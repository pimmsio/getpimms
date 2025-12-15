"use client";

import { cn, getParamsFromURL, getPrettyUrl } from "@dub/utils";
import { useMemo } from "react";

interface UrlDisplayWithUtmProps {
  url: string;
  className?: string;
}

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export function UrlDisplayWithUtm({ url, className }: UrlDisplayWithUtmProps) {
  const { baseUrl, utmCount, prettyUrl } = useMemo(() => {
    if (!url) {
      return { baseUrl: "", utmCount: 0, prettyUrl: "" };
    }

    try {
      const urlObj = new URL(url);
      const params = getParamsFromURL(url);
      
      // Count UTM parameters
      const utmKeys = Object.keys(params).filter(key => UTM_PARAMS.includes(key));
      const utmCount = utmKeys.length;

      // Extract base URL without query parameters
      const baseUrlWithProtocol = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      const baseUrl = getPrettyUrl(baseUrlWithProtocol);
      const prettyUrl = getPrettyUrl(url);

      return {
        baseUrl,
        utmCount,
        prettyUrl,
      };
    } catch (error) {
      const prettyUrl = getPrettyUrl(url);
      return { 
        baseUrl: prettyUrl,
        utmCount: 0,
        prettyUrl,
      };
    }
  }, [url]);

  // If no URL, fallback to simple display
  if (!url) {
    return <span className={className}>{prettyUrl}</span>;
  }

  // If no UTM parameters, just return the pretty URL
  if (utmCount === 0) {
    return <span className={className}>{prettyUrl}</span>;
  }

  // Render base URL + UTM summary chip
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span>{baseUrl}</span>
      <span className="ml-1 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-400">
        {utmCount === 1 ? "utm*" : `utm* +${utmCount - 1}`}
      </span>
    </span>
  );
}

