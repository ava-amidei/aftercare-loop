"use client";
/**
 * Ask Kat mount point (rendered once by AppShell): the floating button and the
 * panel. Hidden on the clinician-facing /care-team view and on /evaluation.
 */
import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useDemoStore, useHasHydrated } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { hasUserMessages, isKatHiddenOn } from "./kat-client";
import { KatFab } from "./KatFab";
import { KatPanel } from "./KatPanel";
import { openKat, useKatRuntime } from "./use-kat-chat";

export interface KatMountProps {
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

export function KatMount({ fetchImpl }: KatMountProps = {}) {
  const t = useT();
  const pathname = usePathname();
  const hydrated = useHasHydrated();
  const open = useDemoStore((s) => s.katOpen);
  const activePatientId = useDemoStore((s) => s.activePatientId);
  const openedOnce = useDemoStore((s) => !!s.katHasOpenedOnce[s.activePatientId]);
  const started = useDemoStore((s) => hasUserMessages(s.patients[s.activePatientId]?.chat ?? []));
  const reducedMotion = useDemoStore(
    (s) => s.patients[s.activePatientId]?.profile.accessibility.includes("reduced_motion") ?? false,
  );
  const minimized = useKatRuntime((s) => s.minimized);
  const pending = useKatRuntime((s) => !!s.pending[activePatientId]);
  const fabRef = useRef<HTMLButtonElement>(null);

  // Switching patients while the panel is open: greet the new patient on their first open.
  useEffect(() => {
    if (hydrated && open && !openedOnce) openKat();
  }, [hydrated, open, openedOnce, activePatientId]);

  // Return focus to the FAB when the panel closes (the FAB is unmounted while open).
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) fabRef.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  const close = useCallback(() => {
    useKatRuntime.getState().setMinimized(false);
    useDemoStore.getState().setKatOpen(false);
  }, []);
  const minimize = useCallback(() => {
    useKatRuntime.getState().setMinimized(true);
    useDemoStore.getState().setKatOpen(false);
  }, []);

  if (isKatHiddenOn(pathname)) return null;
  // Wait for persisted history so the first open never greets over an existing conversation.
  if (!hydrated) return null;

  const indicator = pending || (minimized && started);
  return (
    <>
      {!open && (
        <KatFab
          ref={fabRef}
          label={t("askKat.fabLabel")}
          ariaLabel={indicator ? `${t("askKat.open")} — ${t("askKat.conversationActive")}` : t("askKat.open")}
          indicator={indicator}
          reducedMotion={reducedMotion}
          onClick={openKat}
        />
      )}
      <KatPanel open={open} onClose={close} onMinimize={minimize} fetchImpl={fetchImpl} />
    </>
  );
}
