"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KatMount } from "@/components/ask-kat/KatMount";
import { AccessibilityPrefsSync } from "@/components/profile/use-accessibility-prefs";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { FontSizeControl } from "./FontSizeControl";
import { Logo } from "./Logo";
import { PRIMARY_NAV, SECONDARY_NAV, isNavActive, type NavItem } from "./nav-config";
import { shellStringsFor, type ShellStrings } from "./shell-strings";
import { LanguageToggleSlot, PatientSwitcherSlot, ResetDemoSlot } from "./slots";

export interface AppShellProps {
  children: ReactNode;
  /** Real patient switcher (client component). Fallback: static "Fictional demo patient" label. */
  patientSwitcher?: ReactNode;
  /** Real EN/ES toggle. Fallback: nothing. */
  languageToggle?: ReactNode;
  /** Real Reset Demo button. Fallback: nothing. */
  resetDemo?: ReactNode;
  /** Partial string overrides. Defaults come from the i18n dictionary for the current language. */
  strings?: Partial<ShellStrings>;
  /** Render <KatMount/> (default true). Tests may disable it. */
  withKat?: boolean;
}

const ShellContext = createContext(false);

/** True when rendered inside an AppShell. */
export function useInAppShell(): boolean {
  return useContext(ShellContext);
}

function NavLink({
  item,
  label,
  pathname,
  variant,
}: {
  item: NavItem;
  label: string;
  pathname: string | null;
  variant: "side" | "bottom";
}) {
  const active = isNavActive(pathname, item.href);
  // Outline icon normally, solid icon for the active (filled) state.
  const Icon = active ? item.ActiveIcon : item.Icon;
  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-0 text-xs font-semibold leading-tight tracking-tighter",
          "motion-safe:transition-transform motion-safe:active:scale-95",
          active ? "font-bold text-gray-100" : "text-gray-70 hover:text-gray-90",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
            active && "bg-primary text-primary-contrast",
          )}
        >
          <Icon aria-hidden="true" className="size-6" />
        </span>
        {/*
          Never truncate: at 375px a five-item bar leaves ~70px per label, so
          a long word ("Understand", "Seguimiento") or the larger_text pref
          would clip. Labels wrap at word boundaries instead (data-nav-label is a
          test hook).
        */}
        <span data-nav-label className="max-w-full text-center break-words">
          {label}
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-full px-4 text-base font-medium transition-colors",
        active ? "bg-primary text-primary-contrast font-semibold" : "text-gray-70 hover:bg-gray-10 hover:text-gray-90",
      )}
    >
      <Icon aria-hidden="true" className="size-6 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * App chrome: demo banner, top bar (logo + slots), desktop side nav, mobile
 * bottom nav, footer disclaimer, toasts, saved accessibility prefs sync and a
 * single <KatMount/>.
 *
 * Mounted once in src/app/layout.tsx. A nested <AppShell> (e.g. a page that
 * wraps itself) renders only its children, so the chrome never doubles.
 *
 * Bottom-right is reserved for the Ask Kat FAB: use the CSS vars
 * --kat-fab-bottom / --kat-fab-right from globals.css to position it.
 */
export function AppShell(props: AppShellProps) {
  const nested = useInAppShell();
  if (nested) return <>{props.children}</>;
  return <ShellFrame {...props} />;
}

function ShellFrame({ children, patientSwitcher, languageToggle, resetDemo, strings, withKat = true }: AppShellProps) {
  const pathname = usePathname();
  const t = useT();
  const lang = t.lang;
  const base = shellStringsFor(t);
  const s: ShellStrings = { ...base, ...strings, navLabels: { ...base.navLabels, ...strings?.navLabels } };
  const labelFor = (item: NavItem) => s.navLabels[item.key] ?? item.label;

  // <html lang> is static in the root layout; keep it in sync with the UI language.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <ShellContext.Provider value={true}>
      <ToastProvider>
        <div className="flex min-h-dvh flex-col bg-gray-5 pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
          {/*
            Applies the active patient's SAVED accessibility prefs to <html> on
            every route and patient switch. Kept before <main> so a page's own
            effects (e.g. ProfileEditor's live preview) run after it and win.
          */}
          <AccessibilityPrefsSync />
          <a
            href="#main-content"
            className="sr-only z-[70] rounded-full bg-gray-0 px-4 py-3 font-semibold text-primary-800 shadow-float focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
          >
            {s.skipToContent}
          </a>

          <DemoBanner text={s.demoBanner} />

          {/*
            Mobile: two compact rows (logo + EN/ES + icon-only Reset, then the
            full-width patient switcher) and NOT sticky, so it never eats the
            viewport while scrolling (the bottom nav stays fixed). md+: one
            sticky row.
          */}
          <header className="z-40 bg-gray-0/95 backdrop-blur supports-[backdrop-filter]:bg-gray-0/85 md:sticky md:top-0">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1.5 px-safe py-1.5 md:min-h-[var(--header-height)] md:flex-nowrap md:gap-x-3 md:py-2">
              <Logo name={s.appName} className="mr-auto" />
              <div
                data-slot="header-switcher"
                className="order-last flex w-full min-w-0 md:order-none md:w-auto md:justify-end [&>*]:w-full md:[&>*]:w-auto"
              >
                <PatientSwitcherSlot fallbackLabel={s.patientFallback}>{patientSwitcher}</PatientSwitcherSlot>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                <FontSizeControl />
                <LanguageToggleSlot>{languageToggle}</LanguageToggleSlot>
                <ResetDemoSlot>{resetDemo}</ResetDemoSlot>
              </div>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-7xl flex-1">
            <aside className="hidden w-64 shrink-0 md:block">
              <div className="sticky top-[var(--header-height)] flex flex-col gap-6 px-3 py-6">
                <nav aria-label={s.primaryNav}>
                  <ul className="flex flex-col gap-1">
                    {PRIMARY_NAV.map((item) => (
                      <li key={item.href}>
                        <NavLink item={item} label={labelFor(item)} pathname={pathname} variant="side" />
                      </li>
                    ))}
                  </ul>
                </nav>
                <nav aria-label={s.secondaryNav}>
                  <ul className="flex flex-col gap-1 border-t border-gray-10 pt-4">
                    {SECONDARY_NAV.map((item) => (
                      <li key={item.href}>
                        <NavLink item={item} label={labelFor(item)} pathname={pathname} variant="side" />
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>

            <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-safe py-6 focus:outline-none md:px-8 md:py-8">
              {children}
            </main>
          </div>

          {/* Extra bottom padding keeps the last line clear of the Ask Kat FAB. */}
          <footer className="rounded-t-3xl bg-gray-0 px-safe pt-5 pb-24 md:pb-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-gray-70">{s.footerDisclaimer}</p>
              <nav aria-label={s.footerNav} className="md:hidden">
                <ul className="flex flex-wrap gap-x-4">
                  {SECONDARY_NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
                        className="inline-flex min-h-11 items-center text-sm font-medium text-primary-800 underline-offset-4 hover:underline aria-[current=page]:underline"
                      >
                        {labelFor(item)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </footer>

          <nav
            aria-label={s.primaryNav}
            className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-gray-0/95 pb-safe backdrop-blur md:hidden"
          >
            <ul className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-stretch px-0.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href} className="flex min-w-0 flex-1">
                  <NavLink item={item} label={labelFor(item)} pathname={pathname} variant="bottom" />
                </li>
              ))}
            </ul>
          </nav>

          {withKat && <KatMount />}
        </div>
      </ToastProvider>
    </ShellContext.Provider>
  );
}
