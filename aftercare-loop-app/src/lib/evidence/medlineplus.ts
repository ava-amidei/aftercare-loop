/**
 * Optional live lookup against MedlinePlus Connect (U.S. National Library of
 * Medicine). Server-side only; OFF unless AFTERCARE_ENABLE_MEDLINEPLUS_LIVE="true".
 * Never called by unit tests (tests inject a fake `fetch` or leave it disabled).
 *
 * MedlinePlus Connect is keyed by codes (ICD-10-CM problems, RxCUI drugs,
 * LOINC labs). Callers either pass a code or a curated topic tag listed in
 * MEDLINEPLUS_CONNECT_ICD10 below.
 *
 * Results are mapped to EvidenceReference with a neutral, non-verbatim summary
 * and only include links that point at medlineplus.gov or *.nih.gov. Retrieved
 * content is untrusted data: callers must wrap it before putting it in prompts.
 * Any failure (disabled, network, timeout, bad JSON) returns [] — the curated
 * index remains the source of truth.
 */
import type { EvidenceReference, Language } from "@/lib/types";

export const MEDLINEPLUS_CONNECT_URL = "https://connect.medlineplus.gov/service";

export const CODE_SYSTEMS = {
  icd10cm: "2.16.840.1.113883.6.90",
  rxcui: "2.16.840.1.113883.6.88",
  loinc: "2.16.840.1.113883.6.1",
} as const;
export type CodeSystem = keyof typeof CODE_SYSTEMS;

/**
 * Topic tag → ICD-10-CM code used ONLY as a lookup key for MedlinePlus Connect.
 * Each mapping was checked on 2026-11-07 by calling MedlinePlus Connect and
 * confirming it returned the matching MedlinePlus health topic. These codes
 * are never shown to patients and are not diagnoses. Topics without a
 * confirmed mapping are intentionally absent.
 */
export const MEDLINEPLUS_CONNECT_ICD10: Readonly<Record<string, string>> = {
  pcos: "E28.2",
  hypothyroidism: "E03.9",
  "type 2 diabetes": "E11.9",
  hypertension: "I10",
  anemia: "D50.9",
  "iron deficiency": "D50.9",
  migraine: "G43.909",
  endometriosis: "N80.9",
  "postpartum depression": "F53.0",
  asthma: "J45.909",
  "gestational diabetes": "O24.419",
  menopause: "N95.9",
  perimenopause: "N95.9",
};

export function isMedlinePlusLiveEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AFTERCARE_ENABLE_MEDLINEPLUS_LIVE === "true";
}

export interface MedlinePlusLookup {
  /** Code to look up, or omit and pass `topic`. */
  code?: string;
  codeSystem?: CodeSystem;
  /** Curated topic tag (see MEDLINEPLUS_CONNECT_ICD10). */
  topic?: string;
  language?: Language;
  /** Max references returned. Default 3. */
  limit?: number;
}

export interface MedlinePlusDeps {
  fetch?: typeof fetch;
  env?: Record<string, string | undefined>;
  /** Clock for accessedAt (ISO date). */
  now?: () => Date;
  timeoutMs?: number;
}

export function buildConnectUrl(code: string, codeSystem: CodeSystem, language: Language): string {
  const params = new URLSearchParams({
    "mainSearchCriteria.v.cs": CODE_SYSTEMS[codeSystem],
    "mainSearchCriteria.v.c": code,
    knowledgeResponseType: "application/json",
    "informationRecipient.languageCode.c": language,
  });
  return `${MEDLINEPLUS_CONNECT_URL}?${params.toString()}`;
}

const ALLOWED_HOST = /(^|\.)medlineplus\.gov$|(^|\.)nih\.gov$/;

/** Strip tracking params; return null if not an allowed https NLM/NIH URL. */
export function sanitizeConnectLink(href: unknown): string | null {
  if (typeof href !== "string") return null;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !ALLOWED_HOST.test(url.hostname)) return null;
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith("utm_")) url.searchParams.delete(key);
  }
  return url.toString();
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

interface ConnectEntry {
  title?: { _value?: unknown };
  link?: { href?: unknown }[];
}

/** Pure mapper from a MedlinePlus Connect JSON feed to EvidenceReference[]. */
export function mapConnectFeed(
  json: unknown,
  opts: { language: Language; topic?: string; accessedAt: string; limit: number },
): EvidenceReference[] {
  const entries = (json as { feed?: { entry?: unknown } } | null)?.feed?.entry;
  if (!Array.isArray(entries)) return [];
  const out: EvidenceReference[] = [];
  const seen = new Set<string>();
  for (const raw of entries as ConnectEntry[]) {
    if (out.length >= opts.limit) break;
    const title = typeof raw?.title?._value === "string" ? raw.title._value.trim().slice(0, 200) : "";
    const url = sanitizeConnectLink(raw?.link?.[0]?.href);
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);
    const isMedlinePlus = new URL(url).hostname.endsWith("medlineplus.gov");
    out.push({
      id: `ref-mplus-live-${slug(title)}`,
      title,
      organization: isMedlinePlus
        ? "MedlinePlus (U.S. National Library of Medicine)"
        : "National Institutes of Health (via MedlinePlus Connect)",
      url,
      kind: "patient_education",
      publisherType: "government",
      topics: opts.topic ? [opts.topic.toLowerCase()] : [],
      accessedAt: opts.accessedAt,
      summary:
        opts.language === "es"
          ? "Página de información para pacientes obtenida en vivo de MedlinePlus Connect. Revise la fuente para conocer los detalles."
          : "Patient information page returned live by MedlinePlus Connect. Open the source for details.",
      language: opts.language,
    });
  }
  return out;
}

/**
 * Live MedlinePlus Connect lookup. Returns [] when disabled or on any error.
 */
export async function fetchMedlinePlusConnect(
  lookup: MedlinePlusLookup,
  deps: MedlinePlusDeps = {},
): Promise<EvidenceReference[]> {
  if (!isMedlinePlusLiveEnabled(deps.env)) return [];
  const language: Language = lookup.language ?? "en";
  const codeSystem: CodeSystem = lookup.codeSystem ?? "icd10cm";
  const topic = lookup.topic?.toLowerCase().trim();
  const code = lookup.code ?? (topic ? MEDLINEPLUS_CONNECT_ICD10[topic] : undefined);
  if (!code) return [];

  const doFetch = deps.fetch ?? globalThis.fetch;
  if (typeof doFetch !== "function") return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 4000);
  try {
    const res = await doFetch(buildConnectUrl(code, codeSystem, language), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    const accessedAt = (deps.now?.() ?? new Date()).toISOString().slice(0, 10);
    return mapConnectFeed(json, { language, topic, accessedAt, limit: lookup.limit ?? 3 });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
