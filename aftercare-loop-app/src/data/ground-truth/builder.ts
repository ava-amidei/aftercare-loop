/** Small helpers so ground-truth records derive offsets from the real document text. */
import type { TeachBackQuestion, VisitDocument } from "@/lib/types";
import { exactRef } from "@/data/patients/document-builder";

export type TeachBackInput = Omit<TeachBackQuestion, "patientId" | "documentId" | "sourceRef"> & {
  /** Exact, unique substring of the document the question is about. */
  sourceQuote: string;
};

/** Build a TeachBackQuestion whose sourceRef offsets are computed from `doc.text`. */
export function teachBack(doc: VisitDocument, input: TeachBackInput): TeachBackQuestion {
  const { sourceQuote, ...rest } = input;
  return {
    ...rest,
    patientId: doc.patientId,
    documentId: doc.id,
    sourceRef: exactRef(doc, sourceQuote),
  };
}
