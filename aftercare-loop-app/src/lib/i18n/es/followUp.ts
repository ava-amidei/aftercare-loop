/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { followUp as en } from "../en/followUp";

export const followUp = {
  "followUp.title": "Seguimiento",
  "followUp.subtitle": "Prepárese para su próxima conversación con su equipo de atención médica.",
  "followUp.prepare": "Prepararme para mi cita",

  "followUp.summary.title": "Resumen para mi equipo de atención médica",
  "followUp.summary.generate": "Crear mi resumen",
  "followUp.summary.regenerate": "Actualizar mi resumen",
  "followUp.summary.editHint": "Puede editar este resumen antes de copiarlo.",
  "followUp.summary.editLabel": "Texto del resumen",
  "followUp.summary.copy": "Copiar resumen",
  "followUp.summary.copied": "Resumen copiado.",
  "followUp.summary.noTransmit":
    "No se envía nada. Copie el resumen y compártalo directamente con su equipo de atención médica.",
  "followUp.summary.empty": "Cree un resumen para llevar a su próxima cita.",

  "followUp.section.questions": "Mis preguntas",
  "followUp.section.barriers": "Lo que me dificulta recibir atención médica",
  "followUp.section.unresolved": "Pendiente de resolver",
  "followUp.section.instructions": "Indicaciones del resumen de mi consulta",
  "followUp.section.savedQuestions": "Preguntas guardadas",
  "followUp.savedQuestions.empty": "Todavía no hay preguntas guardadas.",

  "followUp.queue.send": "Enviar al equipo de atención simulado",
  "followUp.queue.sent": "Se agregó a la cola simulada del equipo de atención.",
  "followUp.queue.view": "Ver la cola simulada del equipo de atención",
} satisfies FeatureTranslation<typeof en>;
