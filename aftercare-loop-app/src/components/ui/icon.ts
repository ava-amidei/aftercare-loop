import type { HomeIcon } from "@heroicons/react/24/outline";

/**
 * Component type shared by every Heroicons icon (outline, solid and mini sets
 * all have the same signature). Use for icon maps / props instead of a
 * library-specific type.
 */
export type HeroIcon = typeof HomeIcon;
