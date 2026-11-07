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
  // ---- BEGIN follow-up-and-care-team additions ------------------------------
  "careTeam.banner": "Fictional simulation — no real patients or clinicians",
  "careTeam.description":
    "A simulated clinician view of the requests for {name}, plus fictional example requests.",
  "careTeam.staffNote":
    "Staff review is simulated. Moving a request to the next step does not contact anyone.",
  "careTeam.noAi": "No AI actions run on this page.",
  "careTeam.loading": "Loading the simulated queue…",
  "careTeam.error": "We couldn't load the simulated queue.",
  "careTeam.queue.title": "Request queue",
  "careTeam.filter.label": "Filter by request type",
  "careTeam.filter.all": "All types",
  "careTeam.group.empty": "No requests at this step.",
  "careTeam.emptyFiltered": "No requests match this filter.",
  "careTeam.emptyDescription": "Requests created on the Follow Up page appear here.",
  "careTeam.origin.patient": "From {name} (fictional)",
  "careTeam.origin.seed": "Fictional example",
  "careTeam.closedFinal": "Closed — no further steps",
  "careTeam.relatedAction": "Related plan item: {description}",
  "careTeam.showDetails": "Show details",
  "careTeam.advanced": "Status changed to {status} (simulated).",
  "careTeam.readOnly": "Read-only",
  "careTeam.followUps.title": "Incomplete follow-up items",
  "careTeam.followUps.description": "From the patient's care plan. Pending or needing clarification.",
  "careTeam.followUps.empty": "No incomplete follow-up items.",
  "careTeam.followUps.unverified": "Not matched to the visit document — needs clarification",
  "careTeam.barriers.title": "Patient-reported barriers",
  "careTeam.barriers.description": "Reported in the patient's profile.",
  "careTeam.barriers.empty": "No barriers reported.",
  "careTeam.barriers.reported": "Reported by patient",
  // ---- END follow-up-and-care-team additions --------------------------------
} satisfies Namespaced<"careTeam">;
