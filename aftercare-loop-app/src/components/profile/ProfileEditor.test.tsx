import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ToastProvider } from "@/components/ui";
import { patients } from "@/data/patients";
import { useDemoStore } from "@/lib/store";
import { ProfileEditor } from "./ProfileEditor";

function renderEditor() {
  return render(
    <ToastProvider>
      <ProfileEditor />
    </ToastProvider>,
  );
}

const store = () => useDemoStore.getState();
/** Elements outside the Appearance card (its swatches/text-size radios apply immediately, not on Save). */
const outsideAppearance = <T extends Element>(els: T[]) => els.filter((el) => !el.closest('[data-testid="appearance-section"]'));
const activeProfile = () => store().patients[store().activePatientId]!.profile;

async function ready() {
  await screen.findByRole("form", { name: "Edit health profile" });
}

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  act(() => store().resetDemo());
});

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-text-size");
  document.documentElement.removeAttribute("data-contrast");
  document.documentElement.removeAttribute("data-motion");
});

describe("ProfileEditor", () => {
  it("renders the same editor for all 12 fixture patients", async () => {
    expect(patients).toHaveLength(12);
    for (const p of patients) {
      act(() => store().switchPatient(p.id));
      const { unmount } = renderEditor();
      await screen.findByRole("form");
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      // Same four sections for every patient, plus Appearance right after "How I like information".
      // (About me, How I like information, Appearance, My health, Getting care — in the patient's language.)
      const h2 = screen.getAllByRole("heading", { level: 2 });
      expect(h2).toHaveLength(5);
      expect(h2[2]).toBe(within(screen.getByTestId("appearance-section")).getByRole("heading", { level: 2 }));
      // All five barriers + four accessibility prefs, regardless of patient.
      expect(screen.getAllByRole("checkbox")).toHaveLength(9);
      expect(outsideAppearance(screen.getAllByRole("radio"))).toHaveLength(3);
      for (const c of p.conditions) {
        expect(screen.getByRole("button", { name: c, pressed: true })).toBeInTheDocument();
      }
      // Pregnancy/postpartum textarea only when the record already has it.
      const preg = screen.getByTestId("pregnancy-context");
      expect(within(preg).queryByRole("textbox") !== null).toBe(Boolean(p.pregnancyOrPostpartumContext));
      unmount();
    }
  });

  it("component sources never branch on a fixture condition name", () => {
    const dir = path.resolve(__dirname);
    const sources = readdirSync(dir)
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(".test."))
      .map((f) => readFileSync(path.join(dir, f), "utf8").toLowerCase())
      .join("\n");
    for (const p of patients) {
      for (const c of p.conditions) expect(sources).not.toContain(c.toLowerCase());
      expect(sources).not.toContain(p.id);
    }
  });

  it("adds a free-text condition and saves via updateProfile with a toast", async () => {
    const user = userEvent.setup();
    renderEditor();
    await ready();
    expect(screen.getByTestId("profile-dirty-status")).toHaveTextContent("All changes saved.");
    await user.type(screen.getByLabelText("Add your own condition or concern"), "Ongoing back pain{Enter}");
    expect(screen.getByRole("button", { name: "Ongoing back pain", pressed: true })).toBeInTheDocument();
    expect(screen.getAllByText("You have unsaved changes.").length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole("button", { name: "Save changes" })[0]!);
    expect(activeProfile().conditions).toContain("Ongoing back pain");
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();
    expect(screen.getByTestId("profile-dirty-status")).toHaveTextContent("All changes saved.");
  });

  it("discard changes restores the saved profile", async () => {
    const user = userEvent.setup();
    renderEditor();
    await ready();
    const name = screen.getByLabelText("Name (fictional)");
    await user.clear(name);
    await user.type(name, "Someone Else");
    await user.click(screen.getByRole("radio", { name: "Detailed" }));
    await user.click(screen.getAllByRole("button", { name: "Discard changes" })[0]!);
    expect(screen.getByLabelText("Name (fictional)")).toHaveValue(activeProfile().displayName);
    const savedLevel = activeProfile().explanationLevel;
    expect(outsideAppearance(screen.getAllByRole("radio", { checked: true }))[0]).toHaveAttribute("value", savedLevel);
    expect(screen.getByTestId("profile-dirty-status")).toHaveTextContent("All changes saved.");
  });

  it("pregnancy context appears only after the explicit opt-in button", async () => {
    const user = userEvent.setup();
    const without = patients.find((p) => !p.pregnancyOrPostpartumContext)!;
    act(() => store().switchPatient(without.id));
    renderEditor();
    await ready();
    const preg = screen.getByTestId("pregnancy-context");
    expect(within(preg).queryByRole("textbox")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Add pregnancy or postpartum context" }));
    const box = within(preg).getByRole("textbox", { name: /Pregnancy or postpartum context/ });
    expect(box).toHaveValue("");
    await user.type(box, "Context I chose to share");
    expect(within(preg).getByText("Entered by you")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Save changes" })[0]!);
    expect(store().patients[without.id]!.profile.pregnancyOrPostpartumContext).toBe("Context I chose to share");
  });

  it("medication editor labels origin, shows the dose note, and edits", async () => {
    const user = userEvent.setup();
    const withMeds = patients.find((p) => p.medications.length > 0)!;
    act(() => store().switchPatient(withMeds.id));
    renderEditor();
    await ready();
    expect(screen.getByText(/does not change your medical instructions/)).toBeInTheDocument();
    const firstMed = screen.getByRole("region", { name: new RegExp(`^Medication 1: `) });
    expect(within(firstMed).getByText("From your clinician")).toBeInTheDocument();
    const dose = within(firstMed).getByLabelText("Dose (Medication 1)");
    await user.clear(dose);
    await user.type(dose, "changed");
    expect(within(firstMed).getByText("Entered by you")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add a medication" }));
    expect(screen.getByRole("region", { name: /New medication/ })).toBeInTheDocument();
  });

  it("applies accessibility prefs live and restores saved prefs on discard", async () => {
    const user = userEvent.setup();
    const plain = patients.find((p) => p.accessibility.length === 0)!;
    act(() => store().switchPatient(plain.id));
    renderEditor();
    await ready();
    const html = document.documentElement;
    expect(html.hasAttribute("data-text-size")).toBe(false);
    await user.click(screen.getByRole("checkbox", { name: "Larger text" }));
    await user.click(screen.getByRole("checkbox", { name: "High contrast" }));
    await user.click(screen.getByRole("checkbox", { name: "Reduced motion" }));
    await waitFor(() => expect(html.getAttribute("data-text-size")).toBe("large"));
    expect(html.getAttribute("data-contrast")).toBe("high");
    expect(html.getAttribute("data-motion")).toBe("reduce");
    expect(html.classList.contains("a11y-larger-text")).toBe(true);
    await user.click(screen.getAllByRole("button", { name: "Discard changes" })[0]!);
    await waitFor(() => expect(html.hasAttribute("data-text-size")).toBe(false));
  });

  it("goals and care instructions are labeled and editable", async () => {
    const user = userEvent.setup();
    renderEditor();
    await ready();
    const goals = screen.getByRole("group", { name: "My health goals" });
    const before = within(goals).queryAllByText("Chosen by you").length;
    await user.type(within(goals).getByLabelText("Add a health goal"), "Walk more{Enter}");
    expect(within(goals).getAllByText("Chosen by you")).toHaveLength(before + 1);
    const care = screen.getByRole("group", { name: "Care instructions from my clinician" });
    await user.type(within(care).getByLabelText("Add a care instruction"), "My own note{Enter}");
    expect(within(care).getAllByText("Entered by you").length).toBeGreaterThan(0);
  });

  it("renders in Spanish for a Spanish-preferring fixture", async () => {
    const es = patients.find((p) => p.language === "es")!;
    act(() => store().switchPatient(es.id));
    renderEditor();
    await screen.findByRole("form", { name: "Editar perfil de salud" });
    expect(screen.getByRole("heading", { level: 1, name: "Mi perfil de salud" })).toBeInTheDocument();
  });
});
