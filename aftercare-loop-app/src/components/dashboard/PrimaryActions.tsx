"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpen, CalendarCheck, ChevronRight, ListChecks, MessageCircleHeart } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const cardClass =
  "group flex min-h-24 w-full items-start gap-3 rounded-card border border-border bg-surface p-4 text-left " +
  "shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-shadow hover:border-brand-300 hover:shadow-md " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

function CardBody({ icon, title, desc, accent }: { icon: ReactNode; title: string; desc: string; accent?: boolean }) {
  return (
    <>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-control",
          accent ? "bg-accent-50 text-accent-700" : "bg-brand-50 text-brand-700",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold text-ink">{title}</span>
        <span className="text-sm text-ink-muted">{desc}</span>
      </span>
      <ChevronRight aria-hidden="true" className="mt-3 size-5 shrink-0 text-ink-subtle group-hover:text-brand-700" />
    </>
  );
}

interface LinkAction {
  href: string;
  title: TranslationKey;
  desc: TranslationKey;
  icon: ReactNode;
}

const LINKS: { before: LinkAction[]; after: LinkAction[] } = {
  before: [
    {
      href: "/understand",
      title: "dashboard.action.understand",
      desc: "dashboard.action.understandDesc",
      icon: <BookOpen aria-hidden="true" className="size-5" />,
    },
  ],
  after: [
    {
      href: "/action-plan",
      title: "dashboard.action.actionPlan",
      desc: "dashboard.action.actionPlanDesc",
      icon: <ListChecks aria-hidden="true" className="size-5" />,
    },
    {
      href: "/follow-up",
      title: "dashboard.action.prepare",
      desc: "dashboard.action.prepareDesc",
      icon: <CalendarCheck aria-hidden="true" className="size-5" />,
    },
  ],
};

/** The four primary actions from SPEC §3A, in journey order. */
export function PrimaryActions({ onAskKat }: { onAskKat: () => void }) {
  const t = useT();
  const renderLink = (a: LinkAction) => (
    <li key={a.href}>
      <Link href={a.href} className={cardClass}>
        <CardBody icon={a.icon} title={t(a.title)} desc={t(a.desc)} />
      </Link>
    </li>
  );
  return (
    <section aria-labelledby="dashboard-actions-heading">
      <h2 id="dashboard-actions-heading" className="mb-3 text-lg font-semibold text-ink">
        {t("dashboard.actions.title")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.before.map(renderLink)}
        <li>
          <button type="button" className={cardClass} onClick={onAskKat} aria-haspopup="dialog">
            <CardBody
              accent
              icon={<MessageCircleHeart aria-hidden="true" className="size-5" />}
              title={t("dashboard.action.askKat")}
              desc={t("dashboard.action.askKatDesc")}
            />
          </button>
        </li>
        {LINKS.after.map(renderLink)}
      </ul>
    </section>
  );
}
