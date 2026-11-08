// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter, isDefaultRateLimitActive } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to max per window, then blocks with a retry hint", () => {
    let t = 0;
    const rl = createRateLimiter({ max: 3, windowMs: 60_000, now: () => t });
    expect([1, 2, 3].map(() => rl.check("a").allowed)).toEqual([true, true, true]);
    const blocked = rl.check("a");
    expect(blocked).toMatchObject({ allowed: false, remaining: 0, limit: 3, retryAfterSec: 60 });
    t = 30_000;
    expect(rl.check("a").retryAfterSec).toBe(30);
  });

  it("resets after the window elapses", () => {
    let t = 0;
    const rl = createRateLimiter({ max: 1, windowMs: 1_000, now: () => t });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
    t = 1_000;
    expect(rl.check("a").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const rl = createRateLimiter({ max: 1, now: () => 0 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("defaults to 30 requests per minute", () => {
    const rl = createRateLimiter({ now: () => 0 });
    for (let i = 0; i < 30; i++) expect(rl.check("ip").allowed).toBe(true);
    expect(rl.check("ip").allowed).toBe(false);
  });

  it("bounds memory by evicting the oldest keys", () => {
    const rl = createRateLimiter({ max: 1, maxKeys: 2, now: () => 0 });
    rl.check("a");
    rl.check("b");
    rl.check("c"); // evicts "a"
    expect(rl.check("a").allowed).toBe(true);
  });

  it("reset() clears all windows", () => {
    const rl = createRateLimiter({ max: 1, now: () => 0 });
    rl.check("a");
    rl.reset();
    expect(rl.check("a").allowed).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://localhost/api/x", { headers });

  it("prefers x-real-ip, then the last x-forwarded-for hop", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.1", "x-forwarded-for": "1.1.1.1" }))).toBe("203.0.113.1");
    expect(clientIp(req({ "x-forwarded-for": "10.0.0.1, 198.51.100.9" }))).toBe("198.51.100.9");
    expect(clientIp(req({}))).toBe("unknown");
  });

  it("caps the key length", () => {
    expect(clientIp(req({ "x-real-ip": "x".repeat(500) })).length).toBe(64);
  });
});

describe("isDefaultRateLimitActive", () => {
  it("is off under the test runner and on otherwise", () => {
    expect(isDefaultRateLimitActive({ VITEST: "true" })).toBe(false);
    expect(isDefaultRateLimitActive({ NODE_ENV: "test" })).toBe(false);
    expect(isDefaultRateLimitActive({ NODE_ENV: "production" })).toBe(true);
  });
});
