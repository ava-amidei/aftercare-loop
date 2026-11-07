/**
 * Pure helpers for the simulated care-team (clinician) view. No AI, no I/O.
 */
import type { ActionItem, CareTeamRequest, CareTeamRequestStatus, CareTeamRequestType } from "@/lib/types";
import { CARE_TEAM_STATUS_ORDER } from "@/lib/services/care-team";

export type TypeFilter = CareTeamRequestType | "all";

export const CARE_TEAM_TYPES: readonly CareTeamRequestType[] = [
  "clarification",
  "refill_request",
  "side_effect_question",
  "incomplete_follow_up",
  "reported_barrier",
];

/** Seeded fictional examples use the "ctr-seed-" id prefix (services/care-team seedRequests). */
export function isSeedRequest(req: Pick<CareTeamRequest, "id">): boolean {
  return req.id.startsWith("ctr-seed-");
}

/** Patient's own requests first, then seeds; de-duplicated by id. */
export function mergeQueue(own: CareTeamRequest[], seeds: CareTeamRequest[]): CareTeamRequest[] {
  const seen = new Set<string>();
  const out: CareTeamRequest[] = [];
  for (const r of [...own, ...seeds]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

export function filterByType(reqs: CareTeamRequest[], type: TypeFilter): CareTeamRequest[] {
  return type === "all" ? reqs : reqs.filter((r) => r.type === type);
}

/** Groups in workflow order; newest first within a group. Every status key is present. */
export function groupByStatus(
  reqs: CareTeamRequest[],
): { status: CareTeamRequestStatus; requests: CareTeamRequest[] }[] {
  return CARE_TEAM_STATUS_ORDER.map((status) => ({
    status,
    requests: reqs
      .filter((r) => r.status === status)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)),
  }));
}

/** Care-plan items still pending or needing clarification (read-only list). */
export function incompleteFollowUps(actions: ActionItem[]): ActionItem[] {
  return actions.filter(
    (a) => a.category === "care_plan" && (a.status === "pending" || a.status === "needs_clarification"),
  );
}

/** Advance a request held in local (seed) state. Mirrors the store transition. */
export function replaceRequest(reqs: CareTeamRequest[], next: CareTeamRequest): CareTeamRequest[] {
  return reqs.map((r) => (r.id === next.id ? next : r));
}
