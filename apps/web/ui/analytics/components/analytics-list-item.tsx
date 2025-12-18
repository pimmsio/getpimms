/**
 * Reusable analytics list item component
 * Consolidates repeated list item patterns across devices, locations, destinations, referrers
 */

import React from "react";
import { MetricsDisplay } from "../metrics-display";
import type { LucideIcon } from "lucide-react";
import { RANK_COLORS } from "../lib";

export interface AnalyticsListItemProps {
  /**
   * Icon to display (can be component or image src)
   */
  icon?: React.ReactNode | string;
  /**
   * Optional rank badge for top 3 items
   */
  rank?: number;
  /**
   * Label text
   */
  label: string;
  /**
   * Metrics to display
   */
  metrics: {
    clicks: number;
    leads?: number;
    sales?: number;
    saleAmount?: number;
  };
  /**
   * Totals for the current card/list (used for hover %)
   */
  totals?: {
    clicks: number;
    leads: number;
  };
  /**
   * Currently selected metric tab
   */
  primaryMetric: "clicks" | "leads" | "sales";
  /**
   * Click handler or href
   */
  href?: string;
  onClick?: () => void;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Icon className
   */
  iconClassName?: string;
}

/**
 * Renders a rank badge for top 3 items
 */
function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) return null;

  return (
    <div
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md ${RANK_COLORS[rank - 1]} text-[10px] font-bold`}
    >
      {rank}
    </div>
  );
}

/**
 * Renders the icon (component, image, or text)
 */
function ItemIcon({
  icon,
  iconClassName = "h-3.5 w-3.5 text-neutral-600",
}: {
  icon?: React.ReactNode | string;
  iconClassName?: string;
}) {
  if (!icon) return null;

  // If icon is a string (image URL)
  if (typeof icon === "string") {
    return (
      <img
        src={icon}
        alt=""
        className="h-3 w-5 flex-shrink-0"
      />
    );
  }

  // If icon is a React component
  if (React.isValidElement(icon)) {
    return (
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-neutral-100">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: iconClassName,
        })}
      </div>
    );
  }

  return icon;
}

/**
 * Reusable list item component for analytics data
 */
export function AnalyticsListItem({
  icon,
  rank,
  label,
  metrics,
  totals,
  primaryMetric,
  href,
  onClick,
  className = "",
  iconClassName,
}: AnalyticsListItemProps) {
  const Component = href ? "a" : "button";
  const props = href
    ? { href }
    : onClick
      ? { onClick, type: "button" as const }
      : {};

  return (
    <Component
      {...props}
      className={`app-row group ${className}`}
    >
      {rank && <RankBadge rank={rank} />}
      <ItemIcon icon={icon} iconClassName={iconClassName} />
      <span className="flex-1 text-xs font-medium text-neutral-900 truncate min-w-0">
        {label}
      </span>
      <MetricsDisplay
        clicks={metrics.clicks}
        leads={metrics.leads}
        sales={metrics.sales}
        saleAmount={metrics.saleAmount}
        totalClicks={totals?.clicks}
        totalLeads={totals?.leads}
        primaryMetric={primaryMetric}
        className="text-xs"
      />
    </Component>
  );
}

/**
 * List container with section header
 */
export function AnalyticsListSection({
  title,
  children,
  onViewAll,
  totalCount,
  isModal,
}: {
  title: string;
  children: React.ReactNode;
  onViewAll?: () => void;
  totalCount?: number;
  isModal?: boolean;
}) {
  return (
    <div className="py-3 px-4 first:pt-4 last:pb-4 border-b border-neutral-100 last:border-0">
      <h4 className="mb-3 text-xs font-semibold text-neutral-600 uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>

      {!isModal && onViewAll && totalCount && totalCount > 5 && (
        <button
          onClick={onViewAll}
          className="app-btn-muted mt-3 w-full"
        >
          View all {totalCount} →
        </button>
      )}
    </div>
  );
}

