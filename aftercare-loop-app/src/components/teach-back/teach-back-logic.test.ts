import { describe, expect, it, vi } from "vitest";
import { getGroundTruth, groundTruths } from "@/data/ground-truth";
import type { TeachBackSession } from "@/lib/types";
import {
  initialQuestionIndex,
  latestClarification,
  postTeachBack,
  questionPhase,
  questionsForDocument,
  stripOpener,
  summarizeSessions,
} from "./teach-back-logic";

const gt = groundTruths.find((g) => g.teachBackQuestions.length >= 2)!;

function session(over: Partial<TeachBackSession>): TeachBackSession {
  return {
    questionId: "q",
    patientId: gt.patientId,
    attempts: [],
    clarificationProvided: false,
    savedForClinician: false,
    completed: false,
    ...over,
  };
}

const attempt = (correct: boolean, clarification?: string) => ({
  attemptNumber: 1,
  response: "r",
  matchedConcepts: [],
  correct,
  at: "2026-11-07T00:00:00.000Z",
  ...(clarification ? { clarification, clarificationMode: "scripted_demo" as const } : {}),
});

describe("questionsForDocument", () => {
  it("filters by patient and active document", () => {
    const qs = questionsForDocument(getGroundTruth(gt.patientId), gt.patientId, gt.documentId);
    expect(qs.length).toBe(gt.teachBackQuestions.length);
    expect(questionsForDocument(gt, gt.patientId, "doc-other")).toEqual([]);
    expect(questionsForDocument(gt, "someone-else", gt.documentId)).toEqual([]);
    expect(questionsForDocument(undefined, gt.patientId, gt.documentId)).toEqual([]);
    expect(questionsForDocument(gt, gt.patientId, undefined)).toEqual([]);
  });

  it("resolves deep links", () => {
    const qs = gt.teachBackQuestions;
    expect(initialQuestionIndex(qs, qs[1].id)).toBe(1);
    expect(initialQuestionIndex(qs, "missing")).toBe(0);
    expect(initialQuestionIndex(qs, undefined)).toBe(0);
  });
});

describe("phases and summary", () => {
  it("derives phase from the session", () => {
    expect(questionPhase(undefined)).toBe("unanswered");
    expect(questionPhase(session({ attempts: [attempt(false, "c")] }))).toBe("clarified");
    expect(questionPhase(session({ attempts: [attempt(false, "c")], completed: true }))).toBe("unresolved");
    expect(questionPhase(session({ attempts: [attempt(false, "c"), attempt(true)], completed: true }))).toBe(
      "correct",
    );
    expect(latestClarification(session({ attempts: [attempt(false, "c1"), attempt(true)] }))?.text).toBe("c1");
  });

  it("summarizes initial vs final correctness", () => {
    const [q1, q2] = gt.teachBackQuestions;
    const s = summarizeSessions(gt.teachBackQuestions, {
      [q1.id]: session({ attempts: [attempt(true)], initialCorrect: true, finalCorrect: true, completed: true }),
      [q2.id]: session({
        attempts: [attempt(false, "c"), attempt(true)],
        initialCorrect: false,
        finalCorrect: true,
        clarificationProvided: true,
        savedForClinician: true,
      }),
    });
    expect(s).toMatchObject({ answered: 2, initialCorrect: 1, finalCorrect: 2, clarified: 1, savedForClinician: 1 });
    expect(s.total).toBe(gt.teachBackQuestions.length);
  });

  it("strips a repeated opener", () => {
    expect(stripOpener("Let me explain that another way. Your summary says X.", "Let me explain that another way.")).toBe(
      "Your summary says X.",
    );
    expect(stripOpener("Other text", "Let me explain that another way.")).toBe("Other text");
  });
});

describe("postTeachBack", () => {
  it("posts JSON and validates the response", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ session: session({}) }), { status: 200 }));
    const res = await postTeachBack({ patientId: "p", questionId: "q", response: "r" }, fetchImpl as typeof fetch);
    expect(res.session.attempts).toEqual([]);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/teach-back");
    expect(JSON.parse(String(init.body))).toMatchObject({ questionId: "q" });
  });

  it("throws on HTTP errors and malformed bodies", async () => {
    const bad = vi.fn(async () => new Response("{}", { status: 500 }));
    await expect(postTeachBack({ patientId: "p", questionId: "q", response: "r" }, bad as typeof fetch)).rejects.toThrow();
    const malformed = vi.fn(async () => new Response("{}", { status: 200 }));
    await expect(
      postTeachBack({ patientId: "p", questionId: "q", response: "r" }, malformed as typeof fetch),
    ).rejects.toThrow();
  });
});
