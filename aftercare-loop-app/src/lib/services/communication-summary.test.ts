import { describe, expect, it } from "vitest";
import type { ActionItem, PatientSessionState } from "@/lib/types";
import { exactRef, getDocument, getPatient } from "@/data/patients";
import { groundTruthByPatient } from "@/data/ground-truth";
import { buildActionPlan } from "./action-plan";
import { buildCommunicationSummary } from "./communication-summary";

const NOW = "2026-11-01T12:00:00.000Z";

function sessionFor(pid: string, opts: { savedQuestions?: string[]; extra?: ActionItem[] } = {}): PatientSessionState {
  const profile = getPatient(pid)!;
  const gt = groundTruthByPatient[pid]!;
  const document = getDocument(gt.documentId)!;
  const actions = buildActionPlan({
    profile,
    document,
    interpretation: {
      documentId: document.id,
      patientId: pid,
      instructions: [
        ...gt.expectedInstructions.map((i) => ({
          description: i.description,
          type: i.type,
          sourceRef: exactRef(document, i.quote),
          sourceVerification: "verified" as const,
          ...(i.dueDate ? { dueDate: i.dueDate } : {}),
        })),
        { description: "Unmatched instruction", type: "other" as const, sourceVerification: "unverified" as const },
      ],
      discussWithProvider: ["What should I bring to my next visit?"],
    },
    now: NOW,
  });
  return {
    profile,
    documents: [document],
    activeDocumentId: document.id,
    interpretations: {},
    actions: [...actions, ...(opts.extra ?? [])],
    chat: [],
    teachBack: {},
    careTeamRequests: [],
    savedQuestions: opts.savedQuestions ?? [],
  };
}

describe("buildCommunicationSummary", () => {
  it("collects questions, barriers, unresolved items and documented instructions", () => {
    const state = sessionFor("pt-b-postpartum", { savedQuestions: ["Can my baby come to the visit?", "What should I bring to my next visit?"] });
    const s = buildCommunicationSummary(state, { now: NOW });
    expect(s.patientId).toBe("pt-b-postpartum");
    expect(s.generatedAt).toBe(NOW);
    // Saved first, de-duplicated against the pending AI question.
    expect(s.questions[0]).toBe("Can my baby come to the visit?");
    expect(s.questions.filter((q) => q === "What should I bring to my next visit?")).toHaveLength(1);
    // Barrier suggestions are pending provider questions, in clinic-facing wording.
    expect(s.questions).toContain("Is transportation assistance or a telehealth appointment available for my follow-up care?");
    expect(s.questions.some((q) => /^would you like to/i.test(q))).toBe(false);
    expect(s.text).not.toMatch(/Would you like to ask/);
    expect(s.barriers).toEqual(state.profile.barriers);
    expect(s.unresolvedItems.some((u) => u.startsWith("Clarify: Unmatched instruction") && u.includes("needs clarification"))).toBe(true);
    const gt = groundTruthByPatient["pt-b-postpartum"]!;
    expect(s.documentedInstructions).toHaveLength(gt.expectedInstructions.length);
    const doc = state.documents[0]!;
    for (const d of s.documentedInstructions) {
      expect(doc.text.slice(d.sourceRef!.start, d.sourceRef!.end)).toBe(d.sourceRef!.quote);
    }
    // Pending care-plan items are unresolved.
    expect(s.unresolvedItems.length).toBe(gt.expectedInstructions.length + 1);
  });

  it("formats an editable plain-text block with section headers and Source lines", () => {
    const s = buildCommunicationSummary(sessionFor("pt-e-multi"), { now: NOW });
    const t = s.text;
    for (const h of [
      "Notes for my care team",
      "QUESTIONS FOR MY PROVIDER",
      "THINGS THAT MAKE CARE HARDER FOR ME",
      "FOLLOW-UP ITEMS I STILL NEED TO RESOLVE",
      "INSTRUCTIONS DOCUMENTED IN MY VISIT SUMMARY",
    ]) {
      expect(t).toContain(h);
    }
    expect(t).toContain("Prepared by Gloria Bennett on Nov 1, 2026.");
    expect(t).toContain("Demonstration using fictional patient data.");
    expect(t).toContain('Source: "Take furosemide 40 mg once each morning."');
    expect(t).toContain("- Cost or insurance");
    expect(t).toMatch(/\(due Oct 30, 2026\)/);
    const sourceLines = t.split("\n").filter((l) => l.trim().startsWith("Source: "));
    expect(sourceLines).toHaveLength(s.documentedInstructions.length);
    // No claims of transmission.
    expect(t).not.toMatch(/\b(?:sent|transmitted|delivered|submitted|enviad[oa])\b/i);
  });

  it("marks empty sections and excludes completed / unverified items from documented instructions", () => {
    const state = sessionFor("pt-d-pots");
    state.actions = state.actions.map((a) => ({ ...a, status: a.category === "care_plan" ? ("completed" as const) : a.status }));
    state.profile = { ...state.profile, barriers: [] };
    const s = buildCommunicationSummary(state, { now: NOW });
    expect(s.text).toMatch(/THINGS THAT MAKE CARE HARDER FOR ME\n- None noted/);
    expect(s.unresolvedItems.every((u) => u.includes("needs clarification"))).toBe(true);
    expect(s.documentedInstructions.every((d) => d.sourceRef)).toBe(true);
  });

  it("drops a documented instruction whose quote no longer matches the document", () => {
    const state = sessionFor("pt-a-pcos");
    const target = state.actions.find((a) => a.category === "care_plan")!;
    state.actions = state.actions.map((a) =>
      a.id === target.id ? { ...a, sourceRef: { ...a.sourceRef!, quote: a.sourceRef!.quote + "!" } } : a,
    );
    const s = buildCommunicationSummary(state, { now: NOW });
    expect(s.documentedInstructions.some((d) => d.description === target.description)).toBe(false);
  });

  it("writes the text in Spanish for Spanish profiles", () => {
    const s = buildCommunicationSummary(sessionFor("pt-f-gdm-es"), { now: NOW });
    expect(s.text).toContain("Notas para mi equipo de atención");
    expect(s.text).toContain("PREGUNTAS PARA MI PROVEEDOR");
    expect(s.text).toContain('Fuente: "');
    expect(s.text).toContain("Demostración con datos de pacientes ficticios.");
  });

  it("is pure: same input → same output, input not mutated", () => {
    const state = sessionFor("pt-c-endometriosis");
    const snapshot = JSON.stringify(state);
    expect(buildCommunicationSummary(state, { now: NOW })).toEqual(buildCommunicationSummary(state, { now: NOW }));
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
