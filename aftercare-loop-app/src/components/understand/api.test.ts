import { describe, expect, it, vi } from "vitest";
import type { PatientSessionState, VisitDocument } from "@/lib/types";
import {
  UnderstandApiError,
  askAboutTerm,
  buildActionPlanBody,
  buildInterpretBody,
  requestActionPlan,
  requestInterpretation,
} from "./api";

const fixtureDoc: VisitDocument = {
  id: "doc-f",
  patientId: "pt-1",
  title: "Fixture",
  text: "Fixture text.",
  createdAt: "2026-10-14",
  source: "fixture",
};
const pastedDoc: VisitDocument = { ...fixtureDoc, id: "doc-p", source: "pasted", text: "Pasted text." };

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

const session = {
  profile: { id: "pt-1" },
  documents: [fixtureDoc],
  interpretations: {},
  actions: [],
  chat: [],
  teachBack: {},
  careTeamRequests: [],
  savedQuestions: ["Q1"],
} as unknown as PatientSessionState;

describe("buildInterpretBody", () => {
  it("sends only the fixture id when the fixture text is unchanged", () => {
    expect(buildInterpretBody({ patientId: "pt-1", text: fixtureDoc.text, baseDocument: fixtureDoc, origin: "pasted" })).toEqual({
      patientId: "pt-1",
      documentId: "doc-f",
    });
  });
  it("never reuses a document id for edited text", () => {
    const body = buildInterpretBody({ patientId: "pt-1", text: "Edited", baseDocument: fixtureDoc, origin: "pasted" });
    expect(body).toEqual({ patientId: "pt-1", text: "Edited" });
  });
  it("reuses a pasted document id (with its text) when unchanged", () => {
    expect(buildInterpretBody({ patientId: "pt-1", text: pastedDoc.text, baseDocument: pastedDoc, origin: "pasted" })).toEqual({
      patientId: "pt-1",
      documentId: "doc-p",
      text: pastedDoc.text,
      title: pastedDoc.title,
    });
  });
});

describe("requestInterpretation", () => {
  it("marks uploaded text as uploaded_txt and returns the server document", async () => {
    const fetchImpl = vi.fn(() => json({ document: pastedDoc, interpretation: { documentId: "doc-p" } }));
    const out = await requestInterpretation({ patientId: "pt-1", text: "x", origin: "uploaded_txt" }, fetchImpl);
    expect(out.document.source).toBe("uploaded_txt");
    expect(out.document.text).toBe(pastedDoc.text);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/interpret");
    expect(init.method).toBe("POST");
  });
  it("throws a typed error with the server's safe message on failure", async () => {
    const fetchImpl = vi.fn(() => json({ error: "Document text is empty." }, 400));
    await expect(requestInterpretation({ patientId: "pt-1", text: "x", origin: "pasted" }, fetchImpl)).rejects.toMatchObject({
      status: 400,
      message: "Document text is empty.",
    });
  });
  it("treats network failures and malformed responses as errors", async () => {
    await expect(
      requestInterpretation({ patientId: "pt-1", text: "x", origin: "pasted" }, () => Promise.reject(new Error("down"))),
    ).rejects.toBeInstanceOf(UnderstandApiError);
    await expect(
      requestInterpretation({ patientId: "pt-1", text: "x", origin: "pasted" }, () => json({ nope: true })),
    ).rejects.toBeInstanceOf(UnderstandApiError);
  });
});

describe("action plan + ask kat", () => {
  const interp = {
    documentId: "doc-p",
    patientId: "pt-1",
    instructions: [],
    discussWithProvider: ["Ask"],
  } as never;

  it("includes the document body only for non-fixture documents", () => {
    expect(buildActionPlanBody(session, fixtureDoc, interp)).not.toHaveProperty("document");
    expect(buildActionPlanBody(session, pastedDoc, interp)).toHaveProperty("document", pastedDoc);
  });

  it("returns the actions array", async () => {
    const out = await requestActionPlan(session, pastedDoc, interp, () => json({ actions: [{ id: "a1" }] }));
    expect(out).toEqual([{ id: "a1" }]);
  });

  it("asks Kat as free text with patient context", async () => {
    const fetchImpl = vi.fn(() =>
      json({ message: { id: "m", role: "assistant", content: "Answer", createdAt: "x" }, safety: { level: "none", detectedBy: "none" } }),
    );
    const out = await askAboutTerm(session, "  What is A1C?  ", fixtureDoc, fetchImpl);
    expect(out.message.content).toBe("Answer");
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({
      patientId: "pt-1",
      message: "What is A1C?",
      quickPrompt: "free_text",
      history: [],
      context: { documentId: "doc-f", savedQuestions: ["Q1"] },
    });
    expect(body.context).not.toHaveProperty("document");
  });
});
