/**
 * Deterministic guards shared by the document interpreter and the action-plan
 * generator (ARCHITECTURE §2.6): never present an AI-written medication change
 * as a documented instruction, and never present generic hydration/diet advice
 * as a care-plan step when the record documents a restriction.
 *
 * Pure, condition-agnostic (generic restriction/medication vocabulary only).
 */
import type { PatientProfile, VisitDocument } from "@/lib/types";

// ---------------------------------------------------------------------------
// Documented restrictions
// ---------------------------------------------------------------------------

const FLUID_RESTRICTION_PATTERNS: RegExp[] = [
  /fluid restriction/i,
  /restrict(?:ed|ing)? (?:your )?(?:total )?(?:fluids?|liquids?|water)/i,
  /limit(?:ed|ing)? (?:your )?(?:total |daily )?(?:fluids?|liquids?|water|how much you drink)/i,
  /(?:fluids?|liquids?) (?:limit|restriction)/i,
  /no more than [^.\n]{0,40}(?:fluids?|liquids?|cups|liters|litres|ounces)/i,
  /restricci[oó]n de l[ií]quidos/i,
  /limit(?:e|ar|a) (?:el total de |los |sus )?(?:l[ií]quidos|agua)/i,
];

const DIET_RESTRICTION_PATTERNS: RegExp[] = [
  /low[- ](?:sodium|salt|potassium|phosphorus|protein)/i,
  /(?:limit|restrict|reduce)(?:ed|ing)? (?:your )?(?:salt|sodium|potassium|phosphorus|protein)/i,
  /(?:sodium|salt|potassium|diet(?:ary)?) restriction/i,
  /restricci[oó]n (?:de sal|de sodio|de potasio|en la dieta|alimentaria)/i,
  /(?:dieta )?baja en (?:sal|sodio|potasio)/i,
];

/** A documented, individualized fluid amount (e.g. "2 to 3 liters of fluid each day"). */
const FLUID_TARGET_PATTERN =
  /\b\d+(?:[.,]\d+)?(?:\s*(?:to|-|–|a)\s*\d+(?:[.,]\d+)?)?\s*(?:liters?|litres?|litros?|cups?|tazas?|ounces?|oz)\b[^.\n]{0,30}\b(?:fluids?|water|liquids?|l[ií]quidos?|agua)\b/i;

const GENERIC_HYDRATION = /\b(?:hydrat\w*|drink (?:more|plenty|extra|lots)|more (?:water|fluids?)|plenty of (?:water|fluids?)|glasses of water|increase (?:your )?(?:fluid|water)|water intake|fluid intake|tomar (?:m[aá]s|mucha) agua|hidrat\w*)/i;
const GENERIC_DIET = /\b(?:eat (?:more|less|healthier|a healthy)|healthy (?:diet|eating)|balanced diet|nutrition|increase (?:your )?(?:protein|fruits?|vegetables)|alimentaci[oó]n saludable|dieta (?:sana|saludable|balanceada)|comer m[aá]s)/i;

export interface DocumentedRestrictions {
  fluid: boolean;
  diet: boolean;
  fluidTarget: boolean;
}

/**
 * Returns which restriction kinds are documented in the document text or
 * profile care instructions. `fluidTarget` = an individualized fluid amount is
 * documented (generic hydration advice is then suppressed, no extra question).
 */
export function detectDocumentedRestrictions(
  profile: Pick<PatientProfile, "careInstructions">,
  document?: Pick<VisitDocument, "text"> | null,
): DocumentedRestrictions {
  const haystack = [document?.text ?? "", ...(profile.careInstructions ?? [])].join("\n");
  return {
    fluid: FLUID_RESTRICTION_PATTERNS.some((p) => p.test(haystack)),
    diet: DIET_RESTRICTION_PATTERNS.some((p) => p.test(haystack)),
    fluidTarget: FLUID_TARGET_PATTERN.test(haystack),
  };
}

export function isGenericHydrationText(text: string): boolean {
  return GENERIC_HYDRATION.test(text);
}

export function isGenericDietText(text: string): boolean {
  return GENERIC_DIET.test(text);
}

/** True when the text itself states a fluid limit or an individualized fluid amount. */
export function isFluidRestrictionText(text: string): boolean {
  return FLUID_RESTRICTION_PATTERNS.some((p) => p.test(text)) || FLUID_TARGET_PATTERN.test(text);
}

/**
 * True when the texts read as generic "drink more" advice while the record
 * documents a fluid limit — e.g. a handout sentence quoted in "Reason for
 * visit". Such advice must not be shown as a care-plan step; the patient should
 * ask which applies. A text that itself states the limit/amount never conflicts.
 */
export function conflictsWithFluidRestriction(
  texts: ReadonlyArray<string | undefined>,
  restrictions: DocumentedRestrictions,
): boolean {
  if (!restrictions.fluid) return false;
  const present = texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  if (present.some(isFluidRestrictionText)) return false;
  return present.some(isGenericHydrationText);
}

// ---------------------------------------------------------------------------
// Medication-change directives
// ---------------------------------------------------------------------------

/**
 * Medication-change verbs, base and inflected forms ("holding your furosemide",
 * "try skipping the morning dose"). "hold" is not counted for device handling
 * ("hold the pen for 10 seconds", "hold your breath").
 */
export const MED_CHANGE_VERB_SOURCE =
  "increas(?:e|es|ing)|decreas(?:e|es|ing)|reduc(?:e|es|ing)|rais(?:e|es|ing)|lower(?:s|ing)?|doubl(?:e|es|ing)|halv(?:e|es|ing)|" +
  "cut(?:ting)? (?:back|down)|stop(?:s|ping)?|skip(?:s|ping)?|chang(?:e|es|ing)|adjust(?:s|ing)?|switch(?:es|ing)?|" +
  "taper(?:s|ing)?|discontinu(?:e|es|ing)|titrat(?:e|es|ing)|" +
  "(?:with)?hold(?:s|ing)?(?!\\s+(?:(?:the|your|it|this)\\s+)?(?:\\w+\\s+)?(?:pen|needle|syringe|inhaler|pressure|breath|it in|in place|still|on|under))|" +
  "paus(?:e|es|ing)|aumente|aumentar|aumentando|disminuya|disminuir|disminuyendo|reduzca|reducir|reduciendo|" +
  "suspenda|suspender|suspendiendo|interrump(?:a|ir|iendo)|pausar|cambie|cambiar|cambiando|omita|omitir|omitiendo";
const MED_CHANGE_VERB = new RegExp(
  `\\b(?:${MED_CHANGE_VERB_SOURCE}|instead|more often|less often|extra dose|deje de|dejar de|dejando de|en lugar de|m[aá]s seguido)\\b`,
  "i",
);
const MED_CHANGE_OBJECT =
  /\b(?:dose|doses|dosage|mg|mcg|units?|medications?|medicines?|meds|pills?|tablets?|insulin|prescriptions?|dosis|medicamentos?|medicinas?|pastillas?|unidades)\b/i;

function isQuestion(text: string): boolean {
  const t = text.trim();
  return t.endsWith("?") || t.startsWith("¿");
}

/**
 * True when a text reads as a directive to change a medication (dose,
 * frequency, stop/skip). Questions to the care team are allowed.
 */
export function isMedicationChangeDirective(text: string, medicationNames: readonly string[] = []): boolean {
  if (isQuestion(text)) return false;
  if (!MED_CHANGE_VERB.test(text)) return false;
  if (MED_CHANGE_OBJECT.test(text)) return true;
  const lower = text.toLowerCase();
  return medicationNames.some((n) => n.trim().length > 2 && lower.includes(n.trim().toLowerCase()));
}

/**
 * True when an AI-written description of a quoted passage states a medication
 * change the clinician's quote does not. The quote must then be shown instead.
 */
export function descriptionAddsMedicationChange(
  description: string,
  quote: string,
  medicationNames: readonly string[] = [],
): boolean {
  return isMedicationChangeDirective(description, medicationNames) && !isMedicationChangeDirective(quote, medicationNames);
}
