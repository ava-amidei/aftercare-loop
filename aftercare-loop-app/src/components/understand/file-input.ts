/**
 * Validation for the visit-summary .txt upload. Pure so it can be unit-tested
 * without a DOM. The file is DATA: it is read as text only, never executed or
 * rendered as HTML, and the server sanitizes it again.
 */
import { MAX_DOCUMENT_CHARS } from "@/lib/safety/sanitize";

/** Upload size cap (bytes). */
export const MAX_UPLOAD_BYTES = 200 * 1024;
/** Character cap enforced by /api/interpret. */
export const MAX_SUMMARY_CHARS = MAX_DOCUMENT_CHARS;

export type FileValidationError = "wrong_type" | "too_large" | "empty";

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

const ALLOWED_MIME = new Set(["", "text/plain"]);

/** Accepts only `.txt` files with a plain-text (or unreported) MIME type, 1 byte – 200 KB. */
export function validateTextFile(file: FileLike): FileValidationError | null {
  const name = file.name.trim().toLowerCase();
  const mime = file.type.split(";")[0]!.trim().toLowerCase();
  if (!name.endsWith(".txt") || !ALLOWED_MIME.has(mime)) return "wrong_type";
  if (file.size > MAX_UPLOAD_BYTES) return "too_large";
  if (file.size === 0) return "empty";
  return null;
}

export type SummaryTextError = "empty" | "too_long";

export function validateSummaryText(text: string): SummaryTextError | null {
  if (text.trim().length === 0) return "empty";
  if (text.length > MAX_SUMMARY_CHARS) return "too_long";
  return null;
}

/** Reads a File as UTF-8 text (uses File.text() when available, FileReader otherwise). */
export function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsText(file);
  });
}
