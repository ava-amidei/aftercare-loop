import { describe, expect, it, vi } from "vitest";
import { groundTruths } from "@/data/ground-truth";
import { getDocument, getPatient } from "@/data/patients";
import type { AiResult, TeachBackClarification } from "@/lib/ai";
import type { PatientProfile, TeachBackQuestion, VisitDocument } from "@/lib/types";
import {
  buildTemplateClarification,
  clarify,
  containsJudgmentalLanguage,
  createTeachBackSession,
  MAX_TEACH_BACK_ATTEMPTS,
  runTeachBackAttempt,
  saveForClinician,
} from "./teach-back";

const JUDGMENTAL = /wrong|failed|incorrect/i;

function ctx(q: TeachBackQuestion): { document: VisitDocument; profile: PatientProfile } {
  const document = getDocument(q.documentId);
  const profile = getPatient(q.patientId);
  if (!document || !profile) throw new Error(`missing fixture for ${q.id}`);
  return { document, profile };
}

const allQuestions = groundTruths.flatMap((g) => g.teachBackQuestions);
const noScript = () => null;
const correctAnswer = (q: TeachBackQuestion) => q.acceptedVariations[0] ?? q.expectedAnswer;
const WRONG = "I'm not sure, I don't remember";

describe("non-judgmental clarification", () => {
  it.each(allQuestions.map((q) => [q.id, q] as const))(
    "%s: template never contains judgmental words and quotes the source",
    async (_id, q) => {
      const { document, profile } = ctx(q);
      const misconception = q.scoring.misconceptions?.[0]?.pattern ?? WRONG;
      for (const response of [WRONG, misconception]) {
        const r = await clarify(
          { question: q, response, document, profile, attemptNumber: 1 },
          { mode: "scripted_demo", scripted: noScript },
        );
        expect(r.mode).toBe("scripted_demo");
        expect(r.clarification).not.toMatch(JUDGMENTAL);
        expect(r.clarification).toContain(q.sourceRef.quote.trim());
        expect(r.clarification).toContain(q.expectedAnswer.trim().replace(/[.]$/, ""));
        expect(
          r.clarification.startsWith(
            profile.language === "es" ? "Permítame explicarlo de otra manera." : "Let me explain that another way.",
          ),
        ).toBe(true);
      }
    },
  );

  it("detects judgmental wording in en and es", () => {
    expect(containsJudgmentalLanguage("That answer is WRONG.")).toBe(true);
    expect(containsJudgmentalLanguage("You failed.")).toBe(true);
    expect(containsJudgmentalLanguage("Eso es incorrecto")).toBe(true);
    expect(containsJudgmentalLanguage("Let me explain that another way.")).toBe(false);
  });

  it("includes the predefined misconception clarification", () => {
    const q = allQuestions.find((x) => (x.scoring.misconceptions?.length ?? 0) > 0)!;
    const m = q.scoring.misconceptions![0]!;
    const text = buildTemplateClarification(q, "en", m.clarification);
    expect(text).toContain(m.clarification);
  });
});

describe("clarify modes", () => {
  const q = allQuestions[0]!;
  const { document, profile } = ctx(q);
  const input = { question: q, response: WRONG, document, profile, attemptNumber: 1 };

  it("uses the scripted clarification when available", async () => {
    const r = await clarify(input, { mode: "scripted_demo", scripted: () => "Let me explain that another way. Scripted." });
    expect(r).toMatchObject({ mode: "scripted_demo", clarification: "Let me explain that another way. Scripted." });
  });

  it("live: calls the model with the answer key, source passage and response", async () => {
    const generate = vi.fn(async (req: unknown): Promise<AiResult<TeachBackClarification>> => {
      void req;
      return {
        ok: true,
        model: "claude-test",
        data: { misunderstanding: "The timing seems unclear.", clarification: "Let me explain that another way. Live text." },
      };
    });
    const r = await clarify(input, { mode: "live_claude", generate });
    expect(r).toMatchObject({ mode: "live_claude", model: "claude-test", clarification: "Let me explain that another way. Live text." });
    const req = generate.mock.calls[0]![0] as unknown as { user: string; effort: string };
    expect(req.effort).toBe("medium");
    expect(req.user).toContain(q.expectedAnswer);
    expect(req.user).toContain(WRONG);
  });

  it("live: judgmental model output falls back to the deterministic template", async () => {
    const generate = async (): Promise<AiResult<TeachBackClarification>> => ({
      ok: true,
      model: "claude-test",
      data: { misunderstanding: "x", clarification: "Your answer was wrong." },
    });
    const r = await clarify(input, { mode: "live_claude", generate });
    expect(r.mode).toBe("scripted_demo");
    expect(r.clarification).not.toMatch(JUDGMENTAL);
  });

  it("live: a medication-change directive falls back to the deterministic template", async () => {
    const generate = async (): Promise<AiResult<TeachBackClarification>> => ({
      ok: true,
      model: "claude-test",
      data: { misunderstanding: "The timing seems unclear.", clarification: "Let me explain another way. You can double your dose if you miss one." },
    });
    const r = await clarify(input, { mode: "live_claude", generate });
    expect(r.mode).toBe("scripted_demo");
    expect(r.clarification).not.toMatch(/double your dose/i);
    expect(r.clarification).toContain(q.sourceRef.quote);
  });

  it("live: model failure falls back with a safe error", async () => {
    const generate = async (): Promise<AiResult<TeachBackClarification>> => ({ ok: false, kind: "api", error: "Kat couldn't reach the AI service." });
    const r = await clarify(input, { mode: "live_claude", generate });
    expect(r.mode).toBe("scripted_demo");
    expect(r.error).toBeDefined();
    expect(r.clarification).toContain(q.sourceRef.quote);
  });
});

describe("runTeachBackAttempt", () => {
  const now = () => new Date("2026-11-07T12:00:00Z");

  it.each(allQuestions.map((q) => [q.id, q] as const))(
    "%s: initial wrong → clarification → retry correct sets finalCorrect",
    async (_id, q) => {
      const deps = { ...ctx(q), mode: "scripted_demo" as const, scripted: noScript, now };
      const s1 = await runTeachBackAttempt(undefined, q, WRONG, deps);
      expect(s1.attempts).toHaveLength(1);
      expect(s1.initialCorrect).toBe(false);
      expect(s1.finalCorrect).toBe(false);
      expect(s1.clarificationProvided).toBe(true);
      expect(s1.attempts[0]!.clarification).toBeTruthy();
      expect(s1.attempts[0]!.clarification).not.toMatch(JUDGMENTAL);
      expect(s1.completed).toBe(false);

      const s2 = await runTeachBackAttempt(s1, q, correctAnswer(q), deps);
      expect(s2.attempts).toHaveLength(2);
      expect(s2.initialCorrect).toBe(false);
      expect(s2.finalCorrect).toBe(true);
      expect(s2.completed).toBe(true);
      expect(s2.savedForClinician).toBe(false);
      expect(s2.attempts[1]!.clarification).toBeUndefined();
      // input not mutated
      expect(s1.attempts).toHaveLength(1);
    },
  );

  it("correct on first attempt completes with no clarification", async () => {
    const q = allQuestions[0]!;
    const s = await runTeachBackAttempt(undefined, q, q.expectedAnswer, { ...ctx(q), mode: "scripted_demo", scripted: noScript, now });
    expect(s).toMatchObject({ initialCorrect: true, finalCorrect: true, completed: true, clarificationProvided: false });
  });

  it("records the misunderstanding on the attempt", async () => {
    const q = allQuestions.find((x) => (x.scoring.misconceptions?.length ?? 0) > 0)!;
    const m = q.scoring.misconceptions![0]!;
    const s = await runTeachBackAttempt(undefined, q, m.pattern, { ...ctx(q), mode: "scripted_demo", scripted: noScript, now });
    expect(s.attempts[0]!.misunderstanding).toBe(m.clarification);
  });

  it("completes and saves for clinician after max attempts; ignores further attempts", async () => {
    const q = allQuestions[0]!;
    const deps = { ...ctx(q), mode: "scripted_demo" as const, scripted: noScript, now };
    let s = createTeachBackSession(q);
    for (let i = 0; i < MAX_TEACH_BACK_ATTEMPTS; i++) s = await runTeachBackAttempt(s, q, WRONG, deps);
    expect(s).toMatchObject({ completed: true, finalCorrect: false, savedForClinician: true });
    const after = await runTeachBackAttempt(s, q, q.expectedAnswer, deps);
    expect(after).toBe(s);
  });

  it("saveForClinician sets the flag without mutating", () => {
    const q = allQuestions[0]!;
    const s = createTeachBackSession(q);
    const saved = saveForClinician(s);
    expect(saved.savedForClinician).toBe(true);
    expect(s.savedForClinician).toBe(false);
  });
});
