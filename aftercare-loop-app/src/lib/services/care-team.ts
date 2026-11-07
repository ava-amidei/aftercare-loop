/**
 * Simulated care-team request router (SPEC §3.G). Pure state machine.
 *
 * Nothing is transmitted to real clinicians: every request carries
 * `simulated: true` and the UI labels the queue as a fictional simulation.
 * Aftercare Loop never authorizes refills or changes prescriptions.
 */
import type {
  ActionId,
  CareTeamRequest,
  CareTeamRequestStatus,
  CareTeamRequestType,
  PatientId,
} from "@/lib/types";
import { nowIso } from "@/lib/utils/dates";
import { stableId } from "@/lib/utils/ids";
import { normalizeWhitespace } from "@/lib/utils/text";

export const CARE_TEAM_STATUS_FLOW: Record<CareTeamRequestStatus, CareTeamRequestStatus> = {
  submitted: "in_review",
  in_review: "responded",
  responded: "closed",
  closed: "closed",
};

export const CARE_TEAM_STATUS_ORDER: CareTeamRequestStatus[] = ["submitted", "in_review", "responded", "closed"];

export function nextStatus(status: CareTeamRequestStatus): CareTeamRequestStatus {
  return CARE_TEAM_STATUS_FLOW[status] ?? "closed";
}

export interface CreateCareTeamRequestInput {
  patientId: PatientId;
  type: CareTeamRequestType;
  summary: string;
  details?: string;
  relatedActionId?: ActionId;
  /** ISO timestamp (defaults to now). */
  now?: string;
}

export function createCareTeamRequest(input: CreateCareTeamRequestInput): CareTeamRequest {
  const now = input.now ?? nowIso();
  const summary = normalizeWhitespace(input.summary);
  if (!summary) throw new RangeError("Care-team request summary is required.");
  const req: CareTeamRequest = {
    id: stableId("ctr", input.patientId, input.type, summary, input.relatedActionId, now),
    patientId: input.patientId,
    type: input.type,
    summary,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
    simulated: true,
  };
  const details = input.details ? input.details.trim() : "";
  if (details) req.details = details;
  if (input.relatedActionId) req.relatedActionId = input.relatedActionId;
  return req;
}

/** submitted → in_review → responded → closed. A closed request is returned unchanged. */
export function advanceRequest(req: CareTeamRequest, now: string = nowIso()): CareTeamRequest {
  if (req.status === "closed") return req;
  return { ...req, status: nextStatus(req.status), updatedAt: now, simulated: true };
}

const SEED_TEMPLATES: {
  type: CareTeamRequestType;
  status: CareTeamRequestStatus;
  minutesAgo: number;
  summary: string;
  details: string;
}[] = [
  {
    type: "clarification",
    status: "submitted",
    minutesAgo: 25,
    summary: "Fictional example: patient asked which of two follow-up instructions to do first.",
    details: "Simulated request for demonstration only. No real patient or clinician is involved.",
  },
  {
    type: "refill_request",
    status: "in_review",
    minutesAgo: 140,
    summary: "Fictional example: patient asked the clinic to review a refill for a current medicine.",
    details:
      "Simulated request for demonstration only. Aftercare Loop does not authorize refills or change prescriptions; a clinician would review this.",
  },
  {
    type: "side_effect_question",
    status: "responded",
    minutesAgo: 60 * 26,
    summary: "Fictional example: patient asked whether something they noticed could be related to a medicine.",
    details: "Simulated request for demonstration only. Any answer would come from the care team, not the app.",
  },
  {
    type: "reported_barrier",
    status: "submitted",
    minutesAgo: 10,
    summary: "Fictional example: patient reported a transportation barrier and asked about visit options.",
    details: "Simulated request for demonstration only. The patient asked whether telehealth or transportation help might be available.",
  },
];

/**
 * Fictional queued requests for the simulated clinician dashboard. Generic and
 * condition-agnostic; every summary starts with "Fictional example:".
 */
export function seedRequests(patientId: PatientId, now: string = nowIso()): CareTeamRequest[] {
  const base = new Date(now).getTime();
  const anchor = Number.isNaN(base) ? Date.now() : base;
  return SEED_TEMPLATES.map((t) => {
    const at = new Date(anchor - t.minutesAgo * 60_000).toISOString();
    return {
      id: stableId("ctr-seed", patientId, t.type),
      patientId,
      type: t.type,
      summary: t.summary,
      details: t.details,
      status: t.status,
      createdAt: at,
      updatedAt: at,
      simulated: true as const,
    };
  });
}
