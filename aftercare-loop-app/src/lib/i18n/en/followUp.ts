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
} satisfies Namespaced<"followUp">;
