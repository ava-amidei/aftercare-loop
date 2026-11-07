/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { check as en } from "../en/check";

export const check = {
  "check.title": "Repasar lo que entendí",
  "check.subtitle": "Unas preguntas breves para confirmar que el resumen de su consulta se explicó con claridad.",
  "check.intro": "Quiero asegurarme de haberlo explicado con claridad.",
  "check.nextStepPrompt":
    "Quiero asegurarme de haberlo explicado con claridad. En sus propias palabras, ¿cuál es el siguiente paso de su plan de cuidado?",
  "check.reexplain": "Permítame explicarlo de otra manera.",
  "check.start": "Comenzar",
  "check.progress": "Pregunta {current} de {total}",
  "check.attempt": "Intento {number}",

  "check.answerLabel": "Su respuesta",
  "check.answerPlaceholder": "Responda con sus propias palabras",
  "check.chooseOne": "Elija una respuesta",
  "check.orTypeAnswer": "O escriba su respuesta",
  "check.submit": "Revisar mi respuesta",
  "check.checking": "Revisando…",

  "check.result.correct": "Así es.",
  "check.result.correctDetail": "Lo explicó con claridad.",
  "check.result.notYet": "Gracias por compartirlo. Repasemos esta parte con calma.",
  "check.result.correctAfterRetry": "Eso es. Gracias por repasarlo conmigo.",

  "check.tryAgain": "Intentar de nuevo",
  "check.nextQuestion": "Siguiente pregunta",
  "check.skip": "Omitir por ahora",
  "check.saveForClinician": "Guardar esta pregunta para mi equipo de atención médica",
  "check.savedForClinician": "Se guardó en sus preguntas para la próxima cita.",
  "check.sourcePassage": "De su documento",
  "check.complete.title": "¡Listo!",
  "check.complete.body":
    "Gracias por repasar. Lo que haya guardado estará listo para su próxima cita.",
  "check.empty": "Todavía no hay preguntas. Primero revise el resumen de su consulta.",
  "check.error": "No pudimos revisar su respuesta en este momento.",
  // ---- BEGIN check page additions ----
  "check.loading": "Cargando sus preguntas…",
  "check.emptyTitle": "Todavía no hay preguntas",
  "check.goToUnderstand": "Ir a «Entender mi salud»",
  "check.introDetail": "Responda con sus propias palabras o elija una opción. Aquí no hay respuestas malas, solo una oportunidad para aclarar las cosas.",
  "check.aboutDocument": "Preguntas sobre: {title}",
  "check.answerRequired": "Elija una respuesta o escríbala con sus propias palabras.",
  "check.yourAnswer": "Su respuesta: {answer}",
  "check.encourage": "Muy bien. Sigamos cuando usted quiera.",
  "check.unresolved.title": "Llevemos esta pregunta a su equipo de atención médica",
  "check.unresolved.body": "No se preocupe. Algunas cosas se entienden mejor conversando en persona. Puede guardar esta pregunta para su próxima cita.",
  "check.seeSummary": "Ver mi resumen",
  "check.progressLabel": "Avance en las preguntas",
  "check.saved": "Guardada para su equipo de atención médica",
  "check.summary.title": "Resumen de su repaso",
  "check.summary.intro": "Así le fue. Necesitar una segunda explicación es una parte normal de aprender.",
  "check.summary.firstTry": "{count} de {total} claras en el primer intento",
  "check.summary.byEnd": "{count} de {total} claras al final",
  "check.summary.clarified": "{count} explicadas de otra manera",
  "check.summary.savedCount": "{count} guardadas para su equipo de atención médica",
  "check.summary.questionFirst": "Primer intento",
  "check.summary.questionFinal": "Al final",
  "check.summary.clear": "Clara",
  "check.summary.stillUnclear": "Vale la pena preguntarle a su equipo de atención médica",
  "check.summary.notAnswered": "Todavía sin responder",
  "check.summary.reviewAgain": "Repasar las preguntas",
  "check.summary.viewPlan": "Ver mi plan de acción",
  "check.safety.concerning": "Gracias por compartirlo.",
  // ---- END check page additions ----
} satisfies FeatureTranslation<typeof en>;
