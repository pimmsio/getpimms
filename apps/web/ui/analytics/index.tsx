"use client";
import { cn } from "@dub/utils";
/* 
  This Analytics component lives in several different places:
  1. Workspace analytics page, e.g. app.dub.co/dub/analytics
  2. Public stats page, e.g. app.dub.co/share/dash_6NSA6vNm017MZwfzt8SubNSZ
*/

import useWorkspace from "@/lib/swr/use-workspace";
import { useContext, useEffect, useMemo, useState } from "react";
import AnalyticsProvider, {
  AnalyticsContext,
  AnalyticsDashboardProps,
} from "./analytics-provider";
import Channel from "./channel";
import Channels from "./channels";
import { DraggableRows, type LayoutRow } from "./components/draggable-rows";
import DestinationUrls from "./destination-urls";
import Devices from "./devices";
import Locations from "./locations";
import Main from "./main";
import Toggle from "./toggle";
import TopLinks from "./top-links";
import UTMDetector from "./utm-detector";
import { AnalyticsCanvasProvider } from "./analytics-card";

export default function Analytics({
  adminPage,
  dashboardProps,
}: {
  adminPage?: boolean;
  dashboardProps?: AnalyticsDashboardProps;
}) {
  return (
    <AnalyticsProvider {...{ adminPage, dashboardProps }}>
      <AnalyticsContext.Consumer>
        {({ dashboardProps }) => {
          const standalone = Boolean(dashboardProps);
          return (
            <div
              className={cn(
                // When embedded inside the main app shell, avoid competing backgrounds.
                !standalone && "pb-16",
                // When used standalone (e.g. public/share pages), keep a subtle background.
                standalone && "min-h-screen bg-neutral-50 pb-16 pt-10",
              )}
            >
              <div
                className={cn(
                  "sticky top-0 z-40 border-b border-neutral-100 backdrop-blur-sm",
                  // Embedded: the page surface is already white (PageContent), so keep this neutral.
                  !standalone && "bg-white/85",
                  // Standalone pages own their own background.
                  standalone && "bg-neutral-50/95",
                )}
              >
                <Toggle />
              </div>
              <div className="px-3 pt-5 sm:pt-7 lg:px-10">
                <AnalyticsCanvasProvider enabled={!standalone}>
                  <div className="space-y-6 sm:space-y-8">
                    <Main />
                    <StatsGrid />
                  </div>
                </AnalyticsCanvasProvider>
              </div>
            </div>
          );
        }}
      </AnalyticsContext.Consumer>
    </AnalyticsProvider>
  );
}

function StatsGrid() {
  const { dashboardProps, selectedTab, view, workspace, adminPage } =
    useContext(AnalyticsContext);
  const { plan } = workspace || {};
  const { slug: workspaceSlug } = useWorkspace();

  const hide = false;

  const enableReorder = Boolean(!dashboardProps && !adminPage && workspaceSlug);

  const defaultRows = useMemo<LayoutRow[]>(() => {
    const rows: LayoutRow[] = [
      { rowId: "row:channels-referrers", left: "channels", right: "referrers" },
      { rowId: "row:utm", left: "utm", right: null, fullWidth: true },
      {
        rowId: "row:links-urls",
        left: dashboardProps ? "destination_urls" : "top_links",
        right: dashboardProps ? "locations" : "destination_urls",
      },
      {
        rowId: "row:locations-devices",
        left: dashboardProps ? "devices" : "locations",
        right: dashboardProps ? null : "devices",
      },
    ];

    // If dashboardProps, we didn't include top_links; ensure locations/devices are present cleanly
    if (dashboardProps) {
      return [
        {
          rowId: "row:channels-referrers",
          left: "channels",
          right: "referrers",
        },
        { rowId: "row:utm", left: "utm", right: null, fullWidth: true },
        {
          rowId: "row:destination-locations",
          left: "destination_urls",
          right: "locations",
        },
        { rowId: "row:devices", left: "devices", right: null },
      ];
    }

    return rows;
  }, [dashboardProps]);

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    defaultRows.forEach((r) => {
      if (r.left) ids.add(r.left);
      if (r.right) ids.add(r.right);
    });
    return ids;
  }, [defaultRows]);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = () => setIsDesktop(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  const storageKey = useMemo(
    () => (workspaceSlug ? `analytics:gridOrder:${workspaceSlug}` : null),
    [workspaceSlug],
  );

  const [rows, setRows] = useState<LayoutRow[]>(defaultRows);

  // Load persisted order (desktop only)
  useEffect(() => {
    if (!enableReorder || !isDesktop || !storageKey) {
      setRows(defaultRows);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      const savedRows = Array.isArray(parsed) ? (parsed as any[]) : null;

      const flatAllowed = visibleIds;

      const normalize = (input: any): LayoutRow[] => {
        if (!Array.isArray(input)) return defaultRows;

        // Extract ids, drop unknowns, enforce that utm is always its own full-width row.
        const used = new Set<string>();
        const out: LayoutRow[] = [];

        for (const r of input) {
          const left = typeof r?.left === "string" ? r.left : null;
          const right = typeof r?.right === "string" ? r.right : null;

          // Skip rows with no ids
          if (!left && !right) continue;

          // Pull utm out if it appears anywhere
          if (left === "utm" || right === "utm") {
            // We'll add utm row later.
            if (left === "utm") {
              // keep other card if any
              if (
                right &&
                right !== "utm" &&
                flatAllowed.has(right) &&
                !used.has(right)
              ) {
                used.add(right);
                out.push({ rowId: `row:${right}`, left: right, right: null });
              }
            } else if (right === "utm") {
              if (
                left &&
                left !== "utm" &&
                flatAllowed.has(left) &&
                !used.has(left)
              ) {
                used.add(left);
                out.push({ rowId: `row:${left}`, left, right: null });
              }
            }
            continue;
          }

          const leftOk =
            left && flatAllowed.has(left) && !used.has(left) ? left : null;
          const rightOk =
            right && flatAllowed.has(right) && !used.has(right) ? right : null;

          if (leftOk) used.add(leftOk);
          if (rightOk) used.add(rightOk);

          out.push({
            rowId: `row:${leftOk || "empty"}-${rightOk || "empty"}-${out.length}`,
            left: leftOk,
            right: rightOk,
          });
        }

        // Ensure utm exists as full-width row
        const hasUtm = flatAllowed.has("utm");
        if (hasUtm) {
          out.unshift({
            rowId: "row:utm",
            left: "utm",
            right: null,
            fullWidth: true,
          });
        }

        // Add missing items (pack into rows of 2)
        const missing = Array.from(flatAllowed).filter(
          (id) => id !== "utm" && !used.has(id),
        );
        for (let i = 0; i < missing.length; i += 2) {
          out.push({
            rowId: `row:missing-${i}`,
            left: missing[i] ?? null,
            right: missing[i + 1] ?? null,
          });
        }

        return out;
      };

      setRows(normalize(savedRows));
    } catch {
      setRows(defaultRows);
    }
  }, [enableReorder, isDesktop, storageKey, defaultRows, visibleIds]);

  const persist = (next: LayoutRow[]) => {
    setRows(next);
    if (!enableReorder || !isDesktop || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const renderCard = (id: string, dragHandleProps?: any) => {
    switch (id) {
      case "channels":
        return <Channels dragHandleProps={dragHandleProps} />;
      case "referrers":
        return <Channel dragHandleProps={dragHandleProps} />;
      case "utm":
        return <UTMDetector dragHandleProps={dragHandleProps} />;
      case "top_links":
        return dashboardProps ? null : (
          <TopLinks dragHandleProps={dragHandleProps} />
        );
      case "destination_urls":
        return <DestinationUrls dragHandleProps={dragHandleProps} />;
      case "locations":
        return <Locations dragHandleProps={dragHandleProps} />;
      case "devices":
        return <Devices dragHandleProps={dragHandleProps} />;
      default:
        return null;
    }
  };

  return hide ? null : (
    <DraggableRows
      rows={rows}
      setRows={persist}
      disabled={!enableReorder || !isDesktop}
      renderCard={(id, { dragHandleProps }) => renderCard(id, dragHandleProps)}
    />
  );
}
