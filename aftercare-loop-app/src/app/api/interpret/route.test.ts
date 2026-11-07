import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { patientFixtures } from "@/data/patients";
import { MAX_DOCUMENT_CHARS } from "@/lib/safety";
import { verifySourceRef } from "@/lib/services/source-verification";
import type { DocumentInterpretation, VisitDocument } from "@/lib/types";
import { POST } from "./route";

const saved = process.env.AFTERCARE_FORCE_SCRIPTED;
beforeAll(() => {
  process.env.AFTERCARE_FORCE_SCRIPTED = "true";
});
afterAll(() => {
  if (saved === undefined) delete process.env.AFTERCARE_FORCE_SCRIPTED;
  else process.env.AFTERCARE_FORCE_SCRIPTED = saved;
});

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/interpret", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const fixture = patientFixtures[0]!;

describe("POST /api/interpret", () => {
  it("interprets a fixture document by id", async () => {
    const res = await post({ patientId: fixture.profile.id, documentId: fixture.document.id, mode: "live_claude" });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { document: VisitDocument; interpretation: DocumentInterpretation };
    expect(json.document.id).toBe(fixture.document.id);
    expect(json.interpretation.meta.mode).toBe("scripted_demo"); // client-supplied mode is ignored
    for (const i of json.interpretation.instructions) {
      if (i.sourceVerification === "verified") expect(verifySourceRef(json.document, i.sourceRef)).toBe("verified");
    }
  });

  it("builds a sanitized pasted document and returns offsets into the returned text", async () => {
    const text = "Plan\r\n- Schedule a follow-up visit in 2 weeks.\u0007\r\n- Take your medicine with food.\r\n";
    const res = await post({ patientId: fixture.profile.id, text, title: "  My  summary " });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { document: VisitDocument; interpretation: DocumentInterpretation };
    expect(json.document.source).toBe("pasted");
    expect(json.document.title).toBe("My summary");
    expect(json.document.text).not.toMatch(/[\r\u0007]/);
    expect(json.document.sections?.[0]?.heading).toBe("Plan");
    expect(json.interpretation.documentId).toBe(json.document.id);
    expect(json.interpretation.instructions).toHaveLength(2);
    for (const i of json.interpretation.instructions) {
      expect(i.sourceVerification).toBe("verified");
      expect(verifySourceRef(json.document, i.sourceRef)).toBe("verified");
    }
  });

  it("reuses a client-provided document id for pasted text", async () => {
    const res = await post({ patientId: fixture.profile.id, documentId: "doc-client-123", text: "Plan\n- Call the clinic to book a visit.\n" });
    const json = (await res.json()) as { document: VisitDocument };
    expect(json.document.id).toBe("doc-client-123");
  });

  it("rejects text over the 20,000-character limit with 400", async () => {
    const res = await post({ patientId: fixture.profile.id, text: "a".repeat(MAX_DOCUMENT_CHARS + 1) });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: string };
    expect(json.error).not.toContain("aaaa");
  });

  it("rejects invalid bodies with 400", async () => {
    expect((await post("not json")).status).toBe(400);
    expect((await post({ patientId: fixture.profile.id })).status).toBe(400);
    expect((await post({ patientId: fixture.profile.id, text: "   " })).status).toBe(400);
    expect((await post({ patientId: "bad id with spaces", text: "x" })).status).toBe(400);
    expect((await post({ patientId: fixture.profile.id, text: "\u0007\u0008" })).status).toBe(400);
  });

  it("returns 404 for unknown patients or documents from another patient", async () => {
    expect((await post({ patientId: "pt-unknown", text: "Plan\n- Call us." })).status).toBe(404);
    const other = patientFixtures[1]!;
    expect((await post({ patientId: fixture.profile.id, documentId: other.document.id })).status).toBe(404);
    expect((await post({ patientId: fixture.profile.id, documentId: "doc-nope" })).status).toBe(404);
  });
});
