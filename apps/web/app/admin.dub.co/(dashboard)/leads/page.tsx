import Events from "@/ui/analytics/events";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import LayoutLoader from "@/ui/layout/layout-loader";
import { Suspense } from "react";
import AnalyticsClient from "../analytics/client";

export default function AdminLeadsEvents() {
  return (
    <div className="min-h-screen w-full">
      <div className="sticky top-0 z-20 border-b border-neutral-100 bg-white/90 backdrop-blur-sm">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            Contacts
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Track contact conversions and events across all links
          </p>
        </div>
      </div>
      <Suspense fallback={<LayoutLoader />}>
        <AnalyticsClient eventsPage adminPage>
          <EventsProvider>
            <Events adminPage showTabs />
          </EventsProvider>
        </AnalyticsClient>
      </Suspense>
    </div>
  );
}
