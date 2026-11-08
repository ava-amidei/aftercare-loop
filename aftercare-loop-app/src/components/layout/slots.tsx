import type { ReactNode } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";

/**
 * Header control slots. The dashboard/store agents plug real controls in via
 * AppShell props (`patientSwitcher`, `languageToggle`, `resetDemo`); these
 * components render the provided node or a sensible fallback.
 */

export function PatientSwitcherSlot({
  children,
  fallbackLabel = "Fictional demo patient",
}: {
  children?: ReactNode;
  /** Translated fallback label (AppShell passes it from the i18n dictionary). */
  fallbackLabel?: string;
}) {
  if (children) return <>{children}</>;
  // Fallback: a static, non-interactive label (no fake controls).
  return (
    <span
      data-slot="patient-switcher"
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-gray-70"
    >
      <UserCircleIcon aria-hidden="true" className="size-4" />
      {fallbackLabel}
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
