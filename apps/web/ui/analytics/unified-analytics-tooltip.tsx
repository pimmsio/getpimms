import { getGoogleFavicon, getParamsFromURL } from "@dub/utils";
import { createPortal } from "react-dom";

// Base metrics that appear in all tooltips
export type BaseMetrics = {
  clicks: number;
  leads: number;
  sales: number;
  saleAmount: number;
};

// Top sources for channels
export type TopSource = {
  name: string;
  iconUrl: string;
  percentage?: number;
};

// URL breakdown for links
export type UrlBreakdown = {
  baseUrl: string;
  utmParams: Record<string, string>;
  otherParams: Record<string, string>;
};

// Key performance metrics
export type KeyMetrics = {
  conversionRate: number; // CRV (leads/clicks * 100)
  closedRate: number;     // Closed rate (sales/leads * 100)
  averageOrderValue: number; // AOV (saleAmount/sales)
};

export type TooltipSection = 
  | { type: "header"; title: string }
  | { type: "metrics"; data: BaseMetrics }
  | { type: "keyMetrics"; data: KeyMetrics }
  | { type: "topSources"; data: TopSource[] }
  | { type: "urlBreakdown"; data: UrlBreakdown };

export type UnifiedTooltipProps = {
  sections: TooltipSection[];
  position: { x: number; y: number };
  className?: string;
  disablePositioning?: boolean; // For use within chart libraries that handle positioning
};

const UTM_LABELS: Record<string, string> = {
  utm_source: "Source",
  utm_medium: "Medium", 
  utm_campaign: "Campaign",
  utm_term: "Term",
  utm_content: "Content",
};

export function UnifiedAnalyticsTooltip({ 
  sections, 
  position, 
  disablePositioning = false
}: UnifiedTooltipProps) {
  // If positioning is disabled (for chart libraries), just return the content
  if (disablePositioning) {
    return (
      <div 
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          minWidth: '220px',
          maxWidth: '320px',
          overflow: 'hidden'
        }}
      >
        {sections.map((section, index) => (
          <TooltipSection key={index} section={section} isLast={index === sections.length - 1} />
        ))}
      </div>
    );
  }

  // Return early if position is invalid (0,0 or negative values)
  if (!position || position.x <= 0 || position.y <= 0) {
    console.warn('Invalid tooltip position received:', position);
    return null;
  }

  // Smart positioning near cursor
  const tooltipWidth = 320;
  // Estimate tooltip height based on number of sections and their content
  const estimateHeight = () => {
    let height = 0;
    sections.forEach(section => {
      switch (section.type) {
        case "header":
          height += 40; // px-3 py-2 with text
          break;
        case "metrics":
          height += 80; // 3 rows of metrics
          break;
        case "keyMetrics":
          height += 90; // header + 3 rows
          break;
        case "topSources":
          height += 60 + (section.data.length * 20); // header + sources
          break;
        case "urlBreakdown":
          height += 60; // base height, varies with params
          if (Object.keys(section.data.utmParams).length > 0) height += 40;
          if (Object.keys(section.data.otherParams).length > 0) height += 40;
          break;
      }
    });
    return Math.min(height + 20, 400); // Add padding, cap at 400px
  };
  
  const tooltipHeight = estimateHeight();
  const offset = 15;
  const padding = 10; // Distance from viewport edge
  
  // Determine best position
  const spaceRight = window.innerWidth - position.x;
  const spaceLeft = position.x;
  const spaceBelow = window.innerHeight - position.y;
  const spaceAbove = position.y;
  
  // Horizontal positioning
  let left: number;
  if (spaceRight >= tooltipWidth + offset + padding) {
    // Prefer right side
    left = position.x + offset;
  } else if (spaceLeft >= tooltipWidth + offset + padding) {
    // Fall back to left side
    left = position.x - tooltipWidth - offset;
  } else {
    // Center horizontally if tooltip is wider than available space
    left = Math.max(padding, (window.innerWidth - tooltipWidth) / 2);
  }
  
  // Vertical positioning
  let top: number;
  if (spaceBelow >= tooltipHeight + offset + padding) {
    // Prefer below cursor
    top = position.y + offset;
  } else if (spaceAbove >= tooltipHeight + offset + padding) {
    // Fall back to above cursor
    top = position.y - tooltipHeight - offset;
  } else {
    // Center vertically if tooltip is taller than available space
    top = Math.max(padding, (window.innerHeight - tooltipHeight) / 2);
  }
  
  // Final bounds checking
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));
  top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));

  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 2147483647,
        pointerEvents: 'none',
        isolation: 'isolate',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    >
      <div 
        className="neumorphism-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          minWidth: '220px',
          maxWidth: '320px',
          overflow: 'hidden'
        }}
      >
        {sections.map((section, index) => (
          <TooltipSection key={index} section={section} isLast={index === sections.length - 1} />
        ))}
      </div>
    </div>
  );

  // Always use portal to render outside any overflow containers
  if (typeof document === 'undefined') return null;
  
  // Use document.body directly for the portal
  return createPortal(tooltipContent, document.body);
}

function TooltipSection({ section, isLast }: { section: TooltipSection; isLast: boolean }) {
  const borderClass = isLast ? "" : "border-b border-neutral-100";

  switch (section.type) {
    case "header":
      return (
        <div className={`px-3 py-2 ${borderClass}`}>
          <div className="font-semibold text-sm text-neutral-900 truncate" title={section.title}>
            {section.title}
          </div>
        </div>
      );

    case "metrics":
      return (
        <div className={`px-3 py-2 space-y-1.5 ${borderClass}`}>
          {section.data.clicks > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded bg-blue-400"></div>
                <span className="text-neutral-600 text-xs">Clicks</span>
              </div>
              <span className="font-medium text-neutral-900 tabular-nums text-xs">
                {section.data.clicks.toLocaleString()}
              </span>
            </div>
          )}
          {section.data.leads > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded bg-yellow-400"></div>
                <span className="text-neutral-600 text-xs">Leads</span>
              </div>
              <span className="font-medium text-neutral-900 tabular-nums text-xs">
                {section.data.leads.toLocaleString()}
              </span>
            </div>
          )}
          {section.data.sales > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded bg-green-400"></div>
                <span className="text-neutral-600 text-xs">Sales</span>
              </div>
              <span className="font-medium text-neutral-900 tabular-nums text-xs">
                {section.data.sales.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      );

    case "keyMetrics":
      return (
        <div className={`px-3 py-2 space-y-1.5 ${borderClass}`}>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 text-xs">Conversion Rate</span>
            <span className="font-medium text-neutral-900 tabular-nums text-xs">
              {section.data.conversionRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 text-xs">Close Rate</span>
            <span className="font-medium text-neutral-900 tabular-nums text-xs">
              {section.data.closedRate.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 text-xs">Avg Order Value</span>
            <span className="font-medium text-neutral-900 tabular-nums text-xs">
              ${section.data.averageOrderValue.toFixed(0)}
            </span>
          </div>
        </div>
      );

    case "topSources":
      return (
        <div className={`px-3 py-2 ${borderClass}`}>
          <div className="text-xs font-medium text-neutral-600 mb-2">TOP SOURCES</div>
          <div className="space-y-1.5">
            {section.data.slice(0, 3).map((source, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <img
                  src={source.iconUrl}
                  alt={source.name}
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" fill="%233B82F6" rx="2"/><text x="8" y="11" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${source.name.charAt(0).toUpperCase()}</text></svg>`;
                  }}
                />
                <span className="text-xs text-neutral-700 truncate flex-1 max-w-[180px]">
                  {source.name}
                </span>
                {source.percentage && (
                  <span className="text-xs text-neutral-500">
                    {source.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case "urlBreakdown":
      return (
        <div className={`px-3 py-2 ${borderClass}`}>
          <div className="text-xs font-medium text-neutral-600 mb-2">DESTINATION</div>
          
          {/* Base URL */}
          <div className="mb-2">
            <div className="text-xs text-blue-600 font-medium mb-1">Base URL</div>
            <div className="text-xs text-neutral-700 bg-blue-50 border-l-2 border-blue-400 px-2 py-1 rounded-sm truncate">
              {section.data.baseUrl}
            </div>
          </div>

          {/* UTM Parameters */}
          {Object.keys(section.data.utmParams).length > 0 && (
            <div className="mb-2">
              <div className="text-xs text-green-600 font-medium mb-1">UTM Parameters</div>
              <div className="space-y-1">
                {Object.entries(section.data.utmParams).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs gap-2">
                    <span className="text-neutral-600 flex-shrink-0">{UTM_LABELS[key] || key}:</span>
                    <span className="text-neutral-700 font-medium truncate text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Parameters */}
          {Object.keys(section.data.otherParams).length > 0 && (
            <div>
              <div className="text-xs text-purple-600 font-medium mb-1">Other Params</div>
              <div className="space-y-1">
                {Object.entries(section.data.otherParams).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs gap-2">
                    <span className="text-neutral-600 flex-shrink-0">{key}:</span>
                    <span className="text-neutral-700 font-medium truncate text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

// Helper functions to create common tooltip sections
export function createBaseMetrics(data: BaseMetrics): TooltipSection {
  return { type: "metrics", data };
}

export function createKeyMetrics(data: BaseMetrics): TooltipSection {
  const conversionRate = data.clicks > 0 ? (data.leads / data.clicks) * 100 : 0;
  const closedRate = data.leads > 0 ? (data.sales / data.leads) * 100 : 0;
  const averageOrderValue = data.sales > 0 ? (data.saleAmount / 100) / data.sales : 0;
  
  return { 
    type: "keyMetrics", 
    data: { conversionRate, closedRate, averageOrderValue } 
  };
}

export function createTopSources(sources: string[], getIconUrl: (name: string) => string): TooltipSection {
  return {
    type: "topSources",
    data: sources.map(name => ({
      name,
      iconUrl: getIconUrl(name),
    }))
  };
}

export function createUrlBreakdown(url: string): TooltipSection {
  try {
    const urlObj = new URL(url);
    const params = getParamsFromURL(url) || {};
    
    const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    const utmParams: Record<string, string> = {};
    const otherParams: Record<string, string> = {};
    
    Object.entries(params).forEach(([key, value]) => {
      if (UTM_LABELS[key]) {
        utmParams[key] = value;
      } else {
        otherParams[key] = value;
      }
    });
    
    return {
      type: "urlBreakdown",
      data: { baseUrl, utmParams, otherParams }
    };
  } catch {
    return {
      type: "urlBreakdown", 
      data: { baseUrl: url, utmParams: {}, otherParams: {} }
    };
  }
}
