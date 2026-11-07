import { describe, expect, it } from "vitest";
import { createId, stableHash, stableId } from "./ids";

describe("ids", () => {
  it("createId is prefixed and unique", () => {
    const a = createId("msg");
    const b = createId("msg");
    expect(a).toMatch(/^msg-[a-z0-9]+$/);
    expect(a).not.toBe(b);
  });

  it("stableHash / stableId are deterministic", () => {
    expect(stableHash("abc")).toBe(stableHash("abc"));
    expect(stableHash("abc")).not.toBe(stableHash("abd"));
    expect(stableId("act", "doc-1", 10, 42)).toBe(stableId("act", "doc-1", 10, 42));
    expect(stableId("act", "doc-1", 10, 42)).not.toBe(stableId("act", "doc-1", 104, 2));
    expect(stableId("act", "x")).toMatch(/^act-[a-z0-9]+$/);
  });
});
