import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";
import Insights from "./insights";

export default function WorkspaceInsights() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent
        title="Links Report"
        headerPlacement="content"
      >
        <AnalyticsClient eventsPage>
          <div className="px-3 py-4 pb-16 lg:px-10">
            <EventsProvider>
              <Insights />
            </EventsProvider>
          </div>
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
