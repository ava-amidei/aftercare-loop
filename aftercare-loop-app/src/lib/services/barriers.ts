/**
 * Barrier-aware administrative suggestions (SPEC §12.7).
 *
 * Every suggestion is:
 *  - administrative (never medical), origin `ai_suggested`, `not_applicable` source;
 *  - phrased as a QUESTION the patient could ask their clinic;
 *  - careful never to assert that a service exists ("whether … is available").
 *
 * Pure and deterministic: ids are derived from a language-independent key so a
 * language switch or a re-run never duplicates an item.
 */
import type { AccessBarrier, ActionItem, Language, PatientProfile } from "@/lib/types";
import { nowIso } from "@/lib/utils/dates";
import { stableId } from "@/lib/utils/ids";

export interface BarrierSuggestionText {
  /** Stable, language-independent key (used in the action id). */
  key: string;
  en: string;
  es: string;
}

export const BARRIER_SUGGESTIONS: Record<AccessBarrier, BarrierSuggestionText[]> = {
  transportation: [
    {
      key: "transport-assistance-or-telehealth",
      en: "Would you like to ask your clinic whether transportation assistance or a telehealth appointment is available?",
      es: "¿Le gustaría preguntarle a su clínica si hay ayuda con el transporte o una cita por telemedicina disponible?",
    },
  ],
  cost_or_insurance: [
    {
      key: "cost-financial-assistance-coverage",
      en: "Would you like to ask your clinic whether financial assistance is available and what your insurance covers for your follow-up care?",
      es: "¿Le gustaría preguntarle a su clínica si hay ayuda financiera disponible y qué cubre su seguro para su atención de seguimiento?",
    },
    {
      key: "cost-lower-cost-alternatives",
      en: "Would you like to ask your care team or pharmacist whether a generic or lower-cost option might be available for any of your medicines?",
      es: "¿Le gustaría preguntarle a su equipo de atención o a su farmacéutico si podría haber una opción genérica o de menor costo para alguno de sus medicamentos?",
    },
  ],
  language: [
    {
      key: "language-interpreter-services",
      en: "Would you like to ask your clinic whether interpreter services are available for your visits and phone calls?",
      es: "¿Le gustaría preguntarle a su clínica si hay servicios de intérprete disponibles para sus citas y llamadas?",
    },
    {
      key: "language-translated-materials",
      en: "Would you like to ask your clinic whether your visit instructions can be provided in your preferred language?",
      es: "¿Le gustaría preguntarle a su clínica si le pueden dar las instrucciones de su visita en su idioma preferido?",
    },
  ],
  scheduling: [
    {
      key: "scheduling-early-late-telehealth",
      en: "Would you like to ask your clinic whether early-morning, evening, or telehealth appointment times are available?",
      es: "¿Le gustaría preguntarle a su clínica si hay citas temprano en la mañana, por la tarde o por telemedicina disponibles?",
    },
  ],
  caregiving: [
    {
      key: "caregiving-children-or-telehealth",
      en: "Would you like to ask your clinic whether children may come with you to appointments, or whether a telehealth visit is possible?",
      es: "¿Le gustaría preguntarle a su clínica si sus hijos pueden acompañarla a las citas, o si es posible una cita por telemedicina?",
    },
  ],
};

/** Short, lowercase barrier labels used in rationales ("Suggested because you reported: …"). */
export const BARRIER_LABELS: Record<Language, Record<AccessBarrier, string>> = {
  en: {
    transportation: "transportation",
    cost_or_insurance: "cost or insurance",
    language: "language",
    scheduling: "limited appointment availability",
    caregiving: "caregiving responsibilities",
  },
  es: {
    transportation: "transporte",
    cost_or_insurance: "costo o seguro médico",
    language: "idioma",
    scheduling: "poca disponibilidad de citas",
    caregiving: "responsabilidades de cuidado de otras personas",
  },
};

const RATIONALE_PREFIX: Record<Language, string> = {
  en: "Suggested because you reported: ",
  es: "Sugerido porque usted indicó: ",
};

export function barrierRationale(barrier: AccessBarrier, language: Language = "en"): string {
  return `${RATIONALE_PREFIX[language]}${BARRIER_LABELS[language][barrier]}`;
}

export function barrierActionId(patientId: string, barrier: AccessBarrier, key: string): string {
  return stableId("act", patientId, "barrier", barrier, key);
}

export interface SuggestBarrierOptions {
  /** ISO timestamp for createdAt/updatedAt (defaults to now). */
  now?: string;
}

/**
 * One or two administrative, question-phrased suggestions per reported barrier,
 * in the profile language. Unknown barrier values are ignored.
 */
export function suggestBarrierActions(
  profile: PatientProfile,
  options: SuggestBarrierOptions = {},
): ActionItem[] {
  const now = options.now ?? nowIso();
  const language: Language = profile.language === "es" ? "es" : "en";
  const seen = new Set<string>();
  const items: ActionItem[] = [];
  for (const barrier of profile.barriers ?? []) {
    const suggestions = BARRIER_SUGGESTIONS[barrier];
    if (!suggestions) continue;
    for (const s of suggestions) {
      const id = barrierActionId(profile.id, barrier, s.key);
      if (seen.has(id)) continue;
      seen.add(id);
      items.push({
        id,
        patientId: profile.id,
        description: s[language],
        type: "administrative",
        category: "provider_question",
        origin: "ai_suggested",
        sourceVerification: "not_applicable",
        status: "pending",
        rationale: barrierRationale(barrier, language),
        addressesBarrier: barrier,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
  return items;
}
