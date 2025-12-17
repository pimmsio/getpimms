"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { Button, Tooltip, useRouterStuff } from "@dub/ui";
import { cn } from "@dub/utils";
import { useMemo } from "react";
import AnalyticsProvider from "../analytics-provider";
import Toggle from "../toggle";
import EventsTable from "./events-table";
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
        <Toggle page="events" />
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-3 lg:px-10">
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
