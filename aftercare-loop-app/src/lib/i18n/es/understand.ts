/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { understand as en } from "../en/understand";

export const understand = {
  "understand.title": "Entender mi salud",
  "understand.subtitle":
    "Pregunte sobre un tema de salud o pegue el resumen de su consulta para recibir una explicación en lenguaje sencillo.",

  "understand.input.topicLabel": "Pregunte sobre una condición, un término o una duda",
  "understand.input.topicPlaceholder": "Escriba una palabra o pregunta de su consulta",
  "understand.input.documentLabel": "Pegue el resumen de su consulta",
  "understand.input.documentPlaceholder": "Pegue aquí el texto del resumen de su consulta",
  "understand.input.upload": "Subir un archivo .txt",
  "understand.input.uploadHint": "Solo archivos de texto (.txt), de hasta 20,000 caracteres.",
  "understand.input.useCurrent": "Usar el resumen de mi consulta",
  "understand.input.fileWrongType": "Elija un archivo de texto (.txt).",
  "understand.input.fileTooLarge": "Este archivo es demasiado largo. Use un resumen más corto.",
  "understand.input.emptyDocument": "Primero pegue o suba el resumen de su consulta.",
  "understand.generate": "Explicar",
  "understand.generating": "Leyendo el resumen de su consulta…",

  "understand.section.whatThisMeans": "¿Qué significa esto?",
  "understand.section.whatToKnow": "¿Qué debo saber?",
  "understand.section.discuss": "¿Qué puedo hablar con mi profesional de salud?",
  "understand.section.nextSteps": "¿Cuáles son mis próximos pasos?",
  "understand.section.sources": "Fuentes",
  "understand.section.terms": "Palabras clave",
  "understand.section.limitations": "Lo que su documento no dice",
  "understand.section.unanswered": "Preguntas que su documento no responde",

  "understand.label.documented": "De su documento",
  "understand.label.generalEducation": "Información general",
  "understand.label.clinicianProvided": "De su profesional de salud",
  "understand.label.optionalSuggestion": "Sugerencia opcional",

  "understand.addToPlan": "Agregar a mi plan de acción",
  "understand.addedToPlan": "Se agregó a su plan de acción",
  "understand.addQuestion": "Agregar a mis preguntas",
  "understand.unverifiedNotice":
    "No pudimos encontrar estas palabras exactas en su documento, así que no se muestra como una indicación. Consúltelo con su equipo de atención médica.",
  "understand.noEvidence":
    "No encontramos una fuente confiable sobre este tema. Consúltelo con su equipo de atención médica.",
  "understand.noInstructions": "No se encontraron indicaciones de seguimiento en este documento.",

  "understand.source.patient_education": "Educación para pacientes",
  "understand.source.clinical_guideline": "Guía clínica",
  "understand.source.peer_reviewed": "Investigación revisada por expertos",
  "understand.source.government_resource": "Recurso gubernamental",
  "understand.source.accessed": "Consultado el {date}",
  "understand.source.updated": "Actualizado el {date}",

  "understand.document.original": "Documento original",
  "understand.document.highlight": "Fragmento resaltado",
  "understand.empty": "Pegue el resumen de una consulta o haga una pregunta para comenzar.",
  "understand.error": "No pudimos preparar una explicación en este momento.",
} satisfies FeatureTranslation<typeof en>;
