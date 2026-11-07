/**
 * Id helpers. `createId` is random (for chat messages, requests, toasts);
 * `stableId` is deterministic (for source-traceable items whose id must not
 * change across re-runs, e.g. an action derived from document offsets).
 */

let counter = 0;

function randomPart(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  counter = (counter + 1) % 1_000_000;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Random, collision-resistant id: `${prefix}-${12 chars}`. */
export function createId(prefix = "id"): string {
  return `${prefix}-${randomPart()}`;
}

/** 32-bit FNV-1a hash of a string, base36-encoded. Deterministic across runtimes. */
export function stableHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** Deterministic id from parts: stableId("act", docId, 120, 168) → "act-1x9k2". */
export function stableId(prefix: string, ...parts: Array<string | number | undefined | null>): string {
  const key = parts.map((p) => (p === undefined || p === null ? "" : String(p))).join("␟");
  return `${prefix}-${stableHash(key)}`;
}
