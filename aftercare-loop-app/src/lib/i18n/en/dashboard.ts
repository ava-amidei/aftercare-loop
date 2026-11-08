import type { Namespaced } from "../types";

export const dashboard = {
  "dashboard.title": "My Health Dashboard",
  "dashboard.greeting": "Hi, {name}",
  "dashboard.greetingNoName": "Hi there",
  "dashboard.subtitle": "Here's an overview of your care, all in one place.",
  "dashboard.scenario": "Demo scenario",
  "dashboard.loading": "Loading your dashboard…",
  "dashboard.error.title": "We couldn't load this dashboard.",
  "dashboard.error.noPatient": "No fictional patient is selected. Reset the demo to restore the starting data.",

  "dashboard.start.title": "Start by understanding your visit summary",
  "dashboard.start.body":
    "Kat explains your visit summary in plain words and lists the steps your care team wrote.",
  "dashboard.start.cta": "Understand my visit summary",

  "dashboard.askKat.cta": "Ask Kat",
  "dashboard.askKat.hint": "Questions about your health information? Kat can help you understand it.",

  "dashboard.actions.title": "What would you like to do?",
  "dashboard.action.understand": "Understand My Health",
  "dashboard.action.understandDesc": "Get a plain-language explanation of your visit summary.",
  "dashboard.action.askKat": "Ask Kat",
  "dashboard.action.askKatDesc": "Ask a question and prepare questions for your care team.",
  "dashboard.action.actionPlan": "My Action Plan",
  "dashboard.action.actionPlanDesc": "See your care plan, goals and questions in one list.",
  "dashboard.action.prepare": "Prepare for My Appointment",
  "dashboard.action.prepareDesc": "Build a summary of questions and follow-up items to share.",

  "dashboard.topics.title": "Your health topics",
  "dashboard.topics.empty": "No health topics yet. You can add them in your profile.",
  "dashboard.topics.edit": "Edit in profile",

  "dashboard.tasks.title": "From your care team",
  "dashboard.tasks.subtitle": "Pending steps written in your visit summary.",
  "dashboard.tasks.empty":
    "No follow-up tasks yet. Open Understand My Health to review your visit summary.",
  "dashboard.tasks.emptyDone": "No pending steps from your care team right now.",
  "dashboard.tasks.more": "+{count} more in My Action Plan",
  "dashboard.tasks.viewPlan": "View my action plan",

  "dashboard.reminders.title": "Today's reminders",
  "dashboard.upcoming.title": "Reminders and upcoming",
  "dashboard.upcoming.empty": "No reminders or due dates yet. You can add reminders in My Action Plan.",
  "dashboard.upcoming.today": "Today",
  "dashboard.upcoming.overdue": "Past due",
  "dashboard.upcoming.reminder": "Reminder",
  "dashboard.upcoming.due": "Due",
  "dashboard.reminders.empty": "No reminders for today.",
  "dashboard.appointments.title": "Upcoming appointments",
  "dashboard.appointments.empty": "No upcoming appointments in your action plan.",

  "dashboard.goals.title": "My goals",
  "dashboard.goals.learning": "What I want to learn",
  "dashboard.goals.empty": "No goals yet. You can add them in your profile.",
  "dashboard.goals.progress": "{completed} of {total} wellness goals completed",
  "dashboard.goals.noWellness": "No wellness goals in your action plan yet.",
  "dashboard.goals.progressLabel": "Wellness goal progress",
  "dashboard.progress.title": "My progress",
  "dashboard.progress.tasks": "{completed} of {total} tasks completed",
  "dashboard.progress.checks": "{completed} of {total} understanding checks completed",

  "dashboard.recent.title": "Recent questions",
  "dashboard.recent.asked": "Recently asked Kat",
  "dashboard.recent.saved": "Saved for my appointment",
  "dashboard.recent.empty": "No questions yet. Ask Kat whenever you're ready.",

  "dashboard.document.title": "My latest visit summary",
  "dashboard.document.notReviewed": "Not reviewed yet",
  "dashboard.document.reviewed": "Reviewed",
  "dashboard.document.empty": "No visit summary yet. You can paste one in Understand My Health.",
  "dashboard.document.open": "Open",

  "dashboard.switcher.placeholder": "Choose a fictional patient",
  "dashboard.switcher.option": "{name} — {summary}",
  "dashboard.language.group": "Interface language",
  "dashboard.reset.confirmTitle": "Reset the demo?",
  "dashboard.reset.confirmAction": "Reset demo",
} satisfies Namespaced<"dashboard">;
