// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z as z3 } from "zod";
import { z as z4 } from "zod/v4";
import { RouteError, SAFE_ERROR_MESSAGES, parseJsonBody, withJsonBody } from "./handler";

const BodyV3 = z3.object({ text: z3.string().min(1), level: z3.enum(["a", "b"]) });
const BodyV4 = z4.object({ text: z4.string().min(1) });

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

describe("withJsonBody", () => {
  it("returns 200 JSON with the handler result", async () => {
    const handler = withJsonBody(BodyV3, async (b) => ({ echoLength: b.text.length }), { route: "t" });
    const res = await handler(post(JSON.stringify({ text: "abc", level: "a" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ echoLength: 3 });
  });

  it("accepts zod/v4 schemas too", async () => {
    const handler = withJsonBody(BodyV4, (b) => ({ ok: b.text }), { route: "t" });
    const res = await handler(post(JSON.stringify({ text: "x" })));
    expect(res.status).toBe(200);
  });

  it("400 on invalid JSON", async () => {
    const handler = withJsonBody(BodyV3, () => ({}), { route: "t" });
    const res = await handler(post("{nope"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: SAFE_ERROR_MESSAGES.invalidJson });
  });

  it("400 on schema mismatch without echoing submitted values", async () => {
    const secret = "PRIVATE DOCUMENT TEXT 123";
    const handler = withJsonBody(BodyV3, () => ({}), { route: "t" });
    const res = await handler(post(JSON.stringify({ text: 5, level: secret })));
    expect(res.status).toBe(400);
    const raw = await res.text();
    expect(raw).not.toContain(secret);
    const json = JSON.parse(raw);
    expect(json.error).toBe(SAFE_ERROR_MESSAGES.invalidBody);
    expect(json.issues.map((i: { path: string }) => i.path).sort()).toEqual(["level", "text"]);
  });

  it("500 with a safe message when the handler throws, never the error text", async () => {
    const handler = withJsonBody(
      BodyV3,
      () => {
        throw new Error("failed while processing: PRIVATE DOCUMENT TEXT");
      },
      { route: "t" },
    );
    const res = await handler(post(JSON.stringify({ text: "abc", level: "b" })));
    expect(res.status).toBe(500);
    const raw = await res.text();
    expect(raw).not.toContain("PRIVATE");
    expect(JSON.parse(raw)).toEqual({ error: SAFE_ERROR_MESSAGES.server });
  });

  it("RouteError returns its status and safe message", async () => {
    const handler = withJsonBody(
      BodyV3,
      () => {
        throw new RouteError(404, "Patient not found.");
      },
      { route: "t" },
    );
    const res = await handler(post(JSON.stringify({ text: "abc", level: "b" })));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Patient not found." });
  });

  it("passes through a Response returned by the handler", async () => {
    const handler = withJsonBody(BodyV3, () => Response.json({ created: true }, { status: 201 }), { route: "t" });
    const res = await handler(post(JSON.stringify({ text: "abc", level: "a" })));
    expect(res.status).toBe(201);
  });
});

describe("parseJsonBody", () => {
  it("413 when the body exceeds maxBytes", async () => {
    const res = await parseJsonBody(post(JSON.stringify({ text: "x".repeat(200), level: "a" })), BodyV3, {
      maxBytes: 100,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.response.status).toBe(413);
  });

  it("413 based on declared content-length", async () => {
    const res = await parseJsonBody(post("{}", { "content-length": "999999" }), BodyV3, { maxBytes: 100 });
    expect(res.ok === false && res.response.status).toBe(413);
  });
});
