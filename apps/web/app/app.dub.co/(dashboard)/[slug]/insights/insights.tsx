"use client";

import { cn } from "@dub/utils";
import { useContext } from "react";
import AnalyticsProvider, { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import Toggle from "@/ui/analytics/toggle";
import InsightsTable from "./insights-table";

export default function Insights() {
  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50 pb-16")}>
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <Toggle page="events" />
      </div>
      <div className="mx-auto max-w-screen-xl px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6">
        <div className="space-y-4 sm:space-y-6">
          <InsightsTable />
        </div>
      </div>
    </div>
  );
}
