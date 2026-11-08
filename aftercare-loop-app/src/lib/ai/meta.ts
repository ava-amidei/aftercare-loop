/** AiMeta construction — every AI-shaped response carries one (ARCHITECTURE §2.9). */
import type { AiMeta, Language, ResponseMode } from "@/lib/types";

export const AI_DISCLAIMER =
  "Aftercare Loop provides general education about your fictional visit information. It is not medical advice and does not replace your care team. If you think you may be having an emergency, call 911 or your local emergency number.";

export const AI_DISCLAIMER_ES =
  "Aftercare Loop ofrece información educativa general sobre la información ficticia de su visita. No es un consejo médico y no reemplaza a su equipo de atención. Si cree que puede tener una emergencia, llame al 911 o al número de emergencias local.";

export function getDisclaimer(language: Language = "en"): string {
  return language === "es" ? AI_DISCLAIMER_ES : AI_DISCLAIMER;
}

/**
 * Build the meta block. `model` is only recorded for live responses; scripted
 * responses never claim a model id.
 */
export function makeMeta(mode: ResponseMode, model?: string, language: Language = "en"): AiMeta {
  const meta: AiMeta = {
    mode,
    generatedAt: new Date().toISOString(),
    disclaimer: getDisclaimer(language),
  };
  if (mode !== "scripted_demo" && model) meta.model = model;
  return meta;
}
