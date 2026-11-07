/**
 * Deterministic post-checks for model-authored patient-facing text
 * (ARCHITECTURE §2.6: never change medications, never false-reassure).
 *
 * Runs on live Claude output only (Ask Kat replies, teach-back clarifications).
 * Passages quoted verbatim from the patient's own document are the clinician's
 * words, so they are excluded before checking; everything else Kat wrote is
 * checked sentence by sentence.
 */
import { containsFalseReassurance } from "@/lib/safety";
import type { Language, VisitDocument } from "@/lib/types";
import { isMedicationChangeDirective } from "./action-plan";

export const OUTPUT_GUARD_STR = {
  en: {
    medication:
      "I can't advise changing, skipping, stopping, or adding a dose of any medicine — that decision belongs to your care team. Please ask them before making any change.",
    reassurance:
      "I can't tell how serious this is, and I don't want to guess. Please check with your care team about this.",
  },
  es: {
    medication:
      "No puedo aconsejarle cambiar, omitir, suspender ni agregar una dosis de ningún medicamento; esa decisión le corresponde a su equipo de atención. Por favor, consúltelo con ellos antes de hacer cualquier cambio.",
    reassurance:
      "No puedo saber qué tan grave es esto y no quiero adivinar. Por favor, consulte esto con su equipo de atención.",
  },
} as const;

export interface OutputGuardOptions {
  language: Language;
  medicationNames?: readonly string[];
  /** The patient's own document; verbatim quotes from it are not Kat's words. */
  document?: VisitDocument | null;
  /** Any false reassurance replaces the whole text (used for concerning messages). */
  strictReassurance?: boolean;
}

export interface OutputGuardResult {
  text: string;
  medicationDirective: boolean;
  falseReassurance: boolean;
}

function norm(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s.,;:!?…]+$/, "")
    .trim();
}

const QUOTED = /“([^”]+)”|"([^"]+)"|«([^»]+)»/g;

/** Remove quoted fragments that appear verbatim (case/whitespace-normalized) in the document. */
export function stripDocumentQuotes(sentence: string, document?: VisitDocument | null): string {
  if (!document?.text) return sentence;
  const docText = norm(document.text);
  return sentence.replace(QUOTED, (whole, a?: string, b?: string, c?: string) => {
    const inner = norm(a ?? b ?? c ?? "");
    return inner.length >= 6 && docText.includes(inner) ? " " : whole;
  });
}

const VERB_MATCH =
  /\b(?:increase|decrease|reduce|raise|lower|double|halve|cut back|stop|skip|change|adjust|switch|taper|discontinue|titrate|aumente|aumentar|disminuya|disminuir|reduzca|reducir|suspenda|suspender|cambie|cambiar|omita|omitir)\b/gi;
const NEGATED_BEFORE = /(?:\b(?:do not|don't|dont|never|not|no)\s+(?:to\s+)?)$/i;
const OTHER_TRIGGERS = /\b(?:instead|more often|less often|extra dose|deje de|dejar de|en lugar de|m[aá]s seguido)\b/i;

/** "Don't change your dose on your own" restates a limit, not a change. */
function isOnlyNegatedChange(sentence: string): boolean {
  if (OTHER_TRIGGERS.test(sentence)) return false;
  const s = sentence.replace(/[‘’]/g, "'");
  const matches = [...s.matchAll(VERB_MATCH)];
  return matches.length > 0 && matches.every((m) => NEGATED_BEFORE.test(s.slice(0, m.index)));
}

/** "Take an extra 40 mg", "take another pill", "double up" — not covered by the shared verb list. */
const EXTRA_DOSE =
  /\b(?:(?:take|taking|tome|tomar|toma)\s+(?:an?\s+|one\s+|una\s+|un\s+|otra\s+|otro\s+)?(?:extra|additional|another|more|adicional|m[aá]s)\b|double up)/i;
const DOSE_OBJECT =
  /\b(?:dose|doses|dosage|mg|mcg|units?|medications?|medicines?|meds|pills?|tablets?|insulin|dosis|medicamentos?|medicinas?|pastillas?|unidades)\b/i;

const NEGATED_EXTRA =
  /\b(?:do not|don't|dont|never|no)\s+(?:take|tome|tomar)\s+(?:an?\s+|una\s+|un\s+|otra\s+|otro\s+)?(?:extra|additional|another|more|adicional|m[aá]s)\b[^,;]*/gi;

function isExtraDoseDirective(text: string, medicationNames: readonly string[]): boolean {
  if (/\?\s*$/.test(text) || text.trim().startsWith("¿") || !EXTRA_DOSE.test(text)) return false;
  if (DOSE_OBJECT.test(text)) return true;
  const lower = text.toLowerCase();
  return medicationNames.some((n) => n.trim().length > 2 && lower.includes(n.trim().toLowerCase()));
}

/** True when Kat's own words (outside verbatim document quotes) direct a medication change. */
export function isUnsupportedMedicationDirective(
  sentence: string,
  opts: Pick<OutputGuardOptions, "medicationNames" | "document"> = {},
): boolean {
  // Drop the clinician's verbatim words and negated "don't take an extra dose" clauses.
  const own = stripDocumentQuotes(sentence, opts.document)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(NEGATED_EXTRA, " ")
    .trim();
  if (!own) return false;
  const names = [...(opts.medicationNames ?? [])];
  if (isExtraDoseDirective(own, names)) return true;
  if (!isMedicationChangeDirective(own, names)) return false;
  return !isOnlyNegatedChange(own);
}

function isFalseReassurance(sentence: string, document?: VisitDocument | null): boolean {
  return containsFalseReassurance(stripDocumentQuotes(sentence, document));
}

/** Split a line into sentences without breaking inside quotes. */
export function splitSentences(line: string): string[] {
  const out: string[] = [];
  let start = 0;
  let inCurly = false;
  let inStraight = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === "“") inCurly = true;
    else if (ch === "”") inCurly = false;
    else if (ch === '"') inStraight = !inStraight;
    else if (/\s/.test(ch) && !inCurly && !inStraight && i > start) {
      const prev = line[i - 1]!;
      const prev2 = line[i - 2] ?? "";
      const ends = /[.!?…]/.test(prev) || (/[”"»)]/.test(prev) && /[.!?…]/.test(prev2));
      if (ends) {
        out.push(line.slice(start, i));
        start = i + 1;
      }
    }
  }
  if (start < line.length) out.push(line.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Sentence-level guard. A medication-change sentence is replaced (once) by a
 * deterministic "ask your care team" sentence; false-reassurance sentences are
 * dropped and a deterministic caution is appended (or, when strict, the whole
 * text is replaced).
 */
export function guardModelOutput(text: string, opts: OutputGuardOptions): OutputGuardResult {
  const str = OUTPUT_GUARD_STR[opts.language];
  if (opts.strictReassurance && containsFalseReassurance(text)) {
    return { text: str.reassurance, medicationDirective: false, falseReassurance: true };
  }
  let medicationDirective = false;
  let falseReassurance = false;
  const lines: string[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) {
      lines.push("");
      continue;
    }
    const kept: string[] = [];
    for (const sentence of splitSentences(line)) {
      if (isUnsupportedMedicationDirective(sentence, opts)) {
        if (!medicationDirective) kept.push(str.medication);
        medicationDirective = true;
      } else if (isFalseReassurance(sentence, opts.document)) {
        falseReassurance = true;
      } else {
        kept.push(sentence);
      }
    }
    if (kept.length > 0) lines.push(kept.join(" "));
  }
  if (!medicationDirective && !falseReassurance) return { text, medicationDirective, falseReassurance };
  let out = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (falseReassurance) out = out ? `${out}\n\n${str.reassurance}` : str.reassurance;
  return { text: out, medicationDirective, falseReassurance };
}

/** True when any sentence of `text` is a medication-change directive Kat authored. */
export function containsUnsupportedMedicationDirective(
  text: string,
  opts: Pick<OutputGuardOptions, "medicationNames" | "document"> = {},
): boolean {
  return text.split("\n").some((line) => splitSentences(line).some((s) => isUnsupportedMedicationDirective(s, opts)));
}
