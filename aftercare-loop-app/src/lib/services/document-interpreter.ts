/**
 * Document Interpreter (ARCHITECTURE §4, §5; SPEC §3C, §12.4).
 *
 * Pipeline: deterministic safety rules on the document → evidence retrieval →
 * (scripted lookup | Claude call | heuristic fallback) → post-validation of every
 * instruction against the document text → reference ids restricted to the
 * retrieved evidence → AiMeta.
 *
 * Honesty rules:
 *  - meta.mode is "live_claude" only when Claude actually produced the content.
 *  - "This summary does not mention…" style limitations come only from the
 *    model or scripted content; the service adds only factual notes about how
 *    the result was produced (scripted / live unavailable / unverified quotes).
 *  - Instructions whose quotes cannot be found in the text are "unverified".
 */
import { getAiMode, makeMeta, DocumentInterpretationSchema, type ModelDocumentInterpretation } from "@/lib/ai";
import { getScriptedInterpretation } from "@/lib/ai/scripted";
import { extractTopics, normalizeTopics, retrieveEvidence } from "@/lib/evidence";
import { detectInjectionMarkers, evaluateSafety, safetyContextOf, SAFETY_GUIDANCE } from "@/lib/safety";
import type {
  DocumentInterpretation,
  EvidenceMatch,
  Language,
  PatientProfile,
  ReferenceId,
  SafetyFlag,
  SafetyVerdict,
  TermDefinition,
  VisitDocument,
} from "@/lib/types";
import {
  extractInstructionsHeuristic,
  fromModelInstructions,
  generateModelInterpretation,
  validateInstructions,
  type GenerateStructuredFn,
  type ScriptedInterpretationFn,
} from "./instruction-extraction";
import { locateQuote, verifySourceRefs, type VerifiableItem } from "./source-verification";

export interface InterpretDocumentInput {
  profile: PatientProfile;
  document: VisitDocument;
  /** Pre-retrieved evidence. When omitted, evidence is retrieved from the document topics + profile conditions. */
  evidence?: EvidenceMatch[];
}

export interface InterpretDocumentDeps {
  mode?: "live_claude" | "scripted_demo";
  generate?: GenerateStructuredFn;
  scripted?: ScriptedInterpretationFn;
  retrieve?: typeof retrieveEvidence;
}

export const EVIDENCE_LIMIT = 6;

// ---------------------------------------------------------------------------
// Localized service notes (factual statements about how the result was made)
// ---------------------------------------------------------------------------

const NOTES: Record<
  Language,
  {
    liveUnavailable: string;
    liveUnavailableScripted: string;
    noScripted: string;
    heuristicOverview: string;
    heuristicOverviewNone: string;
    unverified: (n: number) => string;
    noEvidence: string;
    warningSigns: string;
    injectedInstruction: string;
    injectedDocument: string;
  }
> = {
  en: {
    liveUnavailable: "Live AI unavailable; showing extracted instructions only.",
    liveUnavailableScripted: "Live AI unavailable; showing Scripted Demo Mode content instead.",
    noScripted:
      "Scripted Demo Mode has no prepared explanation for this document; showing extracted instructions only. Add an ANTHROPIC_API_KEY to enable live explanations.",
    heuristicOverview:
      "A plain-language explanation is not available right now. The next steps below were copied word for word from your document. Please review them with your care team if anything is unclear.",
    heuristicOverviewNone:
      "A plain-language explanation is not available right now, and no clearly written next steps were found in this document. Please ask your care team what your next steps are.",
    unverified: (n) =>
      `${n} suggested instruction${n === 1 ? "" : "s"} could not be matched to the exact words in your document, so ${n === 1 ? "it is" : "they are"} marked as needing clarification.`,
    noEvidence: "No curated reference in our collection matched this document's topics, so no sources are cited.",
    warningSigns:
      "Your document lists warning signs that may need urgent care. If you have any of them now, follow the instructions in your document or call 911 (or your local emergency number).",
    injectedInstruction:
      "A line in this document looks like instructions aimed at the assistant, not at you. It was not added to your care plan. Please confirm your instructions with your care team.",
    injectedDocument:
      "Part of this document looks like instructions aimed at the assistant, not at you. They were ignored. Please confirm your instructions with your care team.",
  },
  es: {
    liveUnavailable: "La IA en vivo no está disponible; solo se muestran las instrucciones extraídas.",
    liveUnavailableScripted:
      "La IA en vivo no está disponible; en su lugar se muestra contenido del Modo de demostración con guion.",
    noScripted:
      "El Modo de demostración con guion no tiene una explicación preparada para este documento; solo se muestran las instrucciones extraídas. Agregue una ANTHROPIC_API_KEY para activar explicaciones en vivo.",
    heuristicOverview:
      "En este momento no hay una explicación en lenguaje sencillo. Los próximos pasos de abajo se copiaron palabra por palabra de su documento. Revíselos con su equipo de atención médica si algo no está claro.",
    heuristicOverviewNone:
      "En este momento no hay una explicación en lenguaje sencillo, y no se encontraron próximos pasos escritos con claridad en este documento. Pregunte a su equipo de atención médica cuáles son sus próximos pasos.",
    unverified: (n) =>
      n === 1
        ? "1 instrucción sugerida no coincide con las palabras exactas de su documento, por lo que se marca como pendiente de aclarar."
        : `${n} instrucciones sugeridas no coinciden con las palabras exactas de su documento, por lo que se marcan como pendientes de aclarar.`,
    noEvidence:
      "Ninguna referencia de nuestra colección coincidió con los temas de este documento, por lo que no se citan fuentes.",
    warningSigns:
      "Su documento enumera señales de alerta que pueden requerir atención urgente. Si tiene alguna de ellas ahora, siga las instrucciones de su documento o llame al 911 (o al número de emergencias local).",
    injectedInstruction:
      "Una línea de este documento parece contener instrucciones dirigidas al asistente, no a usted. No se agregó a su plan de cuidado. Confirme sus instrucciones con su equipo de atención médica.",
    injectedDocument:
      "Una parte de este documento parece contener instrucciones dirigidas al asistente, no a usted. Se ignoraron. Confirme sus instrucciones con su equipo de atención médica.",
  },
};

function notes(language: Language) {
  return NOTES[language] ?? NOTES.en;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic safety flag for a document (rules only, capped at "concerning" for documents). */
export function documentSafetyFlags(verdict: SafetyVerdict, language: Language): SafetyFlag[] {
  if (verdict.level === "none") return [];
  let message = notes(language).warningSigns;
  if (verdict.scenario === "suicidal_ideation_or_self_harm") {
    message = `${message} ${(SAFETY_GUIDANCE[language] ?? SAFETY_GUIDANCE.en).crisisLineUs}`;
  }
  return [{ level: "urgent", message }];
}

const WARNING_HEADING =
  /\b(when to (seek|get|call)|warning signs?|seek care|emergency|cu[aá]ndo buscar|se[nñ]ales de (alerta|advertencia)|emergencia)\b/i;

/** Document text without its warning-sign sections (they mention many unrelated topics). */
function textWithoutWarningSections(document: VisitDocument): string {
  const warn = (document.sections ?? []).filter((s) => WARNING_HEADING.test(s.heading)).sort((a, b) => b.start - a.start);
  let text = document.text;
  for (const w of warn) text = text.slice(0, w.start) + text.slice(w.end);
  return text;
}

/**
 * Evidence for a document: topics extracted from its text plus the profile's
 * conditions. Two retrievals (whole text, and text without warning-sign
 * sections) are merged so focused matches are not crowded out; references that
 * match the profile's conditions are ordered first.
 */
export function retrieveDocumentEvidence(
  profile: PatientProfile,
  document: VisitDocument,
  retrieve: typeof retrieveEvidence = retrieveEvidence,
): EvidenceMatch[] {
  const conditions = profile.conditions ?? [];
  const lists = [document.text, textWithoutWarningSections(document)].map((text) => {
    const topics = [...new Set([...extractTopics(text), ...conditions])];
    return topics.length > 0 ? retrieve({ topics, language: profile.language, limit: EVIDENCE_LIMIT }) : [];
  });
  const seen = new Set<ReferenceId>();
  const merged: EvidenceMatch[] = [];
  for (const m of lists.flat()) {
    if (seen.has(m.reference.id)) continue;
    seen.add(m.reference.id);
    merged.push(m);
  }
  const conditionTopics = new Set(normalizeTopics(conditions));
  const related = (m: EvidenceMatch) => m.matchedTopics.some((t) => conditionTopics.has(t));
  return [...merged.filter(related), ...merged.filter((m) => !related(m))];
}

/** Sources for a result with no generated narrative: condition-related matches, else the top matches. */
function defaultSourceIds(evidence: readonly EvidenceMatch[], profile: PatientProfile): ReferenceId[] {
  const conditionTopics = new Set(normalizeTopics(profile.conditions ?? []));
  const related = evidence.filter((m) => m.matchedTopics.some((t) => conditionTopics.has(t)));
  return (related.length > 0 ? related : evidence.slice(0, 3)).map((m) => m.reference.id);
}

function restrictIds(ids: readonly ReferenceId[] | undefined, allowed: ReadonlySet<ReferenceId>): ReferenceId[] {
  return [...new Set((ids ?? []).filter((id) => allowed.has(id)))];
}

function cleanStrings(values: readonly string[] | undefined): string[] {
  return (values ?? []).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean);
}

function mergeFlags(...groups: SafetyFlag[][]): SafetyFlag[] {
  const seen = new Set<string>();
  const out: SafetyFlag[] = [];
  for (const f of groups.flat()) {
    const key = `${f.level}:${f.message}`;
    if (!f.message?.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

function termsFromModel(
  document: VisitDocument,
  terms: ModelDocumentInterpretation["terms"],
  allowed: ReadonlySet<ReferenceId>,
): TermDefinition[] {
  return terms.map((t) => {
    const ref = t.sourceQuote ? locateQuote(document, t.sourceQuote, { onAmbiguous: "first" }) : null;
    return {
      term: t.term,
      definition: t.definition,
      referenceIds: restrictIds(t.referenceIds, allowed),
      ...(ref ? { sourceRef: ref } : {}),
    };
  });
}

/** Scripted/stored terms: keep only exact, verifiable refs and allowed reference ids. */
function sanitizeTerms(
  document: VisitDocument,
  terms: readonly TermDefinition[],
  allowed: ReadonlySet<ReferenceId>,
): TermDefinition[] {
  return terms.map((t) => {
    const base: TermDefinition = {
      term: t.term,
      definition: t.definition,
      referenceIds: restrictIds(t.referenceIds, allowed),
    };
    if (!t.sourceRef) return base;
    const item: VerifiableItem = { sourceRef: t.sourceRef, sourceVerification: "unverified" };
    const [checked] = verifySourceRefs(document, [item]);
    return checked?.sourceVerification === "verified" && checked.sourceRef
      ? { ...base, sourceRef: checked.sourceRef }
      : base;
  });
}

type Narrative = Omit<DocumentInterpretation, "documentId" | "patientId" | "instructions" | "meta" | "safetyFlags">;

function emptyNarrative(): Narrative {
  return {
    whatThisMeans: "",
    terms: [],
    whatToKnow: [],
    discussWithProvider: [],
    unansweredQuestions: [],
    limitations: [],
    referenceIds: [],
  };
}

interface Generated {
  narrative: Narrative;
  safetyFlags: SafetyFlag[];
  instructions: DocumentInterpretation["instructions"];
}

/** Scripted Demo Mode content for this patient/document, validated and post-checked; null if none. */
function scriptedContent(
  lookup: ScriptedInterpretationFn,
  document: VisitDocument,
  profile: PatientProfile,
  allowed: ReadonlySet<ReferenceId>,
): Generated | null {
  const raw = lookup(profile.id, document.id);
  if (!raw) return null;
  const parsed = DocumentInterpretationSchema.safeParse(raw);
  if (!parsed.success) return null;
  const s = parsed.data;
  return {
    narrative: {
      whatThisMeans: s.whatThisMeans,
      terms: sanitizeTerms(document, s.terms, allowed),
      whatToKnow: cleanStrings(s.whatToKnow),
      discussWithProvider: cleanStrings(s.discussWithProvider),
      unansweredQuestions: cleanStrings(s.unansweredQuestions),
      limitations: cleanStrings(s.limitations),
      referenceIds: restrictIds(s.referenceIds, allowed),
    },
    safetyFlags: s.safetyFlags,
    instructions: validateInstructions(document, s.instructions),
  };
}

/**
 * Prompt-injection flag (ARCHITECTURE §2.7): text aimed at the assistant is
 * data, never an instruction to the patient. Logs counts only (§2.10).
 */
function injectionFlags(
  document: VisitDocument,
  instructions: DocumentInterpretation["instructions"],
  language: Language,
): SafetyFlag[] {
  const markerCount = detectInjectionMarkers(document.text).length;
  const flaggedInstructions = instructions.filter((i) => i.suspectedInjection).length;
  if (markerCount === 0 && flaggedInstructions === 0) return [];
  if (!(process.env.NODE_ENV === "test" || process.env.VITEST)) {
    console.info("[interpret]", JSON.stringify({ documentId: document.id, injectionMarkers: markerCount, flaggedInstructions }));
  }
  const n = notes(language);
  return [{ level: "clarify_with_clinician", message: flaggedInstructions > 0 ? n.injectedInstruction : n.injectedDocument }];
}

// ---------------------------------------------------------------------------
// interpretDocument
// ---------------------------------------------------------------------------

export async function interpretDocument(
  input: InterpretDocumentInput,
  deps: InterpretDocumentDeps = {},
): Promise<DocumentInterpretation> {
  const { profile, document } = input;
  const language: Language = profile.language === "es" ? "es" : "en";
  const n = notes(language);
  const mode = deps.mode ?? getAiMode();
  const scriptedLookup = deps.scripted ?? getScriptedInterpretation;

  // 1. Deterministic safety rules on the document, before any model call.
  const verdict = evaluateSafety(document.text, {
    source: "document",
    language,
    ...safetyContextOf(profile),
  });
  const ruleFlags = documentSafetyFlags(verdict, language);

  // 2. Evidence (only retrieved matches may be cited).
  const evidence = input.evidence ?? retrieveDocumentEvidence(profile, document, deps.retrieve);
  const allowed = new Set<ReferenceId>(evidence.map((m) => m.reference.id));

  const serviceNotes: string[] = [];
  let generated: Generated | null = null;
  let responseMode: DocumentInterpretation["meta"]["mode"] = "scripted_demo";
  let model: string | undefined;

  // 3. Generation.
  if (mode === "live_claude") {
    const result = await generateModelInterpretation({ profile, document, evidence }, deps.generate);
    if (result.ok) {
      const d = result.data;
      generated = {
        narrative: {
          whatThisMeans: d.whatThisMeans,
          terms: termsFromModel(document, d.terms, allowed),
          whatToKnow: cleanStrings(d.whatToKnow),
          discussWithProvider: cleanStrings(d.discussWithProvider),
          unansweredQuestions: cleanStrings(d.unansweredQuestions),
          limitations: cleanStrings(d.limitations),
          referenceIds: restrictIds(d.referenceIds, allowed),
        },
        safetyFlags: d.safetyFlags,
        instructions: fromModelInstructions(document, d.instructions),
      };
      responseMode = "live_claude";
      model = result.model;
    } else {
      generated = scriptedContent(scriptedLookup, document, profile, allowed);
      serviceNotes.push(generated ? n.liveUnavailableScripted : n.liveUnavailable);
    }
  } else {
    generated = scriptedContent(scriptedLookup, document, profile, allowed);
    if (!generated) serviceNotes.push(n.noScripted);
  }

  // 4. Heuristic fallback (deterministic, verbatim quotes only).
  const heuristic = generated === null;
  const instructions = generated ? generated.instructions : extractInstructionsHeuristic(document);
  const base: Narrative = generated
    ? generated.narrative
    : {
        ...emptyNarrative(),
        whatThisMeans: instructions.length > 0 ? n.heuristicOverview : n.heuristicOverviewNone,
      };
  const modelFlags = generated ? generated.safetyFlags : [];

  // 5. Reference ids: only retrieved matches. A generated narrative cites what it
  //    used; the heuristic result (no narrative) lists condition-related matches.
  const referenceIds = heuristic ? defaultSourceIds(evidence, profile) : base.referenceIds;

  // Injection-flagged lines get their own flag, not the "could not be matched" note.
  const unverifiedCount = instructions.filter((i) => i.sourceVerification !== "verified" && !i.suspectedInjection).length;
  const limitations = [
    ...serviceNotes,
    ...base.limitations,
    ...(unverifiedCount > 0 ? [n.unverified(unverifiedCount)] : []),
    ...(allowed.size === 0 ? [n.noEvidence] : []),
  ];

  return {
    documentId: document.id,
    patientId: document.patientId || profile.id,
    whatThisMeans: base.whatThisMeans,
    terms: base.terms,
    whatToKnow: base.whatToKnow,
    discussWithProvider: base.discussWithProvider,
    instructions,
    unansweredQuestions: base.unansweredQuestions,
    limitations: [...new Set(limitations)],
    safetyFlags: mergeFlags(ruleFlags, injectionFlags(document, instructions, language), modelFlags),
    referenceIds,
    meta: {
      ...makeMeta(responseMode, model, language),
      // Lets consumers (e.g. the "Explain my diagnosis" quick prompt) tell a
      // generated narrative from the heuristic service note in whatThisMeans.
      generatedBy: heuristic ? "deterministic" : responseMode === "live_claude" ? "model" : "scripted",
    },
  };
}
