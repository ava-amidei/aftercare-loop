/**
 * Pure view-model helpers for the interpretation result. No React.
 */
import { getReferenceById } from "@/data/evidence";
import type {
  DocumentInterpretation,
  EvidenceReference,
  ExtractedInstruction,
  ReferenceId,
  SafetyFlag,
  VisitDocument,
} from "@/lib/types";
import { refMatchesDocument } from "./source-highlight";

export interface PartitionedInstructions {
  /** Server says verified AND the offsets re-check against the stored document text. */
  verified: ExtractedInstruction[];
  /** Everything else — shown only under "Needs clarification", never as an instruction. */
  needsClarification: ExtractedInstruction[];
}

export function isInstructionVerified(
  instruction: ExtractedInstruction,
  document: Pick<VisitDocument, "id" | "text"> | undefined,
): boolean {
  return instruction.sourceVerification === "verified" && refMatchesDocument(document, instruction.sourceRef);
}

export function partitionInstructions(
  instructions: ExtractedInstruction[],
  document: Pick<VisitDocument, "id" | "text"> | undefined,
): PartitionedInstructions {
  const verified: ExtractedInstruction[] = [];
  const needsClarification: ExtractedInstruction[] = [];
  for (const ins of instructions) {
    (isInstructionVerified(ins, document) ? verified : needsClarification).push(ins);
  }
  return { verified, needsClarification };
}

export interface ResolvedReferences {
  references: EvidenceReference[];
  /** Ids that are not in the curated index (never rendered as links). */
  missing: ReferenceId[];
}

/** Look ids up in the curated index only; unknown ids are dropped, duplicates removed. */
export function resolveReferences(
  ids: readonly ReferenceId[] | undefined,
  lookup: (id: ReferenceId) => EvidenceReference | undefined = getReferenceById,
): ResolvedReferences {
  const seen = new Set<string>();
  const references: EvidenceReference[] = [];
  const missing: ReferenceId[] = [];
  for (const id of ids ?? []) {
    if (seen.has(id)) continue;
    seen.add(id);
    const ref = lookup(id);
    if (ref && isSafeHttpUrl(ref.url)) references.push(ref);
    else missing.push(id);
  }
  return { references, missing };
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** All reference ids used by an interpretation (top-level + per-term), de-duplicated in order. */
export function collectReferenceIds(interp: Pick<DocumentInterpretation, "referenceIds" | "terms">): ReferenceId[] {
  const out: ReferenceId[] = [];
  const add = (id: ReferenceId) => {
    if (!out.includes(id)) out.push(id);
  };
  interp.referenceIds.forEach(add);
  interp.terms.forEach((term) => term.referenceIds.forEach(add));
  return out;
}

/** Discussion questions: suggested questions + questions the document leaves open, de-duplicated. */
export function discussionItems(
  interp: Pick<DocumentInterpretation, "discussWithProvider" | "unansweredQuestions">,
): { suggested: string[]; unanswered: string[] } {
  const norm = (s: string) => s.trim().toLowerCase();
  const suggested = uniqueTrimmed(interp.discussWithProvider);
  const seen = new Set(suggested.map(norm));
  const unanswered = uniqueTrimmed(interp.unansweredQuestions).filter((q) => !seen.has(norm(q)));
  return { suggested, unanswered };
}

function uniqueTrimmed(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const s = raw.trim();
    const key = s.toLowerCase();
    if (!s || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

const SAFETY_ORDER: Record<SafetyFlag["level"], number> = { urgent: 0, clarify_with_clinician: 1, info: 2 };

/** Most severe first. */
export function sortSafetyFlags(flags: SafetyFlag[]): SafetyFlag[] {
  return [...flags].sort((a, b) => SAFETY_ORDER[a.level] - SAFETY_ORDER[b.level]);
}

export function isSavedQuestion(saved: readonly string[], q: string): boolean {
  const key = q.trim().toLowerCase();
  return saved.some((s) => s.trim().toLowerCase() === key);
}
