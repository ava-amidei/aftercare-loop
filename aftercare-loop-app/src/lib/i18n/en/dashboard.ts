import type { Namespaced } from "../types";

export const dashboard = {
  "dashboard.title": "My Health Dashboard",
  "dashboard.greeting": "Hi, {name}",
  "dashboard.greetingNoName": "Hi there",
  "dashboard.subtitle": "Here's an overview of your care, all in one place.",
  "dashboard.scenario": "Demo scenario",

  "dashboard.action.understand": "Understand My Health",
  "dashboard.action.askKat": "Ask Kat",
  "dashboard.action.actionPlan": "My Action Plan",
  "dashboard.action.prepare": "Prepare for My Appointment",

  "dashboard.topics.title": "My health topics",
  "dashboard.topics.empty": "No health topics yet. You can add them in your profile.",
  "dashboard.tasks.title": "Follow-up tasks from my clinician",
  "dashboard.tasks.empty":
    "No follow-up tasks yet. Open Understand My Health to review your visit summary.",
  "dashboard.reminders.title": "Today's reminders",
  "dashboard.reminders.empty": "No reminders for today.",
  "dashboard.appointments.title": "Upcoming appointments",
  "dashboard.appointments.empty": "No upcoming appointments in your action plan.",
  "dashboard.goals.title": "My learning goals",
  "dashboard.goals.empty": "No goals yet. You can add them in your profile.",
  "dashboard.progress.title": "My progress",
  "dashboard.progress.tasks": "{completed} of {total} tasks completed",
  "dashboard.progress.checks": "{completed} of {total} understanding checks completed",
  "dashboard.recent.title": "Recent questions and topics",
  "dashboard.recent.empty": "No questions yet. Ask Kat whenever you're ready.",
  "dashboard.document.title": "My latest visit summary",
  "dashboard.document.notReviewed": "Not reviewed yet",
  "dashboard.document.reviewed": "Reviewed",
} satisfies Namespaced<"dashboard">;
