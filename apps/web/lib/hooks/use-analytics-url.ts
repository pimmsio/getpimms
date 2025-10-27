import { useRouterStuff } from "@dub/ui";
import { useMemo } from "react";

/**
 * Hook to build analytics URLs with preserved filters
 * This centralizes the URL building logic to avoid code duplication
 */
export function useAnalyticsUrl() {
  const { getQueryString } = useRouterStuff();

  return useMemo(() => {
    const currentParams = getQueryString(undefined, {
      include: [
        "interval",
        "start", 
        "end",
        "domain",
        "key",
        "tagIds", 
        "folderId",
        "country",
        "city",
        "region",
        "continent",
        "device",
        "browser",
        "os",
        "trigger",
        "referer",
        "refererUrl",
        "channel",
        "url",
        "utm_source",
        "utm_medium", 
        "utm_campaign",
        "utm_term",
        "utm_content",
        "customerId",
      ],
    });

    return (basePath: string, additionalParams?: Record<string, string>) => {
      const searchParams = new URLSearchParams();

      // Add current filters
      if (currentParams) {
        const existingParams = new URLSearchParams(currentParams);
        existingParams.forEach((value, key) => {
          searchParams.set(key, value);
        });
      }

      // Add additional params (like event=leads)
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          searchParams.set(key, value);
        });
      }

      const queryString = searchParams.toString();
      return basePath + (queryString ? `?${queryString}` : "");
    };
  }, [getQueryString]);
}
