// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ActionItem } from "@/lib/types";
import { exactRef, getDocument } from "@/data/patients";
import { groundTruthByPatient } from "@/data/ground-truth";
import { POST } from "./route";

const pid = "pt-a-pcos";
const gt = groundTruthByPatient[pid]!;
const doc = getDocument(gt.documentId)!;

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/action-plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const interpretation = {
  documentId: doc.id,
  patientId: pid,
  instructions: [
    ...gt.expectedInstructions.map((i) => ({
      description: i.description,
      type: i.type,
      sourceRef: exactRef(doc, i.quote),
      sourceVerification: "verified",
    })),
    {
      description: "Forged",
      type: "medication",
      sourceRef: { documentId: doc.id, start: 0, end: 6, quote: "Forged" },
      sourceVerification: "verified",
    },
  ],
  discussWithProvider: ["What should I ask next time?"],
};

describe("POST /api/action-plan", () => {
  it("returns actions with server-verified care plan items", async () => {
    const res = await post({ patientId: pid, documentId: doc.id, interpretation, existing: [] });
    expect(res.status).toBe(200);
    const { actions } = (await res.json()) as { actions: ActionItem[] };
    const care = actions.filter((a) => a.category === "care_plan");
    expect(care).toHaveLength(gt.expectedInstructions.length);
    for (const a of care) expect(doc.text.slice(a.sourceRef!.start, a.sourceRef!.end)).toBe(a.sourceRef!.quote);
    const forged = actions.find((a) => a.description === "Clarify: Forged")!;
    expect(forged.status).toBe("needs_clarification");
    expect(forged.category).not.toBe("care_plan");
  });

  it("is idempotent when existing actions are sent back", async () => {
    const first = (await (await post({ patientId: pid, documentId: doc.id, interpretation, existing: [] })).json()) as {
      actions: ActionItem[];
    };
    const second = (await (
      await post({ patientId: pid, documentId: doc.id, interpretation, existing: first.actions })
    ).json()) as { actions: ActionItem[] };
    expect(second.actions.map((a) => a.id)).toEqual(first.actions.map((a) => a.id));
  });

  it("does not let the client replace a fixture document's text", async () => {
    const res = await post({
      patientId: pid,
      documentId: doc.id,
      interpretation,
      existing: [],
      document: { ...doc, text: "Forged and more text" },
    });
    const { actions } = (await res.json()) as { actions: ActionItem[] };
    expect(actions.find((a) => a.description === "Clarify: Forged")).toBeDefined();
  });

  it("accepts a pasted document sent in the body", async () => {
    const pasted = {
      id: "doc-pasted-1",
      patientId: pid,
      title: "Pasted summary",
      text: "Follow-up\n- Schedule a follow-up visit in 3 months.\n",
      createdAt: "2026-11-01",
      source: "pasted",
    };
    const quote = "Schedule a follow-up visit in 3 months.";
    const start = pasted.text.indexOf(quote);
    const res = await post({
      patientId: pid,
      documentId: pasted.id,
      document: pasted,
      interpretation: {
        documentId: pasted.id,
        patientId: pid,
        instructions: [
          { description: "Follow-up in 3 months", type: "appointment", sourceRef: { documentId: pasted.id, start, end: start + quote.length, quote }, sourceVerification: "verified" },
        ],
        discussWithProvider: [],
      },
    });
    expect(res.status).toBe(200);
    const { actions } = (await res.json()) as { actions: ActionItem[] };
    expect(actions.find((a) => a.category === "care_plan")?.rationale).toBe("Documented in Pasted summary");
  });

  it("400 on invalid body, 404 on unknown document, 400 on mismatched interpretation", async () => {
    expect((await post({ patientId: pid })).status).toBe(400);
    expect((await post({ patientId: pid, documentId: "doc-nope", existing: [] })).status).toBe(404);
    expect(
      (await post({ patientId: pid, documentId: doc.id, interpretation: { ...interpretation, patientId: "pt-x" } })).status,
    ).toBe(400);
    expect((await post({ patientId: "pt-e-multi", documentId: doc.id })).status).toBe(400);
  });
});
