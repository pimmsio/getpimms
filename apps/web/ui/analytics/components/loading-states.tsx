/**
 * Standardized loading skeleton components for analytics
 * Consolidates 7+ duplicated loading patterns across analytics components
 */

import React from "react";

/**
 * Loading skeleton for list-based analytics components
 * Used in: devices, locations, utm, referers, etc.
 */
export function ListLoadingSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col animate-pulse divide-y divide-neutral-100">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-neutral-100 flex-shrink-0" />
          <div className="h-3 bg-neutral-100 rounded flex-1" />
          <div className="h-3 w-10 bg-neutral-100 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for card-based analytics with sections
 * Used in: devices (multi-section), locations (with map)
 */
export function CardLoadingSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="flex flex-col animate-pulse divide-y divide-neutral-100">
      {[...Array(sections)].map((_, sectionIdx) => (
        <div key={sectionIdx} className="py-3 px-4">
          <div className="h-2 bg-neutral-100 rounded w-20 mb-3" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-neutral-100 flex-shrink-0" />
              <div className="h-3 bg-neutral-100 rounded flex-1" />
              <div className="h-3 w-10 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for analytics charts
 * Used in: mixed-analytics-chart, analytics-area-chart
 */
export function ChartLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Metrics cards */}
      <div className="mx-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2 xl:flex xl:gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200/50 bg-gray-50 px-4 py-3 lg:min-w-[90px] lg:flex-shrink-0"
          >
            <div className="mb-2 h-3 w-12 rounded bg-neutral-300/50"></div>
            <div className="h-6 w-12 rounded bg-neutral-300/50"></div>
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="mx-4 h-64 rounded-lg bg-neutral-100 sm:h-80 lg:h-96" />
    </div>
  );
}

/**
 * Loading skeleton for location-specific components with map
 * Used in: locations.tsx
 */
export function LocationLoadingSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="h-64 bg-neutral-100 mx-4 mt-4 rounded-lg" />
      <div className="border-t border-neutral-100 py-3 px-4 mt-4">
        <div className="h-2 bg-neutral-100 rounded w-20 mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-7 w-7 rounded-full bg-neutral-100 flex-shrink-0" />
            <div className="h-3 bg-neutral-100 rounded flex-1" />
            <div className="h-3 w-10 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for table-based analytics
 * Used in: events table, top-links table
 */
export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-3 bg-neutral-200 rounded w-24" />
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="border-b border-neutral-100 px-4 py-3">
          <div className="flex gap-4 items-center">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="h-3 bg-neutral-100 rounded"
                style={{ width: j === 0 ? "30%" : "15%" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for pie chart components
 * Used in: channel-pie-chart
 */
export function PieChartLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-[380px] animate-pulse">
      <div className="h-48 w-48 rounded-full bg-neutral-100 mb-4" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-neutral-100" />
            <div className="h-3 w-24 rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

