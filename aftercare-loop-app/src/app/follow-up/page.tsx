import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Placeholder — replaced by the owning feature agent.
export default function FollowUpPage() {
  return (
    <>
      <PageHeader title="Follow Up" />
      <EmptyState
        icon={<MessageSquareText aria-hidden="true" className="size-7" />}
        title="Coming soon"
        description="A summary you can share with your care team will appear here."
      />
    </>
  );
}
