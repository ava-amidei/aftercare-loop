/**
 * Deterministic Ask Kat quick prompts (SPEC §12.1). These never call a model —
 * in either mode — and only restate what the fictional record documents.
 *
 * Condition-agnostic: nothing here branches on a condition name. Section
 * selection uses generic document headings (e.g. "Assessment", "Results").
 */
import type {
  AccessBarrier,
  KatContextualAction,
  Language,
  QuickPromptId,
  ReferenceId,
  SourceRef,
  VisitDocument,
} from "@/lib/types";
import { BARRIER_SUGGESTIONS } from "./barriers";
import { isRefVerified, katAction, profileLanguage, type KatContext } from "./kat-context";

/** Deterministic draft reply; askKat turns it into a ChatMessage. */
export interface KatDraft {
  content: string;
  sourceRefs: SourceRef[];
  referenceIds: ReferenceId[];
  actions: KatContextualAction[];
  /** Questions Kat suggested (each also has an add_question action). */
  suggestedQuestions: string[];
}

export type DeterministicQuickPrompt = Exclude<QuickPromptId, "free_text">;

const MAX_DOC_QUESTIONS = 8;
const MAX_TERMS = 6;
const MAX_SOURCE_ACTIONS = 4;
const MAX_RESULT_SENTENCES = 10;

// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------

const STR = {
  en: {
    askIntro: "Here are some questions you could ask your care team, based on your visit summary and anything still unclear:",
    askBarrierIntro: "Practical questions about getting care (these are not medical advice):",
    askNoInterpretation:
      "I haven't gone through your visit summary with you yet, so I can't suggest questions from it. You can start in Understand My Health.",
    askNoDocument: "I don't see a visit summary in your record yet, so I can't suggest questions from it.",
    askNothing:
      "I don't have enough documented information to suggest specific questions. Tell me what's on your mind and I can help you put it into words for your care team.",
    askSavedNote: "You already have {count} question(s) saved for your next appointment.",
    askClarifyInstruction: "Could you clarify this instruction: “{text}”?",
    diagIntro: "Here is what your visit summary says, in plain language:",
    diagTerms: "Terms from your summary:",
    diagFromDocument: "Your visit summary documents this:",
    diagUnderstandHint: "For a full plain-language explanation, go through your summary in Understand My Health.",
    diagNotDiagnosis:
      "This is general education, not a diagnosis from Kat. Your care team can tell you what it means for you. If you meant a different diagnosis, tell me which one — I can only explain what is documented.",
    diagNoneDocumented:
      "I don't see a diagnosis documented in your visit summary, so I don't want to guess. Which diagnosis would you like to understand?",
    diagProfileListed: "Your profile lists these conditions or concerns: {list}.",
    resultsIntro: "Here is what your visit summary says about your results:",
    resultsTerms: "What some of these words mean:",
    resultsLimit:
      "I can only repeat what is written. The summary may not explain what every result means for you, so please ask your care team about anything that isn't clear.",
    resultsNone:
      "I don't see any test results documented in your visit summary, so I can't explain any. If you have results from another visit, you can ask your care team or paste that summary in Understand My Health.",
    resultsNoDocument: "I don't see a visit summary in your record yet, so there are no documented results to explain.",
    planIntro: "These are the next steps your clinician documented:",
    planUnverified:
      "{count} other item(s) could not be matched to your visit summary, so I've left them out. They are listed under “Needs clarification” — please check them with your care team.",
    planNone:
      "I haven't found any clinician-documented next steps yet. Go through your visit summary in Understand My Health, and I'll help you organize what it says.",
    planOutro: "You can see everything, with the original wording, in your action plan.",
  },
  es: {
    askIntro:
      "Estas son algunas preguntas que podría hacerle a su equipo de atención, según el resumen de su visita y lo que aún no está claro:",
    askBarrierIntro: "Preguntas prácticas para recibir atención (no son consejos médicos):",
    askNoInterpretation:
      "Todavía no hemos revisado juntos el resumen de su visita, así que no puedo sugerir preguntas a partir de él. Puede empezar en Entender mi salud.",
    askNoDocument: "No veo un resumen de visita en su registro todavía, así que no puedo sugerir preguntas a partir de él.",
    askNothing:
      "No tengo suficiente información documentada para sugerir preguntas específicas. Cuénteme qué le preocupa y le ayudo a expresarlo para su equipo de atención.",
    askSavedNote: "Ya tiene {count} pregunta(s) guardada(s) para su próxima cita.",
    askClarifyInstruction: "¿Podría aclararme esta instrucción: “{text}”?",
    diagIntro: "Esto es lo que dice el resumen de su visita, en palabras sencillas:",
    diagTerms: "Términos de su resumen:",
    diagFromDocument: "El resumen de su visita documenta lo siguiente:",
    diagUnderstandHint: "Para una explicación completa en palabras sencillas, revise su resumen en Entender mi salud.",
    diagNotDiagnosis:
      "Esto es información educativa general, no un diagnóstico de Kat. Su equipo de atención puede decirle qué significa para usted. Si se refería a otro diagnóstico, dígame cuál; solo puedo explicar lo que está documentado.",
    diagNoneDocumented:
      "No veo un diagnóstico documentado en el resumen de su visita, así que no quiero adivinar. ¿Qué diagnóstico le gustaría entender?",
    diagProfileListed: "Su perfil incluye estas condiciones o inquietudes: {list}.",
    resultsIntro: "Esto es lo que dice el resumen de su visita sobre sus resultados:",
    resultsTerms: "Qué significan algunas de estas palabras:",
    resultsLimit:
      "Solo puedo repetir lo que está escrito. Es posible que el resumen no explique qué significa cada resultado para usted; pregúntele a su equipo de atención sobre cualquier cosa que no esté clara.",
    resultsNone:
      "No veo resultados de pruebas documentados en el resumen de su visita, así que no puedo explicar ninguno. Si tiene resultados de otra visita, puede preguntarle a su equipo de atención o pegar ese resumen en Entender mi salud.",
    resultsNoDocument: "No veo un resumen de visita en su registro todavía, así que no hay resultados documentados para explicar.",
    planIntro: "Estos son los próximos pasos que documentó su profesional de salud:",
    planUnverified:
      "Otros {count} elemento(s) no coincidieron con el resumen de su visita, así que los dejé fuera. Aparecen en “Necesita aclaración”; por favor, revíselos con su equipo de atención.",
    planNone:
      "Todavía no encontré próximos pasos documentados por su profesional de salud. Revise el resumen de su visita en Entender mi salud y le ayudaré a organizar lo que dice.",
    planOutro: "Puede ver todo, con las palabras originales, en su plan de acción.",
  },
} as const satisfies Record<Language, Record<string, string>>;

type StrKey = keyof (typeof STR)["en"];

function s(lang: Language, key: StrKey, params?: Record<string, string | number>): string {
  let out: string = STR[lang][key] ?? STR.en[key];
  if (params) for (const [k, v] of Object.entries(params)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

function bullets(items: string[]): string {
  return items.map((i) => `• ${i}`).join("\n");
}

function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function shortQuote(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function viewSourceAction(lang: Language, ref: SourceRef): KatContextualAction {
  return katAction(lang, "view_source", { sourceRef: ref }, `${katAction(lang, "view_source").label}: “${shortQuote(ref.quote)}”`);
}

function addQuestionAction(lang: Language, question: string, barrier?: AccessBarrier): KatContextualAction {
  return katAction(lang, "add_question", barrier ? { question, barrier } : { question });
}

function emptyDraft(content: string): KatDraft {
  return { content, sourceRefs: [], referenceIds: [], actions: [], suggestedQuestions: [] };
}

// ---------------------------------------------------------------------------
// Barrier questions
// ---------------------------------------------------------------------------

export interface BarrierQuestion {
  barrier: AccessBarrier;
  /** Phrased "Would you like to ask your clinic whether…" — never assumes availability. */
  question: string;
  /** Clinic-facing wording (patient's voice) — what Kat offers to save as a provider question. */
  clinicQuestion: string;
}

/** Administrative, barrier-aware questions in the requested language (SPEC §12.7). */
export function suggestBarrierQuestions(
  barriers: readonly AccessBarrier[] | undefined,
  language: Language = "en",
): BarrierQuestion[] {
  const lang: Language = language === "es" ? "es" : "en";
  const out: BarrierQuestion[] = [];
  const seen = new Set<AccessBarrier>();
  for (const barrier of barriers ?? []) {
    if (seen.has(barrier)) continue;
    seen.add(barrier);
    for (const sug of BARRIER_SUGGESTIONS[barrier] ?? []) out.push({ barrier, question: sug[lang], clinicQuestion: sug.question[lang] });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Document helpers (generic headings only)
// ---------------------------------------------------------------------------

const RESULTS_HEADING = /\b(results?|assessment|findings|labs?|impression|resultados?|evaluaci[oó]n|hallazgos|laboratorio)\b/i;
const DIAGNOSIS_HEADING = /\b(assessment|diagnos[ie]s|impression|evaluaci[oó]n|diagn[oó]sticos?|impresi[oó]n)\b/i;

/**
 * Split text into trimmed sentence spans. A sentence ends at ".", "!" or "?"
 * only when followed by whitespace or the end, so "10.2 g/dL" stays whole.
 */
export function splitSentences(text: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  let start = 0;
  const pushSpan = (from: number, to: number) => {
    let a = from;
    let b = to;
    while (a < b && /\s/.test(text[a])) a++;
    while (b > a && /\s/.test(text[b - 1])) b--;
    if (b > a) spans.push({ start: a, end: b });
  };
  for (let i = 0; i < text.length; i++) {
    if (!/[.!?]/.test(text[i])) continue;
    let j = i;
    while (j + 1 < text.length && /[.!?"”)]/.test(text[j + 1])) j++;
    if (j + 1 === text.length || /\s/.test(text[j + 1])) {
      pushSpan(start, j + 1);
      start = j + 1;
    }
    i = j;
  }
  pushSpan(start, text.length);
  return spans;
}

/** Sentences (with exact offsets) inside sections whose heading matches `heading`. */
export function sectionSentences(doc: VisitDocument | undefined, heading: RegExp): SourceRef[] {
  if (!doc?.sections?.length) return [];
  const out: SourceRef[] = [];
  for (const section of doc.sections) {
    if (!heading.test(section.heading)) continue;
    const sectionText = doc.text.slice(section.start, section.end);
    const headingIdx = sectionText.indexOf(section.heading);
    let cursor = section.start + (headingIdx >= 0 ? headingIdx + section.heading.length : 0);
    const body = doc.text.slice(cursor, section.end);
    for (const line of body.split("\n")) {
      const lineStart = doc.text.indexOf(line, cursor);
      cursor = lineStart + line.length;
      const content = line.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, "");
      const contentOffset = lineStart + (line.length - content.length);
      for (const span of splitSentences(content)) {
        const start = contentOffset + span.start;
        const quote = content.slice(span.start, span.end);
        if (quote.length < 3) continue;
        const ref: SourceRef = { documentId: doc.id, start, end: start + quote.length, quote, sectionId: section.id };
        if (isRefVerified(doc, ref)) out.push(ref);
      }
    }
  }
  return out;
}

function within(ref: SourceRef, refs: SourceRef[]): boolean {
  return refs.some((r) => ref.start >= r.start && ref.end <= r.end);
}

function sectionRanges(doc: VisitDocument | undefined, heading: RegExp): SourceRef[] {
  return (doc?.sections ?? [])
    .filter((sec) => heading.test(sec.heading))
    .map((sec) => ({ documentId: doc!.id, start: sec.start, end: sec.end, quote: "" }));
}

// ---------------------------------------------------------------------------
// Quick prompts
// ---------------------------------------------------------------------------

/** "What should I ask my doctor?" */
export function buildWhatShouldIAsk(ctx: KatContext): KatDraft {
  const lang = profileLanguage(ctx.profile);
  const saved = new Set(ctx.savedQuestions.map(normalizeKey));
  const seen = new Set<string>();
  const docQuestions: string[] = [];
  const push = (q: string | undefined) => {
    const text = q?.trim();
    if (!text) return;
    const key = normalizeKey(text);
    if (seen.has(key) || saved.has(key)) return;
    seen.add(key);
    docQuestions.push(text);
  };

  const interp = ctx.interpretation;
  if (interp) {
    interp.discussWithProvider.forEach(push);
    interp.unansweredQuestions.forEach(push);
    interp.instructions
      .filter((i) => i.sourceVerification !== "verified" || !isRefVerified(ctx.document, i.sourceRef))
      .forEach((i) => push(s(lang, "askClarifyInstruction", { text: i.description })));
  }
  ctx.actions
    .filter((a) => a.status === "needs_clarification" && a.origin === "clinician_documented")
    .forEach((a) => push(s(lang, "askClarifyInstruction", { text: a.description })));
  const limitedDocQuestions = docQuestions.slice(0, MAX_DOC_QUESTIONS);

  const barrierQuestions = suggestBarrierQuestions(ctx.profile.barriers, lang).filter((b) => {
    const key = normalizeKey(b.clinicQuestion);
    if (seen.has(key) || saved.has(key) || saved.has(normalizeKey(b.question))) return false;
    seen.add(key);
    return true;
  });

  const parts: string[] = [];
  if (limitedDocQuestions.length > 0) {
    parts.push(`${s(lang, "askIntro")}\n${bullets(limitedDocQuestions)}`);
  } else if (!ctx.document) {
    parts.push(s(lang, "askNoDocument"));
  } else if (!interp) {
    parts.push(s(lang, "askNoInterpretation"));
  }
  if (barrierQuestions.length > 0) {
    parts.push(`${s(lang, "askBarrierIntro")}\n${bullets(barrierQuestions.map((b) => b.clinicQuestion))}`);
  }
  if (parts.length === 0) parts.push(s(lang, "askNothing"));
  if (ctx.savedQuestions.length > 0) parts.push(s(lang, "askSavedNote", { count: ctx.savedQuestions.length }));

  const actions = [
    ...limitedDocQuestions.map((q) => addQuestionAction(lang, q)),
    ...barrierQuestions.map((b) => addQuestionAction(lang, b.clinicQuestion, b.barrier)),
  ];
  return {
    content: parts.join("\n\n"),
    sourceRefs: [],
    referenceIds: [],
    actions,
    suggestedQuestions: [...limitedDocQuestions, ...barrierQuestions.map((b) => b.clinicQuestion)],
  };
}

/** "Explain my diagnosis" — only what is documented. */
export function buildExplainMyDiagnosis(ctx: KatContext): KatDraft {
  const lang = profileLanguage(ctx.profile);
  const interp = ctx.interpretation;
  const terms = (interp?.terms ?? []).filter((term) => term.term.trim() && term.definition.trim());
  // A heuristic (no-narrative) interpretation carries a service note in
  // whatThisMeans ("…the next steps below…"), not an explanation — never present
  // it as one; fall through to the documented Assessment quotes instead.
  const heuristic = interp?.meta?.generatedBy === "deterministic";
  const overview = heuristic ? "" : (interp?.whatThisMeans.trim() ?? "");

  if (interp && (overview || terms.length > 0)) {
    const parts: string[] = [];
    if (overview) parts.push(`${s(lang, "diagIntro")}\n${overview}`);
    const shown = terms.slice(0, MAX_TERMS);
    if (shown.length > 0) {
      parts.push(`${s(lang, "diagTerms")}\n${bullets(shown.map((term) => `${term.term} — ${term.definition}`))}`);
    }
    parts.push(s(lang, "diagNotDiagnosis"));
    const sourceRefs = shown
      .map((term) => term.sourceRef)
      .filter((ref): ref is SourceRef => isRefVerified(ctx.document, ref));
    const referenceIds = [...new Set([...interp.referenceIds, ...shown.flatMap((term) => term.referenceIds)])];
    return {
      content: parts.join("\n\n"),
      sourceRefs,
      referenceIds,
      actions: sourceRefs.slice(0, MAX_SOURCE_ACTIONS).map((ref) => viewSourceAction(lang, ref)),
      suggestedQuestions: [],
    };
  }

  const documented = sectionSentences(ctx.document, DIAGNOSIS_HEADING);
  if (documented.length > 0) {
    const shown = documented.slice(0, MAX_RESULT_SENTENCES);
    const content = [
      `${s(lang, "diagFromDocument")}\n${bullets(shown.map((r) => `“${r.quote}”`))}`,
      // Pointing back to Understand only helps if it hasn't already produced a
      // no-narrative (heuristic) result for this document.
      ...(heuristic ? [] : [s(lang, "diagUnderstandHint")]),
      s(lang, "diagNotDiagnosis"),
    ].join("\n\n");
    return {
      content,
      sourceRefs: shown,
      referenceIds: [],
      actions: shown.slice(0, MAX_SOURCE_ACTIONS).map((ref) => viewSourceAction(lang, ref)),
      suggestedQuestions: [],
    };
  }

  const parts = [s(lang, "diagNoneDocumented")];
  const conditions = ctx.profile.conditions.filter((c) => c.trim());
  if (conditions.length > 0) parts.push(s(lang, "diagProfileListed", { list: conditions.join(", ") }));
  return emptyDraft(parts.join("\n\n"));
}

/** "Help me understand my results" — documented results only, never interpreted further. */
export function buildUnderstandMyResults(ctx: KatContext): KatDraft {
  const lang = profileLanguage(ctx.profile);
  if (!ctx.document) return emptyDraft(s(lang, "resultsNoDocument"));
  const sentences = sectionSentences(ctx.document, RESULTS_HEADING);
  if (sentences.length === 0) return emptyDraft(s(lang, "resultsNone"));

  const shown = sentences.slice(0, MAX_RESULT_SENTENCES);
  const ranges = sectionRanges(ctx.document, RESULTS_HEADING);
  const terms = (ctx.interpretation?.terms ?? [])
    .filter((term) => isRefVerified(ctx.document, term.sourceRef) && within(term.sourceRef!, ranges))
    .slice(0, MAX_TERMS);

  const parts = [`${s(lang, "resultsIntro")}\n${bullets(shown.map((r) => `“${r.quote}”`))}`];
  if (terms.length > 0) {
    parts.push(`${s(lang, "resultsTerms")}\n${bullets(terms.map((term) => `${term.term} — ${term.definition}`))}`);
  }
  parts.push(s(lang, "resultsLimit"));
  return {
    content: parts.join("\n\n"),
    sourceRefs: shown,
    referenceIds: [...new Set(terms.flatMap((term) => term.referenceIds))],
    actions: shown.slice(0, MAX_SOURCE_ACTIONS).map((ref) => viewSourceAction(lang, ref)),
    suggestedQuestions: [],
  };
}

/** "Help me plan my next steps" — verified clinician-documented instructions only. */
export function buildPlanNextSteps(ctx: KatContext): KatDraft {
  const lang = profileLanguage(ctx.profile);
  const verified: { description: string; ref: SourceRef }[] = [];
  const seen = new Set<string>();
  let unverifiedCount = 0;
  const add = (description: string, ref: SourceRef) => {
    const key = `${ref.start}:${ref.end}`;
    if (seen.has(key)) return;
    seen.add(key);
    verified.push({ description, ref });
  };

  for (const i of ctx.interpretation?.instructions ?? []) {
    if (i.sourceVerification === "verified" && isRefVerified(ctx.document, i.sourceRef)) add(i.description, i.sourceRef);
    else unverifiedCount++;
  }
  for (const a of ctx.actions) {
    if (a.origin !== "clinician_documented") continue;
    if (a.sourceVerification === "verified" && isRefVerified(ctx.document, a.sourceRef)) add(a.description, a.sourceRef);
  }

  const planAction = katAction(lang, "view_action_plan", { href: "/action-plan" });
  if (verified.length === 0) {
    return { ...emptyDraft(s(lang, "planNone")), actions: [planAction] };
  }
  verified.sort((a, b) => a.ref.start - b.ref.start);
  const parts = [`${s(lang, "planIntro")}\n${bullets(verified.map((v) => `${v.description} — “${v.ref.quote}”`))}`];
  if (unverifiedCount > 0) parts.push(s(lang, "planUnverified", { count: unverifiedCount }));
  parts.push(s(lang, "planOutro"));
  return {
    content: parts.join("\n\n"),
    sourceRefs: verified.map((v) => v.ref),
    referenceIds: [],
    actions: [...verified.map((v) => viewSourceAction(lang, v.ref)), planAction],
    suggestedQuestions: [],
  };
}

const BUILDERS: Record<DeterministicQuickPrompt, (ctx: KatContext) => KatDraft> = {
  what_should_i_ask: buildWhatShouldIAsk,
  explain_my_diagnosis: buildExplainMyDiagnosis,
  understand_my_results: buildUnderstandMyResults,
  plan_next_steps: buildPlanNextSteps,
};

export function isDeterministicQuickPrompt(id: QuickPromptId | undefined): id is DeterministicQuickPrompt {
  return id !== undefined && id !== "free_text" && id in BUILDERS;
}

/** Run a deterministic quick prompt; returns null for free_text / undefined. */
export function runQuickPrompt(id: QuickPromptId | undefined, ctx: KatContext): KatDraft | null {
  return isDeterministicQuickPrompt(id) ? BUILDERS[id](ctx) : null;
}
