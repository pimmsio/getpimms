"use client";

import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";

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
        <Toggle page="events" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-3 lg:px-10">
          <EventsTableContainer />
        </div>
      </div>
    </AnalyticsProvider>
  );
}

function EventsTableContainer() {
  return (
    <EventsTable
      key="events"
    />
  );
}
