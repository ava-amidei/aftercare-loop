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

  // ---- BEGIN follow-up-and-care-team additions ------------------------------
  "followUp.pageTitle": "Prepararme para mi cita",
  "followUp.loading": "Cargando el resumen para su cita…",
  "followUp.error": "No pudimos preparar su resumen.",
  "followUp.sections.title": "Qué incluye mi resumen",
  "followUp.sections.description":
    "Se arma con sus preguntas guardadas, su plan de acción y el resumen de su consulta.",
  "followUp.sections.emptyTitle": "Todavía no hay nada que resumir",
  "followUp.sections.emptyDescription":
    "Revise el resumen de su consulta, arme su plan de acción o guarde una pregunta, y aparecerá aquí.",
  "followUp.sections.toUnderstand": "Entender el resumen de mi consulta",
  "followUp.sections.toPlan": "Abrir mi plan de acción",
  "followUp.section.none": "Nada anotado.",
  "followUp.origin.reported": "Indicado por usted",
  "followUp.instructions.extractedWith": "Cómo se encontraron estos pasos en su documento:",
  "followUp.instructions.noSourceQuote": "No hay un pasaje de origen disponible para este punto.",
  "followUp.summary.save": "Guardar resumen",
  "followUp.summary.saved": "Resumen guardado.",
  "followUp.summary.draft": "Borrador — todavía no se ha guardado",
  "followUp.summary.unsaved": "Tiene cambios sin guardar.",
  "followUp.summary.regenerated": "El resumen se actualizó con su información más reciente.",
  "followUp.summary.regenerateHint": "Al actualizar, el texto se vuelve a generar y se reemplazan sus cambios.",
  "followUp.summary.copyFailed": "No se pudo copiar automáticamente. Seleccione el texto y cópielo usted.",
  "followUp.summary.assembled":
    "Este resumen se arma con la información guardada en esta demostración. Revíselo antes de compartirlo.",
  "followUp.simulation.label": "Simulación ficticia — no se transmite nada",
  "followUp.send.button": "Enviar a mi equipo de atención (simulado)",
  "followUp.send.notice":
    "Esto solo agrega una solicitud ficticia a una cola simulada dentro de esta demostración. No se envía nada a un equipo de atención real y nadie responderá.",
  "followUp.send.done": "Se agregó a la cola simulada. No se transmitió nada.",
  "followUp.send.requestSummary":
    "Preparación para mi cita: por favor, ayúdenme a aclarar mis preguntas y los pendientes de seguimiento.",
  "followUp.send.emptyText": "Su resumen está vacío. Agregue texto antes de añadirlo a la cola simulada.",
  "followUp.request.title": "Preguntarle algo a mi equipo de atención (simulado)",
  "followUp.request.description": "Cree una solicitud ficticia en la cola simulada del equipo de atención.",
  "followUp.request.type": "Tipo de solicitud",
  "followUp.request.summary": "¿Qué le gustaría preguntar?",
  "followUp.request.summaryHint": "Sea breve. Su equipo de atención decide los siguientes pasos.",
  "followUp.request.summaryRequired": "Escriba un resumen breve.",
  "followUp.request.relatedAction": "Punto relacionado de mi plan",
  "followUp.request.relatedNone": "Ninguno",
  "followUp.request.submit": "Agregar a la cola simulada",
  "followUp.request.added": "La solicitud se agregó a la cola simulada. No se transmitió nada.",
  "followUp.request.refillNote":
    "Aftercare Loop nunca autoriza resurtidos ni cambia recetas. Solo su equipo de atención médica puede decidirlo.",
  "followUp.request.urgentTitle": "Esto podría necesitar atención urgente",
  "followUp.request.urgentQueue":
    "Nadie supervisa esta cola simulada. Por favor, no espere una respuesta aquí.",
  "followUp.requests.count": "Solicitudes en la cola simulada: {count}",
  // ---- END follow-up-and-care-team additions --------------------------------
} satisfies FeatureTranslation<typeof en>;
