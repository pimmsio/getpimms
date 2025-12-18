"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import LeadsFeedTable from "./leads-feed-table";

export default function AnalyticsEvents({
  staticDomain,
  staticUrl,
  adminPage,
  showTabs,
}: {
  staticDomain?: string;
  staticUrl?: string;
  adminPage?: boolean;
  showTabs?: boolean;
}) {
  return (
    <AnalyticsProvider {...{ staticDomain, staticUrl, adminPage }}>
      <div className="pb-10">
        <div className="border-b border-neutral-100 bg-white/85 backdrop-blur-sm">
          <Toggle page="events" />
        </div>
        <div className="px-3 py-4 lg:px-10">
          <LeadsViewToggle />
          <EventsTableContainer />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

function LeadsViewToggle() {
  // This component is now empty since the hot leads filter is in the Toggle component
  return null;
}

function EventsTableContainer() {
  useWorkspace();

  return (
    <LeadsFeedTable />
  );
}
