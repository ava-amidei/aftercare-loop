import { describe, expect, it } from "vitest";
import type { ActionItem, DocumentInterpretation, ExtractedInstruction, PatientProfile } from "@/lib/types";
import { exactRef, getDocument, getPatient, patientFixtures } from "@/data/patients";
import { groundTruthByPatient } from "@/data/ground-truth";
import {
  buildActionPlan,
  detectDocumentedRestrictions,
  instructionActionId,
  isGenericHydrationText,
  isMedicationChangeDirective,
  isVerifiedRef,
  suggestBarrierActions,
  type ActionPlanInterpretation,
} from "./action-plan";

const NOW = "2026-11-01T12:00:00.000Z";
const LATER = "2026-11-02T08:00:00.000Z";

/** Interpretation built from ground truth (exact refs) — what a correct interpreter returns. */
function gtInterpretation(patientId: string, extra: Partial<ActionPlanInterpretation> = {}): ActionPlanInterpretation {
  const gt = groundTruthByPatient[patientId]!;
  const doc = getDocument(gt.documentId)!;
  const instructions: ExtractedInstruction[] = gt.expectedInstructions.map((i) => ({
    description: i.description,
    type: i.type,
    sourceRef: exactRef(doc, i.quote),
    sourceVerification: "verified",
    ...(i.dueDate ? { dueDate: i.dueDate } : {}),
  }));
  return {
    documentId: doc.id,
    patientId,
    instructions: [...instructions, ...(extra.instructions ?? [])],
    discussWithProvider: extra.discussWithProvider ?? [],
  };
}

function fixture(id: string): { profile: PatientProfile; document: NonNullable<ReturnType<typeof getDocument>> } {
  const f = patientFixtures.find((p) => p.profile.id === id)!;
  return { profile: f.profile, document: f.document };
}

describe("buildActionPlan — traceability", () => {
  it.each(patientFixtures.map((f) => f.profile.id))(
    "every care_plan item for %s has a verified sourceRef whose quote matches the document",
    (pid) => {
      const { profile, document } = fixture(pid);
      const actions = buildActionPlan({ profile, document, interpretation: gtInterpretation(pid), existing: [], now: NOW });
      const carePlan = actions.filter((a) => a.category === "care_plan");
      expect(carePlan.length).toBe(groundTruthByPatient[pid]!.expectedInstructions.length);
      for (const a of carePlan) {
        expect(a.origin).toBe("clinician_documented");
        expect(a.sourceVerification).toBe("verified");
        expect(a.sourceRef).toBeDefined();
        expect(a.sourceRef!.documentId).toBe(document.id);
        expect(document.text.slice(a.sourceRef!.start, a.sourceRef!.end)).toBe(a.sourceRef!.quote);
        expect(a.rationale).toBe(
          profile.language === "es" ? `Documentado en ${document.title}` : `Documented in ${document.title}`,
        );
      }
      // Nothing other than clinician-documented items is in the care plan.
      expect(actions.filter((a) => a.origin !== "clinician_documented").every((a) => a.category !== "care_plan")).toBe(true);
    },
  );

  it("sets dueDate only when the instruction documents one", () => {
    const { profile, document } = fixture("pt-e-multi");
    const actions = buildActionPlan({ profile, document, interpretation: gtInterpretation("pt-e-multi"), now: NOW });
    const withDue = actions.filter((a) => a.dueDate);
    expect(withDue).toHaveLength(1);
    expect(withDue[0]!.dueDate).toBe("2026-10-30");
    expect(withDue[0]!.type).toBe("test_or_lab");
  });

  it("puts documented question_for_provider instructions in provider_question, still clinician_documented", () => {
    const { profile, document } = fixture("pt-e-multi");
    const quote = "Bring your weight log and your diabetes class handout to your next visit so we can review them together.";
    const interp: ActionPlanInterpretation = {
      documentId: document.id,
      patientId: profile.id,
      instructions: [
        { description: "Review handout at next visit", type: "question_for_provider", sourceRef: exactRef(document, quote), sourceVerification: "verified" },
      ],
      discussWithProvider: [],
    };
    const [item] = buildActionPlan({ profile, document, interpretation: interp, now: NOW });
    expect(item!.category).toBe("provider_question");
    expect(item!.origin).toBe("clinician_documented");
    expect(item!.sourceVerification).toBe("verified");
  });
});

describe("buildActionPlan — unverified instructions", () => {
  const { profile, document } = fixture("pt-a-pcos");
  const good = exactRef(document, groundTruthByPatient["pt-a-pcos"]!.expectedInstructions[0]!.quote);
  const cases: Array<[string, ExtractedInstruction]> = [
    [
      "fabricated quote",
      {
        description: "Start a new supplement every day",
        type: "medication",
        sourceRef: { documentId: document.id, start: 0, end: 10, quote: "Start a new supplement every day." },
        sourceVerification: "verified", // client claim must not be trusted
      },
    ],
    ["shifted offsets", { description: "Shifted", type: "other", sourceRef: { ...good, start: good.start + 1, end: good.end + 1 }, sourceVerification: "verified" }],
    ["wrong document", { description: "Other doc", type: "other", sourceRef: { ...good, documentId: "doc-other" }, sourceVerification: "verified" }],
    ["missing ref", { description: "Get an ultrasound next month", type: "test_or_lab", sourceVerification: "unverified" }],
  ];

  it.each(cases)("%s → needs_clarification, ai_suggested, never care_plan", (_label, instruction) => {
    const actions = buildActionPlan({
      profile: { ...profile, healthGoals: [], barriers: [] },
      document,
      interpretation: { documentId: document.id, patientId: profile.id, instructions: [instruction], discussWithProvider: [] },
      now: NOW,
    });
    expect(actions).toHaveLength(1);
    const [a] = actions;
    expect(a!.category).toBe("provider_question");
    expect(a!.origin).toBe("ai_suggested");
    expect(a!.status).toBe("needs_clarification");
    expect(a!.sourceVerification).toBe("unverified");
    expect(a!.sourceRef).toBeUndefined();
    expect(a!.description.startsWith("Clarify: ")).toBe(true);
    expect(a!.dueDate).toBeUndefined();
  });

  it("isVerifiedRef requires exact slice equality", () => {
    expect(isVerifiedRef(document, good)).toBe(true);
    expect(isVerifiedRef(document, { ...good, quote: good.quote + " " })).toBe(false);
    expect(isVerifiedRef(null, good)).toBe(false);
  });
});

describe("buildActionPlan — other origins", () => {
  it("discussion questions → ai_suggested provider questions; goals → patient_selected wellness goals; barriers included", () => {
    const { profile, document } = fixture("pt-b-postpartum");
    const actions = buildActionPlan({
      profile,
      document,
      interpretation: gtInterpretation("pt-b-postpartum", { discussWithProvider: ["When should my next check-up be?"] }),
      now: NOW,
    });
    const q = actions.find((a) => a.description === "When should my next check-up be?")!;
    expect(q.origin).toBe("ai_suggested");
    expect(q.category).toBe("provider_question");
    expect(q.sourceVerification).toBe("not_applicable");

    const goals = actions.filter((a) => a.category === "wellness_goal");
    expect(goals.map((g) => g.description)).toEqual(profile.healthGoals);
    for (const g of goals) {
      expect(g.origin).toBe("patient_selected");
      expect(g.sourceVerification).toBe("not_applicable");
    }

    const barrierItems = actions.filter((a) => a.addressesBarrier);
    expect(new Set(barrierItems.map((b) => b.addressesBarrier))).toEqual(new Set(profile.barriers));
    expect(barrierItems.every((b) => b.type === "administrative" && b.origin === "ai_suggested")).toBe(true);
  });

  it("drops AI medication dose/frequency change directives but keeps questions", () => {
    const { profile, document } = fixture("pt-e-multi");
    const actions = buildActionPlan({
      profile,
      document,
      interpretation: gtInterpretation("pt-e-multi", {
        discussWithProvider: [
          "Increase your furosemide to 80 mg.",
          "Skip your insulin dose when your sugar is low.",
          "Take lisinopril twice a day instead.",
          "Is there a lower-cost option for my medicines?",
        ],
      }),
      now: NOW,
    });
    const descs = actions.map((a) => a.description);
    expect(descs).not.toContain("Increase your furosemide to 80 mg.");
    expect(descs).not.toContain("Skip your insulin dose when your sugar is low.");
    expect(descs).not.toContain("Take lisinopril twice a day instead.");
    expect(descs).toContain("Is there a lower-cost option for my medicines?");
    // No AI-authored item reads as a medication change directive.
    const ai = actions.filter((a) => a.origin === "ai_suggested" && a.status !== "needs_clarification");
    expect(ai.some((a) => isMedicationChangeDirective(a.description, profile.medications.map((m) => m.name)))).toBe(false);
  });

  it("isMedicationChangeDirective: directives yes, questions and goals no", () => {
    expect(isMedicationChangeDirective("Double your dose tonight.")).toBe(true);
    expect(isMedicationChangeDirective("Deje de tomar la pastilla.")).toBe(true);
    expect(isMedicationChangeDirective("Should I change my dose?")).toBe(false);
    expect(isMedicationChangeDirective("¿Debo cambiar mi dosis?")).toBe(false);
    expect(isMedicationChangeDirective("Write down your weight every morning.")).toBe(false);
  });

  it("uses the clinician's quote when an AI description invents a dose change", () => {
    const { profile, document } = fixture("pt-e-multi");
    const quote = "Take furosemide 40 mg once each morning.";
    const [item] = buildActionPlan({
      profile: { ...profile, healthGoals: [], barriers: [] },
      document,
      interpretation: {
        documentId: document.id,
        patientId: profile.id,
        instructions: [{ description: "Increase furosemide dose to 80 mg", type: "medication", sourceRef: exactRef(document, quote), sourceVerification: "verified" }],
        discussWithProvider: [],
      },
      now: NOW,
    });
    expect(item!.description).toBe(quote);
  });

  it("ignores an interpretation for another patient", () => {
    const { profile, document } = fixture("pt-a-pcos");
    const other = gtInterpretation("pt-e-multi");
    const actions = buildActionPlan({ profile, document, interpretation: other as DocumentInterpretation, now: NOW });
    expect(actions.some((a) => a.category === "care_plan")).toBe(false);
  });
});

describe("buildActionPlan — hydration guard (pt-e-multi)", () => {
  const { profile, document } = fixture("pt-e-multi");

  it("detects the documented fluid restriction", () => {
    expect(detectDocumentedRestrictions(profile, document).fluid).toBe(true);
    // Also from the profile alone.
    expect(detectDocumentedRestrictions(profile, null).fluid).toBe(true);
  });

  it("suppresses generic hydration items and asks about individualized targets instead", () => {
    const actions = buildActionPlan({
      profile: { ...profile, healthGoals: [...profile.healthGoals, "Drink more water every day"] },
      document,
      interpretation: gtInterpretation("pt-e-multi", {
        discussWithProvider: ["Drink plenty of water to stay hydrated.", "Should I drink 8 glasses of water a day?"],
        instructions: [{ description: "Drink plenty of water, especially when blood sugar is high", type: "lifestyle", sourceVerification: "unverified" }],
      }),
      now: NOW,
    });
    const nonClinician = actions.filter((a) => a.origin !== "clinician_documented");
    expect(nonClinician.filter((a) => a.description !== "Ask about individualized hydration targets").some((a) => isGenericHydrationText(a.description))).toBe(false);
    const hydration = actions.filter((a) => a.description === "Ask about individualized hydration targets");
    expect(hydration).toHaveLength(1);
    expect(hydration[0]!.category).toBe("provider_question");
    expect(hydration[0]!.origin).toBe("ai_suggested");
    // The documented fluid limit itself stays in the care plan.
    expect(
      actions.some((a) => a.category === "care_plan" && a.sourceRef?.quote.startsWith("Limit your total fluids to 1.5 liters")),
    ).toBe(true);
    for (const forbidden of [/8 glasses/i, /increase (?:your )?fluid/i, /drink plenty/i]) {
      expect(nonClinician.some((a) => forbidden.test(a.description))).toBe(false);
    }
  });

  it("does not add a hydration question for a patient without a documented restriction", () => {
    const pcos = fixture("pt-a-pcos");
    const actions = buildActionPlan({ ...pcos, interpretation: gtInterpretation("pt-a-pcos"), now: NOW });
    expect(actions.some((a) => a.description === "Ask about individualized hydration targets")).toBe(false);
  });

  it("suppresses generic hydration advice when an individualized fluid target is documented", () => {
    const pots = fixture("pt-d-pots");
    expect(detectDocumentedRestrictions(pots.profile, pots.document).fluidTarget).toBe(true);
    const actions = buildActionPlan({
      ...pots,
      interpretation: gtInterpretation("pt-d-pots", { discussWithProvider: ["Stay hydrated by drinking more water."] }),
      now: NOW,
    });
    expect(actions.some((a) => a.description === "Stay hydrated by drinking more water.")).toBe(false);
  });
});

describe("buildActionPlan — idempotent merge", () => {
  const { profile, document } = fixture("pt-b-postpartum");
  const interp = gtInterpretation("pt-b-postpartum", { discussWithProvider: ["What should I bring to my next visit?"] });

  it("re-running with its own output yields the same ids and no duplicates", () => {
    const first = buildActionPlan({ profile, document, interpretation: interp, existing: [], now: NOW });
    const second = buildActionPlan({ profile, document, interpretation: interp, existing: first, now: LATER });
    expect(second).toEqual(first);
    expect(new Set(second.map((a) => a.id)).size).toBe(second.length);
  });

  it("preserves status, reminders and createdAt; keeps user-added items", () => {
    const first = buildActionPlan({ profile, document, interpretation: interp, existing: [], now: NOW });
    const care = first.find((a) => a.category === "care_plan")!;
    const userQuestion: ActionItem = {
      id: "act-user-1",
      patientId: profile.id,
      description: "My own question",
      type: "question_for_provider",
      category: "provider_question",
      origin: "patient_selected",
      sourceVerification: "not_applicable",
      status: "pending",
      rationale: "Added by you",
      createdAt: NOW,
      updatedAt: NOW,
    };
    const otherPatient: ActionItem = { ...userQuestion, id: "act-other", patientId: "pt-z" };
    const edited = first.map((a) =>
      a.id === care.id
        ? { ...a, status: "completed" as const, reminder: { at: LATER, label: "Call", dismissed: false } }
        : a,
    );
    const second = buildActionPlan({
      profile,
      document,
      interpretation: interp,
      existing: [...edited, userQuestion, otherPatient],
      now: LATER,
    });
    const again = second.find((a) => a.id === care.id)!;
    expect(again.status).toBe("completed");
    expect(again.reminder?.label).toBe("Call");
    expect(again.createdAt).toBe(NOW);
    expect(second.filter((a) => a.id === care.id)).toHaveLength(1);
    expect(second.find((a) => a.id === "act-user-1")).toEqual(userQuestion);
    expect(second.find((a) => a.id === "act-other")).toBeUndefined();
  });

  it("re-verifies client-supplied clinician items instead of trusting their label", () => {
    const forged: ActionItem = {
      id: "act-forged-1",
      patientId: profile.id,
      documentId: document.id,
      description: "Stop all medicines today",
      type: "other",
      category: "care_plan",
      origin: "clinician_documented",
      sourceRef: { documentId: document.id, start: 0, end: 10, quote: "NOT IN DOC" },
      sourceVerification: "verified",
      status: "pending",
      rationale: "forged",
      createdAt: NOW,
      updatedAt: NOW,
    };
    const genuine = buildActionPlan({ profile, document, interpretation: interp, now: NOW }).find(
      (a) => a.category === "care_plan",
    )!;
    const kept: ActionItem = { ...genuine, id: "act-genuine-copy" };
    const out = buildActionPlan({ profile, document, interpretation: interp, existing: [forged, kept], now: LATER });
    expect(out.find((a) => a.id === "act-forged-1")).toMatchObject({
      sourceVerification: "unverified",
      status: "needs_clarification",
    });
    expect(out.find((a) => a.id === "act-genuine-copy")).toEqual(kept);
  });

  it("ids are deterministic hashes of patient + document + quote", () => {
    const actions = buildActionPlan({ profile, document, interpretation: interp, now: NOW });
    const care = actions.find((a) => a.category === "care_plan")!;
    expect(care.id).toBe(instructionActionId(profile.id, document.id, care.sourceRef!.quote));
  });
});

describe("buildActionPlan — language", () => {
  it("localizes generated text for Spanish profiles", () => {
    const pid = "pt-f-gdm-es";
    const profile = getPatient(pid)!;
    const document = getDocument(groundTruthByPatient[pid]!.documentId)!;
    const actions = buildActionPlan({
      profile,
      document,
      interpretation: gtInterpretation(pid, {
        instructions: [{ description: "Algo inventado", type: "other", sourceVerification: "unverified" }],
      }),
      now: NOW,
    });
    expect(actions.find((a) => a.status === "needs_clarification")!.description).toBe("Aclarar: Algo inventado");
    expect(actions.filter((a) => a.addressesBarrier).every((a) => a.description.startsWith("¿"))).toBe(true);
  });

  it("re-exports suggestBarrierActions", () => {
    expect(suggestBarrierActions(getPatient("pt-a-pcos")!, { now: NOW })).toHaveLength(1);
  });
});

describe("buildActionPlan — verified quotes that conflict with a documented fluid limit (fix round 2)", () => {
  it("pt-e: a verified 'drink plenty of water' quote never becomes a care-plan item", () => {
    const profile = getPatient("pt-e-multi")!;
    const doc = getDocument(groundTruthByPatient["pt-e-multi"]!.documentId)!;
    const base = gtInterpretation("pt-e-multi");
    const quote = "drink plenty of water, especially when your blood sugar is high";
    const interp: ActionPlanInterpretation = {
      ...base,
      instructions: [
        ...base.instructions,
        { description: "Drink plenty of water, especially when blood sugar is high", type: "lifestyle", sourceRef: exactRef(doc, quote), sourceVerification: "verified" },
      ],
    };
    const plan = buildActionPlan({ profile, interpretation: interp, document: doc, now: NOW });
    expect(plan.some((a) => /plenty of water/i.test(a.description))).toBe(false);
    expect(plan.some((a) => a.category === "care_plan" && /1\.5 liters/.test(a.description))).toBe(true);
    expect(plan.some((a) => a.origin === "ai_suggested" && /hydration targets/i.test(a.description))).toBe(true);
  });
});
