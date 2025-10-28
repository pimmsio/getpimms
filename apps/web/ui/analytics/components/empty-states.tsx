/**
 * Standardized empty state components for analytics
 * Consolidates 6+ duplicated empty state patterns
 */

import React from "react";
import type { SVGProps } from "react";

export interface AnalyticsEmptyStateProps {
  /**
   * Icon component to display
   */
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description: string;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * Standard empty state component for analytics views
 * Used across: channels, devices, locations, utm, destinations, referrers
 */
export function AnalyticsEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "h-[380px]",
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-50 ring-1 ring-neutral-200/50">
        <Icon className="h-6 w-6 text-neutral-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state specifically for "no data yet" scenarios
 */
export function NoDataYetEmptyState({
  icon: Icon,
  dataType = "data",
  description,
}: {
  icon: React.ComponentType<SVGProps<SVGSVGElement>>;
  dataType?: string;
  description?: string;
}) {
  return (
    <AnalyticsEmptyState
      icon={Icon}
      title={`No ${dataType} yet`}
      description={
        description ||
        `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} will appear once visitors start interacting with your links`
      }
    />
  );
}

/**
 * Empty state for upgrade required scenarios
 */
export function UpgradeRequiredEmptyState({
  feature = "this feature",
}: {
  feature?: string;
}) {
  return (
    <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 ring-1 ring-orange-200/50">
        <svg
          className="h-6 w-6 text-orange-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">Upgrade Required</p>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
          Upgrade your plan to access {feature}
        </p>
      </div>
      <button className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-700 hover:bg-orange-100 hover:border-orange-300 transition-all">
        Upgrade Now
      </button>
    </div>
  );
}

/**
 * Empty state for error scenarios
 */
export function ErrorEmptyState({
  message = "Something went wrong",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex h-[380px] flex-col items-center justify-center gap-3 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-100 to-red-50 ring-1 ring-red-200/50">
        <svg
          className="h-6 w-6 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-900">Error</p>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

