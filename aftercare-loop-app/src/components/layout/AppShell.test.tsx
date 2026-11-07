import { describe, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import { ensureDemoStoreHydrated, useDemoStore } from "@/lib/store";
import { AppShell } from "./AppShell";
import { isNavActive } from "./nav-config";

const pathname = vi.hoisted(() => ({ current: "/understand" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

describe("isNavActive", () => {
  it("matches home only exactly and others by subtree", () => {
    expect(isNavActive("/", "/")).toBe(true);
    expect(isNavActive("/understand", "/")).toBe(false);
    expect(isNavActive("/understand/", "/understand")).toBe(true);
    expect(isNavActive("/action-plan/x", "/action-plan")).toBe(true);
    expect(isNavActive("/checkup", "/check")).toBe(false);
    expect(isNavActive(null, "/")).toBe(false);
  });
});

describe("AppShell", () => {
  it("renders banner, logo, nav, footer disclaimer and content", () => {
    render(
      <AppShell withKat={false}>
        <p>Page body</p>
      </AppShell>,
    );
    expect(screen.getByText("Demonstration using fictional patient data.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Aftercare Loop" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Educational information, not medical advice. Fictional data.")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveTextContent("Page body");
    const navs = screen.getAllByRole("navigation", { name: "Main" });
    expect(navs).toHaveLength(2); // desktop side nav + mobile bottom nav
    for (const nav of navs) {
      for (const label of ["Home", "Understand", "Plan", "Check", "Follow Up"]) {
        expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
      }
      expect(within(nav).getByRole("link", { name: "Understand" })).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    }
  });

  it("renders provided header slots and the fallback otherwise", () => {
    const { unmount } = render(
      <AppShell withKat={false}>
        <p>x</p>
      </AppShell>,
    );
    expect(screen.getByText("Fictional demo patient")).toBeInTheDocument();
    unmount();
    render(
      <AppShell
        withKat={false}
        patientSwitcher={<button>Switch patient</button>}
        languageToggle={<button>ES</button>}
        resetDemo={<button>Reset Demo</button>}
      >
        <p>x</p>
      </AppShell>,
    );
    expect(screen.getByRole("button", { name: "Switch patient" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ES" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset Demo" })).toBeInTheDocument();
    expect(screen.queryByText("Fictional demo patient")).not.toBeInTheDocument();
  });

  it("applies the active patient's saved accessibility prefs on any route", async () => {
    ensureDemoStoreHydrated();
    await useDemoStore.persist.rehydrate();
    const store = useDemoStore.getState;
    act(() => store().resetDemo());
    const withLarge = Object.values(store().patients).find((p) => p.profile.accessibility.includes("larger_text"));
    expect(withLarge).toBeDefined();
    act(() => store().switchPatient(withLarge!.profile.id));
    render(
      <AppShell withKat={false}>
        <p>x</p>
      </AppShell>,
    );
    expect(document.documentElement).toHaveAttribute("data-text-size", "large");
    act(() => store().resetDemo());
    document.documentElement.removeAttribute("data-text-size");
  });

  it("does not double the chrome when nested", () => {
    render(
      <AppShell withKat={false}>
        <AppShell withKat={false}>
          <p>Inner</p>
        </AppShell>
      </AppShell>,
    );
    expect(screen.getAllByTestId("demo-banner")).toHaveLength(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});

describe("AppShell i18n", () => {
  const setLanguage = (language: "en" | "es") =>
    act(() => {
      const { activePatientId, updateProfile } = useDemoStore.getState();
      updateProfile(activePatientId, { language });
    });

  it("translates the chrome and syncs <html lang> with the UI language", () => {
    setLanguage("es");
    try {
      render(
        <AppShell withKat={false}>
          <p>x</p>
        </AppShell>,
      );
      expect(screen.getByText("Demostración con datos de pacientes ficticios.")).toBeInTheDocument();
      expect(screen.getByText("Información educativa, no es consejo médico. Datos ficticios.")).toBeInTheDocument();
      expect(screen.getByText("Ir al contenido principal")).toBeInTheDocument();
      expect(screen.getByText("Paciente de demostración (datos ficticios)")).toBeInTheDocument();
      const navs = screen.getAllByRole("navigation", { name: "Principal" });
      expect(navs).toHaveLength(2);
      for (const nav of navs) {
        for (const label of ["Inicio", "Entender", "Plan", "Repasar", "Seguimiento"]) {
          expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument();
        }
      }
      expect(screen.getAllByRole("link", { name: "Mi perfil de salud" }).length).toBeGreaterThan(0);
      expect(screen.queryByText("Home")).not.toBeInTheDocument();
      expect(document.documentElement.lang).toBe("es");
      setLanguage("en");
      expect(document.documentElement.lang).toBe("en");
      expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(2);
    } finally {
      setLanguage("en");
    }
  });

  it("still honors explicit string overrides", () => {
    render(
      <AppShell withKat={false} strings={{ demoBanner: "Custom banner", navLabels: { "nav.home": "Start" } }}>
        <p>x</p>
      </AppShell>,
    );
    expect(screen.getByText("Custom banner")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Start" })).toHaveLength(2);
  });
});
