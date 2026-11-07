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
  "check.saveForClinician": "Guardar para mi profesional de salud",
  "check.savedForClinician": "Se guardó en sus preguntas para la próxima cita.",
  "check.sourcePassage": "De su documento",
  "check.complete.title": "¡Listo!",
  "check.complete.body":
    "Gracias por repasar. Lo que haya guardado estará listo para su próxima cita.",
  "check.empty": "Todavía no hay preguntas. Primero revise el resumen de su consulta.",
  "check.error": "No pudimos revisar su respuesta en este momento.",
} satisfies FeatureTranslation<typeof en>;
