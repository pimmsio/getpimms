import Events from "@/ui/analytics/events";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import LayoutLoader from "@/ui/layout/layout-loader";
import { PageContent } from "@/ui/layout/page-content";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";

export default function WorkspaceSalesEvents() {
  return (
    <Suspense fallback={<LayoutLoader />}>
      <PageContent title="Sales">
        <AnalyticsClient eventsPage>
          <EventsProvider>
            <Events />
          </EventsProvider>
        </AnalyticsClient>
      </PageContent>
    </Suspense>
  );
}
