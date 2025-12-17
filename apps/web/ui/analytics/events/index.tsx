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
  const { searchParams, queryParams } = useRouterStuff();
  const view = searchParams.get("leadsView") || "activity"; // conversions | activity
  const hotOnly = searchParams.get("hotOnly") === "1";

  const items = useMemo(
    () => [
      {
        id: "conversions",
        label: "Latest conversions",
        tooltip: "Event feed (one row per event).",
      },
      {
        id: "activity",
        label: "Latest activity",
        tooltip: "One row per lead (sorted by newest activity).",
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-neutral-100 p-1">
        {items.map((it) => {
          const active = view === it.id;
          return (
            <Tooltip key={it.id} content={it.tooltip}>
              <div>
                <Button
                  variant={active ? "primary" : "secondary"}
                  className={cn(
                    "h-9 w-auto rounded-full border-none px-3 text-sm shadow-none",
                    active
                      ? "bg-neutral-900 hover:bg-neutral-900 text-white"
                      : "bg-transparent hover:bg-white text-neutral-800",
                  )}
                  text={it.label}
                  onClick={() =>
                    queryParams({
                      set: { leadsView: it.id, page: "1" },
                      scroll: false,
                    })
                  }
                />
              </div>
            </Tooltip>
          );
        })}
        </div>

        {/* Hot leads toggle sits next to the tab selector */}
        <Button
          variant={view === "activity" && hotOnly ? "primary" : "secondary"}
          className={cn(
            "h-9 w-auto rounded-full px-3",
            view === "activity" && hotOnly && "bg-neutral-900 hover:bg-neutral-900",
          )}
          text="Hot leads"
          disabled={view !== "activity"}
          onClick={() =>
            queryParams({
              set: { hotOnly: hotOnly ? "0" : "1", page: "1", leadsView: "activity" },
              scroll: false,
            })
          }
        />
      </div>

      <div />
    </div>
  );
}

function EventsTableContainer() {
  useWorkspace();
  const { searchParams } = useRouterStuff();

  const view = searchParams.get("leadsView") || "activity";

  return (
    view === "activity" ? (
      <LeadsFeedTable />
    ) : (
      <EventsTable
        key="events"
        requiresUpgrade={false}
      />
    )
  );
}
