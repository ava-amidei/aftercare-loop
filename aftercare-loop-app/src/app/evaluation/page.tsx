import { ChartColumn } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function EvaluationPage() {
  return (
    <>
      <PageHeader title="Evaluation" />
      <EmptyState
        icon={<ChartColumn aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="Results from synthetic test runs will appear here."
      />
    </>
  );
}
