// STUB — replaced by the evidence-index agent. Keep these export names.
import type { EvidenceReference, ReferenceId } from "@/lib/types";

export const references: EvidenceReference[] = [];
export function getReferenceById(id: ReferenceId): EvidenceReference | undefined {
  return references.find((r) => r.id === id);
}
