/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { safety as en } from "../en/safety";

export const safety = {
  "safety.emergency.title": "Esto podría ser una emergencia",
  "safety.emergency.call911":
    "Llame al 911 ahora (en EE. UU.) o al número de emergencias de su localidad.",
  "safety.emergency.dontWait": "No espere una respuesta en esta aplicación.",
  "safety.crisis.title": "No tiene que enfrentar esto sin ayuda",
  "safety.crisis.call988":
    "En EE. UU., llame o envíe un mensaje de texto al 988 para comunicarse con la Línea 988 de Prevención del Suicidio y Crisis (hay atención en español). Si está en peligro inmediato, llame al 911.",
  "safety.concerning.title": "Consulte pronto con su equipo de atención médica",
  "safety.concerning.body":
    "Kat no puede evaluar síntomas. Comuníquese pronto con su equipo de atención médica o con un centro de atención de urgencias.",
  "safety.clarify.title": "Consulte esto con su equipo de atención médica",
  "safety.info.title": "Información útil",
  "safety.documentFlag": "Su documento menciona algo que podría requerir atención pronto.",
  "safety.limits":
    "Kat no puede dar diagnósticos, decirle si está fuera de peligro ni cambiar sus medicamentos o su plan de cuidado.",
  "safety.followInstructions": "Siga siempre las indicaciones de su equipo de atención médica.",
} satisfies FeatureTranslation<typeof en>;
