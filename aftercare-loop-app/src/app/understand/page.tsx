import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function UnderstandPage() {
  return (
    <>
      <PageHeader title="Understand My Health" />
      <EmptyState
        icon={<BookOpen aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="Paste a visit summary or ask about a term to get a plain-language explanation."
      />
    </>
  );
}
