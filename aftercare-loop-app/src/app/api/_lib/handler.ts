/**
 * Shared route-handler helpers (private folder: `_lib` is not routed).
 *
 * - Per-IP rate limit (429 + Retry-After) before the body is read.
 * - Rejects cross-site browser requests (403) and non-JSON content types (415).
 * - Parses and validates the JSON body with a zod schema (v3 `"zod"` or `"zod/v4"`).
 * - 400 on invalid JSON / invalid body, 413 on oversize bodies.
 * - 500 with a safe generic message on any unexpected throw.
 * - Never echoes request content (document text, messages) in errors or logs:
 *   validation errors report only field paths and issue codes.
 */
import { NextResponse } from "next/server";
import { apiRateLimiter, clientIp, isDefaultRateLimitActive, type RateLimiter } from "./rate-limit";

/** Default body cap: documents are capped at 20k chars; leave room for context. */
export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

export const SAFE_ERROR_MESSAGES = {
  invalidJson: "Request body must be valid JSON.",
  invalidBody: "Request body is invalid.",
  tooLarge: "Request body is too large.",
  unsupportedType: "Request body must be application/json.",
  crossSite: "Cross-site requests are not allowed.",
  rateLimited: "Too many requests. Please wait a moment and try again.",
  server: "Something went wrong on our side. Please try again.",
} as const;

/** Structural type satisfied by both zod v3 and zod v4 schemas. */
export interface BodySchema<T> {
  safeParse(input: unknown):
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; code: string }> };
      };
}

export interface ValidationIssue {
  path: string;
  code: string;
}

/** Throw from a handler to return a specific status with a SAFE message. */
export class RouteError extends Error {
  readonly status: number;
  constructor(status: number, safeMessage: string) {
    super(safeMessage);
    this.name = "RouteError";
    this.status = status;
  }
}

export function jsonError(
  status: number,
  error: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ error, ...extra }, { status, headers });
}

function isJsonContentType(value: string | null): boolean {
  const type = (value ?? "").split(";")[0].trim().toLowerCase();
  return type === "application/json";
}

export type ParseBodyResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export async function parseJsonBody<T>(
  request: Request,
  schema: BodySchema<T>,
  options: { maxBytes?: number } = {},
): Promise<ParseBodyResult<T>> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, response: jsonError(415, SAFE_ERROR_MESSAGES.unsupportedType) };
  }

  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: jsonError(413, SAFE_ERROR_MESSAGES.tooLarge) };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, response: jsonError(400, SAFE_ERROR_MESSAGES.invalidJson) };
  }
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false, response: jsonError(413, SAFE_ERROR_MESSAGES.tooLarge) };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, response: jsonError(400, SAFE_ERROR_MESSAGES.invalidJson) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.slice(0, 20).map((i) => ({
      // Paths can contain client-chosen record keys: cap their length.
      path: i.path.map((p) => String(p)).join(".").slice(0, 200),
      code: String(i.code).slice(0, 64),
    }));
    return { ok: false, response: jsonError(400, SAFE_ERROR_MESSAGES.invalidBody, { issues }) };
  }
  return { ok: true, data: result.data };
}

export interface JsonHandlerOptions {
  /** Route name for logs, e.g. "ask-kat". */
  route: string;
  maxBytes?: number;
  /**
   * Rate limiter for this route (keyed by route + client IP). Defaults to the
   * shared 30 req/min limiter (inactive under the unit-test runner); `false`
   * disables limiting.
   */
  rateLimit?: RateLimiter | false;
}

function resolveLimiter(option: RateLimiter | false | undefined): RateLimiter | null {
  if (option === false) return null;
  if (option) return option;
  return isDefaultRateLimitActive() ? apiRateLimiter : null;
}

/**
 * Wrap a POST handler: validated body in, JSON out.
 *
 * ```ts
 * export const POST = withJsonBody(BodySchema, async (body) => interpretDocument(body), { route: "interpret" });
 * ```
 * Return a plain value (sent as 200 JSON) or a Response for custom statuses.
 */
export function withJsonBody<T, R>(
  schema: BodySchema<T>,
  handler: (body: T, request: Request) => Promise<R | Response> | R | Response,
  options: JsonHandlerOptions,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const started = Date.now();

    const limiter = resolveLimiter(options.rateLimit);
    if (limiter) {
      const rl = limiter.check(`${options.route}:${clientIp(request)}`);
      if (!rl.allowed) {
        logRoute(options.route, 429, started);
        return jsonError(429, SAFE_ERROR_MESSAGES.rateLimited, undefined, {
          "Retry-After": String(rl.retryAfterSec),
          "RateLimit-Limit": String(rl.limit),
          "RateLimit-Remaining": "0",
        });
      }
    }

    // Browsers send Sec-Fetch-Site; the app only calls its own API.
    if (request.headers.get("sec-fetch-site") === "cross-site") {
      logRoute(options.route, 403, started);
      return jsonError(403, SAFE_ERROR_MESSAGES.crossSite);
    }

    const parsed = await parseJsonBody(request, schema, { maxBytes: options.maxBytes });
    if (!parsed.ok) {
      logRoute(options.route, parsed.response.status, started);
      return parsed.response;
    }
    try {
      const result = await handler(parsed.data, request);
      const response = result instanceof Response ? result : NextResponse.json(result);
      logRoute(options.route, response.status, started);
      return response;
    } catch (err) {
      if (err instanceof RouteError) {
        logRoute(options.route, err.status, started);
        return jsonError(err.status, err.message);
      }
      logRoute(options.route, 500, started, err);
      return jsonError(500, SAFE_ERROR_MESSAGES.server);
    }
  };
}

function logRoute(route: string, status: number, started: number, err?: unknown): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  // Only metadata — never the request body or the error message (may contain document text).
  const entry: Record<string, unknown> = { route, status, ms: Date.now() - started };
  if (err !== undefined) entry.error = err instanceof Error ? err.name : typeof err;
  const line = `[api] ${JSON.stringify(entry)}`;
  if (status >= 500) console.error(line);
  else console.info(line);
}
