import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { DocumentInterpretation, VisitDocument } from "@/lib/types";
import { InterpretationResult } from "./InterpretationResult";

const doc: VisitDocument = {
  id: "doc-test",
  patientId: "pt-test",
  title: "Fictional visit summary",
  text: "Return to the clinic in two weeks.",
} as VisitDocument;

function interp(flags: DocumentInterpretation["safetyFlags"]): DocumentInterpretation {
  return {
    documentId: doc.id,
    patientId: doc.patientId,
    whatThisMeans: "A plain-language overview of this fictional summary.",
    terms: [],
    whatToKnow: [],
    discussWithProvider: [],
    instructions: [],
    unansweredQuestions: [],
    limitations: [],
    safetyFlags: flags,
    referenceIds: [],
    meta: { mode: "scripted_demo", generatedAt: "2026-11-07T00:00:00.000Z", disclaimer: "Education only." },
  };
}

const renderResult = (i: DocumentInterpretation) =>
  render(
    <InterpretationResult interpretation={i} document={doc} savedQuestions={[]} onAddQuestion={() => {}} onViewSource={() => {}} />,
  );

/** True when `a` precedes `b` in document order. */
const before = (a: Element, b: Element) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

afterEach(() => cleanup());

describe("InterpretationResult (fix 8 ordering)", () => {
  it("shows the compact mode badge and one-line caption, then the explanation, then non-urgent flags", () => {
    renderResult(interp([{ level: "clarify_with_clinician", message: "Please confirm this with your clinic." }]));
    const row = screen.getByTestId("result-mode-row");
    const badge = row.querySelector("[data-mode='scripted_demo']")!;
    expect(badge).toHaveTextContent("Scripted Demo Mode");
    expect(screen.getByTestId("result-disclaimer")).toHaveTextContent("not medical advice");
    const card = screen.getByTestId("card-what-this-means");
    const flags = screen.getByTestId("safety-flags");
    expect(before(badge, card)).toBe(true);
    expect(before(card, flags)).toBe(true);
    expect(before(flags, screen.getByTestId("card-what-to-know"))).toBe(true);
    expect(screen.queryByTestId("safety-flags-urgent")).toBeNull();
  });

  it("keeps urgent flags above the explanation", () => {
    renderResult(
      interp([
        { level: "info", message: "Info note." },
        { level: "urgent", message: "Call 911 now." },
      ]),
    );
    const urgent = screen.getByTestId("safety-flags-urgent");
    expect(urgent).toHaveTextContent("Call 911 now.");
    expect(before(urgent, screen.getByTestId("card-what-this-means"))).toBe(true);
    expect(screen.getByTestId("safety-flags")).toHaveTextContent("Info note.");
  });
});
