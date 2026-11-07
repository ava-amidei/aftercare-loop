/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { askKat as en } from "../en/askKat";

// Brand name "Ask Kat" is kept in English (ARCHITECTURE §2.11). Kat addresses the user
// with "usted"; chips are the user's own words to Kat, so they use "tú".
export const askKat = {
  "askKat.name": "Ask Kat",
  "askKat.fabLabel": "Ask Kat",
  "askKat.open": "Abrir Ask Kat",
  "askKat.close": "Cerrar Ask Kat",
  "askKat.minimize": "Minimizar Ask Kat",
  "askKat.panelTitle": "Ask Kat",
  "askKat.subtitle": "Su compañera para entender su información de salud",
  "askKat.notAClinician":
    "Kat no es profesional de salud. Kat no puede dar diagnósticos ni cambiar su tratamiento.",
  "askKat.contextFor": "Usando el expediente ficticio de {name}",

  "askKat.welcome":
    "¡Hola! Soy Kat. 💗\nEstoy aquí para ayudarle a entender su información de salud, explorar recursos confiables y preparar preguntas para su equipo de atención médica.\n¿En qué le puedo ayudar hoy?",
  "askKat.welcome.greeting": "¡Hola! Soy Kat. 💗",
  "askKat.welcome.body":
    "Estoy aquí para ayudarle a entender su información de salud, explorar recursos confiables y preparar preguntas para su equipo de atención médica.",
  "askKat.welcome.question": "¿En qué le puedo ayudar hoy?",

  "askKat.chip.what_should_i_ask": "¿Qué debo preguntarle a mi médico?",
  "askKat.chip.explain_my_diagnosis": "Explícame mi diagnóstico",
  "askKat.chip.understand_my_results": "Ayúdame a entender mis resultados",
  "askKat.chip.plan_next_steps": "Ayúdame a planear mis próximos pasos",
  "askKat.chip.free_text": "Pregúntele a Kat lo que quiera sobre su salud…",
  "askKat.chips.label": "Preguntas sugeridas",

  "askKat.prompt.simpler": "¿Me lo puedes explicar de forma más sencilla?",
  "askKat.prompt.medicalTerm": "¿Qué significa este término médico?",
  "askKat.prompt.followUpPlan": "¿Qué dice mi plan de seguimiento?",
  "askKat.prompt.clarify": "¿Qué información debería aclarar?",

  "askKat.input.label": "Mensaje para Kat",
  "askKat.input.placeholder": "Pregúntele a Kat lo que quiera sobre su salud…",
  "askKat.send": "Enviar",
  "askKat.thinking": "Kat está pensando…",
  "askKat.error": "Kat no pudo responder en este momento.",
  "askKat.retry": "Intentar de nuevo",
  "askKat.sources": "Fuentes",
  "askKat.clearChat": "Borrar conversación",
  "askKat.you": "Usted",
  "askKat.kat": "Kat",
  "askKat.questionAdded": "Se agregó a sus preguntas.",

  "askKat.action.view_source": "Ver la fuente original",
  "askKat.action.check_understanding": "Repasar lo que entendí",
  "askKat.action.add_question": "Agregar la pregunta a mi lista",
  "askKat.action.view_action_plan": "Ver mi plan de acción",
  "askKat.action.prepare_appointment": "Prepararme para mi cita",
  // ---- BEGIN ask-kat-ui additions ----
  "askKat.conversationActive": "Conversación en curso",
  "askKat.messagesLabel": "Conversación con Kat",
  "askKat.fromYourDocument": "De su resumen de la visita",
  "askKat.viewSource": "Ver la fuente",
  "askKat.sourceUnavailable": "El documento original de este pasaje no está disponible.",
  "askKat.deterministicNote": "Elaborado a partir de su expediente ficticio sin un modelo de IA.",
  "askKat.suggestedQuestion": "Pregunta sugerida",
  "askKat.questionAlreadySaved": "Ya está en sus preguntas",
  "askKat.planCreated": "Se creó su plan de acción a partir de su resumen de la visita.",
  "askKat.planError":
    "Kat no pudo crear su plan de acción en este momento. Puede intentarlo de nuevo desde Mi plan de acción.",
  "askKat.empty.title": "Todavía no hay mensajes",
  "askKat.empty.body": "Hágale una pregunta a Kat o elija una sugerencia.",
  "askKat.hydrating": "Cargando su conversación…",
  "askKat.moreSuggestions": "Más sugerencias",
  "askKat.concerningNote": "Kat no puede evaluar síntomas. Comuníquese pronto con su equipo de atención.",
  // ---- END ask-kat-ui additions ----
} satisfies FeatureTranslation<typeof en>;
