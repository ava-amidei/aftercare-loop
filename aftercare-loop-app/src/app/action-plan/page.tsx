import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function ActionPlanPage() {
  return (
    <>
      <PageHeader title="My Action Plan" />
      <EmptyState
        icon={<ListChecks aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="Your care plan, wellness goals and questions for your provider will appear here."
      />
    </>
  );
}
