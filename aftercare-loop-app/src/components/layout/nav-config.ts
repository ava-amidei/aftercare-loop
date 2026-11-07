import {
  BookOpen,
  ChartColumn,
  ClipboardCheck,
  House,
  ListChecks,
  MessageSquareText,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  /** Key for i18n dictionaries (en.ts / es.ts). */
  key: string;
  /** English fallback label. */
  label: string;
  Icon: LucideIcon;
}

/** Primary journey: Understand → Ask → Verify → Act → Follow Up. Shown in the mobile bottom nav. */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/", key: "nav.home", label: "Home", Icon: House },
  { href: "/understand", key: "nav.understand", label: "Understand", Icon: BookOpen },
  { href: "/action-plan", key: "nav.plan", label: "Plan", Icon: ListChecks },
  { href: "/check", key: "nav.check", label: "Check", Icon: ClipboardCheck },
  { href: "/follow-up", key: "nav.followUp", label: "Follow Up", Icon: MessageSquareText },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/profile", key: "nav.profile", label: "My Health Profile", Icon: User },
  { href: "/care-team", key: "nav.careTeam", label: "Care Team (simulated)", Icon: Users },
  { href: "/evaluation", key: "nav.evaluation", label: "Evaluation", Icon: ChartColumn },
];

/** "/" matches only itself; other items match their subtree. */
export function isNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
