import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/** Path of the brand mark (docs/DESIGN.md). */
export const LOGO_SRC = "/brand/logo.svg";

/** The brand mark alone. Decorative by default (alt=""): pair it with visible text. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      unoptimized
      priority
      className={cn("shrink-0 select-none", className)}
    />
  );
}

/** Brand mark + wordmark. The link text is the accessible name. */
export function Logo({ name = "Aftercare Loop", className }: { name?: string; className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-full pr-1 text-gray-100", className)}
    >
      <LogoMark className="size-8" />
      <span className="text-lg font-bold tracking-tight whitespace-nowrap">{name}</span>
    </Link>
  );
}
