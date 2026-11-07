/**
 * Evidence retriever over the curated index in src/data/evidence.
 *
 * Pure and deterministic: same input → same output, no I/O, no randomness.
 * Condition-agnostic: conditions only appear as data (synonym table + tags).
 *
 * Scoring (each component in 0..1, combined into a 0..1 relevance score):
 *   - topic      (weight 0.6): exact tag hits weighted 1.0, partial
 *                              (whole-word containment, e.g. "diabetes" vs
 *                              "type 2 diabetes") weighted 0.4.
 *   - keyword    (weight 0.3): stemmed overlap between the query and the
 *                              reference title + summary + tags.
 *   - language   (weight 0.1): reference language equals requested language.
 *   A reference in a different language than requested is additionally
 *   multiplied by OTHER_LANGUAGE_FACTOR so same-language sources rank first.
 *   Final ordering applies a greedy kind/organization diversity re-rank; the
 *   reported `score` is the undiluted relevance score.
 *
 * Insufficient evidence: when nothing passes the relevance gate, the result is
 * an empty array. Callers must then say evidence is insufficient (never
 * invent a reference).
 */
import type {
  EvidenceKind,
  EvidenceMatch,
  EvidenceReference,
  Language,
  ReferenceId,
} from "@/lib/types";
import { getReferenceById, references as curatedReferences } from "@/data/evidence";

// ---------------------------------------------------------------------------
// Text normalization & stemming
// ---------------------------------------------------------------------------

/** Lowercase, strip diacritics, turn punctuation into spaces, collapse spaces. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can could did do does for from had has have how i if in into is it its " +
    "me my of on or our should so than that the their them then there these they this to was we were what when " +
    "where which who why will with would you your yours about after before also any been being more most much " +
    "not only other over same some such too very just get got go going need want know like tell please thanks " +
    "explain mean means meaning help understand information info question questions ask asked asking " +
    "doctor doctors provider providers health care medical patient patients page overview plain language " +
    "el la los las un una de del y o en que para por con su sus es mi me se lo al como mas"
  ).split(" "),
);

/**
 * Stems too generic to signal relevance on their own (most pages mention
 * diagnosis, treatment, symptoms...). They never count as keyword hits.
 */
const GENERIC_STEMS = new Set(
  [
    "diagnosis", "diagnose", "diagnosed", "treat", "treatment", "treated", "symptom", "sign", "test",
    "testing", "option", "risk", "cause", "common", "use", "take", "taking", "manage", "management",
    "condition", "disease", "problem", "body", "normal", "result", "plan", "next", "step", "visit",
    "appointment", "talk", "discuss", "support", "includ", "cover", "covering", "explain", "guide",
    "people", "person", "woman", "women", "life", "time", "day", "week", "month", "year", "new",
  ].map((w) => stem(w)),
);

/** Very small suffix-stripping stemmer (English-centric, works on normalized text). */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  const rules: [RegExp, string][] = [
    [/ational$/, "ate"],
    [/ization$/, "ize"],
    [/iveness$/, "ive"],
    [/fulness$/, "ful"],
    [/ousness$/, "ous"],
    [/ies$/, "y"],
    [/sses$/, "ss"],
    [/ing$/, ""],
    [/edly$/, ""],
    [/ed$/, ""],
    [/ly$/, ""],
    [/es$/, ""],
    [/s$/, ""],
  ];
  for (const [re, rep] of rules) {
    if (re.test(w)) {
      const candidate = w.replace(re, rep);
      if (candidate.length >= 3) {
        w = candidate;
        break;
      }
    }
  }
  return w;
}

/** Content-word stems of a text (stopwords removed, unique, order of first appearance). */
export function contentStems(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const token of normalizeText(text).split(" ")) {
    if (!token || STOPWORDS.has(token)) continue;
    if (token.length < 2) continue;
    const s = stem(token);
    if (GENERIC_STEMS.has(s)) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Topic extraction (synonyms → canonical tags)
// ---------------------------------------------------------------------------

/**
 * Canonical tag → phrases that indicate it. Phrases are matched as whole words
 * on normalized text (diacritics stripped), with an optional trailing "s".
 * Only names/synonyms of topics are listed here — symptoms are deliberately
 * NOT mapped to diagnoses (the app never diagnoses).
 */
export const TOPIC_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  pcos: [
    "pcos",
    "polycystic",
    "polycystic ovary",
    "polycystic ovarian",
    "polycystic ovary syndrome",
    "stein leventhal",
    "ovario poliquistico",
    "sindrome de ovario poliquistico",
  ],
  endometriosis: ["endometriosis", "endometrioma"],
  "postpartum care": [
    "postpartum",
    "post partum",
    "postnatal",
    "after birth",
    "after giving birth",
    "after delivery",
    "after childbirth",
    "fourth trimester",
    "posparto",
    "despues del parto",
  ],
  "postpartum depression": [
    "postpartum depression",
    "post partum depression",
    "postnatal depression",
    "perinatal depression",
    "baby blues",
    "ppd",
    "depresion posparto",
  ],
  "postpartum follow-up": [
    "postpartum visit",
    "postpartum checkup",
    "postpartum check up",
    "postpartum appointment",
    "postpartum follow up",
  ],
  pots: [
    "pots",
    "postural tachycardia",
    "postural orthostatic tachycardia",
    "postural orthostatic tachycardia syndrome",
  ],
  dysautonomia: ["dysautonomia", "autonomic dysfunction", "disautonomia"],
  hypothyroidism: [
    "hypothyroidism",
    "hypothyroid",
    "underactive thyroid",
    "low thyroid",
    "hashimoto",
    "hashimotos",
    "hipotiroidismo",
  ],
  thyroid: ["thyroid", "tiroides"],
  "type 2 diabetes": [
    "type 2 diabetes",
    "type ii diabetes",
    "type two diabetes",
    "t2d",
    "t2dm",
    "diabetes tipo 2",
  ],
  diabetes: ["diabetes", "diabetic"],
  "gestational diabetes": [
    "gestational diabetes",
    "diabetes in pregnancy",
    "diabetes during pregnancy",
    "pregnancy diabetes",
    "gdm",
    "diabetes gestacional",
  ],
  "blood sugar": ["blood sugar", "blood glucose", "glucose", "azucar en la sangre", "glucosa"],
  "insulin resistance": ["insulin resistance", "insulin resistant", "resistencia a la insulina"],
  hypertension: [
    "hypertension",
    "high blood pressure",
    "elevated blood pressure",
    "hipertension",
    "presion arterial alta",
  ],
  "blood pressure": ["blood pressure", "presion arterial"],
  "blood pressure monitoring": [
    "blood pressure reading",
    "blood pressure check",
    "blood pressure cuff",
    "blood pressure log",
    "home blood pressure",
    "check my blood pressure",
    "check blood pressure",
    "monitor my blood pressure",
    "monitor blood pressure",
    "monitoring blood pressure",
    "measure blood pressure",
    "measure my blood pressure",
    "measuring blood pressure",
    "bp reading",
    "bp check",
  ],
  preeclampsia: [
    "preeclampsia",
    "pre eclampsia",
    "high blood pressure in pregnancy",
    "high blood pressure during pregnancy",
    "gestational hypertension",
  ],
  anemia: ["anemia", "anaemia", "anemic", "anaemic", "low hemoglobin", "low haemoglobin"],
  "iron deficiency": ["iron deficiency", "iron deficient", "low iron", "low ferritin", "ferritin"],
  "iron supplements": [
    "iron supplement",
    "iron pill",
    "iron tablet",
    "ferrous sulfate",
    "ferrous sulphate",
    "ferrous gluconate",
    "oral iron",
    "suplemento de hierro",
  ],
  migraine: ["migraine", "migraña"],
  headache: ["headache", "dolor de cabeza"],
  perimenopause: [
    "perimenopause",
    "perimenopausal",
    "menopausal transition",
    "menopause transition",
    "perimenopausia",
  ],
  menopause: ["menopause", "menopausal", "menopausia"],
  asthma: ["asthma", "asthmatic", "asma"],
  pregnancy: ["pregnant", "pregnancy", "prenatal", "expecting a baby", "embarazo", "embarazada"],
  metformin: ["metformin", "glucophage", "metformina"],
  levothyroxine: [
    "levothyroxine",
    "synthroid",
    "levoxyl",
    "unithroid",
    "euthyrox",
    "levotiroxina",
    "thyroid medicine",
    "thyroid medication",
    "thyroid hormone pill",
  ],
  "pelvic ultrasound": [
    "pelvic ultrasound",
    "transvaginal ultrasound",
    "transvaginal",
    "pelvic sonogram",
    "ultrasound of the pelvis",
    "ecografia pelvica",
    "ecografia transvaginal",
  ],
  ultrasound: ["ultrasound", "sonogram", "ecografia", "ultrasonido"],
  a1c: ["a1c", "hba1c", "hemoglobin a1c", "haemoglobin a1c", "glycated hemoglobin", "glycohemoglobin"],
  tsh: ["tsh", "thyroid stimulating hormone", "thyroid test", "thyroid blood test", "thyroid level"],
  "lab tests": ["lab test", "lab result", "blood test", "blood work", "bloodwork", "test result", "labs"],
  "patient-provider communication": [
    "talk to my doctor",
    "talk with my doctor",
    "talking with your doctor",
    "talk to my provider",
    "talk with my provider",
    "ask my doctor",
    "ask my provider",
    "tell my doctor",
    "tell my provider",
    "communicate with my",
    "communication with my",
    "hablar con su doctor",
    "hablar con mi doctor",
  ],
  "question lists": [
    "questions to ask",
    "question to ask",
    "what should i ask",
    "list of questions",
    "question list",
    "questions for my",
    "question builder",
    "preguntas para",
  ],
  "appointment preparation": [
    "prepare for my appointment",
    "prepare for the appointment",
    "prepare for my visit",
    "prepare for a visit",
    "preparing for my appointment",
    "next appointment",
    "upcoming appointment",
    "before my appointment",
    "appointment prep",
    "follow up appointment",
    "follow up visit",
  ],
  transportation: [
    "transportation",
    "transport",
    "a ride",
    "no car",
    "dont have a car",
    "bus",
    "get to my appointment",
    "get to the clinic",
    "get to appointments",
    "travel to the clinic",
    "transporte",
  ],
  "financial assistance": [
    "afford",
    "cant afford",
    "cost",
    "expensive",
    "insurance",
    "uninsured",
    "no insurance",
    "copay",
    "co pay",
    "financial",
    "pay for",
    "sliding fee",
    "sliding scale",
    "bill",
    "costo",
    "seguro medico",
  ],
  "medication cost": [
    "medication cost",
    "medicine cost",
    "prescription cost",
    "cost of my medication",
    "cost of my medicine",
    "afford my medication",
    "afford my medicine",
    "afford my prescription",
    "generic medicine",
    "generic medication",
  ],
  "health centers": [
    "health center",
    "community health center",
    "clinic near me",
    "low cost clinic",
    "free clinic",
    "find a clinic",
  ],
  "community resources": ["211", "community resource", "local resource", "food bank", "housing", "utility"],
  caregiving: ["caregiving", "caregiver", "childcare", "child care", "babysitter"],
  "crisis support": ["crisis", "hotline", "helpline", "crisis line", "lifeline"],
  "988": ["988"],
  "suicide prevention": [
    "suicide",
    "suicidal",
    "kill myself",
    "end my life",
    "self harm",
    "hurt myself",
    "harm myself",
    "suicidio",
  ],
  "mental health": ["mental health", "depression", "depressed", "anxiety", "anxious", "salud mental", "depresion"],
  "emergency warning signs": [
    "warning sign",
    "emergency",
    "urgent",
    "when to call",
    "when should i call",
    "go to the er",
    "911",
    "chest pain",
    "trouble breathing",
    "cant breathe",
    "heavy bleeding",
    "severe bleeding",
    "senales de advertencia",
  ],
  "pelvic pain": ["pelvic pain", "dolor pelvico"],
  "painful periods": ["painful period", "period pain", "menstrual cramps", "dysmenorrhea"],
  "irregular periods": ["irregular period", "missed period", "irregular cycle"],
  fertility: ["fertility", "infertility", "trying to conceive", "get pregnant", "fertilidad"],
  medication: ["medication", "medicine", "prescription", "pill", "medicamento"],
};

/** Tags implied when two other tags co-occur. */
const COMPOUND_TOPICS: readonly { all: readonly string[]; add: string }[] = [
  { all: ["asthma", "pregnancy"], add: "asthma in pregnancy" },
  { all: ["asthma", "postpartum care"], add: "asthma in pregnancy" },
  { all: ["emergency warning signs", "postpartum care"], add: "postpartum warning signs" },
  { all: ["emergency warning signs", "pregnancy"], add: "postpartum warning signs" },
  { all: ["financial assistance", "medication"], add: "medication cost" },
  { all: ["blood pressure", "hypertension"], add: "blood pressure monitoring" },
];

/** Tags implied by a more specific tag (keeps broad queries and narrow tags connected). */
const IMPLIED_TOPICS: Readonly<Record<string, readonly string[]>> = {
  "postpartum depression": ["mental health"],
  "gestational diabetes": ["pregnancy"],
  "type 2 diabetes": ["diabetes"],
  "blood pressure monitoring": ["blood pressure"],
  "988": ["crisis support"],
  "suicide prevention": ["crisis support"],
  "postpartum warning signs": ["emergency warning signs"],
  "asthma in pregnancy": ["asthma"],
};

interface CompiledSynonym {
  tag: string;
  re: RegExp;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const COMPILED: CompiledSynonym[] = Object.entries(TOPIC_SYNONYMS).flatMap(([tag, phrases]) =>
  phrases.map((phrase) => ({
    tag,
    re: new RegExp(`(?:^| )${escapeRegExp(normalizeText(phrase))}s?(?: |$)`),
  })),
);

/** Canonical tags this module knows about (synonym keys + compound/implied tags). */
export const KNOWN_TOPICS: ReadonlySet<string> = new Set([
  ...Object.keys(TOPIC_SYNONYMS),
  ...COMPOUND_TOPICS.map((c) => c.add),
  ...Object.values(IMPLIED_TOPICS).flat(),
]);

/**
 * Map free text (a question, a condition label, a document) to canonical topic
 * tags. Deterministic; result is sorted alphabetically.
 */
export function extractTopics(text: string): string[] {
  const normalized = normalizeText(text ?? "");
  if (!normalized) return [];
  const found = new Set<string>();
  for (const { tag, re } of COMPILED) {
    if (re.test(normalized)) found.add(tag);
  }
  for (const { all, add } of COMPOUND_TOPICS) {
    if (all.every((t) => found.has(t))) found.add(add);
  }
  for (const tag of [...found]) {
    for (const implied of IMPLIED_TOPICS[tag] ?? []) found.add(implied);
  }
  return [...found].sort();
}

/** Normalize caller-supplied topics: known tags pass through; free text is mapped via synonyms. */
export function normalizeTopics(topics: readonly string[] | undefined): string[] {
  const out = new Set<string>();
  for (const raw of topics ?? []) {
    if (typeof raw !== "string") continue;
    const lowered = raw.toLowerCase().trim();
    if (!lowered) continue;
    if (KNOWN_TOPICS.has(lowered)) out.add(lowered);
    for (const t of extractTopics(raw)) out.add(t);
  }
  return [...out].sort();
}

// ---------------------------------------------------------------------------
// Retrieval
// ---------------------------------------------------------------------------

export interface RetrieveEvidenceInput {
  /** Free-text query (user question, document excerpt, etc.). */
  query?: string;
  /** Topic tags or condition labels (free text is mapped through extractTopics). */
  topics?: readonly string[];
  /** Preferred language; same-language references rank higher. */
  language?: Language;
  /** Max results. Default 5. */
  limit?: number;
  /** Minimum relevance (0..1) for a reference to be returned. Default MIN_SCORE. */
  minScore?: number;
  /** Optional allow-list of kinds. */
  kinds?: readonly EvidenceKind[];
  /** Reference ids to exclude (e.g. already shown). */
  excludeIds?: readonly ReferenceId[];
}

export const DEFAULT_LIMIT = 5;
export const MIN_SCORE = 0.2;
export const OTHER_LANGUAGE_FACTOR = 0.5;

const WEIGHT_TOPIC = 0.6;
const WEIGHT_KEYWORD = 0.3;
const WEIGHT_LANGUAGE = 0.1;
const PARTIAL_TOPIC_WEIGHT = 0.4;
/** Topic coverage denominator cap so broad multi-topic queries are not diluted. */
const TOPIC_DENOMINATOR_CAP = 3;
/** Keyword-only matches (no topic hit) need at least this many distinct stems. */
const MIN_KEYWORD_STEMS_WITHOUT_TOPIC = 2;
/** ...and must cover at least this share of the query's content stems. */
const MIN_KEYWORD_RATIO_WITHOUT_TOPIC = 0.5;
/**
 * Broad tags that co-occur with many specific topics. They count with a lower
 * weight, and a reference matching ONLY broad tags is dropped whenever another
 * reference matches a specific tag (e.g. "iron pills" → iron pages, not every
 * medication page).
 */
export const BROAD_TOPICS: ReadonlySet<string> = new Set([
  "medication",
  "pregnancy",
  "mental health",
  "blood pressure",
  "diabetes",
  "thyroid",
  "lab tests",
  "hormones",
  "ultrasound",
  "blood sugar",
]);
const BROAD_TOPIC_WEIGHT = 0.35;
const KIND_DIVERSITY_DECAY = 0.9;
const ORG_DIVERSITY_DECAY = 0.92;

function containsWholeWords(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

interface Scored {
  reference: EvidenceReference;
  score: number;
  matchedTopics: string[];
  /** True when at least one matched tag is not in BROAD_TOPICS. */
  specificHit: boolean;
}

function topicWeight(tag: string): number {
  return BROAD_TOPICS.has(tag) ? BROAD_TOPIC_WEIGHT : 1;
}

function scoreReference(
  ref: EvidenceReference,
  requestedTopics: readonly string[],
  queryStems: readonly string[],
  language: Language | undefined,
): Scored | null {
  const refTopics = ref.topics.map((t) => t.toLowerCase());
  const refTopicSet = new Set(refTopics);

  const exact: string[] = [];
  const partial: string[] = [];
  for (const t of requestedTopics) {
    if (refTopicSet.has(t)) {
      exact.push(t);
    } else if (refTopics.some((rt) => containsWholeWords(rt, t) || containsWholeWords(t, rt))) {
      partial.push(t);
    }
  }

  let keywordHits = 0;
  if (queryStems.length > 0) {
    const refStems = new Set(contentStems(`${ref.title} ${ref.summary} ${refTopics.join(" ")}`));
    for (const s of queryStems) if (refStems.has(s)) keywordHits++;
  }

  const hasTopic = exact.length > 0 || partial.length > 0;
  if (
    !hasTopic &&
    (keywordHits < MIN_KEYWORD_STEMS_WITHOUT_TOPIC ||
      keywordHits / Math.max(1, queryStems.length) < MIN_KEYWORD_RATIO_WITHOUT_TOPIC)
  ) {
    return null;
  }

  // Denominator: weights of the (up to CAP) heaviest requested topics.
  const requestedWeights = requestedTopics.map(topicWeight).sort((a, b) => b - a);
  const denom = Math.max(
    BROAD_TOPIC_WEIGHT,
    requestedWeights.slice(0, TOPIC_DENOMINATOR_CAP).reduce((sum, w) => sum + w, 0),
  );
  const hitWeight =
    exact.reduce((sum, t) => sum + topicWeight(t), 0) +
    PARTIAL_TOPIC_WEIGHT * partial.reduce((sum, t) => sum + topicWeight(t), 0);
  const topicComponent = Math.min(1, hitWeight / denom);
  const keywordComponent = queryStems.length > 0 ? keywordHits / queryStems.length : 0;
  const sameLanguage = !language || ref.language === language;
  const languageComponent = sameLanguage ? 1 : 0;

  let score =
    WEIGHT_TOPIC * topicComponent + WEIGHT_KEYWORD * keywordComponent + WEIGHT_LANGUAGE * languageComponent;
  if (!sameLanguage) score *= OTHER_LANGUAGE_FACTOR;

  return {
    reference: ref,
    score: round4(Math.min(1, Math.max(0, score))),
    matchedTopics: [...exact, ...partial],
    specificHit: [...exact, ...partial].some((t) => !BROAD_TOPICS.has(t)),
  };
}

function compareScored(a: Scored, b: Scored): number {
  if (b.score !== a.score) return b.score - a.score;
  return a.reference.id < b.reference.id ? -1 : a.reference.id > b.reference.id ? 1 : 0;
}

/** Greedy re-rank that gently favors a mix of kinds and organizations. */
function diversify(sorted: Scored[], limit: number): Scored[] {
  const remaining = [...sorted];
  const picked: Scored[] = [];
  const kindCount = new Map<EvidenceKind, number>();
  const orgCount = new Map<string, number>();
  while (picked.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestAdj = -1;
    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const adj =
        c.score *
        KIND_DIVERSITY_DECAY ** (kindCount.get(c.reference.kind) ?? 0) *
        ORG_DIVERSITY_DECAY ** (orgCount.get(c.reference.organization) ?? 0);
      // Strictly greater keeps the deterministic (score, id) order on ties.
      if (adj > bestAdj) {
        bestAdj = adj;
        bestIdx = i;
      }
    }
    const [chosen] = remaining.splice(bestIdx, 1);
    picked.push(chosen);
    kindCount.set(chosen.reference.kind, (kindCount.get(chosen.reference.kind) ?? 0) + 1);
    orgCount.set(chosen.reference.organization, (orgCount.get(chosen.reference.organization) ?? 0) + 1);
  }
  return picked;
}

/**
 * Retrieve curated references relevant to a query and/or topics.
 * Returns [] when evidence is insufficient — callers must say so explicitly.
 *
 * @param index Override the reference index (tests); defaults to the curated index.
 */
export function retrieveEvidence(
  input: RetrieveEvidenceInput,
  index: readonly EvidenceReference[] = curatedReferences,
): EvidenceMatch[] {
  const limit = Math.max(0, Math.floor(input.limit ?? DEFAULT_LIMIT));
  if (limit === 0) return [];
  const minScore = input.minScore ?? MIN_SCORE;
  const query = input.query ?? "";

  const requestedTopics = [...new Set([...normalizeTopics(input.topics), ...extractTopics(query)])].sort();
  const queryStems = contentStems(query);
  if (requestedTopics.length === 0 && queryStems.length === 0) return [];

  const kinds = input.kinds && input.kinds.length > 0 ? new Set(input.kinds) : null;
  const exclude = new Set(input.excludeIds ?? []);

  const scored: Scored[] = [];
  for (const ref of index) {
    if (exclude.has(ref.id)) continue;
    if (kinds && !kinds.has(ref.kind)) continue;
    const s = scoreReference(ref, requestedTopics, queryStems, input.language);
    if (s && s.score >= minScore) scored.push(s);
  }
  // Tiered gate: specific topic hits > broad-only topic hits > keyword-only.
  // Lower tiers are used only when no candidate reaches a higher tier.
  const tier = (c: Scored) => (c.specificHit ? 2 : c.matchedTopics.length > 0 ? 1 : 0);
  const bestTier = scored.reduce((m, c) => Math.max(m, tier(c)), 0);
  const kept = scored.filter((c) => tier(c) === bestTier);
  kept.sort(compareScored);

  return diversify(kept, limit).map(({ reference, score, matchedTopics }) => ({
    reference,
    score,
    matchedTopics,
  }));
}

/** Look up a curated reference by id. */
export function getReference(id: ReferenceId): EvidenceReference | undefined {
  return getReferenceById(id);
}

/** Resolve many ids, silently dropping unknown ones (never fabricate a reference). */
export function getReferences(ids: readonly ReferenceId[]): EvidenceReference[] {
  const out: EvidenceReference[] = [];
  const seen = new Set<ReferenceId>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const ref = getReferenceById(id);
    if (ref) out.push(ref);
  }
  return out;
}
