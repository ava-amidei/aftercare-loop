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
    "Pregunte sobre un tema de salud o pegue el resumen de su consulta para que se lo expliquemos.",

  "understand.input.topicLabel": "Pregunte sobre una condición, un término o una duda",
  "understand.input.topicPlaceholder": "Escriba una palabra o pregunta de su consulta",
  "understand.input.documentLabel": "Pegue el resumen de su consulta",
  "understand.input.documentPlaceholder": "Pegue aquí el texto del resumen de su consulta",
  "understand.input.upload": "Subir un archivo .txt",
  "understand.input.uploadHint": "Solo archivos de texto (.txt), de hasta 200 KB y 20,000 caracteres.",
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
  // ---- understand-page additions ----
  "understand.tabs.label": "Elija qué desea entender",
  "understand.tabs.topic": "Preguntar sobre un término o condición",
  "understand.tabs.summary": "El resumen de mi consulta",

  "understand.topic.ask": "Preguntar",
  "understand.topic.asking": "Buscando la respuesta…",
  "understand.topic.hint": "Por ejemplo, una palabra del resumen de su consulta o el nombre de un examen.",
  "understand.topic.empty": "Pregunte sobre una palabra, un examen o una condición para ver aquí una respuesta en lenguaje sencillo.",
  "understand.topic.emptyQuestion": "Primero escriba una palabra o pregunta.",
  "understand.topic.youAsked": "Usted preguntó",
  "understand.topic.answerFromKat": "Respuesta de Ask Kat",
  "understand.topic.error": "No pudimos obtener una respuesta en este momento.",
  "understand.topic.addQuestion": "Agregar a mis preguntas",

  "understand.input.loadSample": "Cargar mi resumen de ejemplo",
  "understand.input.pasteHint": "Puede pegar texto, cargar su resumen de ejemplo o subir un archivo .txt.",
  "understand.input.charCount": "{count} de {max} caracteres",
  "understand.input.tooLong": "Este resumen tiene más de {max} caracteres. Acórtelo, por favor.",
  "understand.input.fileEmpty": "Este archivo está vacío.",
  "understand.input.fileReadError": "No pudimos leer este archivo. Pruebe con otro.",
  "understand.input.fileLoaded": "Se cargó {name}",
  "understand.explain": "Explíquemelo",
  "understand.retry": "Intentar de nuevo",
  "understand.resultFor": "Explicación de: {title}",

  "understand.terms.expandHint": "Toque una palabra para ver qué significa.",
  "understand.terms.notInDocument": "No pudimos encontrar esta palabra en su documento.",
  "understand.terms.learnMore": "Más información",
  "understand.whatToKnow.generalNote":
    "Información general de salud, no un consejo específico sobre su situación.",
  "understand.whatToKnow.empty": "No se agregó información general para este documento.",
  "understand.discuss.hint": "Preguntas sugeridas que tal vez quiera hacer. No son indicaciones.",
  "understand.discuss.added": "Se agregó a sus preguntas",
  "understand.discuss.addedToast": "Se guardó en sus preguntas para su profesional de salud.",
  "understand.discuss.empty": "No hay preguntas sugeridas para este documento.",
  "understand.nextSteps.hint": "Aquí solo se muestran las indicaciones que coinciden con las palabras exactas de su documento.",
  "understand.nextSteps.needsClarification": "Necesita aclaración",
  "understand.nextSteps.needsClarificationHint":
    "Estos podrían ser próximos pasos, pero no pudimos encontrar las palabras exactas en su documento. No se agregan a su plan de atención. Consúltelos con su equipo de atención médica.",
  "understand.nextSteps.notVerified": "No verificado",
  "understand.nextSteps.claimedQuote": "Texto que buscamos: “{quote}”",

  "understand.sources.notVerified": "No verificado",
  "understand.sources.notVerifiedNote":
    "No encontramos una fuente seleccionada para esta explicación, así que no está respaldada por una fuente verificada. Consúltelo con su equipo de atención médica.",
  "understand.sources.unknownRemoved":
    "Algunas referencias no están en nuestra lista seleccionada y no se muestran.",
  "understand.sources.government": "Fuente gubernamental",
  "understand.sources.open": "Abrir {title}",

  "understand.safety.title": "Tenga en cuenta",
  "understand.safety.urgent": "Urgente",
  "understand.safety.clarify": "Consulte con su equipo de atención médica",
  "understand.safety.info": "Para su información",

  "understand.cta.title": "¿Qué le gustaría hacer ahora?",
  "understand.cta.check": "Comprobar lo que entendí",
  "understand.cta.plan": "Crear mi plan de acción",
  "understand.cta.planBuilding": "Creando su plan de acción…",
  "understand.cta.planError": "No pudimos crear su plan de acción en este momento.",

  "understand.viewer.title": "Documento original",
  "understand.viewer.description": "El fragmento resaltado es el texto exacto del que proviene este elemento.",
  "understand.viewer.notFound":
    "No pudimos encontrar este fragmento en el documento, así que no hay nada resaltado. Consúltelo con su equipo de atención médica.",
  "understand.viewer.noDocument": "El documento original no está disponible.",

  "understand.loading": "Cargando el resumen de su consulta…",
  "understand.emptyResult": "Seleccione “Explíquemelo” para ver una explicación en lenguaje sencillo de su resumen.",
  // ---- end understand-page additions ----
} satisfies FeatureTranslation<typeof en>;
