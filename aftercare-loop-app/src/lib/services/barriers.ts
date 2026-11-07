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
import { normalizeWhitespace } from "@/lib/utils/text";

export interface BarrierSuggestionText {
  /** Stable, language-independent key (used in the action id). */
  key: string;
  /** Patient-facing prompt ("Would you like to ask your clinic whether…?"). */
  en: string;
  es: string;
  /**
   * Clinic-facing wording of the same question, in the patient's voice. This is
   * what gets saved to "My questions" and the care-team summary, never the prompt.
   */
  question: { en: string; es: string };
}

export const BARRIER_SUGGESTIONS: Record<AccessBarrier, BarrierSuggestionText[]> = {
  transportation: [
    {
      key: "transport-assistance-or-telehealth",
      en: "Would you like to ask your clinic whether transportation assistance or a telehealth appointment is available?",
      es: "¿Le gustaría preguntarle a su clínica si hay ayuda con el transporte o una cita por telemedicina disponible?",
      question: {
        en: "Is transportation assistance or a telehealth appointment available for my follow-up care?",
        es: "¿Hay ayuda con el transporte o citas por telemedicina disponibles para mi atención de seguimiento?",
      },
    },
  ],
  cost_or_insurance: [
    {
      key: "cost-financial-assistance-coverage",
      en: "Would you like to ask your clinic whether financial assistance is available and what your insurance covers for your follow-up care?",
      es: "¿Le gustaría preguntarle a su clínica si hay ayuda financiera disponible y qué cubre su seguro para su atención de seguimiento?",
      question: {
        en: "Is financial assistance available, and what does my insurance cover for my follow-up care?",
        es: "¿Hay ayuda financiera disponible y qué cubre mi seguro para mi atención de seguimiento?",
      },
    },
    {
      key: "cost-lower-cost-alternatives",
      en: "Would you like to ask your care team or pharmacist whether a generic or lower-cost option might be available for any of your medicines?",
      es: "¿Le gustaría preguntarle a su equipo de atención o a su farmacéutico si podría haber una opción genérica o de menor costo para alguno de sus medicamentos?",
      question: {
        en: "Is a generic or lower-cost option available for any of my medicines?",
        es: "¿Hay una opción genérica o de menor costo para alguno de mis medicamentos?",
      },
    },
  ],
  language: [
    {
      key: "language-interpreter-services",
      en: "Would you like to ask your clinic whether interpreter services are available for your visits and phone calls?",
      es: "¿Le gustaría preguntarle a su clínica si hay servicios de intérprete disponibles para sus citas y llamadas?",
      question: {
        en: "Are interpreter services available for my visits and phone calls?",
        es: "¿Hay servicios de intérprete disponibles para mis citas y llamadas?",
      },
    },
    {
      key: "language-translated-materials",
      en: "Would you like to ask your clinic whether your visit instructions can be provided in your preferred language?",
      es: "¿Le gustaría preguntarle a su clínica si le pueden dar las instrucciones de su visita en su idioma preferido?",
      question: {
        en: "Can my visit instructions be provided in my preferred language?",
        es: "¿Me pueden dar las instrucciones de mi visita en mi idioma preferido?",
      },
    },
  ],
  scheduling: [
    {
      key: "scheduling-early-late-telehealth",
      en: "Would you like to ask your clinic whether early-morning, evening, or telehealth appointment times are available?",
      es: "¿Le gustaría preguntarle a su clínica si hay citas temprano en la mañana, por la tarde o por telemedicina disponibles?",
      question: {
        en: "Are early-morning, evening, or telehealth appointment times available?",
        es: "¿Hay citas temprano en la mañana, por la tarde o por telemedicina disponibles?",
      },
    },
  ],
  caregiving: [
    {
      key: "caregiving-children-or-telehealth",
      en: "Would you like to ask your clinic whether children may come with you to appointments, or whether a telehealth visit is possible?",
      es: "¿Le gustaría preguntarle a su clínica si sus hijos pueden acompañarla a las citas, o si es posible una cita por telemedicina?",
      question: {
        en: "May my children come with me to appointments, or is a telehealth visit possible?",
        es: "¿Pueden mis hijos acompañarme a las citas, o es posible una cita por telemedicina?",
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// Clinic-facing wording (what is saved / sent, never the patient-facing prompt)
// ---------------------------------------------------------------------------

const normKey = (text: string) => normalizeWhitespace(text).toLowerCase();

const CLINIC_QUESTION_BY_TEXT: Map<string, string> = (() => {
  const map = new Map<string, string>();
  for (const list of Object.values(BARRIER_SUGGESTIONS)) {
    for (const s of list) {
      for (const lang of ["en", "es"] as const) {
        map.set(normKey(s[lang]), s.question[lang]);
        map.set(normKey(s.question[lang]), s.question[lang]);
      }
    }
  }
  return map;
})();

// Generic fallback for prompt-phrased suggestions not in the table (e.g. live
// Claude output): "Would you like to ask your clinic whether X?" → "Can you tell
// me whether X?". Only the leading prompt and possessives are rewritten.
const EN_PROMPT = /^would you like to ask (?:your|my) [^?]*?\b(whether|if)\s+(.+?)\??$/i;
const ES_PROMPT = /^¿?le gustaría preguntarle a su [^?]*?\bsi\s+(.+?)\??$/i;

function toFirstPersonEn(clause: string): string {
  return clause.replace(/\byour\b/gi, "my").replace(/\bwith you\b/gi, "with me");
}

function toFirstPersonEs(clause: string): string {
  return clause.replace(/\bsus\b/g, "mis").replace(/\bsu\b/g, "mi");
}

/**
 * The clinic-facing question for a barrier suggestion (either language, prompt
 * or question wording). Text that is not a prompt-phrased suggestion is returned
 * unchanged (normalized whitespace), so it is safe to call on any saved question.
 */
export function toClinicQuestion(text: string): string {
  const clean = normalizeWhitespace(text);
  const known = CLINIC_QUESTION_BY_TEXT.get(clean.toLowerCase());
  if (known) return known;
  const en = EN_PROMPT.exec(clean);
  if (en) return `Can you tell me ${en[1]!.toLowerCase()} ${toFirstPersonEn(en[2]!)}?`;
  const es = ES_PROMPT.exec(clean);
  if (es) return `¿Me podría decir si ${toFirstPersonEs(es[1]!)}?`;
  return clean;
}

/** True when `text` is (either wording of) a built-in barrier suggestion. */
export function isBarrierSuggestionText(text: string): boolean {
  return CLINIC_QUESTION_BY_TEXT.has(normKey(text));
}

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
