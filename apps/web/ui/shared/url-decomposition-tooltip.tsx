"use client";

import { Tooltip } from "@dub/ui";
import { cn, getParamsFromURL } from "@dub/utils";
import { Copy } from "lucide-react";
import { ReactNode, useMemo, useState } from "react";

interface UrlDecompositionTooltipProps {
  url: string;
  children: ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
}

interface UrlPart {
  label: string;
  value: string;
  type: 'base' | 'utm' | 'query';
  isClickable?: boolean;
}

const UTM_LABELS: Record<string, string> = {
  utm_source: "Source",
  utm_medium: "Medium", 
  utm_campaign: "Campaign",
  utm_term: "Term",
  utm_content: "Content",
};

export function UrlDecompositionTooltip({ 
  url, 
  children, 
  className,
  side = "bottom" 
}: UrlDecompositionTooltipProps) {
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const urlParts = useMemo(() => {
    if (!url) return [];

    try {
      const urlObj = new URL(url);
      const params = getParamsFromURL(url) || {};
      const parts: UrlPart[] = [];

      // Base URL (protocol + hostname + pathname)
      const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      parts.push({
        label: "Base URL",
        value: baseUrl,
        type: "base",
        isClickable: true
      });

      // UTM Parameters
      Object.entries(UTM_LABELS).forEach(([key, label]) => {
        if (params[key]) {
          parts.push({
            label: `UTM ${label}`,
            value: params[key],
            type: "utm"
          });
        }
      });

      // Other query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (!UTM_LABELS[key] && value) {
          parts.push({
            label: key.charAt(0).toUpperCase() + key.slice(1),
            value: value,
            type: "query"
          });
        }
      });

      return parts;
    } catch (error) {
      // Fallback for invalid URLs
      return [{
        label: "URL",
        value: url,
        type: "base" as const,
        isClickable: true
      }];
    }
  }, [url]);

  const copyToClipboard = async (text: string, partKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPart(partKey);
      setTimeout(() => setCopiedPart(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const tooltipContent = (
    <div className="w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Link Details</h4>
      </div>
      
      <div className="space-y-3">
        {urlParts.map((part, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={cn(
                "text-xs font-medium",
                part.type === "base" && "text-blue-600",
                part.type === "utm" && "text-green-600", 
                part.type === "query" && "text-purple-600"
              )}>
                {part.label}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(part.value, `${part.label}-${index}`);
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy value"
                >
                  <Copy className={cn(
                    "w-3 h-3 transition-colors",
                    copiedPart === `${part.label}-${index}` ? "text-green-500" : "text-gray-400"
                  )} />
                </button>
              </div>
            </div>
            <div className={cn(
              "text-xs px-2 py-1.5 rounded border-l-2 bg-gray-50",
              part.type === "base" && "border-blue-400 bg-blue-50",
              part.type === "utm" && "border-green-400 bg-green-50",
              part.type === "query" && "border-purple-400 bg-purple-50"
            )}>
              <span className="text-gray-700 break-all">
                {part.value}
              </span>
            </div>
          </div>
        ))}
        
        {urlParts.length === 1 && (
          <p className="text-xs text-gray-500 text-center py-2">
            No UTM parameters found
          </p>
        )}
      </div>
    </div>
  );

  return urlParts.length <= 1 ? (
    <div className={className}>
      {children}
    </div>
  ) : (
    <Tooltip content={tooltipContent} side={side} align="end">
      <div className={className}>
        {children}
      </div>
    </Tooltip>
  );
}
