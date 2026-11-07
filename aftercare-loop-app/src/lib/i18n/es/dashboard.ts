/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { dashboard as en } from "../en/dashboard";

export const dashboard = {
  "dashboard.title": "Mi panel de salud",
  "dashboard.greeting": "Hola, {name}",
  "dashboard.greetingNoName": "Hola",
  "dashboard.subtitle": "Aquí tiene un resumen de su cuidado, todo en un solo lugar.",
  "dashboard.scenario": "Escenario de demostración",

  "dashboard.action.understand": "Entender mi salud",
  "dashboard.action.askKat": "Ask Kat",
  "dashboard.action.actionPlan": "Mi plan de acción",
  "dashboard.action.prepare": "Prepararme para mi cita",

  "dashboard.topics.title": "Mis temas de salud",
  "dashboard.topics.empty": "Todavía no hay temas de salud. Puede agregarlos en su perfil.",
  "dashboard.tasks.title": "Tareas de seguimiento de mi profesional de salud",
  "dashboard.tasks.empty":
    "Todavía no hay tareas de seguimiento. Abra «Entender mi salud» para revisar el resumen de su consulta.",
  "dashboard.reminders.title": "Recordatorios de hoy",
  "dashboard.reminders.empty": "No hay recordatorios para hoy.",
  "dashboard.appointments.title": "Próximas citas",
  "dashboard.appointments.empty": "No hay próximas citas en su plan de acción.",
  "dashboard.goals.title": "Lo que quiero aprender",
  "dashboard.goals.empty": "Todavía no hay metas. Puede agregarlas en su perfil.",
  "dashboard.progress.title": "Mi progreso",
  "dashboard.progress.tasks": "{completed} de {total} tareas completadas",
  "dashboard.progress.checks": "{completed} de {total} repasos completados",
  "dashboard.recent.title": "Preguntas y temas recientes",
  "dashboard.recent.empty": "Todavía no hay preguntas. Pregúntele a Kat cuando quiera.",
  "dashboard.document.title": "Mi resumen de consulta más reciente",
  "dashboard.document.notReviewed": "Sin revisar",
  "dashboard.document.reviewed": "Revisado",
} satisfies FeatureTranslation<typeof en>;
