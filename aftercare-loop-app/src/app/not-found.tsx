import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      headingLevel="h1"
      icon={<Compass aria-hidden="true" className="size-7" />}
      title="Page not found"
      description="We couldn't find that page. It may have moved."
      action={
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Go to Home
        </Link>
      }
    />
  );
}
