/**
 * Deterministic safety rules (ARCHITECTURE §2.6, §5; SPEC §12.5).
 *
 * Runs BEFORE any model call on every user message and on pasted documents.
 * Layers:
 *   1. Normalization  — lowercase, strip accents/apostrophes, collapse spaces,
 *                       fix common misspellings, split into clauses.
 *   2. Signals        — phrase/regex patterns (English + Spanish) per symptom.
 *   3. Context        — per-match negation ("no chest pain"), remote-past
 *                       ("last year I had…") and hypothetical/educational
 *                       framing ("warning signs of…", "if you have…") dampen by
 *                       one level; negation removes a match (except self-harm
 *                       and harm-to-baby, which are only downgraded).
 *   4. Combination    — co-occurrence (chest pain + arm/jaw/sweating/breathing
 *                       trouble → emergency), postpartum context.
 *
 * This is a limited, synthetic-tested rule set, not a clinical triage tool.
 * Model-based detection may only supplement it, never replace it.
 */
import type { Language, SafetyLevel, SafetyScenario, SafetyVerdict } from "@/lib/types";
import { getSafetyGuidance } from "./guidance";

export { SAFETY_SYSTEM_RULES } from "./guidance";

export interface SafetyOptions {
  /** Language for the guidance text. Detection always covers en + es. */
  language?: Language;
  /** True when the (fictional) profile documents pregnancy/postpartum context. */
  postpartumContext?: boolean;
  /**
   * "document" for pasted/uploaded visit documents: these describe a past visit
   * and often list warning signs, so the level is capped at "concerning".
   */
  source?: "message" | "document";
}

// ---------------------------------------------------------------------------
// 1. Normalization
// ---------------------------------------------------------------------------

const TYPO_MAP: Record<string, string> = {
  cheast: "chest",
  chesst: "chest",
  chets: "chest",
  chect: "chest",
  ches: "chest",
  pian: "pain",
  paine: "pain",
  presure: "pressure",
  pressur: "pressure",
  tighness: "tightness",
  breth: "breath",
  brethe: "breathe",
  breate: "breathe",
  brething: "breathing",
  breathin: "breathing",
  breating: "breathing",
  bleding: "bleeding",
  bleeing: "bleeding",
  bleedin: "bleeding",
  bleading: "bleeding",
  sucide: "suicide",
  suicde: "suicide",
  suiside: "suicide",
  suacide: "suicide",
  sucidal: "suicidal",
  suicidle: "suicidal",
  suisidal: "suicidal",
  myslef: "myself",
  mysef: "myself",
  myelf: "myself",
  kil: "kill",
  stroek: "stroke",
  storke: "stroke",
  slured: "slurred",
  slurd: "slurred",
  numbnes: "numbness",
  numbess: "numbness",
  hedache: "headache",
  headach: "headache",
  headake: "headache",
  hedake: "headache",
  dizy: "dizzy",
  sweatting: "sweating",
  sweting: "sweating",
  vission: "vision",
  blury: "blurry",
  fevr: "fever",
  feaver: "fever",
  tempature: "temperature",
  temprature: "temperature",
  postpartem: "postpartum",
  postpardum: "postpartum",
  postpartm: "postpartum",
  postpartun: "postpartum",
  pospartum: "postpartum",
  shortnes: "shortness",
  shortnss: "shortness",
  siezure: "seizure",
  seizur: "seizure",
  cannt: "cant",
  cnat: "cant",
  // Spanish
  respiar: "respirar",
  repirar: "respirar",
  pexo: "pecho",
  sangardo: "sangrado",
};

/** Lowercase, strip accents and apostrophes. Keeps punctuation for clause splitting. */
function baseNormalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019\u02bc`']/g, "")
    .replace(/[\u00bf\u00a1]/g, " ")
    .replace(/[\u2013\u2014]/g, ", ");
}

/** Sentences end at . ! ? ; or newline (a period followed by a digit, as in 100.4, is kept). */
const SENTENCE_SPLIT = /[.!?;\n\r]+(?!\d)/;
/** Contrast words start a new segment: past/hypothetical framing does not carry across them. */
const SEGMENT_SPLIT = /\b(?:but|however|although|though|and now|pero|aunque|sin embargo|y ahora)\b/;
/** List items inside a segment ("no fever, chest pain, or cough"). */
const LIST_SPLIT = /[,:]+|\s-\s/;
/** Clauses inside a list item: negation scope never crosses these. */
const CLAUSE_SPLIT = /\b(?:and|y)\b/;
/** A list item that continues a disjunctive list: "…, or cough" / "…, nor fever" / "…, ni fiebre". */
const LIST_CONTINUATION = /^(?:or|nor|and|ni|o|y)\b|\b(?:or|nor|ni|o)\b/;
/** A list item with a subject/pronoun starts a new statement, so list negation stops there. */
const SUBJECT_WORDS =
  /\b(?:i|im|ive|id|my|me|she|shes|he|hes|her|his|it|its|they|theyre|we|yo|tengo|estoy|siento|me|mi|ella|el)\b/;

function cleanClause(clause: string): string {
  const words = clause
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => TYPO_MAP[w] ?? w);
  return words.join(" ");
}

interface Clause {
  text: string;
  /** Remote-past or hypothetical framing applies (carried forward within a segment). */
  dampened: boolean;
  /** Hypothetical / educational / conditional framing ("if you have…", "signs of…"). */
  hypothetical: boolean;
  /** Negated by an earlier list item in the same segment ("no fever, chest pain…"). */
  inheritedNegation: boolean;
}

/** True when the clause contains a real negation cue followed by at least one word. */
function hasNegationCue(clause: string): boolean {
  const words = clause.split(" ");
  for (let i = 0; i < words.length - 1; i++) {
    if (NEG_CUES.has(words[i]!) && !PSEUDO_NEG_NEXT.has(words[i + 1]!)) return true;
  }
  return false;
}

function segmentClauses(text: string): Clause[] {
  const out: Clause[] = [];
  for (const sentence of baseNormalize(text).split(SENTENCE_SPLIT)) {
    const sentenceStart = out.length;
    /** End index (exclusive) of clauses covered by a "…but it's gone" segment. */
    let resolvedUpTo = -1;
    for (const segment of sentence.split(SEGMENT_SPLIT)) {
      const cleanSegment = cleanClause(segment);
      const segmentResolved = RESOLVED_MARKERS.test(cleanSegment) && !ONGOING_MARKERS.test(cleanSegment);
      if (!segmentResolved && resolvedUpTo >= 0 && ONGOING_MARKERS.test(cleanSegment)) {
        resolvedUpTo = -1; // "…it went away but came back today"
      }
      let hypothetical = false;
      let past = false;
      let listNegation = false;
      const items = segment.split(LIST_SPLIT).map(cleanClause);
      items.forEach((item, itemIdx) => {
        const subClauses = item.split(CLAUSE_SPLIT).map((c) => c.trim()).filter(Boolean);
        if (subClauses.length === 0) return;
        // "I have no fever, chest pain, or cough": negation carries across list
        // items only when the list is disjunctive (a later item has "or"/"nor"/
        // "and…"), and stops at an item with its own subject ("…, my chest hurts").
        const disjunctiveLater = items
          .slice(itemIdx)
          .some((later, j) => j > 0 && LIST_CONTINUATION.test(later));
        const isContinuation = LIST_CONTINUATION.test(item);
        if (listNegation && (SUBJECT_WORDS.test(subClauses[0]!) || !(disjunctiveLater || isContinuation))) {
          listNegation = false;
        }
        subClauses.forEach((clause, idx) => {
          if (HYPOTHETICAL_MARKERS.test(clause)) hypothetical = true;
          if (PAST_MARKERS.test(clause)) past = true;
          if (PRESENT_OVERRIDE.test(clause)) past = false;
          const soft = SOFT_HYPOTHETICAL.test(clause) && !PRESENT_OVERRIDE.test(clause);
          out.push({
            text: clause,
            dampened: hypothetical || past || soft,
            hypothetical: hypothetical || soft,
            inheritedNegation: idx === 0 && listNegation,
          });
        });
        const last = subClauses[subClauses.length - 1]!;
        if (!(subClauses.length === 1 && listNegation)) listNegation = hasNegationCue(last);
      });
      if (segmentResolved) resolvedUpTo = out.length;
    }
    for (let i = sentenceStart; i < resolvedUpTo; i++) {
      const c = out[i]!;
      // A clause that itself says the symptom is ongoing ("my chest still hurts") is not resolved.
      if (!ONGOING_MARKERS.test(c.text) && !PRESENT_OVERRIDE.test(c.text)) c.dampened = true;
    }
  }
  return out;
}

/** Normalized clauses used for matching. Exported for tests/debugging. */
export function toSafetyClauses(text: string): string[] {
  return segmentClauses(text).map((c) => c.text);
}

/** Single normalized string (clauses joined by " | "). Exported for tests/debugging. */
export function normalizeForSafety(text: string): string {
  return toSafetyClauses(text).join(" | ");
}

// ---------------------------------------------------------------------------
// 2. Signals
// ---------------------------------------------------------------------------

type Signal =
  | "chest_core"
  | "chest_sore"
  | "chest_severe"
  | "radiating"
  | "sweating"
  | "nausea"
  | "dizzy"
  | "breath_emergency"
  | "breath_concerning"
  | "stroke_emergency"
  | "stroke_concerning"
  | "sudden_headache"
  | "severe_headache"
  | "vision_change"
  | "bleed_emergency"
  | "bleed_concerning"
  | "pad_soaking"
  | "large_clots"
  | "suicidal"
  | "hopeless"
  | "harm_baby"
  | "seizure_or_unresponsive"
  | "calf"
  | "fever_mention";

const SIGNAL_PATTERNS: Record<Signal, RegExp[]> = {
  chest_core: [
    /\bchest (?:pain|pains|pressure|tightness|tight|is tight|feels tight|heaviness|heavy|feels heavy|is heavy|discomfort|hurts|hurting|is hurting|squeezing|crushing|burning|feels like)\b/,
    /\b(?:pain|pains|pressure|tightness|heaviness|discomfort|squeezing|weight|hurting|burning) (?:in|on|across|around|under) (?:my |the )?chest\b/,
    /\btight(?:ness in (?:my |the )?)? chest\b/,
    /\bdolor (?:\w+ )?(?:\w+ )?(?:en el|en mi|de|del) pecho\b/,
    /\bdolor toracico\b/,
    /\b(?:presion|opresion|peso|ardor|molestia) (?:\w+ )?(?:en el|en mi) pecho\b/,
    /\bme duele (?:\w+ )?(?:el )?pecho\b/,
    /\bpecho apretado\b/,
    /\bme aprieta el pecho\b/,
  ],
  chest_sore: [
    /\bchest (?:soreness|is sore|feels sore|ache|aches|aching|is achy|achy|twinge|feels achy)\b/,
    /\bsore chest\b/,
    /\b(?:soreness|ache|aching|twinge) in (?:my |the )?chest\b/,
    /\bpecho adolorido\b/,
  ],
  chest_severe: [
    /\b(?:crushing|severe|intense|terrible|unbearable|excruciating|really bad|very bad|worst|horrible|sharp severe) (?:chest pain|chest pressure|pain in (?:my |the )?chest|pressure in (?:my |the )?chest)\b/,
    /\belephant (?:is |was )?(?:sitting |standing )?on (?:my )?chest\b/,
    /\b(?:having|havin|think (?:im|i am) having|might be having|is this|could this be|feels like|maybe) (?:a )?heart attack\b/,
    /\bdolor (?:muy fuerte|fuerte|intenso|severo|insoportable|aplastante|terrible) (?:en el|en mi|de|del) pecho\b/,
    /\b(?:estoy teniendo|me esta dando|creo que (?:es|tengo|estoy teniendo)|tengo) (?:un )?(?:infarto|ataque al corazon|ataque cardiaco)\b/,
  ],
  radiating: [
    /\b(?:left |right )?arm (?:pain|hurts|is hurting|is numb|numb|numbness|tingling|feels numb|feels heavy|feels weak|is tingling|went numb)\b/,
    /\b(?:pain|numbness|tingling|ache) (?:in|down|into|spreading (?:to|into|down)|radiating (?:to|into|down)|going (?:to|into|down)|moving (?:to|into)) (?:my |the )?(?:left |right )?(?:arm|jaw|neck|shoulder|back)\b/,
    /\bjaw (?:pain|hurts|is hurting|ache|aches)\b/,
    /\b(?:spreads?|spreading|radiat\w*|goes|going|moving|shooting) (?:to|into|down|up) (?:my |the )?(?:left |right )?(?:arm|jaw|neck|shoulder|back)\b/,
    /\b(?:dolor|entumecimiento|hormigueo) (?:en|hacia) (?:el|mi|la) (?:brazo|mandibula|quijada|cuello|espalda|hombro)\b/,
    /\bme duele (?:el|la) (?:brazo|mandibula|quijada)\b/,
    /\b(?:se me duerme|se me adormece|tengo entumecido) el brazo\b/,
    /\b(?:se extiende|se va|baja|corre|se pasa) (?:al|a la|hacia el|hacia la|por el) (?:brazo|mandibula|quijada|cuello|espalda)\b/,
  ],
  sweating: [/\b(?:sweat\w*|clammy|diaphore\w*)\b/, /\b(?:sudor\w*|sudando|empapad[oa] en sudor)\b/],
  nausea: [/\b(?:nause\w*|vomit\w*|throwing up|threw up|sick to my stomach|ganas de vomitar)\b/],
  dizzy: [/\b(?:dizz\w*|light ?headed|faint|fainting|fainted|passed out|pass out|about to pass out|mareo|mareada|mareado|desmay\w*)\b/],
  breath_emergency: [
    /\b(?:cant|cannot|can not|couldnt|unable to|not able to) (?:breathe|breath|breathing|get (?:enough )?air|get a breath)\b/,
    /\b(?:can barely|could barely|can hardly|hardly) (?:breathe|breath|get air)\b/,
    /\b(?:struggling|fighting) (?:to breathe|for (?:air|breath|breathe))\b/,
    /\bgasping\b/,
    /\b(?:choking|suffocating)\b/,
    /\b(?:not breathing|stopped breathing)\b/,
    /\b(?:lips|face|fingers|fingernails|skin) (?:are |is |turning |look |looks |went )?(?:blue|gray|grey|purple)\b/,
    /\bturning blue\b/,
    /\b(?:severe|extreme|serious|really bad|very bad|terrible) (?:shortness of breath|trouble breathing|difficulty breathing|breathing (?:problems?|trouble|difficulty))\b/,
    /\b(?:cant|cannot) (?:talk|speak) (?:because|in full sentences|without gasping)\b/,
    /\b(?:cant|cannot|couldnt|unable to) (?:finish|complete|get through|get out) (?:a |my |one |full |whole )?sentences?\b/,
    /\b(?:can|could) only (?:get out|say|speak|manage) (?:a )?(?:few|couple of|couple|one or two|two|2) words\b/,
    /\b(?:every|each) breath is (?:a )?(?:struggle|fight|battle)\b/,
    /\b(?:cant|cannot|couldnt) catch my breath (?:even )?(?:at rest|while resting|sitting still|sitting down|lying down|resting)\b/,
    /\bno (?:puedo|podia|puede|podemos) respirar\b/,
    /\bme (?:estoy )?ahog\w*\b/,
    /\bno me entra (?:el )?aire\b/,
    /\bdificultad (?:grave|severa|extrema|muy fuerte) para respirar\b/,
    /\blabios (?:morados|azules)\b/,
    /\bme falta mucho el aire\b/,
  ],
  breath_concerning: [
    /\b(?:short of breath|shortness of breath|out of breath|breathless|winded)\b/,
    /\b(?:cant|cannot|can not|couldnt) catch my breath\b/,
    /\b(?:trouble|difficulty|hard time|problems?|problem) breathing\b/,
    /\bhard to breathe?\b/,
    /\bwheez\w*\b/,
    /\bbreathing (?:is )?(?:hard|difficult|labored|fast)\b/,
    /\bfalta de aire\b/,
    /\bme falta (?:el )?aire\b/,
    /\bdificultad para respirar\b/,
    /\bme cuesta respirar\b/,
    /\bsin aliento\b/,
  ],
  stroke_emergency: [
    /\b(?:face|smile|mouth) (?:is |looks |feels |started |went )?(?:drooping|droopy|droops|drooped|crooked|lopsided|uneven)\b/,
    /\b(?:drooping|droopy) (?:face|mouth|eyelid|smile)\b/,
    /\bone side of (?:my |her |his )?face\b/,
    /\bslurr(?:ed|ing)\b/,
    /\b(?:cant|cannot|unable to) (?:speak|talk) (?:properly|clearly|right|normally)\b/,
    /\b(?:trouble|difficulty|hard time) (?:speaking|talking|getting (?:my |the )?words out|finding (?:my |the )?words)\b(?! (?:to|with|about))/,
    /\b(?:words (?:are )?coming out (?:wrong|jumbled)|garbled speech)\b/,
    /\bsudden(?:ly)?(?: \w+){0,3} (?:numb|numbness|weak|weakness|confus\w*|trouble (?:seeing|walking|speaking|talking)|vision loss|loss of vision|blind\w*|loss of balance|cant see|cant walk)\b/,
    /\b(?:weak|weakness|numb|numbness|tingling|paralyz\w*) (?:on|in|of) (?:one|the (?:left|right)) side\b/,
    /\bone side (?:of my body )?(?:is |feels |went )?(?:weak|numb|limp|paralyzed)\b/,
    /\b(?:left|right) side (?:of my (?:body|face) )?(?:is |feels |went )?(?:weak|numb|limp|paralyzed)\b/,
    /\b(?:cant|cannot|unable to) (?:move|lift|feel|raise) (?:my )?(?:left |right )?(?:arm|leg|hand|face|side)\b/,
    /\b(?:arm|leg) (?:suddenly )?(?:went|is|feels) (?:limp|dead|paralyzed)\b/,
    /\b(?:having|think (?:im|i am|shes|she is|hes|he is) having|might be having) (?:a )?stroke\b/,
    /\b(?:cara|boca) (?:caida|torcida|chueca)\b/,
    /\bse me (?:cae|cayo|esta cayendo|tuerce|torcio) (?:la cara|la boca|un lado de la cara)\b/,
    /\bun lado de (?:la|mi) cara\b/,
    /\bhabla (?:arrastrada|enredada|rara)\b/,
    /\barrastr\w* las palabras\b/,
    /\bno puedo hablar (?:bien|claro)\b/,
    /\bdificultad para hablar\b/,
    /\b(?:debilidad|entumecimiento|adormecimiento) (?:repentin[oa] )?(?:en|de) un lado\b/,
    /\bno puedo (?:mover|levantar|sentir) (?:el|mi|la) (?:brazo|pierna|mano|cara)\b/,
    /\b(?:estoy teniendo|creo que (?:es|tengo|estoy teniendo)|me esta dando) un (?:derrame|ictus|embolia|accidente cerebrovascular)\b/,
    /\bde repente (?:\w+ )?(?:no puedo|perdi|entumec\w*|debilidad|confus\w*)\b/,
  ],
  stroke_concerning: [
    /\b(?:numb|numbness|tingling|needles) (?:in|on) (?:my )?(?:arm|leg|hand|face|fingers)\b/,
    /\b(?:arm|leg|hand|face) (?:is |feels |went )?(?:numb|tingly|weak)\b/,
    /\b(?:hormigueo|entumecimiento|adormecimiento) en (?:el|la|mi) (?:brazo|pierna|mano|cara)\b/,
  ],
  sudden_headache: [
    /\bworst headache (?:of|in) my (?:entire )?life\b/,
    /\bthunderclap headache\b/,
    /\bsudden(?:ly)? (?:a )?(?:severe|terrible|intense|bad|really bad|excruciating) headache\b/,
    /\bel peor dolor de cabeza de mi vida\b/,
    /\bdolor de cabeza (?:repentino|subito) (?:\w+ )?(?:fuerte|intenso|severo)\b/,
  ],
  severe_headache: [
    /\b(?:severe|bad|terrible|intense|pounding|really bad|very bad|awful|excruciating|horrible) headaches?\b/,
    /\bheadaches? (?:that )?(?:wont|doesnt|does not|will not|isnt) (?:go away|get better|going away|getting better|stop)\b/,
    /\bheadaches? (?:is|are) (?:really |very |so )?(?:bad|severe|terrible|intense)\b/,
    /\bdolor de cabeza (?:muy )?(?:fuerte|intenso|severo|terrible|que no se (?:quita|va))\b/,
    /\bmigrana (?:muy )?(?:fuerte|intensa)\b/,
  ],
  vision_change: [
    /\b(?:blurry|blurred|double|cloudy) vision\b/,
    /\bvision (?:is |has |went |getting |keeps )?(?:blurry|blurred|changes?|changed|dim|weird|off|loss|going)\b/,
    /\bseeing (?:spots|stars|flashing lights|flashes|double)\b/,
    /\b(?:flashing lights|spots in my vision|vision changes?|changes in my vision|trouble seeing|lost my vision|loss of vision)\b/,
    /\bvision (?:borrosa|doble|nublada)\b/,
    /\b(?:veo|viendo) (?:manchas|puntos|luces|estrellas|doble|borroso)\b/,
    /\bcambios en (?:la|mi) vision\b/,
  ],
  bleed_emergency: [
    /\b(?:heavy|severe|massive|uncontrolled|uncontrollable|profuse|excessive|serious) bleeding\b/,
    /\bbleeding (?:very |really |so )?(?:heavily|a lot|so much|really bad|badly|profusely|uncontrollably|nonstop|non stop|wont stop|will not stop|that wont stop|doesnt stop|does not stop|everywhere)\b/,
    /\b(?:cant|cannot|wont|will not) stop (?:the )?bleeding\b/,
    /\bhemorrhaging\b/,
    /\bblood (?:is )?(?:everywhere|gushing|pouring|spurting)\b/,
    /\b(?:gushing|pouring|spurting) blood\b/,
    /\b(?:vomiting|throwing up|coughing up|puking) blood\b/,
    /\bsangrado (?:muy )?(?:abundante|fuerte|intenso|excesivo|grave|incontrolable|que no para)\b/,
    /\bsangrando (?:mucho|muchisimo|sin parar)\b/,
    /\btengo (?:una )?hemorragia\b/,
    /\bno (?:para|deja|paro|dejo) de sangrar\b/,
    /\b(?:vomitando|tosiendo|escupiendo) sangre\b/,
    /\bmucha sangre\b/,
    /\bsangro mucho\b/,
  ],
  bleed_concerning: [
    /\b(?:im|i am|been|keep|still|started|start|is) bleeding\b/,
    /\bbleeding (?:more than (?:usual|normal)|again|from)\b/,
    /\bblood in (?:my )?(?:urine|stool|stools|poop|pee)\b/,
    /\b(?:estoy sangrando|sigo sangrando|empece a sangrar)\b/,
    /\bsangre en (?:la orina|las heces|el excremento|la popo)\b/,
  ],
  pad_soaking: [
    /\b(?:soak\w*|bleeding through|bled through|bleed through) (?:through )?(?:a |one |my |more than one |two |2 |1 |the |multiple |several )?(?:maxi |sanitary |overnight )?(?:pad|pads|tampon|tampons)\b/,
    /\b(?:pad|pads|tampon|tampons)\b(?: \w+){0,3} (?:an|per|every|each|in an?|in less than an?|within an?) (?:hour|hr|half hour)\b/,
    /\b(?:empap\w*|traspas\w*|lleno|llenando) (?:\w+ )?(?:toalla|toallas|compresa|compresas)\b/,
    /\b(?:una|1|mas de una) (?:toalla|compresa)(?: \w+){0,2} (?:por|cada|en una) hora\b/,
  ],
  large_clots: [
    /\b(?:clots?|blood clots?) (?:the size of|bigger than|larger than|as big as|size of) (?:a |an )?(?:golf ?ball|egg|plum|lemon|fist|baseball|orange)\b/,
    /\b(?:large|big|huge|giant) (?:blood )?clots\b/,
    /\b(?:golf ?ball|egg|plum|lemon) (?:sized?|size) (?:blood )?clots?\b/,
    /\bcoagulos (?:muy )?(?:grandes|enormes|del tamano de (?:un|una) (?:huevo|pelota de golf|limon|ciruela))\b/,
  ],
  suicidal: [
    /\b(?:kill|killing|harm|harming|end) (?:myself|my self)\b/,
    // Accidental injuries ("I cut myself cooking") are not self-harm.
    /\b(?:hurt|hurting|cut|cutting) (?:myself|my self)\b(?! (?:cooking|shaving|lifting|exercising|working out|at the gym|playing|cleaning|gardening|chopping|slicing|by accident|accidentally|falling|on (?!purpose)|with a knife while|at work))/,
    /\bsuicid\w*\b/,
    /\b(?:end|ending|take|taking) my (?:own )?life\b/,
    /\bend it all\b/,
    /\b(?:i )?(?:want|wanna|wish) (?:to )?die\b/,
    /\bwish i (?:was|were) dead\b/,
    /\bwish i (?:could )?(?:just )?(?:disappear forever|not wake up|wouldnt wake up|didnt wake up)\b/,
    /\bbetter off (?:dead|without me|if i (?:wasnt|werent|was not|were not) (?:around|here|alive)|if i (?:was|were) (?:gone|dead)|if i (?:disappeared|died|didnt exist|never existed))\b/,
    /\bwish i (?:wasnt|werent|was not|were not) (?:here|around|alive)\b/,
    /\b(?:dont|do not) want to (?:live|be alive|be here anymore|wake up|exist|go on)\b/,
    /\bno (?:reason|point) (?:to|in) (?:live|living|going on)\b/,
    /\b(?:dont|do not|cant|cannot|no longer) (?:really )?see (?:the|any) point (?:of|in) (?:living|being alive|being here|going on|carrying on|life)(?: anymore| any more)?$/,
    /\bself harm\w*\b/,
    /\b(?:take|taking|swallow) (?:all|a bunch|a lot|the whole bottle) (?:of )?(?:my )?(?:pills|meds|medication|medicine)\b/,
    // Completed / in-progress overdose. "I took all my pills" alone is an
    // ordinary adherence report, so a quantity needs an intent or method cue.
    /\b(?:swallowed|downed) (?:all|the (?:whole|entire|rest of the)|a (?:whole|full)|a (?:bunch|handful|lot)|handfuls)\b(?: \w+){0,5}? (?:pills|meds|medications?|medicine|tablets|bottle)\b/,
    /\b(?:took|taken|swallowed|downed) (?:the|a) (?:whole|entire|full) (?:bottle|pack|packet|box)\b(?! (?:of antibiotics|as (?:prescribed|directed)|like (?:i was told|prescribed)))/,
    /\b(?:took|taken|take|taking|swallowed|swallow|downed)\b(?: \w+){0,6}? (?:pills|meds|medications?|medicine|tablets|bottle|insulin)\b(?: \w+){0,4}? on purpose\b/,
    /(?<!accidentally )\b(?:overdosed|overdosing|took an overdose|taken an overdose|tried to overdose|(?:going|gonna|want|wanna|planning) to overdose|overdose on purpose)\b(?! (?:by accident|accidentally|on accident))/,
    /\b(?:dont|do not) want (?:anyone|anybody|them|you|people|my family|him|her) to (?:find|save|stop) me\b/,
    /\bme (?:tome|trague) (?:el|un|todo el) (?:frasco|bote) (?:entero|completo)\b/,
    /\bme (?:tome|trague)\b(?: \w+){0,5}? (?:pastillas|pildoras|medicinas|medicamentos)\b(?: \w+){0,3}? a proposito\b/,
    /\b(?:me (?:tome|provoque|hice)|tome) una sobredosis\b(?! (?:sin querer|por accidente))/,
    /\bno quiero que (?:nadie|me) (?:me )?encuentre\w*\b/,
    /\b(?:estarian|estaria|estarias|estaran|estan) mejor sin mi\b/,
    /\bno (?:le )?veo (?:el )?sentido (?:a|de) (?:vivir|la vida|seguir viviendo)\b/,
    /\b(?:thoughts?|thinking) (?:of|about) (?:ending it|dying|death|not being here)\b/,
    /\b(?:quiero|quisiera|queria) morir(?:me)?\b/,
    /\bme quiero morir\b/,
    /\b(?:quitarme|quitar mi) la vida\b/,
    /\b(?:matarme|hacerme dano|lastimarme|cortarme|herirme)\b/,
    /\bno quiero (?:vivir|seguir viviendo|despertar)\b/,
    /\bmejor (?:muerta|muerto)\b/,
    /\bno vale la pena vivir\b/,
    /\bterminar con (?:todo|mi vida)\b/,
  ],
  // Hopelessness without an explicit reference to death: "concerning" with the
  // crisis line (see evaluateHits), never silently "none".
  hopeless: [
    /\b(?:dont|do not|cant|cannot|no longer) (?:really )?see (?:the|any) point (?:of|in) (?:any of (?:this|it)|anything|it all|trying)(?: anymore| any more)?$/,
    /\b(?:dont|do not|cant|cannot|no longer) (?:really )?see (?:the|any) point (?:anymore|any more)$/,
    /\bnothing matters(?: anymore| any more| to me(?: anymore)?)?$/,
    /\b(?:ya )?nada (?:me )?importa(?: ya)?$/,
    /\bno (?:le )?veo (?:el )?sentido a nada\b/,
  ],
  harm_baby: [
    /\b(?:hurt|hurting|harm|harming|kill|killing|shake|shaking|smother\w*|drown\w*) (?:my|the) (?:baby|newborn|infant|son|daughter|child|kids?)\b/,
    /\b(?:hacerle dano|lastimar|herir|matar) (?:a )?(?:mi|al) (?:bebe|hijo|hija|nino|nina)\b/,
  ],
  seizure_or_unresponsive: [
    /\b(?:having|had|having a|had a) (?:seizure|convulsion)s?\b/,
    /\b(?:seizing|convulsing)\b/,
    /\b(?:unresponsive|wont wake up|cant wake (?:her|him|them) up|unconscious)\b/,
    /\b(?:convulsion\w*|convulsionando|ataque epileptico)\b/,
    /\b(?:inconsciente|no responde|no despierta)\b/,
  ],
  calf: [
    /\bcalf (?:is |feels )?(?:pain|swelling|swollen|hurts|tender|red|warm|hot|cramp\w*)\b/,
    /\b(?:pain|swelling|tenderness|redness|cramping) in (?:my |one |the )?(?:left |right )?(?:calf|calves)\b/,
    /\b(?:one |my )?(?:left |right )?leg (?:is |feels |looks )?(?:red|swollen|warm|hot)\b/,
    /\bswollen (?:painful |red )?(?:calf|leg)\b/,
    /\b(?:dolor|hinchazon) (?:en|de) (?:la|mi) pantorrilla\b/,
    /\bpantorrilla (?:hinchada|roja|caliente|adolorida)\b/,
    /\bme duele la pantorrilla\b/,
    /\bpierna (?:hinchada|roja|caliente)\b/,
  ],
  fever_mention: [/\b(?:high fever|very high fever|fiebre (?:muy )?alta)\b/],
};

// Clause-level context markers.
const MILD_MARKERS =
  /\b(?:mild|mildly|slight|slightly|a little|a bit|little bit|minor|occasional|sometimes|muscle|muscular|pulled|from coughing|when i cough|when i press|leve|un poco|poquito|ligero|ligera)\b/;
const SEVERE_MARKERS =
  /\b(?:severe|crushing|intense|terrible|worst|bad|really|very|sudden|suddenly|fuerte|intenso|severo|mucho|muy)\b/;
const PAST_MARKERS =
  /\b(?:last (?:year|month|summer|winter|spring|fall|autumn|pregnancy)|(?:\d+|a|one|two|three|four|five|few|a few|several|many|couple of|a couple of) (?:years?|months?) (?:ago|back)|years ago|months ago|a while ago|long time ago|long ago|in the past|used to|back in \d{4}|back when|as a (?:kid|child|teen|teenager)|when i was (?:a kid|a child|younger|a teen|a teenager|little)|history of|previous pregnancy|el ano pasado|el mes pasado|hace (?:\d+|un|una|unos|unas|dos|tres|varios|varias|muchos|muchas) (?:anos?|meses?)|de nina|cuando era (?:nina|joven|pequena|chica)|antes (?:tenia|sentia)|solia|historial de|antecedentes? de)\b/;
/** Conditional framing that a present-time word cancels ("if I get chest pain" vs "…right now"). */
const SOFT_HYPOTHETICAL =
  /\b(?:(?:what|when) (?:should|do|would) i do if|should i (?:go|call) (?:to the er |911 )?if|if i (?:get|have|start|feel|notice|develop)|si (?:me da|tengo|siento|empiezo)|(?:explain|define|tell me) what\b(?: \w+){1,6} means?|what (?:does|do)\b(?: \w+){1,6} mean|what is the meaning of|(?:que|lo que) (?:significa|quiere decir))\b/;
/**
 * A sentence segment saying the symptom has resolved ("…but it's gone",
 * "…pero ya estoy mejor") dampens the whole sentence by one level, unless a
 * present-time word ("now", "again", "still") says it is ongoing.
 */
const RESOLVED_MARKERS =
  /^(?:(?:it|its|that|the \w+) )?(?:is |has |was )?(?:gone|went away|go away|resolved|stopped|passed|over|better now|fine now)$|\b(?:its gone|it went away|its gone away|it stopped|it passed|its better now|it resolved|ya (?:paso|se fue|se quito|estoy mejor|me siento mejor)|ya no (?:me duele|tengo))\b/;
/** Words saying a symptom is ongoing or recurring; they cancel a resolution marker. */
const ONGOING_MARKERS =
  /\b(?:again|still|keeps?|came back|comes back|coming back|returned|worse|tonight|otra vez|de nuevo|todavia|sigo|aun|regreso|volvio)\b/;
const PRESENT_OVERRIDE =
  /\b(?:now|right now|today|tonight|currently|again|this morning|this afternoon|this evening|still|since|keeps?|ahora|hoy|esta noche|otra vez|de nuevo|todavia|sigo|aun|desde)\b/;
const HYPOTHETICAL_MARKERS =
  /\b(?:what (?:are|is) (?:the )?(?:warning )?(?:signs|symptoms)|(?:warning )?signs of|symptoms of|warning signs|what if i ever|if i ever|in case i (?:ever )?|how (?:do|would|will|can) i (?:know|tell) (?:if|when)|when (?:should|do) i (?:call|go)|when to (?:call|go|seek)|if you (?:have|experience|notice|develop|feel|get|start|are)|call 911 if|seek (?:emergency )?(?:care|help) if|go to the (?:er|emergency room|emergency department) if|return (?:to the (?:er|ed|clinic) )?if|en caso de|senales de|sintomas de|si alguna vez|si usted (?:tiene|presenta|nota|siente)|si tiene|llame al 911 si|acuda a urgencias si)\b/;
const POSTPARTUM_CONTEXT =
  /\b(?:postpartum|post partum|postnatal|after (?:giving )?birth|gave birth|given birth|after (?:my |the )?delivery|delivered (?:my|the|a) baby|since (?:my |the )?(?:birth|delivery|c section|cesarean)|c section|cesarean|caesarean|newborn|my baby|the baby|had (?:my|a|the) baby|breastfeed\w*|posparto|post parto|despues del parto|di a luz|dar a luz|cesarea|recien nacid[oa]|mi bebe|el bebe|tuve (?:a )?(?:mi|un) bebe|lactancia|amamant\w*)\b/;
const FEVER_WORD = /\b(?:fever|temp|temperature|febrile|fiebre|temperatura|calentura)\b/;

/**
 * Pad/tampon count over a stated time ("gone through four pads in the last two
 * hours", "cambie tres toallas en una hora"). A hit needs ≥2 pads at a rate of
 * at least one per hour — the same threshold as "soaking a pad every hour".
 */
const COUNT_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, several: 3, multiple: 2, many: 4, "a few": 3, "a couple of": 2, "a couple": 2,
  un: 1, uno: 1, una: 1, media: 0.5, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8,
  nueve: 9, diez: 10, varias: 3, varios: 3, muchas: 4, "half an": 0.5, half: 0.5,
};
const PAD_COUNT = "(\\d{1,2}|a couple of|a couple|a few|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|several|multiple|many|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|varias|varios|muchas)";
const PAD_DURATION = "(\\d{1,3}(?:\\.\\d)?|half an|half|an|a|one|two|three|four|five|six|un|una|media|dos|tres|cuatro|cinco|seis)";
const PAD_RATE = new RegExp(
  "\\b(?:gone through|went through|been through|go through|going through|got through|gotten through|used|using|changed|changing|change|filled|filling|soaked|soaking|bled through|needed|cambie|cambiado|cambiando|llene|llenado|llenando|use|usado|empape|empapado|traspase)\\b(?: \\w+){0,2}? " +
    PAD_COUNT +
    " (?:\\w+ ){0,2}?(?:pads?|tampons?|toallas?|compresas?)\\b(?: \\w+){0,5}? (?:" +
    PAD_DURATION +
    " )?(hours?|hrs?|horas?|minutes?|mins?|minutos?)\\b",
);

function countValue(token: string | undefined, fallback: number): number {
  if (token === undefined) return fallback;
  if (/^\d/.test(token)) return parseFloat(token);
  return COUNT_WORDS[token] ?? fallback;
}

/** Matched phrase when the clause reports ≥2 pads at ≥1 per hour; else null. */
function padRatePhrase(clause: string): { phrase: string; index: number } | null {
  const m = PAD_RATE.exec(clause);
  if (!m) return null;
  const pads = countValue(m[1], 0);
  const unit = m[3] ?? "";
  const amount = countValue(m[2], 1);
  const hours = /^min/.test(unit) ? amount / 60 : amount;
  if (pads < 2 || hours <= 0 || pads / hours < 1) return null;
  return { phrase: m[0], index: m.index };
}

const NEG_CUES = new Set([
  "no", "not", "never", "without", "denies", "deny", "denied", "dont", "doesnt", "didnt",
  "isnt", "arent", "wasnt", "werent", "havent", "hasnt", "hadnt", "negative", "nor", "neither",
  "none", "sin", "nunca", "tampoco", "ni",
]);
const PSEUDO_NEG_NEXT = new Set([
  "idea", "clue", "sure", "know", "se", "only", "just", "certain", "matter", "wonder",
  "understand", "remember", "think", "doubt", "estoy",
]);
const NEG_WINDOW_STOP = new Set(["and", "then", "so", "because", "also", "plus", "y", "entonces", "porque", "tambien"]);
const NEG_WINDOW = 4;

/** Signals where negation only downgrades (never fully suppresses). */
const NEGATION_DOWNGRADE_ONLY: ReadonlySet<Signal> = new Set<Signal>(["suicidal", "harm_baby"]);

// ---------------------------------------------------------------------------
// 3. Matching with context
// ---------------------------------------------------------------------------

interface Hit {
  signal: Signal;
  phrase: string;
  negated: boolean;
  /** Remote past or hypothetical/educational framing. */
  dampened: boolean;
  /** Mild qualifier present (only meaningful for chest signals). */
  mild: boolean;
}

function isNegated(clause: string, matchIndex: number, matchText: string): boolean {
  const prefixWords = clause.slice(0, matchIndex).trim().split(" ").filter(Boolean);
  const firstMatchWord = matchText.split(" ")[0] ?? "";
  const lowest = Math.max(0, prefixWords.length - NEG_WINDOW);
  for (let i = prefixWords.length - 1; i >= lowest; i--) {
    const w = prefixWords[i]!;
    if (NEG_WINDOW_STOP.has(w)) return false;
    if (NEG_CUES.has(w)) {
      const next = i + 1 < prefixWords.length ? prefixWords[i + 1]! : firstMatchWord;
      if (!PSEUDO_NEG_NEXT.has(next)) return true;
    }
  }
  return false;
}

function collectHits(clauses: Clause[], documentMode: boolean): Hit[] {
  const hits: Hit[] = [];
  clauses.forEach(({ text: clause, dampened, hypothetical, inheritedNegation }) => {
    // Documents routinely list warning signs ("Call 911 if you have…"); those are
    // instructions, not reported symptoms.
    if (documentMode && hypothetical) return;
    const mild = MILD_MARKERS.test(clause) && !SEVERE_MARKERS.test(clause);
    (Object.keys(SIGNAL_PATTERNS) as Signal[]).forEach((signal) => {
      for (const pattern of SIGNAL_PATTERNS[signal]) {
        const re = new RegExp(pattern.source, "g");
        let m: RegExpExecArray | null;
        while ((m = re.exec(clause)) !== null) {
          if (m[0].length === 0) {
            re.lastIndex++;
            continue;
          }
          hits.push({
            signal,
            phrase: m[0],
            negated: inheritedNegation || isNegated(clause, m.index, m[0]),
            dampened,
            mild,
          });
        }
      }
    });
    const padRate = padRatePhrase(clause);
    if (padRate) {
      hits.push({
        signal: "pad_soaking",
        phrase: padRate.phrase,
        negated: inheritedNegation || isNegated(clause, padRate.index, padRate.phrase),
        dampened,
        mild: false,
      });
    }
    // Numeric fever ≥ 100.4 °F / ≥ 38.0 °C, only when a fever/temperature word is in the clause.
    if (FEVER_WORD.test(clause)) {
      const nums = clause.match(/\b\d{2,3}(?:\.\d{1,2})?\b/g) ?? [];
      for (const n of nums) {
        const v = parseFloat(n);
        const isF = v >= 100.4 - 1e-9 && v <= 110;
        const isC = v >= 38 && v <= 43;
        if (isF || isC) {
          const feverWord = clause.match(FEVER_WORD)?.[0] ?? "fever";
          hits.push({
            signal: "fever_mention",
            phrase: `${feverWord} ${n}`,
            negated: inheritedNegation || isNegated(clause, clause.indexOf(feverWord), feverWord),
            dampened,
            mild: false,
          });
        }
      }
    }
  });
  return hits;
}

// ---------------------------------------------------------------------------
// 4. Combination
// ---------------------------------------------------------------------------

type State = "active" | "dampened" | "absent";

const LEVEL_RANK: Record<SafetyLevel, number> = { none: 0, concerning: 1, emergency: 2 };

function downgrade(level: SafetyLevel): SafetyLevel {
  return level === "emergency" ? "concerning" : "none";
}

interface Candidate {
  level: SafetyLevel;
  scenario?: SafetyScenario;
  crisisLine?: boolean;
  phrases: string[];
  priority: number;
}

/** Scenario priority when several candidates share the top level (lower = preferred). */
const PRIORITY: Record<SafetyScenario | "other", number> = {
  suicidal_ideation_or_self_harm: 0,
  severe_postpartum_warning: 1,
  chest_pain: 2,
  severe_breathing_difficulty: 3,
  stroke_symptoms: 4,
  severe_bleeding: 5,
  other: 9,
};

function evaluateHits(hits: Hit[], postpartum: boolean): Candidate[] {
  const of = (...signals: Signal[]) => hits.filter((h) => signals.includes(h.signal));
  const effective = (h: Hit): "active" | "dampened" | "dropped" => {
    if (h.negated) return NEGATION_DOWNGRADE_ONLY.has(h.signal) ? "dampened" : "dropped";
    return h.dampened ? "dampened" : "active";
  };
  const stateOf = (list: Hit[]): State => {
    let s: State = "absent";
    for (const h of list) {
      const e = effective(h);
      if (e === "active") return "active";
      if (e === "dampened") s = "dampened";
    }
    return s;
  };
  const phrasesOf = (list: Hit[]) => list.filter((h) => effective(h) !== "dropped").map((h) => h.phrase);
  const out: Candidate[] = [];
  const add = (
    baseLevel: SafetyLevel,
    state: State,
    scenario: SafetyScenario | undefined,
    list: Hit[],
    crisisLine = false,
  ) => {
    if (state === "absent") return;
    const level = state === "active" ? baseLevel : downgrade(baseLevel);
    if (level === "none") return;
    out.push({ level, scenario, crisisLine, phrases: phrasesOf(list), priority: PRIORITY[scenario ?? "other"] });
  };
  const ppScenario = (fallback: SafetyScenario | undefined) =>
    postpartum ? ("severe_postpartum_warning" as const) : fallback;

  // Suicidal ideation / self-harm — always emergency when active.
  const suicidal = of("suicidal");
  add("emergency", stateOf(suicidal), "suicidal_ideation_or_self_harm", suicidal, true);
  const hopeless = of("hopeless");
  add("concerning", stateOf(hopeless), "suicidal_ideation_or_self_harm", hopeless, true);

  // Thoughts of harming the baby (postpartum warning sign) — include crisis line.
  const harmBaby = of("harm_baby");
  add("emergency", stateOf(harmBaby), "severe_postpartum_warning", harmBaby, true);

  // Chest pain with co-occurrence.
  const chestSevere = of("chest_severe");
  const chestCore = of("chest_core");
  const chestSore = of("chest_sore");
  const companions = of("radiating", "sweating", "nausea", "dizzy", "breath_concerning", "breath_emergency");
  const companionState = stateOf(companions);
  const chestAll = [...chestSevere, ...chestCore, ...chestSore];
  const coreNonMild = chestCore.filter((h) => !h.mild);
  const chestAnyState = stateOf(chestAll);
  if (stateOf(chestSevere) === "active" || stateOf(coreNonMild) === "active") {
    add("emergency", "active", "chest_pain", [...chestAll, ...companions]);
  } else if (chestAnyState === "active" && companionState === "active") {
    add("emergency", "active", "chest_pain", [...chestAll, ...companions]);
  } else if (chestAnyState === "active") {
    add("concerning", "active", "chest_pain", chestAll);
  } else if (stateOf([...chestSevere, ...chestCore]) === "dampened") {
    // Past/hypothetical chest pain → concerning (one level down from emergency).
    add("emergency", "dampened", "chest_pain", chestAll);
  }

  // Breathing.
  const breathE = of("breath_emergency");
  add("emergency", stateOf(breathE), "severe_breathing_difficulty", breathE);
  const breathC = of("breath_concerning");
  add("concerning", stateOf(breathC), "severe_breathing_difficulty", breathC);

  // Stroke-like symptoms.
  const strokeE = of("stroke_emergency");
  add("emergency", stateOf(strokeE), "stroke_symptoms", strokeE);
  const suddenHead = of("sudden_headache");
  add("emergency", stateOf(suddenHead), ppScenario("stroke_symptoms"), suddenHead);
  const strokeC = of("stroke_concerning");
  add("concerning", stateOf(strokeC), "stroke_symptoms", strokeC);

  // Severe headache + vision changes.
  const headache = of("severe_headache");
  const vision = of("vision_change");
  const headState = stateOf(headache);
  const visionState = stateOf(vision);
  if (headState !== "absent" && visionState !== "absent") {
    const both: State = headState === "active" && visionState === "active" ? "active" : "dampened";
    add(postpartum ? "emergency" : "concerning", both, ppScenario("stroke_symptoms"), [...headache, ...vision]);
  } else if (postpartum && headState !== "absent") {
    add("concerning", headState, "severe_postpartum_warning", headache);
  } else if (postpartum && visionState !== "absent") {
    add("concerning", visionState, "severe_postpartum_warning", vision);
  }

  // Bleeding.
  const bleedE = of("bleed_emergency", "pad_soaking", "large_clots");
  add("emergency", stateOf(bleedE), ppScenario("severe_bleeding"), bleedE);
  const bleedC = of("bleed_concerning");
  add("concerning", stateOf(bleedC), ppScenario("severe_bleeding"), bleedC);

  // Fever ≥ 100.4 °F / 38 °C and calf pain/swelling: emergency-level postpartum
  // warning signs; outside postpartum context, "concerning" without a scenario.
  const fever = of("fever_mention");
  const feverNumeric = fever.filter((h) => /\d/.test(h.phrase));
  if (feverNumeric.length > 0) {
    add(postpartum ? "emergency" : "concerning", stateOf(feverNumeric), ppScenario(undefined), fever);
  } else {
    add("concerning", stateOf(fever), ppScenario(undefined), fever);
  }
  const calf = of("calf");
  add(postpartum ? "emergency" : "concerning", stateOf(calf), ppScenario(undefined), calf);

  // Seizure / unresponsive.
  const seizure = of("seizure_or_unresponsive");
  add("emergency", stateOf(seizure), ppScenario(undefined), seizure);

  return out;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values));
}

/**
 * Deterministic safety check. Run on every user message (and pasted documents
 * with `source: "document"`) BEFORE any model call.
 */
export function evaluateSafety(text: string, opts: SafetyOptions = {}): SafetyVerdict {
  const language: Language = opts.language ?? "en";
  if (typeof text !== "string" || text.trim().length === 0) {
    return { level: "none", detectedBy: "none" };
  }
  const clauses = segmentClauses(text);
  const postpartum =
    opts.postpartumContext === true || POSTPARTUM_CONTEXT.test(clauses.map((c) => c.text).join(" "));
  const hits = collectHits(clauses, opts.source === "document");
  const candidates = evaluateHits(hits, postpartum);
  if (candidates.length === 0) return { level: "none", detectedBy: "none" };

  let top = candidates[0]!;
  for (const c of candidates) {
    if (
      LEVEL_RANK[c.level] > LEVEL_RANK[top.level] ||
      (LEVEL_RANK[c.level] === LEVEL_RANK[top.level] && c.priority < top.priority)
    ) {
      top = c;
    }
  }
  let level = top.level;
  if (opts.source === "document" && level === "emergency") level = "concerning";

  const crisisLine = candidates.some((c) => c.crisisLine === true);
  const matchedPhrases = dedupe(
    candidates.filter((c) => c.level !== "none").flatMap((c) => c.phrases),
  );
  return {
    level,
    scenario: top.scenario,
    detectedBy: "rules",
    guidance: getSafetyGuidance(level, top.scenario, language, { crisisLine }),
    matchedPhrases,
  };
}

// ---------------------------------------------------------------------------
// False reassurance detection (for tests / eval of model output)
// ---------------------------------------------------------------------------

const FALSE_REASSURANCE_PATTERNS: RegExp[] = [
  /\byou(?: are|re) (?:probably |likely |totally |completely |perfectly |just )?(?:fine|ok|okay|safe|alright|all right)\b/,
  /\byou(?:ll| will| are going to| are gonna|re going to|re gonna) be (?:just )?(?:fine|ok|okay|alright|all right)\b/,
  /\bnothing (?:to worry about|serious|to be (?:worried|concerned) about)\b/,
  /\bno (?:need|reason) to (?:worry|be worried|panic)\b/,
  /\bdont worry\b/,
  /\bno need to (?:seek|get|go|call|see|contact)\b/,
  /\b(?:you )?(?:dont|do not) need to (?:see|call|go to|seek|contact|visit) (?:a|your|the|any|medical|emergency|urgent)\b/,
  /\bthis is (?:completely |totally |perfectly |probably |likely |just |very )?normal\b/,
  /\b(?:its|it is|thats|that is) (?:probably |likely |just |completely |totally |perfectly )?(?:normal|nothing|not serious|harmless)\b/,
  /\bnot an emergency\b/,
  /\bcan wait (?:until|till) (?:your|the) next (?:appointment|visit)\b/,
  /\bno cause for (?:concern|alarm)\b/,
  /\bperfectly safe\b/,
  /\b(?:usted esta|estas|todo esta|va a estar|vas a estar) bien\b/,
  /\bno se preocupe\b/,
  /\bno te preocupes\b/,
  /\bno hay (?:nada )?(?:de )?que preocuparse\b/,
  /\bno hay (?:motivo|razon) (?:de|para) preocup\w*\b/,
  /\b(?:esto es|eso es|es) (?:completamente |totalmente |perfectamente )?normal\b/,
  /\bno es (?:nada(?: grave)?|grave|una emergencia)\b/,
  /\bno (?:necesita|tiene que) (?:buscar|ir|llamar|ver) (?:a|al|atencion|ayuda)\b/,
];

/** Matched false-reassurance phrases (normalized), e.g. ["you are fine"]. */
export function findFalseReassurance(text: string): string[] {
  const normalized = baseNormalize(text)
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const found: string[] = [];
  for (const p of FALSE_REASSURANCE_PATTERNS) {
    const m = normalized.match(p);
    if (m) found.push(m[0]);
  }
  return dedupe(found);
}

/** True if text contains phrases that falsely reassure ("you are fine", "this is normal", …). */
export function containsFalseReassurance(text: string): boolean {
  return findFalseReassurance(text).length > 0;
}
