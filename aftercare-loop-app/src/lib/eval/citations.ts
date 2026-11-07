/**
 * Citation-validity suite (ARCHITECTURE §2.5): every extracted instruction marked
 * `sourceVerification: "verified"` must point at its exact quote:
 * `document.text.slice(ref.start, ref.end) === ref.quote` (and the ref must name
 * the same document). Unverified items are counted separately — they are routed
 * to "Needs clarification" and are not citation failures.
 */
import type { EvalCaseResult, EvalMetric, ExtractedInstruction, VisitDocument } from "@/lib/types";
import { countMetric, ratioMetric } from "./metrics";

export interface CitationInput {
  patientId: string;
  document: VisitDocument;
  instructions: ExtractedInstruction[];
}

export interface CitationSuiteResult {
  metrics: EvalMetric[];
  cases: EvalCaseResult[];
  verifiedCount: number;
  validCount: number;
  invalidCount: number;
  unverifiedCount: number;
}

/** Why a "verified" citation is invalid, or null when it is valid. */
export function citationProblem(doc: VisitDocument, item: ExtractedInstruction): string | null {
  const ref = item.sourceRef;
  if (!ref) return "marked verified but has no sourceRef";
  if (ref.documentId !== doc.id) return `sourceRef.documentId ${ref.documentId} does not match ${doc.id}`;
  if (!Number.isInteger(ref.start) || !Number.isInteger(ref.end) || ref.start < 0 || ref.end > doc.text.length || ref.end <= ref.start) {
    return `offsets [${ref.start}, ${ref.end}) are out of range`;
  }
  if (doc.text.slice(ref.start, ref.end) !== ref.quote) return "document text at the stated offsets does not equal the quote";
  return null;
}

export function runCitationSuite(inputs: CitationInput[]): CitationSuiteResult {
  const cases: EvalCaseResult[] = [];
  let verifiedCount = 0;
  let validCount = 0;
  let unverifiedCount = 0;
  let total = 0;

  for (const { patientId, document: doc, instructions } of inputs) {
    instructions.forEach((item, i) => {
      total++;
      if (item.sourceVerification !== "verified") {
        if (item.sourceVerification === "unverified") unverifiedCount++;
        return;
      }
      verifiedCount++;
      const problem = citationProblem(doc, item);
      if (!problem) validCount++;
      cases.push({
        caseId: `citation:${patientId}:${i + 1}`,
        suite: "citation_validity",
        passed: problem === null,
        details: problem === null ? "Quote matches the document at the stated offsets." : `Invalid citation: ${problem}.`,
        expected: item.sourceRef ? { documentId: doc.id, start: item.sourceRef.start, end: item.sourceRef.end, quote: item.sourceRef.quote } : undefined,
        actual: item.sourceRef ? { textAtOffsets: doc.text.slice(Math.max(0, item.sourceRef.start), Math.max(0, item.sourceRef.end)) } : undefined,
      });
    });
  }

  const invalidCount = verifiedCount - validCount;
  const metrics: EvalMetric[] = [
    countMetric("Verified citations checked", verifiedCount, total, inputs.length > 0),
    countMetric("Valid citations", validCount, verifiedCount),
    countMetric("Invalid citations", invalidCount, verifiedCount),
    ratioMetric("Citation validity rate", validCount, verifiedCount),
    countMetric("Unverified instructions (routed to Needs clarification)", unverifiedCount, total, inputs.length > 0),
  ];
  return { metrics, cases, verifiedCount, validCount, invalidCount, unverifiedCount };
}
