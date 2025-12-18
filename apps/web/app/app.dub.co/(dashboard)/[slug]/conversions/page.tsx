import Events from "@/ui/analytics/events";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";

export default function WorkspaceAnalyticsConversions() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent
        title="Leads"
        headerPlacement="content"
      >
        <AnalyticsClient eventsPage>
          <div className="px-3 py-4 pb-16 lg:px-10">
            <EventsProvider>
              <Events />
            </EventsProvider>
          </div>
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
