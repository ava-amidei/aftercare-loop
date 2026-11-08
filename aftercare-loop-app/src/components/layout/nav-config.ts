import { BookOpenIcon, ChartBarIcon, ChatBubbleBottomCenterTextIcon, ClipboardDocumentCheckIcon, HomeIcon, ListBulletIcon, UserIcon, UsersIcon } from "@heroicons/react/24/outline";
import {
  BookOpenIcon as BookOpenSolidIcon,
  ChartBarIcon as ChartBarSolidIcon,
  ChatBubbleBottomCenterTextIcon as ChatBubbleBottomCenterTextSolidIcon,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolidIcon,
  HomeIcon as HomeSolidIcon,
  ListBulletIcon as ListBulletSolidIcon,
  UserIcon as UserSolidIcon,
  UsersIcon as UsersSolidIcon,
} from "@heroicons/react/24/solid";
import type { HeroIcon } from "@/components/ui/icon";

export interface NavItem {
  href: string;
  /** Key for i18n dictionaries (en.ts / es.ts). */
  key: string;
  /** English fallback label. */
  label: string;
  /** Heroicons 24/outline (navigation). */
  Icon: HeroIcon;
  /** Heroicons 24/solid twin, shown for the active (filled) state. */
  ActiveIcon: HeroIcon;
}

/** Primary journey: Understand → Ask → Verify → Act → Follow Up. Shown in the mobile bottom nav. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", key: "nav.home", label: "Home", Icon: HomeIcon, ActiveIcon: HomeSolidIcon },
  { href: "/understand", key: "nav.understand", label: "Understand", Icon: BookOpenIcon, ActiveIcon: BookOpenSolidIcon },
  { href: "/action-plan", key: "nav.plan", label: "Plan", Icon: ListBulletIcon, ActiveIcon: ListBulletSolidIcon },
  { href: "/check", key: "nav.check", label: "Check", Icon: ClipboardDocumentCheckIcon, ActiveIcon: ClipboardDocumentCheckSolidIcon },
  { href: "/follow-up", key: "nav.followUp", label: "Follow Up", Icon: ChatBubbleBottomCenterTextIcon, ActiveIcon: ChatBubbleBottomCenterTextSolidIcon },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/profile", key: "nav.profile", label: "My Health Profile", Icon: UserIcon, ActiveIcon: UserSolidIcon },
  { href: "/care-team", key: "nav.careTeam", label: "Care Team (simulated)", Icon: UsersIcon, ActiveIcon: UsersSolidIcon },
  { href: "/evaluation", key: "nav.evaluation", label: "Evaluation", Icon: ChartBarIcon, ActiveIcon: ChartBarSolidIcon },
];

/** "/" matches only itself; other items match their subtree. */
export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
