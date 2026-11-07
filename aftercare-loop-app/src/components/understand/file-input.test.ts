import { describe, expect, it } from "vitest";
import { MAX_SUMMARY_CHARS, MAX_UPLOAD_BYTES, readFileAsText, validateSummaryText, validateTextFile } from "./file-input";

describe("validateTextFile", () => {
  it("accepts .txt files with text/plain or empty MIME", () => {
    expect(validateTextFile({ name: "summary.txt", type: "text/plain", size: 100 })).toBeNull();
    expect(validateTextFile({ name: "SUMMARY.TXT", type: "", size: 100 })).toBeNull();
    expect(validateTextFile({ name: "a.txt", type: "text/plain;charset=utf-8", size: 1 })).toBeNull();
  });
  it("rejects other extensions or MIME types", () => {
    expect(validateTextFile({ name: "summary.pdf", type: "application/pdf", size: 100 })).toBe("wrong_type");
    expect(validateTextFile({ name: "summary.txt", type: "text/html", size: 100 })).toBe("wrong_type");
    expect(validateTextFile({ name: "summary.txt.exe", type: "", size: 100 })).toBe("wrong_type");
  });
  it("enforces the 200 KB cap and rejects empty files", () => {
    expect(MAX_UPLOAD_BYTES).toBe(200 * 1024);
    expect(validateTextFile({ name: "a.txt", type: "text/plain", size: MAX_UPLOAD_BYTES })).toBeNull();
    expect(validateTextFile({ name: "a.txt", type: "text/plain", size: MAX_UPLOAD_BYTES + 1 })).toBe("too_large");
    expect(validateTextFile({ name: "a.txt", type: "text/plain", size: 0 })).toBe("empty");
  });
});

describe("validateSummaryText", () => {
  it("flags empty and over-long text", () => {
    expect(validateSummaryText("   \n")).toBe("empty");
    expect(validateSummaryText("x".repeat(MAX_SUMMARY_CHARS + 1))).toBe("too_long");
    expect(validateSummaryText("x".repeat(MAX_SUMMARY_CHARS))).toBeNull();
  });
});

describe("readFileAsText", () => {
  it("reads a File's text", async () => {
    const file = new File(["hello\nworld"], "a.txt", { type: "text/plain" });
    await expect(readFileAsText(file)).resolves.toBe("hello\nworld");
  });
});
