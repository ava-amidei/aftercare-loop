"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BookOpenIcon, CalendarDaysIcon, ChevronRightIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/20/solid";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const cardClass =
  "group flex min-h-24 w-full items-start gap-3 rounded-3xl bg-gray-0 p-4 text-left " +
  "transition-[background-color,transform] hover:bg-primary-50 motion-safe:active:scale-[0.99] " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700";

function CardBody({ icon, title, desc, accent }: { icon: ReactNode; title: string; desc: string; accent?: boolean }) {
  return (
    <>
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
          accent ? "bg-accent-100 text-accent-800" : "bg-primary-100 text-primary-900",
        )}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-semibold text-gray-90">{title}</span>
        <span className="text-sm text-gray-70">{desc}</span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="mt-3 size-5 shrink-0 text-gray-60 group-hover:text-primary-800" />
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
      icon: <BookOpenIcon aria-hidden="true" className="size-5" />,
    },
  ],
  after: [
    {
      href: "/action-plan",
      title: "dashboard.action.actionPlan",
      desc: "dashboard.action.actionPlanDesc",
      icon: <ListBulletIcon aria-hidden="true" className="size-5" />,
    },
    {
      href: "/follow-up",
      title: "dashboard.action.prepare",
      desc: "dashboard.action.prepareDesc",
      icon: <CalendarDaysIcon aria-hidden="true" className="size-5" />,
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
      <h2 id="dashboard-actions-heading" className="mb-3 text-lg font-semibold text-gray-90">
        {t("dashboard.actions.title")}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {LINKS.before.map(renderLink)}
        <li>
          <button type="button" className={cardClass} onClick={onAskKat} aria-haspopup="dialog">
            <CardBody
              accent
              icon={<ChatBubbleOvalLeftEllipsisIcon aria-hidden="true" className="size-5" />}
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
