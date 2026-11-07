// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { askKat, filterReferenceIds, SCRIPTED_UNSUPPORTED_ES, trimHistory, type AskKatDeps } from "./ask-kat";
import { KatContextError, type KatContext } from "./kat-context";
import { SCRIPTED_UNSUPPORTED } from "@/lib/ai/scripted";
import { KatReplySchema, type KatReply } from "@/lib/ai/schemas";
import { aiFailure } from "@/lib/ai/errors";
import { getReference } from "@/lib/evidence";
import { evaluateSafety } from "@/lib/safety";
import { exactRef, getDocuments, getPatient } from "@/data/patients";
import { getGroundTruth } from "@/data/ground-truth";
import type {
  ActionItem,
  DocumentInterpretation,
  EvidenceMatch,
  KatRequest,
  PatientId,
  SourceRef,
  VisitDocument,
} from "@/lib/types";

const A: PatientId = "pt-a-pcos";
const B: PatientId = "pt-b-postpartum";
const ES: PatientId = "pt-f-gdm-es";

const EMERGENCY_MSG = "I have crushing chest pain that's spreading to my left arm and jaw.";
const CONCERNING_MSG = "I get a little short of breath climbing stairs lately and it's new for me.";

function docFor(id: PatientId): VisitDocument {
  return getDocuments(id)[0]!;
}

function ctxFor(id: PatientId, extra: Partial<KatContext> = {}): KatContext {
  return {
    profile: getPatient(id)!,
    document: docFor(id),
    actions: [],
    savedQuestions: [],
    teachBackQuestions: getGroundTruth(id)?.teachBackQuestions ?? [],
    ...extra,
  };
}

const A_DISCUSS = "How will we know if the metformin is helping?";
const A_UNANSWERED = "What should I do if I want to get pregnant in the future?";
const A_UNVERIFIED = "Drink eight glasses of water every day";

function interpA(): DocumentInterpretation {
  const doc = docFor(A);
  const gt = getGroundTruth(A)!;
  return {
    documentId: doc.id,
    patientId: A,
    whatThisMeans: "Your clinician documented that your symptoms, labs and ultrasound fit PCOS.",
    terms: [
      {
        term: "Polycystic ovary syndrome (PCOS)",
        definition: "A common hormone condition that can affect periods, skin and hair.",
        sourceRef: exactRef(doc, "polycystic ovary syndrome (PCOS)"),
        referenceIds: ["ref-medlineplus-pcos", "ref-invented-999"],
      },
      {
        term: "Testosterone",
        definition: "A hormone everyone has; the summary says yours was mildly elevated.",
        sourceRef: exactRef(doc, "Your testosterone level was mildly elevated."),
        referenceIds: [],
      },
    ],
    whatToKnow: [],
    discussWithProvider: [A_DISCUSS],
    instructions: [
      ...gt.expectedInstructions.map((i) => ({
        description: i.description,
        type: i.type,
        sourceRef: exactRef(doc, i.quote),
        sourceVerification: "verified" as const,
      })),
      { description: A_UNVERIFIED, type: "lifestyle" as const, sourceVerification: "unverified" as const },
    ],
    unansweredQuestions: [A_UNANSWERED],
    limitations: [],
    safetyFlags: [],
    referenceIds: ["ref-medlineplus-pcos"],
    meta: { mode: "scripted_demo", generatedAt: "2026-10-14T00:00:00.000Z", disclaimer: "" },
  };
}

function actionA(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: "act-a-1",
    patientId: A,
    description: "Bring your period calendar to your next visit",
    type: "other",
    category: "care_plan",
    origin: "clinician_documented",
    sourceVerification: "unverified",
    status: "needs_clarification",
    rationale: "test",
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
    ...overrides,
  };
}

function req(patientId: PatientId, message: string, quickPrompt?: KatRequest["quickPrompt"], history: KatRequest["history"] = []): KatRequest {
  return { patientId, message, quickPrompt, history };
}

function makeDeps(overrides: Partial<AskKatDeps> = {}) {
  const generateStructured = vi.fn<AskKatDeps["generateStructured"]>(async () => {
    throw new Error("model must not be called");
  });
  const getScriptedKatReply = vi.fn<AskKatDeps["getScriptedKatReply"]>(() => null);
  const retrieveEvidence = vi.fn<AskKatDeps["retrieveEvidence"]>(() => []);
  const deps: Partial<AskKatDeps> = {
    getAiMode: () => "scripted_demo",
    generateStructured,
    getScriptedKatReply,
    retrieveEvidence,
    ...overrides,
  };
  return { deps, generateStructured, getScriptedKatReply, retrieveEvidence };
}

function liveReply(reply: Partial<KatReply> = {}): KatReply {
  return {
    content: "Here is what your summary says.",
    referenceIds: [],
    sourceQuotes: [],
    suggestedActions: [],
    limitations: [],
    ...reply,
  };
}

function expectVerified(doc: VisitDocument, refs: SourceRef[] | undefined) {
  for (const r of refs ?? []) {
    expect(r.documentId).toBe(doc.id);
    expect(doc.text.slice(r.start, r.end)).toBe(r.quote);
  }
}

function evidenceMatch(id: string): EvidenceMatch {
  return { reference: getReference(id)!, score: 0.9, matchedTopics: [] };
}

// ---------------------------------------------------------------------------

describe("askKat — safety short-circuit", () => {
  it("fixture messages classify as expected", () => {
    expect(evaluateSafety(EMERGENCY_MSG).level).toBe("emergency");
    expect(evaluateSafety(CONCERNING_MSG).level).toBe("concerning");
  });

  it.each(["scripted_demo", "live_claude"] as const)(
    "emergency returns guidance only, no education or actions (%s)",
    async (mode) => {
      const { deps, generateStructured, getScriptedKatReply, retrieveEvidence } = makeDeps({ getAiMode: () => mode });
      const res = await askKat(req(A, EMERGENCY_MSG), ctxFor(A, { interpretation: interpA() }), deps);
      expect(res.safety.level).toBe("emergency");
      expect(res.message.safety).toEqual(res.safety);
      expect(res.message.content).toBe(res.safety.guidance);
      expect(res.message.content).toContain("911");
      expect(res.message.actions).toEqual([]);
      expect(res.message.referenceIds).toEqual([]);
      expect(res.message.sourceRefs).toEqual([]);
      expect(res.message.meta?.generatedBy).toBe("deterministic");
      expect(generateStructured).not.toHaveBeenCalled();
      expect(getScriptedKatReply).not.toHaveBeenCalled();
      expect(retrieveEvidence).not.toHaveBeenCalled();
    },
  );

  it("emergency wins even when sent with a quick prompt", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(A, EMERGENCY_MSG, "plan_next_steps"), ctxFor(A, { interpretation: interpA() }), deps);
    expect(res.message.content).toBe(res.safety.guidance);
    expect(res.message.content).not.toContain("metformin");
    expect(res.message.actions).toEqual([]);
  });

  it("emergency guidance follows the profile language", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(ES, "Tengo un dolor fuerte en el pecho que se me va al brazo izquierdo."), ctxFor(ES), deps);
    expect(res.safety.level).toBe("emergency");
    expect(res.message.content).toMatch(/Llame al 911/);
  });

  it("concerning prepends guidance and continues (live), without false reassurance", async () => {
    const { deps, generateStructured } = makeDeps({ getAiMode: () => "live_claude" });
    generateStructured.mockResolvedValue({
      ok: true,
      model: "claude-test",
      data: liveReply({ content: "You're fine, this is nothing to worry about." }),
    });
    const res = await askKat(req(A, CONCERNING_MSG), ctxFor(A), deps);
    expect(res.safety.level).toBe("concerning");
    expect(res.message.content.startsWith(res.safety.guidance!)).toBe(true);
    expect(res.message.content).not.toMatch(/you're fine|nothing to worry/i);
    expect(generateStructured).toHaveBeenCalledTimes(1);
  });
});

describe("askKat — quick prompts are deterministic (pt-a-pcos)", () => {
  it.each(["scripted_demo", "live_claude"] as const)("never call a model or scripted lookup (%s)", async (mode) => {
    const { deps, generateStructured, getScriptedKatReply } = makeDeps({ getAiMode: () => mode });
    for (const qp of ["what_should_i_ask", "explain_my_diagnosis", "understand_my_results", "plan_next_steps"] as const) {
      const res = await askKat(req(A, "chip", qp), ctxFor(A, { interpretation: interpA() }), deps);
      expect(res.message.quickPrompt).toBe(qp);
      expect(res.message.meta?.generatedBy).toBe("deterministic");
      expect(res.message.meta?.model).toBeUndefined();
    }
    expect(generateStructured).not.toHaveBeenCalled();
    expect(getScriptedKatReply).not.toHaveBeenCalled();
  });

  it("what_should_i_ask: documented + unresolved + clarification + barrier questions, each with add_question", async () => {
    const { deps } = makeDeps();
    const saved = "Is the follow-up visit covered?";
    const res = await askKat(
      req(A, "What should I ask my doctor?", "what_should_i_ask"),
      ctxFor(A, { interpretation: interpA(), actions: [actionA()], savedQuestions: [saved, A_DISCUSS] }),
      deps,
    );
    const m = res.message;
    expect(m.content).not.toContain(A_DISCUSS); // already saved → not re-suggested
    expect(m.content).toContain(A_UNANSWERED);
    expect(m.content).toContain(A_UNVERIFIED); // unverified instruction → clarification question
    expect(m.content).toContain("Bring your period calendar to your next visit");
    expect(m.content).toMatch(/Would you like to ask your clinic whether transportation assistance or a telehealth appointment is available\?/);
    const questions = (m.actions ?? []).filter((a) => a.kind === "add_question").map((a) => a.payload?.question as string);
    expect(questions).toContain(A_UNANSWERED);
    expect(questions.some((q) => q.includes(A_UNVERIFIED))).toBe(true);
    expect(questions.some((q) => q.startsWith("Would you like to ask your clinic whether"))).toBe(true);
    // every bullet in the content has a matching add_question action
    const bulletsInContent = m.content.split("\n").filter((l) => l.startsWith("• ")).map((l) => l.slice(2));
    expect(bulletsInContent.length).toBeGreaterThan(0);
    for (const b of bulletsInContent) expect(questions).toContain(b);
    expect(m.actions?.some((a) => a.kind === "prepare_appointment")).toBe(true);
    expect(m.actions?.some((a) => a.kind === "check_understanding")).toBe(true);
  });

  it("what_should_i_ask without an interpretation says so and still offers barrier questions", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(A, "What should I ask my doctor?", "what_should_i_ask"), ctxFor(A), deps);
    expect(res.message.content).toMatch(/Understand My Health/);
    expect(res.message.actions?.filter((a) => a.kind === "add_question")).toHaveLength(1);
  });

  it("explain_my_diagnosis uses whatThisMeans + terms with verified sources", async () => {
    const { deps } = makeDeps();
    const interp = interpA();
    const res = await askKat(req(A, "Explain my diagnosis", "explain_my_diagnosis"), ctxFor(A, { interpretation: interp }), deps);
    const m = res.message;
    expect(m.content).toContain(interp.whatThisMeans);
    expect(m.content).toContain("Polycystic ovary syndrome (PCOS) — ");
    expect(m.content).toMatch(/not a diagnosis from Kat/);
    expect(m.sourceRefs?.length).toBeGreaterThan(0);
    expectVerified(docFor(A), m.sourceRefs);
    expect(m.actions?.some((a) => a.kind === "view_source")).toBe(true);
    expect(m.referenceIds).toEqual(["ref-medlineplus-pcos"]); // invented id dropped
  });

  it("explain_my_diagnosis without interpretation quotes the documented assessment verbatim", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(A, "Explain my diagnosis", "explain_my_diagnosis"), ctxFor(A), deps);
    expect(res.message.content).toContain(
      "“Your symptoms, lab results, and ultrasound together fit polycystic ovary syndrome (PCOS).”",
    );
    expectVerified(docFor(A), res.message.sourceRefs);
  });

  it("explain_my_diagnosis with nothing documented asks which diagnosis and says nothing is documented", async () => {
    const { deps } = makeDeps();
    const res = await askKat(
      req(A, "Explain my diagnosis", "explain_my_diagnosis"),
      ctxFor(A, { document: undefined, teachBackQuestions: [] }),
      deps,
    );
    expect(res.message.content).toMatch(/don't see a diagnosis documented/);
    expect(res.message.content).toMatch(/Which diagnosis would you like to understand\?/);
    expect(res.message.sourceRefs).toEqual([]);
    expect(res.message.referenceIds).toEqual([]);
  });

  it("understand_my_results only quotes the Results/Assessment section, with view_source actions", async () => {
    const { deps } = makeDeps();
    const doc = docFor(A);
    const res = await askKat(req(A, "Help me understand my results", "understand_my_results"), ctxFor(A, { interpretation: interpA() }), deps);
    const m = res.message;
    const assessment = doc.sections!.find((s) => s.heading === "Assessment")!;
    expect(m.content).toContain("“Your testosterone level was mildly elevated.”");
    expect(m.content).toContain("“Your thyroid and prolactin tests were normal.”");
    expect(m.content).not.toContain("metformin 500 mg");
    expect(m.content).toContain("Testosterone — "); // term inside the section
    expectVerified(doc, m.sourceRefs);
    for (const r of m.sourceRefs ?? []) {
      expect(r.start).toBeGreaterThanOrEqual(assessment.start);
      expect(r.end).toBeLessThanOrEqual(assessment.end);
    }
    const sourceActions = (m.actions ?? []).filter((a) => a.kind === "view_source");
    expect(sourceActions.length).toBeGreaterThan(0);
    for (const a of sourceActions) {
      const ref = a.payload?.sourceRef as SourceRef;
      expect(doc.text.slice(ref.start, ref.end)).toBe(ref.quote);
    }
  });

  it("understand_my_results without a document explains nothing", async () => {
    const { deps } = makeDeps();
    const res = await askKat(
      req(A, "Help me understand my results", "understand_my_results"),
      ctxFor(A, { document: undefined }),
      deps,
    );
    expect(res.message.content).toMatch(/no documented results/);
    expect(res.message.sourceRefs).toEqual([]);
  });

  it("plan_next_steps lists only verified instructions with view_source + view_action_plan", async () => {
    const { deps } = makeDeps();
    const doc = docFor(A);
    const gt = getGroundTruth(A)!;
    const res = await askKat(req(A, "Help me plan my next steps", "plan_next_steps"), ctxFor(A, { interpretation: interpA() }), deps);
    const m = res.message;
    for (const i of gt.expectedInstructions) expect(m.content).toContain(`“${i.quote}”`);
    expect(m.content).not.toContain(A_UNVERIFIED);
    expect(m.content).toMatch(/1 other item\(s\) could not be matched/);
    expect(m.sourceRefs).toHaveLength(gt.expectedInstructions.length);
    expectVerified(doc, m.sourceRefs);
    expect((m.actions ?? []).filter((a) => a.kind === "view_source")).toHaveLength(gt.expectedInstructions.length);
    expect(m.actions?.some((a) => a.kind === "view_action_plan")).toBe(true);
    expect(m.actions?.some((a) => a.kind === "prepare_appointment")).toBe(true);
  });

  it("plan_next_steps ignores instructions whose quote does not match the document", async () => {
    const { deps } = makeDeps();
    const interp = interpA();
    interp.instructions = [
      {
        description: "Fabricated",
        type: "medication",
        sourceVerification: "verified",
        sourceRef: { documentId: docFor(A).id, start: 0, end: 10, quote: "Take 2 pills" },
      },
    ];
    const res = await askKat(req(A, "Help me plan my next steps", "plan_next_steps"), ctxFor(A, { interpretation: interp }), deps);
    expect(res.message.content).not.toContain("Fabricated");
    expect(res.message.content).toMatch(/haven't found any clinician-documented next steps/);
    expect(res.message.actions?.some((a) => a.kind === "view_action_plan")).toBe(true);
  });

  it("quick prompt replies use the profile language", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(ES, "Ayúdame a planear mis próximos pasos", "plan_next_steps"), ctxFor(ES), deps);
    expect(res.message.content).toMatch(/Entender mi salud/);
    expect(res.message.actions?.find((a) => a.kind === "view_action_plan")?.label).toBe("Ver mi plan de acción");
  });
});

describe("askKat — scripted mode free text", () => {
  it("returns the honest unsupported text when no scripted reply exists", async () => {
    const { deps, generateStructured, getScriptedKatReply } = makeDeps();
    const res = await askKat(req(A, "Can I eat bananas?"), ctxFor(A), deps);
    expect(getScriptedKatReply).toHaveBeenCalledWith(A, "Can I eat bananas?", undefined);
    expect(res.message.content).toBe(SCRIPTED_UNSUPPORTED);
    expect(res.message.meta?.mode).toBe("scripted_demo");
    expect(res.message.meta?.model).toBeUndefined();
    expect(res.message.referenceIds).toEqual([]);
    expect(generateStructured).not.toHaveBeenCalled();
  });

  it("unsupported text is localized for Spanish profiles", async () => {
    const { deps } = makeDeps();
    const res = await askKat(req(ES, "¿Puedo comer plátanos?"), ctxFor(ES), deps);
    expect(res.message.content).toBe(SCRIPTED_UNSUPPORTED_ES);
  });

  it("verifies scripted quotes and filters scripted reference ids to the index", async () => {
    const { deps, getScriptedKatReply } = makeDeps();
    getScriptedKatReply.mockReturnValue({
      content: "Your summary mentions a fasting blood test.",
      referenceIds: ["ref-medlineplus-pcos", "ref-does-not-exist"],
      sourceQuotes: [
        "Get a fasting blood test for glucose and cholesterol at the lab within the next 2 weeks.",
        "Take two aspirin daily.",
      ],
      actions: [{ kind: "not_a_kind", label: "x" }, { kind: "view_action_plan", label: "Plan" }],
    });
    const res = await askKat(req(A, "What test do I need?"), ctxFor(A), deps);
    const m = res.message;
    expect(m.referenceIds).toEqual(["ref-medlineplus-pcos"]);
    expect(m.sourceRefs).toHaveLength(1);
    expectVerified(docFor(A), m.sourceRefs);
    expect(m.actions?.map((a) => a.kind)).toEqual(
      expect.arrayContaining(["view_action_plan", "view_source", "check_understanding"]),
    );
    expect(m.actions?.some((a) => (a.kind as string) === "not_a_kind")).toBe(false);
  });
});

describe("askKat — live mode free text", () => {
  it("calls generateStructured with KatReply schema, effort medium, trimmed history and evidence", async () => {
    const { deps, generateStructured, retrieveEvidence } = makeDeps({ getAiMode: () => "live_claude" });
    retrieveEvidence.mockReturnValue([evidenceMatch("ref-medlineplus-pcos")]);
    generateStructured.mockResolvedValue({
      ok: true,
      model: "claude-test-model",
      data: liveReply({
        content: "Metformin is documented to help with insulin resistance.",
        referenceIds: ["ref-medlineplus-pcos", "ref-medlineplus-metformin", "ref-made-up"],
        sourceQuotes: ["take   metformin 500 mg twice daily with breakfast and dinner.", "Invented passage."],
        suggestedActions: [
          { kind: "view_source", label: "See it", questionText: null, sourceQuote: "Not in the document at all" },
          { kind: "add_question", label: "Save", questionText: "How long before metformin works?", sourceQuote: null },
        ],
        limitations: ["The summary does not say how long metformin takes to work."],
      }),
    });
    const history = Array.from({ length: 15 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `turn-${String(i).padStart(2, "0")}`,
    }));
    const res = await askKat(req(A, "Why am I taking metformin?", undefined, history), ctxFor(A), deps);

    expect(generateStructured).toHaveBeenCalledTimes(1);
    const call = generateStructured.mock.calls[0]![0];
    expect(call.schema).toBe(KatReplySchema);
    expect(call.effort).toBe("medium");
    expect(call.user).toContain("Why am I taking metformin?");
    expect(call.user).toContain("turn-14");
    expect(call.user).toContain("turn-05");
    expect(call.user).not.toContain("turn-04");
    expect(call.user).toContain("ref-medlineplus-pcos");

    const topics = retrieveEvidence.mock.calls[0]![0].topics ?? [];
    expect(topics).toEqual(expect.arrayContaining(["Polycystic ovary syndrome (PCOS)", "metformin"]));

    const m = res.message;
    expect(m.meta?.mode).toBe("live_claude");
    expect(m.meta?.model).toBe("claude-test-model");
    expect(m.meta?.generatedBy).toBe("model");
    expect(m.referenceIds).toEqual(["ref-medlineplus-pcos"]); // index ∩ retrieved
    expect(m.sourceRefs).toHaveLength(1);
    expect(m.sourceRefs![0]!.quote).toBe("Take metformin 500 mg twice daily with breakfast and dinner.");
    expectVerified(docFor(A), m.sourceRefs);
    expect(m.content).toContain("does not say how long metformin takes");
    const kinds = m.actions?.map((a) => a.kind) ?? [];
    expect(kinds).toContain("add_question");
    expect(kinds).toContain("view_source"); // from the located quote, not the invented one
    for (const a of m.actions ?? []) {
      if (a.kind === "view_source") {
        const ref = a.payload?.sourceRef as SourceRef;
        expect(docFor(A).text.slice(ref.start, ref.end)).toBe(ref.quote);
      }
    }
    expect(kinds).toContain("check_understanding");
  });

  it("returns a typed error message when the model call fails", async () => {
    const { deps, generateStructured } = makeDeps({ getAiMode: () => "live_claude" });
    generateStructured.mockResolvedValue(aiFailure("rate_limit"));
    const res = await askKat(req(A, "What is insulin resistance?"), ctxFor(A), deps);
    expect(res.message.error).toBeTruthy();
    expect(res.message.content).toBe(res.message.error);
    expect(res.message.actions).toEqual([]);
    expect(res.message.meta?.mode).toBe("live_claude");
  });
});

describe("askKat — patient isolation", () => {
  it("rejects a context whose profile belongs to another patient", async () => {
    const { deps } = makeDeps();
    await expect(askKat(req(B, "hi"), ctxFor(A), deps)).rejects.toBeInstanceOf(KatContextError);
  });

  it("drops patient A's document, interpretation and actions from patient B's reply", async () => {
    const leaked: KatContext = {
      ...ctxFor(B),
      document: docFor(A),
      interpretation: interpA(),
      actions: [actionA()],
      teachBackQuestions: getGroundTruth(A)!.teachBackQuestions,
    };
    const { deps } = makeDeps();
    for (const qp of ["what_should_i_ask", "explain_my_diagnosis", "understand_my_results", "plan_next_steps"] as const) {
      const res = await askKat(req(B, "chip", qp), leaked, deps);
      const text = JSON.stringify(res.message);
      expect(text).not.toContain(A_DISCUSS);
      expect(text).not.toContain(A_UNANSWERED);
      expect(text).not.toContain("metformin");
      expect(text).not.toContain("tb-pt-a");
      expect(text).not.toContain(docFor(A).id);
    }
  });

  it("never sends patient A's record to the model for patient B", async () => {
    const { deps, generateStructured } = makeDeps({ getAiMode: () => "live_claude" });
    generateStructured.mockResolvedValue({ ok: true, model: "m", data: liveReply() });
    const leaked: KatContext = { ...ctxFor(B), interpretation: interpA(), actions: [actionA()] };
    await askKat(req(B, "What does my summary say?"), leaked, deps);
    const user = generateStructured.mock.calls[0]![0].user;
    expect(user).not.toContain("Maya Thompson");
    expect(user).not.toContain(docFor(A).text.slice(0, 200));
    expect(user).not.toContain(A_UNANSWERED);
    expect(user).not.toContain("Bring your period calendar to your next visit");
    expect(user).toContain(getPatient(B)!.displayName);
  });
});

describe("helpers", () => {
  it("trimHistory keeps the last 10 non-empty turns", () => {
    const h = Array.from({ length: 12 }, (_, i) => ({ role: "user", content: i === 11 ? " " : `m${i}` }));
    const out = trimHistory(h);
    expect(out).toHaveLength(10);
    expect(out[0]!.content).toBe("m1");
    expect(out.at(-1)!.content).toBe("m10");
  });

  it("filterReferenceIds keeps only indexed (and allowed) ids", () => {
    const exists = (id: string) => getReference(id) !== undefined;
    expect(filterReferenceIds(["ref-medlineplus-pcos", "nope", "ref-medlineplus-pcos"], exists)).toEqual([
      "ref-medlineplus-pcos",
    ]);
    expect(
      filterReferenceIds(["ref-medlineplus-pcos", "ref-medlineplus-metformin"], exists, new Set(["ref-medlineplus-metformin"])),
    ).toEqual(["ref-medlineplus-metformin"]);
  });
});
