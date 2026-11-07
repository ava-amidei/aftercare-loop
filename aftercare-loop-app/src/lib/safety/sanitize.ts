/**
 * Untrusted-input handling for pasted/uploaded documents and retrieved text
 * (ARCHITECTURE §2.7). Document text is DATA: it is cleaned, size-capped and
 * wrapped in delimiters before it is placed in any prompt.
 *
 * Sanitize at ingestion (before a VisitDocument is stored), because source
 * offsets index into the stored text. Sanitizing never rewrites words, so
 * injection phrases are kept verbatim and only reported for logging.
 */

export const MAX_DOCUMENT_CHARS = 20_000;

export interface SanitizedDocument {
  text: string;
  /** True when the input exceeded MAX_DOCUMENT_CHARS and was cut. */
  truncated: boolean;
  originalLength: number;
  /** Number of control / invisible formatting characters removed. */
  removedChars: number;
}

// C0 controls except \t (09) and \n (0A); DEL; C1 controls; zero-width and
// bidi-override characters that can hide text from a human reviewer.
const STRIP_CHARS =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** Full sanitization result, including the truncation flag. */
export function sanitizeDocument(raw: string, maxChars: number = MAX_DOCUMENT_CHARS): SanitizedDocument {
  const input = typeof raw === "string" ? raw : "";
  const newlines = input.replace(/\r\n?/g, "\n").replace(/[\u2028\u2029]/g, "\n");
  const stripped = newlines.replace(STRIP_CHARS, "");
  const removedChars = newlines.length - stripped.length;
  let text = stripped;
  let truncated = false;
  if (text.length > maxChars) {
    let cut = maxChars;
    // Don't split a surrogate pair.
    const code = text.charCodeAt(cut - 1);
    if (code >= 0xd800 && code <= 0xdbff) cut -= 1;
    text = text.slice(0, cut);
    truncated = true;
  }
  return { text, truncated, originalLength: input.length, removedChars };
}

/** Strip control chars, normalize newlines to \n, cap at 20,000 chars. */
export function sanitizeDocumentText(raw: string): string {
  return sanitizeDocument(raw).text;
}

function escapeDelimiters(text: string): string {
  // Neutralize any literal opening/closing delimiter so content can't break out.
  return text.replace(/<(\s*\/?\s*)(untrusted_document)/gi, "&lt;$1$2");
}

function safeId(id: string): string {
  const cleaned = String(id).replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 128);
  return cleaned || "unknown";
}

/**
 * Wrap untrusted text for a prompt:
 *   <untrusted_document id="doc-1">
 *   …text…
 *   </untrusted_document>
 * Any literal "<untrusted_document" / "</untrusted_document" inside is escaped.
 */
export function wrapUntrusted(id: string, text: string): string {
  return `<untrusted_document id="${safeId(id)}">\n${escapeDelimiters(text)}\n</untrusted_document>`;
}

const INJECTION_PATTERNS: RegExp[] = [
  /\b(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+|any\s+|the\s+|your\s+|my\s+)?(?:previous|prior|above|earlier|preceding|system|safety|original)?\s*(?:instructions|rules|prompts?|directions|guidelines|messages)\b/gi,
  /\byou\s+are\s+now\b/gi,
  /\bfrom\s+now\s+on\s+you\b/gi,
  /\bact\s+as\s+(?:a|an|my)\b/gi,
  /\bpretend\s+(?:to\s+be|you\s+are)\b/gi,
  /\bsystem\s+prompt\b/gi,
  /\bnew\s+instructions\b/gi,
  /\bdeveloper\s+mode\b/gi,
  /\bjailbreak\w*\b/gi,
  /\bdo\s+anything\s+now\b/gi,
  /\b(?:reveal|print|show|repeat)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions)\b/gi,
  /<\s*\/?\s*(?:system|assistant|user|instructions?)\s*>/gi,
  /<\s*\/?\s*untrusted_document/gi,
  /<\|im_(?:start|end)\|>/gi,
  /^\s*(?:system|assistant)\s*:/gim,
  /\b(?:ignora|olvida|omite)\s+(?:todas\s+)?(?:las\s+|tus\s+)?instrucciones(?:\s+(?:anteriores|previas))?\b/gi,
  /\bahora\s+eres\b/gi,
];

/**
 * Suspicious prompt-injection phrases found in text, lowercased and de-duplicated.
 * For LOGGING/flagging only — the document is still treated purely as data.
 */
export function detectInjectionMarkers(text: string): string[] {
  if (typeof text !== "string" || !text) return [];
  const found = new Set<string>();
  for (const pattern of INJECTION_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    for (const m of text.match(re) ?? []) {
      found.add(m.trim().replace(/\s+/g, " ").toLowerCase());
    }
  }
  return Array.from(found);
}
