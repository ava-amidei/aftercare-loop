"use client";
/**
 * Hydration-safe access to the persisted demo store.
 *
 * The store is created with `skipHydration`, so server HTML and the first
 * client render both use fixture state. `useHasHydrated()` triggers a single
 * `rehydrate()` after mount and returns true once localStorage has been read.
 * Render skeletons/placeholders for persisted-only data until it is true.
 */
import { useEffect, useSyncExternalStore } from "react";
import { useDemoStore } from "./demo-store";

let rehydrateStarted = false;

/** Idempotent: starts rehydration from localStorage at most once per page load. */
export function ensureDemoStoreHydrated(): void {
  if (rehydrateStarted || typeof window === "undefined") return;
  rehydrateStarted = true;
  void useDemoStore.persist.rehydrate();
}

const subscribe = (cb: () => void) => useDemoStore.persist.onFinishHydration(cb);
const getSnapshot = () => useDemoStore.persist.hasHydrated();
const getServerSnapshot = () => false;

export function useHasHydrated(): boolean {
  useEffect(() => {
    ensureDemoStoreHydrated();
  }, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
