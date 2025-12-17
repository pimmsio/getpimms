import { PageContent } from "@/ui/layout/page-content";
import TodayClient from "./today-client";

export default function TodayPage() {
  return (
    <PageContent title="Today" description="Quick overview of your workspace.">
      <TodayClient />
    </PageContent>
  );
}

