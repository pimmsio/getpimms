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
      className={`flex h-5 w-5 items-center justify-center rounded-full ${RANK_COLORS[rank - 1]} text-[10px] font-bold flex-shrink-0 shadow-sm`}
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
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 flex-shrink-0">
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
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200 ${className}`}
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
          className="mt-3 w-full rounded-lg border border-neutral-200 bg-neutral-50 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300 font-medium transition-all"
        >
          View all {totalCount} →
        </button>
      )}
    </div>
  );
}

