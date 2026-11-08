"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { ArrowUturnLeftIcon } from "@heroicons/react/20/solid";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonVariants } from "@/components/ui/Button";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    // Log only identifiers — never document text or prompts (ARCHITECTURE §2.10).
    const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
    const name = error instanceof Error ? error.name : typeof error;
    console.error("[aftercare-loop] route error", { name, digest });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-6">
      <h1 className="text-2xl font-bold text-gray-90">Something went wrong</h1>
      <Alert
        variant="danger"
        title="This page couldn't load."
        action={
          <>
            <Button leftIcon={<ArrowUturnLeftIcon aria-hidden="true" className="size-5" />} onClick={() => retry()}>
              Try again
            </Button>
            <Link href="/" className={buttonVariants({ variant: "secondary" })}>
              Go to Home
            </Link>
          </>
        }
      >
        Your demo data is still saved in this browser. You can try again or return home.
      </Alert>
    </div>
  );
}
