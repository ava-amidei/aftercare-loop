/**
 * Pure helpers that turn scripted content into domain objects. Offsets are
 * always computed from the real document text (never typed by hand).
 */
import type {
  DocumentInterpretation,
  ExtractedInstruction,
  PatientGroundTruth,
  SourceRef,
  VisitDocument,
} from "@/lib/types";
import type { ScriptedPatientContent } from "./types";

/** SourceRef for the first exact occurrence of `quote` in the document, or null. */
export function locateFirst(doc: VisitDocument, quote: string): SourceRef | null {
  if (!quote) return null;
  const start = doc.text.indexOf(quote);
  if (start < 0) return null;
  const end = start + quote.length;
  const section = doc.sections?.find((s) => s.start <= start && end <= s.end);
  return {
    documentId: doc.id,
    start,
    end,
    quote,
    ...(section ? { sectionId: section.id } : {}),
  };
}

/** Ground-truth instructions → ExtractedInstructions with exact, verified offsets. */
export function instructionsFromGroundTruth(
  doc: VisitDocument,
  groundTruth: PatientGroundTruth,
): ExtractedInstruction[] {
  return groundTruth.expectedInstructions.map((gt) => {
    const ref = locateFirst(doc, gt.quote);
    const verified = ref !== null && doc.text.slice(ref.start, ref.end) === gt.quote;
    const instruction: ExtractedInstruction = {
      description: gt.description,
      type: gt.type,
      sourceVerification: verified ? "verified" : "unverified",
    };
    if (ref) instruction.sourceRef = ref;
    if (gt.dueDate) instruction.dueDate = gt.dueDate;
    return instruction;
  });
}

/** Assemble a full interpretation (minus meta) from scripted content. */
export function buildScriptedInterpretation(
  content: ScriptedPatientContent,
  doc: VisitDocument,
  groundTruth: PatientGroundTruth | undefined,
): Omit<DocumentInterpretation, "meta"> {
  const i = content.interpretation;
  return {
    documentId: doc.id,
    patientId: content.patientId,
    whatThisMeans: i.whatThisMeans,
    terms: i.terms.map((t) => {
      const ref = locateFirst(doc, t.find);
      return {
        term: t.term,
        definition: t.definition,
        referenceIds: [...t.referenceIds],
        ...(ref ? { sourceRef: ref } : {}),
      };
    }),
    whatToKnow: [...i.whatToKnow],
    discussWithProvider: [...i.discussWithProvider],
    instructions: groundTruth ? instructionsFromGroundTruth(doc, groundTruth) : [],
    unansweredQuestions: [...i.unansweredQuestions],
    limitations: [...i.limitations],
    safetyFlags: i.safetyFlags.map((f) => ({ ...f })),
    referenceIds: [...i.referenceIds],
  };
}
