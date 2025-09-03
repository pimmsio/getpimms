import Analytics from "@/ui/analytics";
import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { Suspense } from "react";
import AnalyticsClient from "./client";

export default function WorkspaceAnalytics() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent 
        title={
          <div className="flex items-center justify-between">
            <h1>Analytics</h1>
          </div>
        }
      >
        <AnalyticsClient>
          <Analytics />
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
