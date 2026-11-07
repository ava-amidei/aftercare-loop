/**
 * Action Plan Generator (SPEC §3.E, §12.4, §12.7).
 *
 * Pure and deterministic. Turns a document interpretation + profile into
 * ActionItems with strict origin separation:
 *  - clinician_documented: ONLY instructions whose sourceRef matches the document
 *    text exactly (`text.slice(start, end) === quote`). These go to My Care Plan.
 *  - ai_suggested: discussion questions, clarification items for unverified
 *    instructions, barrier-aware administrative questions. Never in My Care Plan.
 *  - patient_selected: wellness goals from the profile.
 *
 * Guards:
 *  - never creates AI medication dose/frequency change directives;
 *  - never creates generic hydration/diet items when the document or profile
 *    documents a restriction — asks about individualized targets instead.
 *
 * Ids are stable hashes, so re-running never duplicates items; merging with
 * `existing` preserves status, reminders and createdAt.
 */
import type {
  ActionItem,
  DocumentInterpretation,
  ExtractedInstruction,
  Language,
  PatientProfile,
  SourceRef,
  VisitDocument,
} from "@/lib/types";
import { nowIso } from "@/lib/utils/dates";
import { stableId } from "@/lib/utils/ids";
import { normalizeWhitespace } from "@/lib/utils/text";
import { suggestBarrierActions } from "./barriers";

export { suggestBarrierActions, BARRIER_SUGGESTIONS } from "./barriers";

export type ActionPlanInterpretation = Pick<
  DocumentInterpretation,
  "documentId" | "patientId" | "instructions" | "discussWithProvider"
>;

export interface BuildActionPlanInput {
  profile: PatientProfile;
  interpretation?: ActionPlanInterpretation | null;
  document?: VisitDocument | null;
  existing?: ActionItem[];
  /** ISO timestamp used for new/changed items (defaults to now). */
  now?: string;
}

// ---------------------------------------------------------------------------
// Localized strings
// ---------------------------------------------------------------------------

const STRINGS = {
  en: {
    documentedIn: (title: string) => `Documented in ${title}`,
    clarifyPrefix: "Clarify: ",
    unverifiedRationale:
      "Kat could not match this to the exact words in your visit document, so it is not part of your care plan. Ask your care team to confirm it.",
    discussRationale: "Suggested by Kat as a question you could ask, based on your visit information.",
    goalRationale: "You added this goal to your health profile.",
    hydrationQuestion: "Ask about individualized hydration targets",
    hydrationRationale:
      "Your visit document or profile mentions a fluid or diet restriction, so general hydration advice may not apply to you. Your care team can tell you what fits your plan.",
    nutritionQuestion: "Ask which eating guidance applies to you",
    nutritionRationale:
      "Your visit document or profile mentions a diet restriction, so general eating advice may not apply to you. Your care team can tell you what fits your plan.",
  },
  es: {
    documentedIn: (title: string) => `Documentado en ${title}`,
    clarifyPrefix: "Aclarar: ",
    unverifiedRationale:
      "Kat no pudo encontrar estas palabras exactas en su documento de la visita, así que no forma parte de su plan de atención. Pida a su equipo de atención que lo confirme.",
    discussRationale: "Kat lo sugiere como una pregunta que podría hacer, según la información de su visita.",
    goalRationale: "Usted agregó esta meta a su perfil de salud.",
    hydrationQuestion: "Preguntar cuánto líquido debo tomar según mi caso",
    hydrationRationale:
      "Su documento de la visita o su perfil menciona una restricción de líquidos o de alimentación, así que los consejos generales sobre tomar agua pueden no aplicarse a usted. Su equipo de atención puede decirle qué es adecuado para su plan.",
    nutritionQuestion: "Preguntar qué recomendaciones de alimentación se aplican a mí",
    nutritionRationale:
      "Su documento de la visita o su perfil menciona una restricción en la alimentación, así que los consejos generales pueden no aplicarse a usted. Su equipo de atención puede decirle qué es adecuado para su plan.",
  },
} as const;

// ---------------------------------------------------------------------------
// Guards (exported for tests and reuse)
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

/**
 * Returns which restriction kinds are documented in the document text or
 * profile care instructions. `fluidTarget` = an individualized fluid amount is
 * documented (generic hydration advice is then suppressed, no extra question).
 */
export function detectDocumentedRestrictions(
  profile: PatientProfile,
  document?: VisitDocument | null,
): { fluid: boolean; diet: boolean; fluidTarget: boolean } {
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

const MED_CHANGE_VERB =
  /\b(?:increase|decrease|reduce|raise|lower|double|halve|cut back|stop|skip|change|adjust|switch|taper|discontinue|titrate|instead|more often|less often|extra dose|aumente|aumentar|disminuya|disminuir|reduzca|reducir|suspenda|suspender|cambie|cambiar|deje de|dejar de|omita|omitir|en lugar de|m[aá]s seguido)\b/i;
const MED_CHANGE_OBJECT =
  /\b(?:dose|doses|dosage|mg|mcg|units?|medications?|medicines?|meds|pills?|tablets?|insulin|prescriptions?|dosis|medicamentos?|medicinas?|pastillas?|unidades)\b/i;

function isQuestion(text: string): boolean {
  const t = text.trim();
  return t.endsWith("?") || t.startsWith("¿");
}

/**
 * True when an AI-authored text reads as a directive to change a medication
 * (dose, frequency, stop/skip). Questions to the care team are allowed.
 */
export function isMedicationChangeDirective(text: string, medicationNames: string[] = []): boolean {
  if (isQuestion(text)) return false;
  if (!MED_CHANGE_VERB.test(text)) return false;
  if (MED_CHANGE_OBJECT.test(text)) return true;
  const lower = text.toLowerCase();
  return medicationNames.some((n) => n.trim().length > 2 && lower.includes(n.trim().toLowerCase()));
}

/** Exact traceability check (ARCHITECTURE §2.5). */
export function isVerifiedRef(document: VisitDocument | null | undefined, ref: SourceRef | undefined): ref is SourceRef {
  if (!document || !ref) return false;
  if (ref.documentId !== document.id) return false;
  if (!Number.isInteger(ref.start) || !Number.isInteger(ref.end) || ref.start < 0 || ref.end <= ref.start) return false;
  if (!ref.quote) return false;
  return document.text.slice(ref.start, ref.end) === ref.quote;
}

// ---------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------

function key(text: string): string {
  return normalizeWhitespace(text).toLowerCase();
}

export function instructionActionId(patientId: string, documentId: string, quote: string): string {
  return stableId("act", patientId, documentId, "quote", quote);
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

type Draft = Omit<ActionItem, "createdAt" | "updatedAt">;

function verifiedInstructionItem(
  profile: PatientProfile,
  document: VisitDocument,
  instruction: ExtractedInstruction,
  ref: SourceRef,
  language: Language,
): Draft {
  const isQuestionType = instruction.type === "question_for_provider";
  const medNames = profile.medications.map((m) => m.name);
  // If the AI-written description reads as a med change the quote doesn't state,
  // fall back to the clinician's own words.
  const description =
    isMedicationChangeDirective(instruction.description, medNames) &&
    !isMedicationChangeDirective(ref.quote, medNames)
      ? ref.quote
      : normalizeWhitespace(instruction.description) || ref.quote;
  const draft: Draft = {
    id: instructionActionId(profile.id, document.id, ref.quote),
    patientId: profile.id,
    documentId: document.id,
    description,
    type: instruction.type,
    category: isQuestionType ? "provider_question" : "care_plan",
    origin: "clinician_documented",
    sourceRef: { ...ref },
    sourceVerification: "verified",
    status: "pending",
    rationale: STRINGS[language].documentedIn(document.title),
  };
  if (instruction.dueDate) draft.dueDate = instruction.dueDate;
  return draft;
}

function clarificationItem(
  profile: PatientProfile,
  documentId: string | undefined,
  instruction: ExtractedInstruction,
  language: Language,
): Draft {
  const s = STRINGS[language];
  const description = normalizeWhitespace(instruction.description || instruction.sourceRef?.quote || "");
  return {
    id: stableId("act", profile.id, documentId, "clarify", key(instruction.sourceRef?.quote || description)),
    patientId: profile.id,
    ...(documentId ? { documentId } : {}),
    description: `${s.clarifyPrefix}${description}`,
    type: "question_for_provider",
    category: "provider_question",
    origin: "ai_suggested",
    sourceVerification: "unverified",
    status: "needs_clarification",
    rationale: s.unverifiedRationale,
  };
}

function aiQuestionItem(
  profile: PatientProfile,
  documentId: string | undefined,
  text: string,
  rationale: string,
): Draft {
  const description = normalizeWhitespace(text);
  return {
    id: stableId("act", profile.id, documentId, "discuss", key(description)),
    patientId: profile.id,
    ...(documentId ? { documentId } : {}),
    description,
    type: "question_for_provider",
    category: "provider_question",
    origin: "ai_suggested",
    sourceVerification: "not_applicable",
    status: "pending",
    rationale,
  };
}

function goalItem(profile: PatientProfile, goal: string, language: Language): Draft {
  const description = normalizeWhitespace(goal);
  return {
    id: stableId("act", profile.id, "goal", key(description)),
    patientId: profile.id,
    description,
    type: "other",
    category: "wellness_goal",
    origin: "patient_selected",
    sourceVerification: "not_applicable",
    status: "pending",
    rationale: STRINGS[language].goalRationale,
  };
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

function sameContent(a: Draft, b: ActionItem): boolean {
  return (
    a.description === b.description &&
    a.type === b.type &&
    a.category === b.category &&
    a.origin === b.origin &&
    a.sourceVerification === b.sourceVerification &&
    a.rationale === b.rationale &&
    a.dueDate === b.dueDate &&
    a.addressesBarrier === b.addressesBarrier &&
    a.documentId === b.documentId &&
    JSON.stringify(a.sourceRef ?? null) === JSON.stringify(b.sourceRef ?? null)
  );
}

function mergeOne(draft: Draft, prev: ActionItem | undefined, now: string): ActionItem {
  if (!prev) return { ...draft, createdAt: now, updatedAt: now };
  // Preserve the patient's progress. An unverified item cannot silently become
  // "pending" again; only an explicit completion is carried over.
  let status = prev.status;
  if (draft.status === "needs_clarification" && prev.status === "pending") status = "needs_clarification";
  const merged: ActionItem = {
    ...draft,
    status,
    createdAt: prev.createdAt,
    updatedAt: sameContent(draft, prev) && status === prev.status ? prev.updatedAt : now,
  };
  if (prev.reminder) merged.reminder = prev.reminder;
  return merged;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the merged action plan. Returns generated items (in a stable order:
 * care plan → clarifications → provider questions → wellness goals → barrier
 * suggestions) followed by any existing items for this patient that were not
 * regenerated (e.g. user-added questions), untouched.
 */
export function buildActionPlan(input: BuildActionPlanInput): ActionItem[] {
  const { profile, interpretation, document } = input;
  const now = input.now ?? nowIso();
  const language: Language = profile.language === "es" ? "es" : "en";
  const s = STRINGS[language];
  const medNames = profile.medications.map((m) => m.name);
  const restrictions = detectDocumentedRestrictions(profile, document);
  const documentId = document?.id ?? interpretation?.documentId;
  // Interpretation for a different document/patient is ignored rather than mixed in.
  const interp =
    interpretation &&
    interpretation.patientId === profile.id &&
    (!document || interpretation.documentId === document.id)
      ? interpretation
      : null;

  const drafts: Draft[] = [];
  let needHydrationQuestion = restrictions.fluid;
  let needNutritionQuestion = false;

  /** Applies the restriction guard to non-clinician items. Returns false if suppressed. */
  const passesRestrictionGuard = (text: string): boolean => {
    if (restrictions.fluid || restrictions.diet || restrictions.fluidTarget) {
      if (isGenericHydrationText(text)) {
        if (restrictions.fluid || restrictions.diet) needHydrationQuestion = true;
        return false;
      }
      if (restrictions.diet && isGenericDietText(text)) {
        needNutritionQuestion = true;
        return false;
      }
    }
    return true;
  };

  // 1. Instructions: verified → care plan; anything else → needs clarification.
  for (const instruction of interp?.instructions ?? []) {
    if (document && isVerifiedRef(document, instruction.sourceRef)) {
      drafts.push(verifiedInstructionItem(profile, document, instruction, instruction.sourceRef, language));
    } else {
      const text = instruction.description || instruction.sourceRef?.quote || "";
      if (!normalizeWhitespace(text)) continue;
      // A clarification request is framed as a question for the care team, so it
      // is allowed even when it mentions a medication — but never as a directive.
      if (!passesRestrictionGuard(text)) continue;
      drafts.push(clarificationItem(profile, documentId, instruction, language));
    }
  }

  // 2. Discussion questions from the interpretation.
  for (const q of interp?.discussWithProvider ?? []) {
    if (!normalizeWhitespace(q)) continue;
    if (isMedicationChangeDirective(q, medNames)) continue;
    if (!passesRestrictionGuard(q)) continue;
    drafts.push(aiQuestionItem(profile, documentId, q, s.discussRationale));
  }

  // 3. Patient-selected wellness goals.
  for (const goal of profile.healthGoals ?? []) {
    if (!normalizeWhitespace(goal)) continue;
    if (!passesRestrictionGuard(goal)) continue;
    drafts.push(goalItem(profile, goal, language));
  }

  // 4. Restriction-aware questions instead of generic hydration/diet advice.
  if (needHydrationQuestion) {
    drafts.push({
      ...aiQuestionItem(profile, undefined, s.hydrationQuestion, s.hydrationRationale),
      id: stableId("act", profile.id, "guard", "hydration-targets"),
    });
  }
  if (needNutritionQuestion) {
    drafts.push({
      ...aiQuestionItem(profile, undefined, s.nutritionQuestion, s.nutritionRationale),
      id: stableId("act", profile.id, "guard", "nutrition-guidance"),
    });
  }

  // 5. Barrier-aware administrative questions.
  for (const b of suggestBarrierActions(profile, { now })) {
    const { createdAt: _c, updatedAt: _u, ...draft } = b;
    void _c;
    void _u;
    drafts.push(draft);
  }

  // Merge with existing (dedupe by id; first occurrence wins).
  const existing = (input.existing ?? []).filter((a) => a.patientId === profile.id);
  const prevById = new Map(existing.map((a) => [a.id, a] as const));
  const out: ActionItem[] = [];
  const emitted = new Set<string>();
  for (const d of drafts) {
    if (emitted.has(d.id)) continue;
    emitted.add(d.id);
    out.push(mergeOne(d, prevById.get(d.id), now));
  }
  for (const a of existing) {
    if (emitted.has(a.id)) continue;
    emitted.add(a.id);
    out.push(a);
  }
  return out;
}
