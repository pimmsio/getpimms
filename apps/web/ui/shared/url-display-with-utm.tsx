"use client";

import { cn, getParamsFromURL, getPrettyUrl } from "@dub/utils";
import { useMemo } from "react";

interface UrlDisplayWithUtmProps {
  url: string;
  className?: string;
}

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export function UrlDisplayWithUtm({ url, className }: UrlDisplayWithUtmProps) {
  const { prettyUrl, hasUtm, urlParts } = useMemo(() => {
    if (!url) {
      return { prettyUrl: "", hasUtm: false, urlParts: [] };
    }

    try {
      const urlObj = new URL(url);
      const params = getParamsFromURL(url);
      
      const utmKeys = Object.keys(params).filter(key => UTM_PARAMS.includes(key));
      const hasUtmParams = utmKeys.length > 0;

      // Get base URL without protocol/www
      const baseUrl = `${urlObj.hostname}${urlObj.pathname}`.replace("www.", "").replace(/\/$/, "");
      
      // Build parts array for rendering
      const parts: Array<{ text: string; isUtm: boolean }> = [];
      
      // Add base URL
      parts.push({ text: baseUrl, isUtm: false });
      
      // Process query parameters
      const paramEntries = Array.from(urlObj.searchParams.entries());
      if (paramEntries.length > 0) {
        paramEntries.forEach(([key, value], index) => {
          const isUtm = UTM_PARAMS.includes(key);
          const separator = index === 0 ? "?" : "&";
          parts.push({ 
            text: `${separator}${key}=${value}`, 
            isUtm 
          });
        });
      }

      return {
        prettyUrl: getPrettyUrl(url),
        hasUtm: hasUtmParams,
        urlParts: parts,
      };
    } catch (error) {
      return { 
        prettyUrl: getPrettyUrl(url), 
        hasUtm: false, 
        urlParts: [{ text: getPrettyUrl(url), isUtm: false }] 
      };
    }
  }, [url]);

  // If no URL parts or error, fallback to simple display
  if (!urlParts.length) {
    return <span className={className}>{prettyUrl}</span>;
  }

  // If no UTM parameters, just return the pretty URL
  if (!hasUtm) {
    return <span className={className}>{prettyUrl}</span>;
  }

  // Render with styled UTM parameters
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-0", className)}>
      {urlParts.map((part, index) => (
        <span
          key={index}
          className={cn(
            part.isUtm && "text-neutral-300 opacity-60"
          )}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}

