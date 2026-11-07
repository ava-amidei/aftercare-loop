/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { common as en } from "../en/common";

export const common = {
  "common.appName": "Aftercare Loop",
  "common.tagline":
    "Aftercare Loop no solo responde preguntas de salud. Ayuda a las pacientes a entender, confirmar y cumplir las indicaciones de cuidado documentadas.",
  "common.demoBanner": "Demostración con datos de pacientes ficticios.",
  "common.skipToContent": "Ir al contenido principal",

  "common.loading": "Cargando…",
  "common.error": "Algo salió mal.",
  "common.errorDetail": "Intente de nuevo. Si el problema continúa, reinicie la demostración.",
  "common.retry": "Intentar de nuevo",
  "common.save": "Guardar",
  "common.saved": "Guardado",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.minimize": "Minimizar",
  "common.edit": "Editar",
  "common.remove": "Quitar",
  "common.add": "Agregar",
  "common.copy": "Copiar",
  "common.copied": "Copiado",
  "common.back": "Atrás",
  "common.next": "Siguiente",
  "common.done": "Listo",
  "common.submit": "Enviar",
  "common.send": "Enviar",
  "common.yes": "Sí",
  "common.no": "No",
  "common.optional": "Opcional",
  "common.none": "Ninguno",
  "common.empty": "Todavía no hay nada aquí.",
  "common.viewSource": "Ver fuente",
  "common.hideSource": "Ocultar fuente",
  "common.sources": "Fuentes",
  "common.learnMore": "Más información",
  "common.opensInNewTab": "(se abre en una pestaña nueva)",
  "common.dueDate": "Fecha límite: {date}",

  "common.resetDemo": "Reiniciar demostración",
  "common.resetDemoConfirm":
    "¿Reiniciar la demostración? Todos los perfiles ficticios volverán a su estado inicial y se borrarán las conversaciones y el progreso.",
  "common.resetDemoDone": "Se reinició la demostración.",

  "common.patientSwitcher.label": "Paciente (datos ficticios)",
  "common.patientSwitcher.switchedTo": "Ahora está viendo a {name}",
  "common.language.label": "Idioma",
  "common.language.en": "English",
  "common.language.es": "Español",

  "common.mode.scripted":
    "Modo de demostración con guion — Las respuestas están predefinidas con fines de demostración.",
  "common.mode.scriptedShort": "Modo de demostración con guion",
  "common.mode.live": "Respuestas en vivo generadas por Claude.",
  "common.mode.liveShort": "IA en vivo",
  "common.mode.unsupported":
    "Esta demostración con guion no puede responder esa pregunta. Agregue una ANTHROPIC_API_KEY para activar las respuestas en vivo.",

  "common.disclaimer.education":
    "Aftercare Loop ofrece educación sobre la salud, no consejo médico. Siga siempre las indicaciones de su equipo de atención médica.",

  "common.origin.clinician_documented": "De su profesional de salud",
  "common.origin.patient_selected": "Elegido por usted",
  "common.origin.ai_suggested": "Sugerido por Kat",
  "common.verification.verified": "Coincide con su documento",
  "common.verification.unverified": "No se encontró en su documento",
  "common.verification.not_applicable": "Sin fuente en el documento",
} satisfies FeatureTranslation<typeof en>;
