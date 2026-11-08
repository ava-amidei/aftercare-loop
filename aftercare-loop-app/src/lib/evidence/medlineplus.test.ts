import { describe, expect, it, vi } from "vitest";
import {
  buildConnectUrl,
  fetchMedlinePlusConnect,
  isMedlinePlusLiveEnabled,
  mapConnectFeed,
  sanitizeConnectLink,
} from "./medlineplus";

// Shape mirrors a MedlinePlus Connect JSON feed; no network is used in tests.
const FEED = {
  feed: {
    entry: [
      {
        title: { _value: "Polycystic Ovary Syndrome" },
        link: [{ href: "https://medlineplus.gov/polycysticovarysyndrome.html?utm_source=mplusconnect&utm_medium=service" }],
      },
      { title: { _value: "Evil" }, link: [{ href: "https://evil.example.com/x" }] },
      { title: { _value: "Insecure" }, link: [{ href: "http://medlineplus.gov/x.html" }] },
      { title: { _value: "No link" } },
    ],
  },
};

describe("medlineplus connect (offline)", () => {
  it("is disabled unless the env flag is exactly 'true'", () => {
    expect(isMedlinePlusLiveEnabled({})).toBe(false);
    expect(isMedlinePlusLiveEnabled({ AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "1" })).toBe(false);
    expect(isMedlinePlusLiveEnabled({ AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" })).toBe(true);
  });

  it("never calls fetch when disabled", async () => {
    const fetchSpy = vi.fn();
    const res = await fetchMedlinePlusConnect({ topic: "pcos" }, { env: {}, fetch: fetchSpy as never });
    expect(res).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("builds a Connect URL with code system, code and language", () => {
    const url = new URL(buildConnectUrl("E28.2", "icd10cm", "es"));
    expect(url.origin).toBe("https://connect.medlineplus.gov");
    expect(url.searchParams.get("mainSearchCriteria.v.c")).toBe("E28.2");
    expect(url.searchParams.get("mainSearchCriteria.v.cs")).toBe("2.16.840.1.113883.6.90");
    expect(url.searchParams.get("informationRecipient.languageCode.c")).toBe("es");
    expect(url.searchParams.get("knowledgeResponseType")).toBe("application/json");
  });

  it("only keeps https NLM/NIH links and strips tracking params", () => {
    expect(sanitizeConnectLink("https://medlineplus.gov/a.html?utm_source=x")).toBe("https://medlineplus.gov/a.html");
    expect(sanitizeConnectLink("https://www.niddk.nih.gov/x")).toBe("https://www.niddk.nih.gov/x");
    expect(sanitizeConnectLink("https://evil.example.com")).toBeNull();
    expect(sanitizeConnectLink("https://medlineplus.gov.evil.com/")).toBeNull();
    expect(sanitizeConnectLink(42)).toBeNull();
  });

  it("maps a feed to references with a neutral summary", () => {
    const refs = mapConnectFeed(FEED, { language: "en", topic: "pcos", accessedAt: "2026-11-07", limit: 5 });
    expect(refs).toHaveLength(1);
    expect(refs[0]).toMatchObject({
      id: "ref-mplus-live-polycystic-ovary-syndrome",
      url: "https://medlineplus.gov/polycysticovarysyndrome.html",
      kind: "patient_education",
      topics: ["pcos"],
      language: "en",
      accessedAt: "2026-11-07",
    });
    expect(mapConnectFeed(null, { language: "en", accessedAt: "x", limit: 3 })).toEqual([]);
  });

  it("uses an injected fetch when enabled and swallows errors", async () => {
    const okFetch = vi.fn(async () => new Response(JSON.stringify(FEED), { status: 200 }));
    const refs = await fetchMedlinePlusConnect(
      { topic: "pcos" },
      { env: { AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" }, fetch: okFetch as never, now: () => new Date("2026-11-07T12:00:00Z") },
    );
    expect(okFetch).toHaveBeenCalledTimes(1);
    expect(refs[0].accessedAt).toBe("2026-11-07");

    const badFetch = vi.fn(async () => {
      throw new Error("network");
    });
    expect(
      await fetchMedlinePlusConnect({ topic: "pcos" }, { env: { AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" }, fetch: badFetch as never }),
    ).toEqual([]);
    // Unknown topic with no code → no request.
    const spy = vi.fn();
    expect(
      await fetchMedlinePlusConnect({ topic: "xylophone" }, { env: { AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" }, fetch: spy as never }),
    ).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects links with credentials, custom ports or excessive length", () => {
    expect(sanitizeConnectLink("https://user:pw@medlineplus.gov/a.html")).toBeNull();
    expect(sanitizeConnectLink("https://medlineplus.gov:8443/a.html")).toBeNull();
    expect(sanitizeConnectLink("https://evilnih.gov/a.html")).toBeNull();
    expect(sanitizeConnectLink(`https://medlineplus.gov/${"a".repeat(3000)}`)).toBeNull();
    expect(sanitizeConnectLink("javascript:alert(1)//medlineplus.gov")).toBeNull();
  });

  it("refuses prototype keys and malformed codes without fetching", async () => {
    const env = { AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" };
    const spy = vi.fn();
    for (const lookup of [
      { topic: "constructor" },
      { topic: "__proto__" },
      { code: "E28.2&x=1" },
      { code: "../../etc" },
      { code: "E28.2", language: "fr" as never },
      { code: "E28.2", codeSystem: "toString" as never },
    ]) {
      expect(await fetchMedlinePlusConnect(lookup, { env, fetch: spy as never })).toEqual([]);
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("disables redirects/credentials and drops oversized or off-origin responses", async () => {
    const env = { AFTERCARE_ENABLE_MEDLINEPLUS_LIVE: "true" };
    const okFetch = vi.fn(async () => new Response(JSON.stringify(FEED), { status: 200 }));
    await fetchMedlinePlusConnect({ topic: "pcos" }, { env, fetch: okFetch as never });
    const init = (okFetch.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init).toMatchObject({ redirect: "error", credentials: "omit" });

    const big = vi.fn(async () => new Response("x".repeat(600 * 1024), { status: 200 }));
    expect(await fetchMedlinePlusConnect({ topic: "pcos" }, { env, fetch: big as never })).toEqual([]);

    const offOrigin = vi.fn(async () => {
      const res = new Response(JSON.stringify(FEED), { status: 200 });
      Object.defineProperty(res, "url", { value: "https://evil.example.com/service" });
      return res;
    });
    expect(await fetchMedlinePlusConnect({ topic: "pcos" }, { env, fetch: offOrigin as never })).toEqual([]);
  });
});
