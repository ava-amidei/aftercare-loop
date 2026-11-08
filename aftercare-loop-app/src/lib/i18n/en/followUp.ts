import type { Namespaced } from "../types";

export const followUp = {
  "followUp.title": "Follow Up",
  "followUp.subtitle": "Get ready for your next conversation with your care team.",
  "followUp.prepare": "Prepare for my appointment",

  "followUp.summary.title": "Summary for my care team",
  "followUp.summary.generate": "Create my summary",
  "followUp.summary.regenerate": "Update my summary",
  "followUp.summary.editHint": "You can edit this summary before you copy it.",
  "followUp.summary.editLabel": "Summary text",
  "followUp.summary.copy": "Copy summary",
  "followUp.summary.copied": "Summary copied.",
  "followUp.summary.noTransmit":
    "Nothing is sent anywhere. Copy the summary and share it with your care team yourself.",
  "followUp.summary.empty": "Create a summary to bring to your next appointment.",

  "followUp.section.questions": "My questions",
  "followUp.section.barriers": "Things that make getting care harder",
  "followUp.section.unresolved": "Still unresolved",
  "followUp.section.instructions": "Instructions from my visit summary",
  "followUp.section.savedQuestions": "Saved questions",
  "followUp.savedQuestions.empty": "No saved questions yet.",

  "followUp.queue.send": "Send to the simulated care team",
  "followUp.queue.sent": "Added to the simulated care-team queue.",
  "followUp.queue.view": "View the simulated care-team queue",

  // ---- BEGIN follow-up-and-care-team additions ------------------------------
  "followUp.pageTitle": "Prepare for My Appointment",
  "followUp.loading": "Loading your appointment summary…",
  "followUp.error": "We couldn't put your summary together.",
  "followUp.sections.title": "What's in my summary",
  "followUp.sections.description":
    "Put together from your saved questions, your action plan and your visit summary.",
  "followUp.sections.emptyTitle": "Nothing to summarize yet",
  "followUp.sections.emptyDescription":
    "Review your visit summary, build your action plan or save a question, and it will show up here.",
  "followUp.sections.toUnderstand": "Understand my visit summary",
  "followUp.sections.toPlan": "Open my action plan",
  "followUp.section.none": "Nothing noted.",
  "followUp.origin.reported": "Reported by you",
  "followUp.instructions.extractedWith": "How these steps were found in your document:",
  "followUp.instructions.noSourceQuote": "No source passage is available for this item.",
  "followUp.summary.save": "Save summary",
  "followUp.summary.saved": "Summary saved.",
  "followUp.summary.draft": "Draft — not saved yet",
  "followUp.summary.unsaved": "You have unsaved changes.",
  "followUp.summary.regenerated": "Summary updated from your latest information.",
  "followUp.summary.regenerateHint": "Updating rebuilds the text and replaces your edits.",
  "followUp.summary.copyFailed": "Couldn't copy automatically. Select the text and copy it yourself.",
  "followUp.summary.assembled":
    "This summary is assembled from the information saved in this demo. Please review it before sharing.",
  "followUp.simulation.label": "Fictional simulation — nothing is transmitted",
  "followUp.send.button": "Send to my care team (simulated)",
  "followUp.send.notice":
    "This only adds a fictional request to a simulated queue inside this demo. Nothing is sent to a real care team, and no one will reply.",
  "followUp.send.done": "Added to the simulated queue. Nothing was transmitted.",
  "followUp.send.requestSummary":
    "Appointment preparation: please help me clarify my questions and unresolved follow-up items.",
  "followUp.send.emptyText": "Your summary is empty. Add some text before adding it to the simulated queue.",
  "followUp.request.title": "Ask my care team something (simulated)",
  "followUp.request.description": "Create a fictional request in the simulated care-team queue.",
  "followUp.request.type": "Request type",
  "followUp.request.summary": "What would you like to ask?",
  "followUp.request.summaryHint": "Keep it short. Your care team decides any next steps.",
  "followUp.request.summaryRequired": "Please write a short summary.",
  "followUp.request.relatedAction": "Related item from my plan",
  "followUp.request.relatedNone": "None",
  "followUp.request.submit": "Add to simulated queue",
  "followUp.request.added": "Request added to the simulated queue. Nothing was transmitted.",
  "followUp.request.refillNote":
    "Aftercare Loop never authorizes refills or changes prescriptions. Only your care team can decide that.",
  "followUp.request.urgentTitle": "This may need urgent attention",
  "followUp.request.urgentQueue":
    "This simulated queue is not monitored by anyone. Please don't wait for a reply here.",
  "followUp.requests.count": "Requests in the simulated queue: {count}",
  // ---- END follow-up-and-care-team additions --------------------------------
} satisfies Namespaced<"followUp">;
