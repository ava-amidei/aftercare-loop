import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { patients as fixturePatients } from "@/data/patients";
import { ToastProvider } from "@/components/ui/Toast";
import { getTranslator } from "@/lib/i18n";
import { buildInitialStore } from "@/lib/store/initial-state";
import { useDemoStore } from "@/lib/store/demo-store";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LanguageToggle } from "./LanguageToggle";
import { PatientSwitcher } from "./PatientSwitcher";
import { ResetDemoButton } from "./ResetDemoButton";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function Harness() {
  return (
    <ToastProvider>
      <PatientSwitcher />
      <LanguageToggle />
      <ResetDemoButton />
      <Dashboard />
    </ToastProvider>
  );
}

beforeAll(async () => {
  await useDemoStore.persist.rehydrate();
});

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  act(() => useDemoStore.getState().resetDemo());
});

describe("PatientSwitcher", () => {
  it("lists every fictional fixture patient with name and scenario", async () => {
    render(<Harness />);
    const select = await screen.findByRole("combobox", { name: "Fictional patient" });
    await waitFor(() => expect(select).toBeEnabled());
    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(fixturePatients.length);
    expect(fixturePatients.length).toBe(12);
    fixturePatients.forEach((p, i) => {
      expect(options[i]).toHaveValue(p.id);
      expect(options[i]).toHaveTextContent(p.displayName);
      expect(options[i]).toHaveTextContent(p.scenarioSummary);
    });
  });

  it("switching isolates state: another patient's chat and progress never show", async () => {
    const user = userEvent.setup();
    const [a, b] = fixturePatients;
    act(() => {
      const s = useDemoStore.getState();
      s.switchPatient(a.id);
      s.appendChat(a.id, { id: "c1", role: "user", content: "Private question from A", createdAt: "2026-11-07T00:00:00Z" });
    });
    render(<Harness />);
    expect(await screen.findByText("Private question from A")).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: "Fictional patient" });
    await waitFor(() => expect(select).toBeEnabled());
    await user.selectOptions(select, b.id);

    const st = useDemoStore.getState();
    expect(st.activePatientId).toBe(b.id);
    expect(st.patients[b.id].chat).toEqual([]);
    expect(st.patients[a.id].chat).toHaveLength(1); // A's data is preserved, just not shown
    expect(screen.queryByText("Private question from A")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(b.displayName);
    // Switch is announced (toast) in the newly selected patient's language.
    const announce = getTranslator(b.language)("common.patientSwitcher.switchedTo", { name: b.displayName });
    expect(await screen.findByText(announce)).toBeInTheDocument();
  });
});

describe("LanguageToggle", () => {
  it("updates the active patient's profile.language and the UI", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = await screen.findByRole("group", { name: "Interface language" });
    const es = within(group).getByRole("button", { name: "Español" });
    await waitFor(() => expect(es).toBeEnabled());
    expect(within(group).getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    await user.click(es);
    const st = useDemoStore.getState();
    expect(st.patients[st.activePatientId].profile.language).toBe("es");
    expect(screen.getByText("Mi panel de salud")).toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "Idioma de la interfaz" })).getByRole("button", { name: "Español" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("ResetDemoButton", () => {
  it("cancel keeps state; confirm restores fixtures for all patients and shows a toast", async () => {
    const user = userEvent.setup();
    const [a, b] = fixturePatients;
    act(() => {
      const s = useDemoStore.getState();
      s.appendChat(a.id, { id: "c1", role: "user", content: "hello", createdAt: "2026-11-07T00:00:00Z" });
      s.addSavedQuestion(b.id, "Saved for B");
      s.updateProfile(a.id, { language: "es", displayName: "Edited name" });
      s.switchPatient(b.id);
      s.setKatOpen(true);
    });
    render(<Harness />);

    const open = async () => {
      // Label is the Spanish or English "Reset Demo" depending on the active patient.
      await user.click(await screen.findByRole("button", { name: /Reset Demo|Reiniciar demostración/ }));
      return screen.getByRole("dialog");
    };

    let dialog = await open();
    await user.click(within(dialog).getByRole("button", { name: /Cancel|Cancelar/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useDemoStore.getState().patients[a.id].chat).toHaveLength(1);

    dialog = await open();
    await user.click(within(dialog).getByRole("button", { name: /Reset demo|Reiniciar$/ }));

    const st = useDemoStore.getState();
    const fresh = buildInitialStore();
    expect(st.activePatientId).toBe(fresh.activePatientId);
    expect(st.katOpen).toBe(false);
    expect(st.patients).toEqual(fresh.patients);
    expect(st.patients[a.id].profile.displayName).toBe(a.displayName);
    expect(await screen.findByText("The demo has been reset.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
