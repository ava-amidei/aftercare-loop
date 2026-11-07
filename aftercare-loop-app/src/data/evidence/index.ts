// Curated evidence index. Owned by the evidence-index module.
// Keep these export names: `references`, `getReferenceById`.
import type { EvidenceReference, ReferenceId } from "@/lib/types";
import { references } from "./references";

export { references, EVIDENCE_ACCESSED_AT } from "./references";

const byId: ReadonlyMap<ReferenceId, EvidenceReference> = new Map(
  references.map((r) => [r.id, r]),
);

export function getReferenceById(id: ReferenceId): EvidenceReference | undefined {
  return byId.get(id);
}
