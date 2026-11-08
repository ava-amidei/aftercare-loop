/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { actionPlan as en } from "../en/actionPlan";

export const actionPlan = {
  "actionPlan.title": "Mi plan de acción",
  "actionPlan.subtitle": "Sus próximos pasos y de dónde viene cada uno.",
  "actionPlan.generate": "Crear mi plan de acción",
  "actionPlan.generating": "Organizando sus próximos pasos…",
  "actionPlan.empty": "Todavía no hay pasos. Primero revise el resumen de su consulta en «Entender mi salud».",
  "actionPlan.categoryEmpty": "Todavía no hay nada aquí.",

  "actionPlan.category.care_plan": "Mi plan de cuidado",
  "actionPlan.category.care_planHint":
    "Pasos que su equipo de atención anotó en el resumen de su consulta.",
  "actionPlan.category.wellness_goal": "Mis metas de bienestar",
  "actionPlan.category.wellness_goalHint": "Metas que usted eligió.",
  "actionPlan.category.provider_question": "Preguntas para mi profesional de salud",
  "actionPlan.category.provider_questionHint": "Preguntas para llevar a su próxima cita.",

  "actionPlan.status.pending": "Pendiente",
  "actionPlan.status.completed": "Completado",
  "actionPlan.status.needs_clarification": "Necesita aclaración",
  "actionPlan.markCompleted": "Marcar como completado",
  "actionPlan.markPending": "Marcar como pendiente",
  "actionPlan.markNeedsClarification": "Marcar como «necesita aclaración»",

  "actionPlan.type.medication": "Medicamento",
  "actionPlan.type.appointment": "Cita",
  "actionPlan.type.test_or_lab": "Prueba o análisis",
  "actionPlan.type.referral": "Referido a especialista",
  "actionPlan.type.lifestyle": "Hábitos de vida",
  "actionPlan.type.monitoring": "Seguimiento de síntomas o mediciones",
  "actionPlan.type.administrative": "Trámite",
  "actionPlan.type.question_for_provider": "Pregunta para mi profesional de salud",
  "actionPlan.type.other": "Otro",

  "actionPlan.field.source": "Fuente",
  "actionPlan.field.rationale": "Por qué aparece aquí",
  "actionPlan.field.dueDate": "Fecha límite",
  "actionPlan.field.noDueDate": "Su documento no indica una fecha",

  "actionPlan.reminder.add": "Agregar un recordatorio",
  "actionPlan.reminder.label": "Recordatorio",
  "actionPlan.reminder.when": "Recordarme el",
  "actionPlan.reminder.set": "Recordatorio para el {date}",
  "actionPlan.reminder.dismiss": "Descartar recordatorio",
  "actionPlan.reminder.inAppOnly":
    "Los recordatorios aparecen solo en esta aplicación. No se envían mensajes de texto ni correos.",

  "actionPlan.addGoal": "Agregar una meta de bienestar",
  "actionPlan.addQuestion": "Agregar una pregunta",
  "actionPlan.goalPlaceholder": "Escriba una meta",
  "actionPlan.questionPlaceholder": "Escriba una pregunta para su profesional de salud",

  "actionPlan.needsClarification.title": "Necesita aclaración",
  "actionPlan.needsClarification.hint":
    "No pudimos encontrar estas palabras exactas en su documento. Consúltelas con su equipo de atención médica antes de seguirlas.",
  "actionPlan.barrier.basedOn": "Según algo que usted compartió: {barrier}",
  "actionPlan.barrier.sectionTitle": "Ayuda para recibir atención médica",
  "actionPlan.barrier.sectionHint":
    "Son preguntas para su clínica, no indicaciones médicas. La disponibilidad depende de cada clínica.",
  // ---- BEGIN action-plan page additions ----
  "actionPlan.loading": "Cargando su plan de acción…",
  "actionPlan.emptyTitle": "Su plan de acción está vacío",
  "actionPlan.goToUnderstand": "Ir a «Entender mi salud»",
  "actionPlan.rebuild": "Actualizar desde mi resumen",
  "actionPlan.rebuildHint":
    "Actualiza su plan a partir del resumen de su consulta. Se conservan su progreso y sus recordatorios.",
  "actionPlan.rebuildDone": "Su plan de acción está al día.",
  "actionPlan.rebuildError": "No pudimos actualizar su plan de acción en este momento.",
  "actionPlan.noDocument": "Agregue el resumen de una consulta en «Entender mi salud» para crear su plan.",
  "actionPlan.count": "{count} en esta sección",
  "actionPlan.progress": "{completed} de {total} pasos completados",
  "actionPlan.status.label": "Estado",
  "actionPlan.modeNote": "Preguntas sugeridas a partir del resumen de su consulta:",
  "actionPlan.sourceUnavailable": "El documento original no está disponible.",

  "actionPlan.reminder.title": "Agregar un recordatorio",
  "actionPlan.reminder.labelField": "¿Qué quiere que le recordemos?",
  "actionPlan.reminder.save": "Guardar recordatorio",
  "actionPlan.reminder.invalid": "Elija una fecha y una hora.",
  "actionPlan.reminder.saved": "Se guardó el recordatorio.",
  "actionPlan.reminder.change": "Cambiar recordatorio",
  "actionPlan.reminder.dueTitle": "Recordatorio: {label}",
  "actionPlan.reminder.dueBody": "Para el {date}. Este recordatorio aparece solo en esta aplicación.",
  "actionPlan.reminder.view": "Ver mi plan de acción",

  "actionPlan.addGoalHint": "Algo en lo que le gustaría trabajar. Se marcará como elegido por usted.",
  "actionPlan.addQuestionHint": "Cualquier cosa que quiera preguntar en su próxima consulta.",
  "actionPlan.goalAdded": "Se agregó la meta.",
  "actionPlan.questionAdded": "Se agregó la pregunta.",
  "actionPlan.inputRequired": "Primero escriba algo, por favor.",

  "actionPlan.barrier.because": "Como usted mencionó {barrier}…",
  "actionPlan.barrier.addToQuestions": "Agregar a mis preguntas",
  "actionPlan.barrier.added": "Agregada a mis preguntas",

  "actionPlan.saved.title": "Mis preguntas guardadas",
  "actionPlan.saved.hint": "Preguntas que guardó desde «Ask Kat» o «Repasar lo que entendí».",
  "actionPlan.saved.remove": "Quitar pregunta: {question}",

  "actionPlan.needsClarification.what": "Qué significa esto",
  "actionPlan.needsClarification.explainer":
    "Kat encontró algo que podría ser una indicación, pero no pudo encontrar esas mismas palabras en el documento de su consulta. No forma parte de su plan de cuidado hasta que su equipo de atención médica lo confirme.",
  "actionPlan.needsClarification.claimed": "Lo que encontró Kat",
  // ---- END action-plan page additions ----
} satisfies FeatureTranslation<typeof en>;
