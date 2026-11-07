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
  // ---- BEGIN action-plan page additions ----
  "actionPlan.loading": "Loading your action plan…",
  "actionPlan.emptyTitle": "Your action plan is empty",
  "actionPlan.goToUnderstand": "Go to Understand My Health",
  "actionPlan.rebuild": "Rebuild from my summary",
  "actionPlan.rebuildHint": "Updates your plan from your visit summary. Your progress and reminders are kept.",
  "actionPlan.rebuildDone": "Your action plan is up to date.",
  "actionPlan.rebuildError": "We couldn't rebuild your action plan right now.",
  "actionPlan.noDocument": "Add a visit summary in Understand My Health to build your plan.",
  "actionPlan.count": "{count} in this section",
  "actionPlan.progress": "{completed} of {total} steps completed",
  "actionPlan.status.label": "Status",
  "actionPlan.modeNote": "Questions suggested from your visit summary:",
  "actionPlan.sourceUnavailable": "The original document is not available.",

  "actionPlan.reminder.title": "Add a reminder",
  "actionPlan.reminder.labelField": "What should we remind you about?",
  "actionPlan.reminder.save": "Save reminder",
  "actionPlan.reminder.invalid": "Choose a date and time.",
  "actionPlan.reminder.saved": "Reminder saved.",
  "actionPlan.reminder.change": "Change reminder",
  "actionPlan.reminder.dueTitle": "Reminder: {label}",
  "actionPlan.reminder.dueBody": "Due {date}. This reminder appears in this app only.",
  "actionPlan.reminder.view": "View my action plan",

  "actionPlan.addGoalHint": "Something you'd like to work on. It will be labeled as chosen by you.",
  "actionPlan.addQuestionHint": "Anything you want to ask at your next visit.",
  "actionPlan.goalAdded": "Goal added.",
  "actionPlan.questionAdded": "Question added.",
  "actionPlan.inputRequired": "Please type something first.",

  "actionPlan.barrier.because": "Because you mentioned {barrier}…",
  "actionPlan.barrier.addToQuestions": "Add to my questions",
  "actionPlan.barrier.added": "Added to my questions",

  "actionPlan.saved.title": "My saved questions",
  "actionPlan.saved.hint": "Questions you saved from Ask Kat or Check My Understanding.",
  "actionPlan.saved.remove": "Remove question: {question}",

  "actionPlan.needsClarification.what": "What this means",
  "actionPlan.needsClarification.explainer":
    "Kat found something that may be an instruction, but could not match it word-for-word to your visit document. It is not part of your care plan until your care team confirms it.",
  "actionPlan.needsClarification.claimed": "What Kat found",
  // ---- END action-plan page additions ----
} satisfies Namespaced<"actionPlan">;
