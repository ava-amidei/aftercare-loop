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
  "dashboard.loading": "Cargando su panel…",
  "dashboard.error.title": "No pudimos cargar este panel.",
  "dashboard.error.noPatient":
    "No hay una paciente ficticia seleccionada. Reinicie la demostración para restaurar los datos iniciales.",

  "dashboard.start.title": "Comience por entender el resumen de su consulta",
  "dashboard.start.body":
    "Kat puede explicarle en lenguaje sencillo el resumen ficticio de su consulta y señalar los pasos de seguimiento que anotó su profesional de salud.",
  "dashboard.start.cta": "Entender el resumen de mi consulta",

  "dashboard.askKat.cta": "Ask Kat",
  "dashboard.askKat.hint": "¿Tiene preguntas sobre su información de salud? Kat puede ayudarle a entenderla.",

  "dashboard.actions.title": "¿Qué le gustaría hacer?",
  "dashboard.action.understand": "Entender mi salud",
  "dashboard.action.understandDesc": "Reciba una explicación sencilla del resumen de su consulta.",
  "dashboard.action.askKat": "Ask Kat",
  "dashboard.action.askKatDesc": "Haga una pregunta y prepare preguntas para su equipo de salud.",
  "dashboard.action.actionPlan": "Mi plan de acción",
  "dashboard.action.actionPlanDesc": "Vea su plan de cuidado, sus metas y sus preguntas en una sola lista.",
  "dashboard.action.prepare": "Prepararme para mi cita",
  "dashboard.action.prepareDesc": "Prepare un resumen de preguntas y pendientes para compartir.",

  "dashboard.topics.title": "Sus temas de salud",
  "dashboard.topics.empty": "Todavía no hay temas de salud. Puede agregarlos en su perfil.",
  "dashboard.topics.edit": "Editar en el perfil",

  "dashboard.tasks.title": "De su equipo de salud",
  "dashboard.tasks.subtitle": "Pasos pendientes escritos en el resumen de su consulta.",
  "dashboard.tasks.empty":
    "Todavía no hay tareas de seguimiento. Abra «Entender mi salud» para revisar el resumen de su consulta.",
  "dashboard.tasks.emptyDone": "Por ahora no hay pasos pendientes de su equipo de salud.",
  "dashboard.tasks.more": "+{count} más en Mi plan de acción",
  "dashboard.tasks.viewPlan": "Ver mi plan de acción",

  "dashboard.reminders.title": "Recordatorios de hoy",
  "dashboard.upcoming.title": "Recordatorios y próximos pasos",
  "dashboard.upcoming.empty":
    "Todavía no hay recordatorios ni fechas límite. Puede agregar recordatorios en Mi plan de acción.",
  "dashboard.upcoming.today": "Hoy",
  "dashboard.upcoming.overdue": "Vencido",
  "dashboard.upcoming.reminder": "Recordatorio",
  "dashboard.upcoming.due": "Fecha límite",
  "dashboard.reminders.empty": "No hay recordatorios para hoy.",
  "dashboard.appointments.title": "Próximas citas",
  "dashboard.appointments.empty": "No hay próximas citas en su plan de acción.",

  "dashboard.goals.title": "Mis metas",
  "dashboard.goals.learning": "Lo que quiero aprender",
  "dashboard.goals.empty": "Todavía no hay metas. Puede agregarlas en su perfil.",
  "dashboard.goals.progress": "{completed} de {total} metas de bienestar completadas",
  "dashboard.goals.noWellness": "Todavía no hay metas de bienestar en su plan de acción.",
  "dashboard.goals.progressLabel": "Progreso de las metas de bienestar",
  "dashboard.progress.title": "Mi progreso",
  "dashboard.progress.tasks": "{completed} de {total} tareas completadas",
  "dashboard.progress.checks": "{completed} de {total} repasos completados",

  "dashboard.recent.title": "Preguntas recientes",
  "dashboard.recent.asked": "Preguntas recientes a Kat",
  "dashboard.recent.saved": "Guardadas para mi cita",
  "dashboard.recent.empty": "Todavía no hay preguntas. Pregúntele a Kat cuando quiera.",

  "dashboard.document.title": "Mi resumen de consulta más reciente",
  "dashboard.document.notReviewed": "Sin revisar",
  "dashboard.document.reviewed": "Revisado",
  "dashboard.document.empty": "Todavía no hay un resumen de consulta. Puede pegar uno en «Entender mi salud».",
  "dashboard.document.open": "Abrir",

  "dashboard.switcher.placeholder": "Elija una paciente ficticia",
  "dashboard.switcher.option": "{name} — {summary}",
  "dashboard.language.group": "Idioma de la interfaz",
  "dashboard.reset.confirmTitle": "¿Reiniciar la demostración?",
  "dashboard.reset.confirmAction": "Reiniciar",
} satisfies FeatureTranslation<typeof en>;
