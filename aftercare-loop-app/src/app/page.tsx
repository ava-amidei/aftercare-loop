import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

// Temporary placeholder — replaced by the dashboard agent. The AppShell chrome
// comes from src/app/layout.tsx (a nested <AppShell> would render children only).
export default function HomePage() {
  return (
    <>
      <PageHeader title="My Health Dashboard" />
      <EmptyState
        icon={<LayoutDashboard aria-hidden="true" className="size-7" />}
        title="Dashboard coming"
        description="Your personalized overview will appear here."
      />
    </>
  );
}
