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
   * Whether to show the icon (defaults to false to avoid visual clutter when
   * multiple analytics cards are empty on the same page).
   */
  showIcon?: boolean;
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
  showIcon = false,
  title,
  description,
  action,
  className = "h-[380px]",
}: AnalyticsEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 text-center ${className}`}
    >
      {showIcon && (
        <div className="app-empty-icon">
          <Icon className="h-6 w-6 text-neutral-600" />
        </div>
      )}
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="app-btn-secondary-sm mt-2 h-auto px-4 py-2 text-xs font-medium"
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
      <div className="app-empty-icon">
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
      <button className="app-btn-secondary-sm mt-2 h-auto px-4 py-2 text-xs font-medium">
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
      <div className="app-empty-icon">
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
          className="app-btn-secondary-sm mt-2 h-auto px-4 py-2 text-xs font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

