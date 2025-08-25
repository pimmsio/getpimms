import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";
import Insights from "./insights";

export default function WorkspaceInsights() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent title="Links Report">
        <AnalyticsClient eventsPage>
          <EventsProvider>
            <Insights />
          </EventsProvider>
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
