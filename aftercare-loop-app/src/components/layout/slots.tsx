import type { ReactNode } from "react";
import { UserRound } from "lucide-react";

/**
 * Header control slots. The dashboard/store agents plug real controls in via
 * AppShell props (`patientSwitcher`, `languageToggle`, `resetDemo`); these
 * components render the provided node or a sensible fallback.
 */

export function PatientSwitcherSlot({ children }: { children?: ReactNode }) {
  if (children) return <>{children}</>;
  // Fallback: a static, non-interactive label (no fake controls).
  return (
    <span
      data-slot="patient-switcher"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-medium text-ink-muted"
    >
      <UserRound aria-hidden="true" className="size-4" />
      Fictional demo patient
    </span>
  );
}

export function LanguageToggleSlot({ children }: { children?: ReactNode }) {
  // Fallback: nothing — a language control that does nothing would mislead.
  return children ? <>{children}</> : null;
}

export function ResetDemoSlot({ children }: { children?: ReactNode }) {
  return children ? <>{children}</> : null;
}
