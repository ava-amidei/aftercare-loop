/*
 * Spanish UI strings (formal "usted" register, neutral Latin American Spanish).
 * Translations are demo-validated only for the scripted scenarios; they are NOT
 * a comprehensive, professionally validated medical translation. Missing keys
 * fall back to English at runtime. Clinical source passages are never translated.
 */
import type { FeatureTranslation } from "../types";
import type { nav as en } from "../en/nav";

export const nav = {
  "nav.mainLabel": "Navegación principal",
  "nav.menu": "Menú",
  "nav.home": "Inicio",
  "nav.dashboard": "Mi panel de salud",
  "nav.profile": "Mi perfil de salud",
  "nav.understand": "Entender",
  "nav.understandFull": "Entender mi salud",
  "nav.plan": "Plan",
  "nav.actionPlanFull": "Mi plan de acción",
  "nav.check": "Repasar",
  "nav.checkFull": "Repasar lo que entendí",
  "nav.followUp": "Seguimiento",
  "nav.followUpFull": "Seguimiento",
  "nav.careTeam": "Equipo de atención (simulado)",
  "nav.evaluation": "Evaluación",
  "nav.askKat": "Ask Kat",

  "nav.loop.label": "Su ciclo de cuidado",
  "nav.loop.understand": "Entender",
  "nav.loop.ask": "Preguntar",
  "nav.loop.verify": "Confirmar",
  "nav.loop.act": "Actuar",
  "nav.loop.followUp": "Dar seguimiento",
} satisfies FeatureTranslation<typeof en>;
