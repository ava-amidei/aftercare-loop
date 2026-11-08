// @vitest-environment node
import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "./headers";

function directives(csp: string): Map<string, string[]> {
  return new Map(
    csp.split(";").map((d) => {
      const [name, ...values] = d.trim().split(/\s+/);
      return [name, values] as const;
    }),
  );
}

describe("security headers", () => {
  it("production CSP locks down sources but allows the Next inline runtime", () => {
    const d = directives(buildContentSecurityPolicy(false));
    expect(d.get("default-src")).toEqual(["'self'"]);
    expect(d.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(d.get("connect-src")).toEqual(["'self'"]);
    expect(d.get("frame-ancestors")).toEqual(["'none'"]);
    expect(d.get("object-src")).toEqual(["'none'"]);
    expect(d.get("base-uri")).toEqual(["'self'"]);
    expect(d.get("font-src")).toContain("https://fonts.gstatic.com");
    expect(d.get("style-src")).toContain("https://fonts.googleapis.com");
  });

  it("dev CSP adds only eval (React Refresh) and HMR websockets", () => {
    const d = directives(buildContentSecurityPolicy(true));
    expect(d.get("script-src")).toContain("'unsafe-eval'");
    expect(d.get("connect-src")).toEqual(["'self'", "ws:", "wss:"]);
  });

  it("sets the standard hardening headers; HSTS only outside dev", () => {
    const prod = Object.fromEntries(buildSecurityHeaders(false).map((h) => [h.key, h.value]));
    expect(prod["X-Frame-Options"]).toBe("DENY");
    expect(prod["X-Content-Type-Options"]).toBe("nosniff");
    expect(prod["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(prod["Permissions-Policy"]).toContain("camera=()");
    expect(prod["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    const dev = buildSecurityHeaders(true).map((h) => h.key);
    expect(dev).not.toContain("Strict-Transport-Security");
  });

  it("next.config applies them to every route and hides X-Powered-By", async () => {
    expect(nextConfig.poweredByHeader).toBe(false);
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/(.*)");
    const keys = rules[0].headers.map((h) => h.key);
    expect(keys).toEqual(expect.arrayContaining(["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options"]));
    expect(nextConfig.cacheComponents).toBe(false);
  });
});
