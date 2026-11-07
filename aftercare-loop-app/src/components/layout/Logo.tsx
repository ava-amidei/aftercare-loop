import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Wordmark + loop glyph. Purely decorative glyph; the link text is the accessible name. */
export function Logo({ name = "Aftercare Loop", className }: { name?: string; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-control pr-1 text-brand-900", className)}
    >
      <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 shrink-0">
        <rect width="32" height="32" rx="9" className="fill-brand-700" />
        <path
          d="M10.5 16a4.5 4.5 0 0 1 7.7-3.2L21.5 16l-3.3 3.2A4.5 4.5 0 1 1 10.5 16Z"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="10" r="2.2" className="fill-accent-400" />
      </svg>
      <span className="text-lg font-bold tracking-tight whitespace-nowrap">{name}</span>
    </Link>
  );
}
