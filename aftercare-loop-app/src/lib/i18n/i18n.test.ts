import { describe, expect, it } from "vitest";
import { en, es, getTranslator, interpolate, missingKeys, t } from "./core";
import { enModules } from "./en";
import { QUICK_PROMPT_ORDER, quickPromptKey } from "./labels";

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("dictionaries", () => {
  it("merge has no key collisions and every key is namespaced by its module", () => {
    let total = 0;
    for (const [ns, mod] of Object.entries(enModules)) {
      for (const key of Object.keys(mod)) expect(key.startsWith(`${ns}.`)).toBe(true);
      total += Object.keys(mod).length;
    }
    expect(Object.keys(en)).toHaveLength(total);
  });

  it("Spanish covers every English key with matching placeholders and no extras", () => {
    expect(missingKeys("es")).toEqual([]);
    for (const key of Object.keys(es)) expect(en).toHaveProperty(key);
    for (const [key, value] of Object.entries(en)) {
      const translated = (es as Record<string, string>)[key];
      expect(translated?.trim(), key).toBeTruthy();
      expect(placeholders(translated), key).toEqual(placeholders(value));
    }
  });

  it("contains the exact SPEC copy", () => {
    expect(t("en", "askKat.welcome")).toBe(
      "Hi! I'm Kat. 💗\nI'm here to help you understand your health information, explore reliable resources, and prepare questions for your care team.\nWhat's on your mind today?",
    );
    expect(QUICK_PROMPT_ORDER.map((q) => t("en", quickPromptKey(q)))).toEqual([
      "What should I ask my doctor?",
      "Explain my diagnosis",
      "Help me understand my results",
      "Help me plan my next steps",
      "Ask Kat anything about your health…",
    ]);
    expect(t("en", "common.demoBanner")).toBe("Demonstration using fictional patient data.");
    expect(t("en", "common.mode.scripted")).toBe(
      "Scripted Demo Mode — Responses are predefined for demonstration purposes.",
    );
    expect(t("en", "common.mode.unsupported")).toBe(
      "This scripted demonstration can't answer that question. Add an ANTHROPIC_API_KEY to enable live responses.",
    );
    expect(t("en", "check.reexplain")).toBe("Let me explain that another way.");
    expect(t("en", "careTeam.fictional")).toBe("Fictional simulation");
    expect(t("en", "evaluation.notEvaluated")).toBe("Not evaluated");
  });

  it("never uses the retired companion name", () => {
    for (const dict of [en, es]) {
      expect(JSON.stringify(dict)).not.toMatch(/Aftercare AI/i);
    }
  });
});

describe("t()", () => {
  it("translates and interpolates", () => {
    expect(t("en", "dashboard.greeting", { name: "Ana" })).toBe("Hi, Ana");
    expect(t("es", "dashboard.greeting", { name: "Ana" })).toBe("Hola, Ana");
    expect(t("es", "nav.home")).toBe("Inicio");
  });

  it("leaves unknown placeholders intact and returns unknown keys as-is", () => {
    expect(interpolate("{a} and {b}", { a: 1 })).toBe("1 and {b}");
    expect(t("en", "not.a.key" as never)).toBe("not.a.key");
  });

  it("translator is stable per language, callable and destructurable", () => {
    const tr = getTranslator("es");
    expect(getTranslator("es")).toBe(tr);
    const { t: tt, lang } = tr;
    expect(lang).toBe("es");
    expect(tr("nav.home")).toBe(tt("nav.home"));
    expect(getTranslator("xx" as never).lang).toBe("en");
  });
});
