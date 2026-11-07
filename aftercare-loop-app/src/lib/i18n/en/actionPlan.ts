import type { Namespaced } from "../types";

export const actionPlan = {
  "actionPlan.title": "My Action Plan",
  "actionPlan.subtitle": "Your next steps, with where each one came from.",
  "actionPlan.generate": "Build my action plan",
  "actionPlan.generating": "Organizing your next steps…",
  "actionPlan.empty": "No steps yet. Review your visit summary in Understand My Health first.",
  "actionPlan.categoryEmpty": "Nothing here yet.",

  "actionPlan.category.care_plan": "My Care Plan",
  "actionPlan.category.care_planHint": "Steps your clinician documented in your visit summary.",
  "actionPlan.category.wellness_goal": "My Wellness Goals",
  "actionPlan.category.wellness_goalHint": "Goals you chose for yourself.",
  "actionPlan.category.provider_question": "Questions for My Provider",
  "actionPlan.category.provider_questionHint": "Questions to bring to your next appointment.",

  "actionPlan.status.pending": "Pending",
  "actionPlan.status.completed": "Completed",
  "actionPlan.status.needs_clarification": "Needs Clarification",
  "actionPlan.markCompleted": "Mark as completed",
  "actionPlan.markPending": "Mark as pending",
  "actionPlan.markNeedsClarification": "Mark as needs clarification",

  "actionPlan.type.medication": "Medication",
  "actionPlan.type.appointment": "Appointment",
  "actionPlan.type.test_or_lab": "Test or lab",
  "actionPlan.type.referral": "Referral",
  "actionPlan.type.lifestyle": "Lifestyle",
  "actionPlan.type.monitoring": "Monitoring",
  "actionPlan.type.administrative": "Administrative",
  "actionPlan.type.question_for_provider": "Question for my provider",
  "actionPlan.type.other": "Other",

  "actionPlan.field.source": "Source",
  "actionPlan.field.rationale": "Why this is here",
  "actionPlan.field.dueDate": "Due date",
  "actionPlan.field.noDueDate": "No due date in your document",

  "actionPlan.reminder.add": "Add a reminder",
  "actionPlan.reminder.label": "Reminder",
  "actionPlan.reminder.when": "Remind me on",
  "actionPlan.reminder.set": "Reminder set for {date}",
  "actionPlan.reminder.dismiss": "Dismiss reminder",
  "actionPlan.reminder.inAppOnly": "Reminders appear in this app only. No texts or emails are sent.",

  "actionPlan.addGoal": "Add a wellness goal",
  "actionPlan.addQuestion": "Add a question",
  "actionPlan.goalPlaceholder": "Type a goal",
  "actionPlan.questionPlaceholder": "Type a question for your provider",

  "actionPlan.needsClarification.title": "Needs clarification",
  "actionPlan.needsClarification.hint":
    "These couldn't be matched to the exact words in your document. Check them with your care team before acting on them.",
  "actionPlan.barrier.basedOn": "Based on something you shared: {barrier}",
  "actionPlan.barrier.sectionTitle": "Help with getting care",
  "actionPlan.barrier.sectionHint":
    "These are questions to ask your clinic, not medical instructions. Availability depends on your clinic.",
} satisfies Namespaced<"actionPlan">;
