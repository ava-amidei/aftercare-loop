import type { Namespaced } from "../types";

export const careTeam = {
  "careTeam.title": "Care Team Queue",
  "careTeam.fictional": "Fictional simulation",
  "careTeam.fictionalNotice":
    "This is a fictional simulation. Nothing is sent to real clinicians or care teams.",
  "careTeam.staffView": "Simulated clinician view",
  "careTeam.noAuthorization":
    "Requests here never authorize refills or change prescriptions. Those decisions are made by a clinician.",
  "careTeam.empty": "No requests in the queue.",

  "careTeam.type.clarification": "Clarification request",
  "careTeam.type.refill_request": "Refill request",
  "careTeam.type.side_effect_question": "Side-effect question",
  "careTeam.type.incomplete_follow_up": "Incomplete follow-up item",
  "careTeam.type.reported_barrier": "Reported barrier",

  "careTeam.status.submitted": "Submitted",
  "careTeam.status.in_review": "In review",
  "careTeam.status.responded": "Responded",
  "careTeam.status.closed": "Closed",

  "careTeam.advance": "Move to next step",
  "careTeam.advanceTo": "Mark as {status}",
  "careTeam.field.patient": "Patient (fictional)",
  "careTeam.field.type": "Request type",
  "careTeam.field.summary": "Summary",
  "careTeam.field.details": "Details",
  "careTeam.field.status": "Status",
  "careTeam.field.submittedAt": "Submitted {date}",
  "careTeam.field.updatedAt": "Updated {date}",
  "careTeam.newRequest": "New request",
  "careTeam.submit": "Submit request",
  "careTeam.submitted": "Request added to the simulated queue.",
} satisfies Namespaced<"careTeam">;
