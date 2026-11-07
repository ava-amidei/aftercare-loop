import { expect, test, type Page } from "@playwright/test";

/**
 * Primary demo journey (SPEC §12.12/§12.13) for fictional patient pt-a-pcos:
 * Understand → Ask Kat → Check → Action Plan → Follow Up → Evaluation.
 * Runs on the "desktop" and "mobile" Playwright projects.
 */

const PATIENT_ID = "pt-a-pcos";

async function selectPatient(page: Page) {
  const select = page.getByTestId("patient-switcher").locator("select");
  await expect(select).toBeEnabled();
  await select.selectOption(PATIENT_ID);
  await expect(select).toHaveValue(PATIENT_ID);
}

test("primary journey: understand → ask kat → check → plan → follow up → evaluation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Demonstration using fictional patient data.").first()).toBeVisible();
  await selectPatient(page);

  // Understand: load the sample summary and explain it.
  await page.goto("/understand");
  await page.getByRole("button", { name: "Load my sample summary" }).click();
  await page.getByRole("button", { name: "Explain this to me" }).click();
  const result = page.getByTestId("interpretation-result");
  await expect(result).toBeVisible({ timeout: 30_000 });
  for (const id of ["card-what-this-means", "card-what-to-know", "card-discuss", "card-next-steps", "card-sources"]) {
    await expect(result.getByTestId(id)).toBeVisible();
  }
  expect(await result.getByTestId("verified-instruction").count()).toBeGreaterThanOrEqual(3);

  // Ask Kat: welcome text, five chips, and a real reply to a quick prompt.
  await page.getByTestId("kat-fab").click();
  const log = page.getByRole("log", { name: /./ });
  await expect(log.getByText("Hi! I'm Kat.", { exact: false }).first()).toBeVisible();
  await expect(log.getByText("What's on your mind today?").first()).toBeVisible();
  const chips = page.getByTestId("kat-welcome-chips").locator("[data-chip]");
  await expect(chips).toHaveCount(5);
  const assistantBefore = await log.locator('[data-role="assistant"]').count();
  await chips.filter({ hasText: "What should I ask my doctor?" }).click();
  await expect(log.locator('[data-role="user"]').first()).toContainText("What should I ask my doctor?");
  await expect(log.locator('[data-role="assistant"]')).toHaveCount(assistantBefore + 1, { timeout: 30_000 });
  await expect(log.locator('[data-role="assistant"]').last()).not.toBeEmpty();
  await page.keyboard.press("Escape");

  // Check: answer one teach-back question.
  await page.goto("/check");
  const step = page.getByTestId("teach-back-step");
  await expect(step).toBeVisible({ timeout: 30_000 });
  const radios = step.getByRole("radio");
  if ((await radios.count()) > 0) {
    await radios.first().check();
  } else {
    await step.getByRole("textbox").fill("I am not sure");
  }
  await step.getByRole("button", { name: "Check my answer" }).click();
  await expect(step).not.toHaveAttribute("data-phase", "unanswered", { timeout: 30_000 });

  // Action plan: clinician-documented items with View source.
  await page.goto("/action-plan");
  const build = page.getByRole("button", { name: "Build my action plan" });
  const firstCard = page.getByTestId("action-card").first();
  await expect(build.or(firstCard)).toBeVisible({ timeout: 30_000 });
  if (await build.isVisible()) await build.click();
  const clinicianCards = page
    .getByTestId("action-card")
    .filter({ hasText: "From your clinician" })
    .filter({ has: page.getByRole("button", { name: "View source" }) });
  await expect(clinicianCards.first()).toBeVisible({ timeout: 30_000 });
  expect(await clinicianCards.count()).toBeGreaterThanOrEqual(3);
  await clinicianCards.first().getByRole("button", { name: "View source" }).click();
  await expect(page.getByTestId("source-viewer-highlight")).toBeVisible();
  await page.keyboard.press("Escape");

  // Follow up: editable summary with Copy summary.
  await page.goto("/follow-up");
  await expect(page.getByRole("button", { name: "Copy summary" })).toBeVisible({ timeout: 30_000 });

  // Evaluation renders.
  await page.goto("/evaluation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/\bcoming\b/i)).toHaveCount(0);
});
