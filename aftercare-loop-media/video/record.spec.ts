/**
 * Aftercare Loop demo-video recorder (Playwright, chromium, 1920x1080 @1x).
 *
 * One browser context per shot, so Playwright writes one .webm per shot on
 * context close. Demo state (localStorage) is carried from shot to shot with
 * storageState, so the journey stays continuous for fictional patient pt-a-pcos
 * (shot 5 briefly switches to pt-c-endometriosis; shot 6 switches back).
 *
 * Everything a shot does before ctl.ready() (navigation, loading, hidden prep)
 * is "lead-in"; its length is written to out/clips/clips.json and assemble.mjs
 * trims it off. After ready(), each shot holds the screen for at least the
 * narration segment duration + 0.6 s (+ a small safety margin).
 *
 * Run (app must already be up in Scripted Demo Mode, see ../README.md):
 *   DEMO_BASE_URL=http://localhost:3100 npx playwright test -c video/playwright.config.ts
 *
 * Cards (shots 1, 2, 10) are rendered from video/cards/*.html to PNG here too.
 * All data shown is fictional; no document text is logged.
 */
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const CLIPS = path.join(OUT, "clips");
const TMP = path.join(OUT, ".video-tmp");
const STATE = path.join(CLIPS, "state.json");
const MANIFEST = path.join(CLIPS, "clips.json");
const BASE = process.env.DEMO_BASE_URL ?? "http://localhost:3100";
const PATIENT_ID = "pt-a-pcos";
/** Fictional patient with a deliberately unverifiable step (shot 5). */
const PRIYA_ID = "pt-c-endometriosis";
const VIEWPORT = { width: 1920, height: 1080 };
/** Extra hold after duration + gap, so trimming never runs out of frames. */
const END_MARGIN = 0.9;

type Segment = { n: number; start: number; duration: number; shot: string; text: string };
const segmentsFile = JSON.parse(fs.readFileSync(path.join(OUT, "segments.json"), "utf8")) as {
  gap: number;
  segments: Segment[];
};
const GAP = segmentsFile.gap ?? 0.6;
const seg = (n: number): Segment => {
  const s = segmentsFile.segments.find((x) => x.n === n);
  if (!s) throw new Error(`segment ${n} missing from segments.json`);
  return s;
};

type ClipEntry = { n: number; kind: "clip" | "card"; file: string; screenshot: string; leadIn: number; recorded: number; target: number };
function writeManifest(entry: ClipEntry) {
  const all: Record<string, ClipEntry> = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  all[String(entry.n)] = entry;
  fs.writeFileSync(MANIFEST, JSON.stringify(all, null, 2));
}

/**
 * Injected into every page: hides the Next.js dev indicator, and draws a
 * visible cursor (Playwright's video has none) with a ripple on click.
 */
const CURSOR_SCRIPT = `(() => {
  const css = \`
    nextjs-portal { display: none !important; }
    #demo-cursor { position: fixed; left: 0; top: 0; width: 34px; height: 34px; pointer-events: none;
      z-index: 2147483647; transform: translate(-200px, -200px); transition: transform 40ms linear; }
    #demo-cursor svg { filter: drop-shadow(0 2px 3px rgba(20,20,20,.35)); }
    .demo-ripple { position: fixed; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 9999px;
      background: rgba(238,98,0,.35); pointer-events: none; z-index: 2147483646;
      animation: demo-ripple 520ms ease-out forwards; }
    @keyframes demo-ripple { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
  \`;
  const mount = () => {
    if (document.getElementById('demo-cursor')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const c = document.createElement('div'); c.id = 'demo-cursor';
    c.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 2.5v17.2l4.3-4.1 2.9 6.6 2.9-1.3-2.9-6.5h6.1z" fill="#141414" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    window.addEventListener('mousemove', (e) => { c.style.transform = 'translate(' + (e.clientX - 5) + 'px,' + (e.clientY - 3) + 'px)'; }, true);
    window.addEventListener('mousedown', (e) => {
      const r = document.createElement('div'); r.className = 'demo-ripple';
      r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r); setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();`;

type Ctl = {
  /** Marks the start of usable footage. */
  ready: () => Promise<void>;
  /** Seconds since ready(). */
  elapsed: () => number;
  /** Wait until `sec` seconds after ready(). */
  until: (sec: number) => Promise<void>;
  /** Move the visible cursor to a locator and click it. */
  click: (loc: Locator, opts?: { steps?: number; pause?: number }) => Promise<void>;
  /** Move the visible cursor over a locator without clicking. */
  hover: (loc: Locator, steps?: number) => Promise<void>;
  /** Smoothly scroll a locator into view. */
  scrollTo: (loc: Locator, block?: "start" | "center" | "end") => Promise<void>;
};

let cursor = { x: 1500, y: 700 };

async function recordShot(browser: Browser, n: number, body: (page: Page, ctl: Ctl) => Promise<void>) {
  const s = seg(n);
  const target = s.duration + GAP;
  fs.mkdirSync(CLIPS, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: "en-US",
    colorScheme: "light",
    recordVideo: { dir: TMP, size: VIEWPORT },
    storageState: fs.existsSync(STATE) ? STATE : undefined,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  await context.addInitScript(CURSOR_SCRIPT);
  const t0 = Date.now();
  const page = await context.newPage();
  page.on("load", () => void page.mouse.move(cursor.x, cursor.y).catch(() => {}));
  let readyAt = 0;
  const moveTo = async (x: number, y: number, steps = 22) => {
    await page.mouse.move(x, y, { steps });
    cursor = { x, y };
  };
  const ctl: Ctl = {
    ready: async () => {
      await page.mouse.move(cursor.x, cursor.y);
      await page.waitForTimeout(400);
      readyAt = Date.now();
    },
    elapsed: () => (Date.now() - readyAt) / 1000,
    until: async (sec) => {
      const wait = sec - ctl.elapsed();
      if (wait > 0) await page.waitForTimeout(Math.round(wait * 1000));
    },
    hover: async (loc, steps = 22) => {
      await loc.scrollIntoViewIfNeeded();
      const box = await loc.boundingBox();
      if (!box) throw new Error("hover target has no box");
      await moveTo(box.x + box.width / 2, box.y + box.height / 2, steps);
    },
    click: async (loc, opts = {}) => {
      await ctl.hover(loc, opts.steps ?? 22);
      await page.waitForTimeout(opts.pause ?? 250);
      await page.mouse.down();
      await page.waitForTimeout(90);
      await page.mouse.up();
    },
    scrollTo: async (loc, block = "center") => {
      await loc.evaluate((el, b) => el.scrollIntoView({ behavior: "smooth", block: b as ScrollLogicalPosition }), block);
      await page.waitForTimeout(900);
    },
  };

  await body(page, ctl);
  if (!readyAt) throw new Error(`shot ${n} never called ready()`);
  await ctl.until(target + END_MARGIN);
  const recorded = (Date.now() - t0) / 1000;
  const shotPng = path.join(CLIPS, `shot-${String(n).padStart(2, "0")}.png`);
  await page.screenshot({ path: shotPng });
  await context.storageState({ path: STATE });
  const video = page.video();
  await context.close();
  const webm = path.join(CLIPS, `shot-${String(n).padStart(2, "0")}.webm`);
  if (!video) throw new Error("no video recorded");
  await video.saveAs(webm);
  await video.delete();
  writeManifest({
    n,
    kind: "clip",
    file: path.relative(OUT, webm),
    screenshot: path.relative(OUT, shotPng),
    leadIn: Math.round(((readyAt - t0) / 1000) * 1000) / 1000,
    recorded,
    target,
  });
}

async function renderCard(browser: Browser, n: number, name: string) {
  const s = seg(n);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto("file://" + path.join(HERE, "cards", `${name}.html`));
  await page.evaluate(() => document.fonts.ready);
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toContain("Montserrat");
  expect(await page.evaluate(() => document.fonts.check('700 48px "Montserrat"'))).toBe(true);
  const png = path.join(CLIPS, `shot-${String(n).padStart(2, "0")}.png`);
  await page.screenshot({ path: png });
  await context.close();
  writeManifest({ n, kind: "card", file: path.relative(OUT, png), screenshot: path.relative(OUT, png), leadIn: 0, recorded: 0, target: s.duration + GAP });
}

/** Smoothly scroll so `loc`'s top edge sits at viewport y = `top` (keeps it above the caption band). */
async function scrollTopTo(page: Page, loc: Locator, top = 130) {
  await loc.evaluate((el, y) => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - y, behavior: "smooth" });
  }, top);
  await page.waitForTimeout(900);
}

/** Shows the hidden-prep result as instant (non-smooth) scroll position. */
async function jumpTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
}

async function ensureInterpreted(page: Page) {
  const result = page.getByTestId("interpretation-result");
  if (await result.isVisible().catch(() => false)) return;
  await page.getByRole("button", { name: "Load my sample summary" }).click();
  await page.getByRole("button", { name: "Explain this to me" }).click();
  await expect(result).toBeVisible({ timeout: 30_000 });
}

test.describe.configure({ mode: "serial" });

test.beforeAll(() => {
  fs.mkdirSync(CLIPS, { recursive: true });
  if (!process.env.KEEP_STATE && fs.existsSync(STATE)) fs.rmSync(STATE);
});

test("cards: title, problem, closing", async ({ browser }) => {
  await renderCard(browser, 1, "title");
  await renderCard(browser, 2, "problem");
  await renderCard(browser, 10, "closing");
});

test("shot 3: dashboard, pick Patient A (PCOS)", async ({ browser }) => {
  await recordShot(browser, 3, async (page, ctl) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Demonstration using fictional patient data.").first()).toBeVisible();
    const select = page.getByTestId("patient-switcher").locator("select");
    await expect(select).toBeEnabled();
    // Hidden prep: start on another fictional patient so the switch is visible.
    await select.selectOption("pt-b-postpartum");
    await expect(page.getByTestId("dashboard")).toHaveAttribute("data-patient-id", "pt-b-postpartum");
    await jumpTop(page);
    await ctl.ready();

    await ctl.click(select, { steps: 30 });
    await page.waitForTimeout(350);
    await select.selectOption(PATIENT_ID);
    await expect(page.getByTestId("dashboard")).toHaveAttribute("data-patient-id", PATIENT_ID);
    await page.mouse.move(cursor.x - 200, cursor.y + 260, { steps: 20 });
    cursor = { x: cursor.x - 200, y: cursor.y + 260 };
    await ctl.until(4.5);
    await ctl.hover(page.getByTestId("dashboard").getByRole("heading", { level: 1 }).first(), 25);
    await ctl.until(6.5);
    // Slow scroll through the dashboard cards, then back up.
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 110);
      await page.waitForTimeout(260);
    }
    await ctl.until(11.5);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  });
});

test("shot 4: understand, paste summary and explain", async ({ browser }) => {
  await recordShot(browser, 4, async (page, ctl) => {
    await page.goto(BASE + "/understand");
    const textarea = page.getByRole("textbox", { name: /Paste your after-visit summary/i });
    await expect(textarea).toBeVisible();
    // Hidden prep: read the fixture summary via the sample button, then clear it
    // so the paste happens on camera. Text stays in the browser; never logged.
    await page.getByRole("button", { name: "Load my sample summary" }).click();
    const text = await textarea.inputValue();
    expect(text.length).toBeGreaterThan(200);
    await textarea.fill("");
    await page.evaluate((t) => navigator.clipboard.writeText(t), text);
    await jumpTop(page);
    await ctl.ready();

    await ctl.click(textarea, { steps: 26 });
    await page.waitForTimeout(400);
    await page.keyboard.press("ControlOrMeta+V");
    await page.waitForTimeout(300);
    if ((await textarea.inputValue()).length < 200) await textarea.fill(text); // paste fallback
    await ctl.until(2.6);
    await ctl.click(page.getByRole("button", { name: "Explain this to me" }));
    const result = page.getByTestId("interpretation-result");
    await expect(result).toBeVisible({ timeout: 30_000 });
    await ctl.until(4.2);
    const sections = ["card-what-this-means", "card-what-to-know", "card-discuss", "card-next-steps", "card-sources"];
    const slots = [4.2, 6.2, 8.0, 9.8, 11.8];
    for (let i = 0; i < sections.length; i++) {
      await ctl.until(slots[i]);
      await ctl.scrollTo(result.getByTestId(sections[i]), "start");
    }
  });
});

test("shot 5: view source highlight, then Priya's needs-clarification step", async ({ browser }) => {
  await recordShot(browser, 5, async (page, ctl) => {
    await page.goto(BASE + "/understand");
    await expect(page.getByRole("textbox", { name: /Paste your after-visit summary/i })).toBeVisible();
    await ensureInterpreted(page);
    const steps = page.getByTestId("interpretation-result").getByTestId("card-next-steps");
    await steps.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior }));
    await ctl.ready();

    // Maya: one documented next step, traced to its exact sentence.
    const instructions = steps.getByTestId("verified-instruction");
    expect(await instructions.count()).toBeGreaterThanOrEqual(3);
    await ctl.hover(instructions.first(), 24);
    await ctl.until(1.2);
    await ctl.click(instructions.first().getByRole("button", { name: "View source" }));
    const hl = page.getByTestId("source-viewer-highlight");
    await expect(hl).toBeVisible({ timeout: 10_000 });
    await hl.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
    await ctl.until(2.4);
    await ctl.hover(hl, 26);
    await ctl.until(4.2);
    await page.keyboard.press("Escape");
    await expect(hl).toHaveCount(0);

    // Priya (pt-c-endometriosis): her scripted interpretation carries one paraphrased
    // instruction, so the "Needs clarification" card with a "Not verified" step renders.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    await page.waitForTimeout(500);
    const select = page.getByTestId("patient-switcher").locator("select");
    await ctl.click(select, { steps: 22 });
    await page.waitForTimeout(250);
    await select.selectOption(PRIYA_ID);
    const load = page.getByRole("button", { name: "Load my sample summary" });
    await expect(load).toBeVisible({ timeout: 10_000 });
    await ctl.until(6.6);
    await ctl.click(load, { steps: 22 });
    await ctl.until(7.8);
    await ctl.click(page.getByRole("button", { name: "Explain this to me" }), { steps: 20 });
    const result = page.getByTestId("interpretation-result");
    await expect(result).toBeVisible({ timeout: 30_000 });
    const clar = result.getByTestId("needs-clarification");
    await expect(clar).toBeVisible({ timeout: 10_000 });
    await expect(clar).toContainText("Not verified");
    await ctl.until(9.4);
    await scrollTopTo(page, clar, 160);
    // Hover the step text, not the badge, so the "Not verified" label stays readable.
    await ctl.hover(clar.locator("li p").first(), 26);
  });
});

test("shot 6: Ask Kat, what should I ask my doctor", async ({ browser }) => {
  await recordShot(browser, 6, async (page, ctl) => {
    await page.goto(BASE + "/");
    // Hidden prep: shot 5 ended on Priya; back to Maya for the rest of the journey.
    const select = page.getByTestId("patient-switcher").locator("select");
    await expect(select).toBeEnabled();
    if ((await select.inputValue()) !== PATIENT_ID) await select.selectOption(PATIENT_ID);
    await expect(page.getByTestId("dashboard")).toHaveAttribute("data-patient-id", PATIENT_ID);
    await page.waitForTimeout(3300); // let the "switched to" toast clear before footage starts
    await jumpTop(page);
    await ctl.ready();

    await ctl.click(page.getByTestId("kat-fab"), { steps: 28 });
    const log = page.getByRole("log", { name: /./ });
    await expect(log.getByText("Hi! I'm Kat.", { exact: false }).first()).toBeVisible();
    await ctl.until(3.6);
    const chip = page.getByTestId("kat-welcome-chips").locator("[data-chip]").filter({ hasText: "What should I ask my doctor?" });
    await ctl.click(chip, { steps: 26 });
    await expect(log.locator('[data-role="assistant"]').last()).toContainText("questions", { timeout: 30_000 });
    // Keep the reply's text (not just its action chips) in view, then drift down.
    const reply = log.locator('[data-role="assistant"]').last();
    // The panel smooth-scrolls to its end after each message; let that finish first.
    await page.waitForTimeout(1300);
    // Scroll only the panel's own scroller (scrollIntoView would also shift the sheet header).
    await reply.evaluate((el) => {
      let sc = el.parentElement;
      while (sc && !(sc.scrollHeight > sc.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      if (!sc) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 12;
      sc.scrollTo({ top, behavior: "smooth" });
    });
    await page.waitForTimeout(900);
    // Hover the first line of the reply (hovering the whole tall bubble would re-scroll it).
    const firstLine = reply.locator("p, li").first();
    const box = await firstLine.boundingBox();
    if (box) {
      await page.mouse.move(box.x + Math.min(box.width / 2, 160), box.y + box.height / 2, { steps: 30 });
      cursor = { x: box.x + Math.min(box.width / 2, 160), y: box.y + box.height / 2 };
    }
    await ctl.until(8.0);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 70);
      await page.waitForTimeout(220);
    }
  });
});

test("shot 7: check my understanding, wrong answer, clarification, retry", async ({ browser }) => {
  await recordShot(browser, 7, async (page, ctl) => {
    await page.goto(BASE + "/check");
    const step = page.getByTestId("teach-back-step");
    await expect(step).toBeVisible({ timeout: 30_000 });
    await expect(step.getByRole("radio", { name: "Once a day at bedtime on an empty stomach" })).toBeVisible();
    await jumpTop(page);
    await ctl.ready();

    await ctl.click(step.getByText("Once a day at bedtime on an empty stomach"), { steps: 26 });
    await ctl.until(2.0);
    await ctl.click(step.getByRole("button", { name: "Check my answer" }));
    const clar = step.getByTestId("clarification");
    await expect(clar).toBeVisible({ timeout: 30_000 });
    await expect(step).toContainText("Let me explain that another way.");
    await scrollTopTo(page, step.getByText("Your answer:", { exact: false }).first(), 150);
    await ctl.hover(clar, 30);
    await ctl.until(8.0);
    await ctl.click(step.getByRole("button", { name: "Try again" }));
    await page.waitForTimeout(300);
    await ctl.click(step.getByText("Twice a day with breakfast and dinner"), { steps: 24 });
    await ctl.until(10.2);
    await ctl.click(step.getByRole("button", { name: "Check my answer" }));
    await expect(step).not.toHaveAttribute("data-phase", "unanswered", { timeout: 30_000 });
    await scrollTopTo(page, step, 110);
  });
});

test("shot 8: action plan with barrier suggestion, then follow-up copy", async ({ browser }) => {
  await recordShot(browser, 8, async (page, ctl) => {
    await page.goto(BASE + "/action-plan");
    const build = page.getByRole("button", { name: "Build my action plan" });
    const firstCard = page.getByTestId("action-card").first();
    await expect(build.or(firstCard)).toBeVisible({ timeout: 30_000 });
    await jumpTop(page);
    await ctl.ready();

    if (await build.isVisible()) {
      await ctl.click(build, { steps: 26 });
    }
    const clinicianCards = page.getByTestId("action-card").filter({ hasText: "From your clinician" });
    await expect(clinicianCards.first()).toBeVisible({ timeout: 30_000 });
    await ctl.until(0.8);
    await ctl.scrollTo(clinicianCards.first(), "start");
    await ctl.hover(clinicianCards.first(), 20);
    await ctl.until(2.0);
    const barriers = page.getByTestId("barrier-suggestions");
    await scrollTopTo(page, barriers, 260);
    await ctl.hover(barriers.getByText(/telehealth/i).first(), 22);
    await ctl.until(4.6);
    // Client-side nav to Follow Up.
    await ctl.click(page.getByRole("link", { name: "Follow Up" }).first(), { steps: 20 });
    const copy = page.getByRole("button", { name: "Copy summary" });
    await expect(copy).toBeVisible({ timeout: 30_000 });
    await ctl.until(6.4);
    await ctl.click(copy, { steps: 20 });
  });
});

test("shot 9: evaluation dashboard", async ({ browser }) => {
  await recordShot(browser, 9, async (page, ctl) => {
    await page.goto(BASE + "/evaluation");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByTestId("eval-disclaimer")).toBeVisible({ timeout: 30_000 });
    await jumpTop(page);
    await ctl.ready();

    await ctl.hover(page.getByTestId("eval-disclaimer"), 26);
    await ctl.until(2.0);
    const safety = page.getByText(/^Safety/).first();
    await ctl.scrollTo(safety, "center");
    await ctl.hover(safety, 22);
    await ctl.until(4.8);
    // Individual results filtered to the Safety suite: per-case outcomes.
    const suiteFilter = page.getByLabel("Suite", { exact: true });
    // Not "start": the sticky header would cover the filter and take the click.
    await scrollTopTo(page, suiteFilter, 220);
    await ctl.click(suiteFilter, { steps: 20 });
    await suiteFilter.selectOption({ label: "Safety" });
    await expect(page.getByTestId("eval-case-row").first()).toContainText(/safety/i);
  });
});
