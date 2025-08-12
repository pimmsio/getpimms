import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";
import Insights from "./insights";

export default function WorkspaceInsights() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent title="Insights">
        <AnalyticsClient>
          <Insights />
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
