"use client";

import Events from "@/ui/analytics/events";
import { EventsProvider } from "@/ui/analytics/events/events-provider";
import AnalyticsClient from "../analytics/client";

export default function ConversionsClient() {
  return (
    <AnalyticsClient eventsPage>
      <div className="px-3 py-4 pb-16 lg:px-10">
        <EventsProvider>
          <Events />
        </EventsProvider>
      </div>
    </AnalyticsClient>
  );
}
