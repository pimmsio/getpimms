import { normalizeUtmValue } from "@dub/utils";

export interface SaveUtmParametersResult {
  source?: { success: boolean; error?: string };
  medium?: { success: boolean; error?: string };
  campaign?: { success: boolean; error?: string };
  term?: { success: boolean; error?: string };
  content?: { success: boolean; error?: string };
}

/**
 * Save UTM parameters to the library/database
 * This function saves each parameter type to its respective endpoint
 */
export async function saveUtmParameters(
  utmValues: Record<string, string>,
  workspaceId: string,
): Promise<SaveUtmParametersResult> {
  const results: SaveUtmParametersResult = {};

  // Map of UTM keys to their API endpoints
  const parameterMap: Record<
    string,
    { endpoint: string; key: keyof SaveUtmParametersResult }
  > = {
    utm_source: { endpoint: "utm-sources", key: "source" },
    utm_medium: { endpoint: "utm-mediums", key: "medium" },
    utm_campaign: { endpoint: "utm-campaigns", key: "campaign" },
    utm_term: { endpoint: "utm-terms", key: "term" },
    utm_content: { endpoint: "utm-contents", key: "content" },
  };

  // Create an array of promises for all parameters
  const savePromises = Object.entries(utmValues)
    .filter(([key, value]) => parameterMap[key] && value && value.trim())
    .map(async ([key, value]) => {
      const { endpoint, key: resultKey } = parameterMap[key];
      const normalizedValue = normalizeUtmValue(value);

      try {
        const response = await fetch(
          `/api/${endpoint}?workspaceId=${workspaceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: normalizedValue }),
          },
        );

        if (response.ok) {
          results[resultKey] = { success: true };
        } else {
          const errorData = await response.json();
          // If it's a conflict (already exists), treat as success
          if (response.status === 409) {
            results[resultKey] = { success: true };
          } else {
            results[resultKey] = {
              success: false,
              error: errorData.error?.message || "Failed to save parameter",
            };
          }
        }
      } catch (error) {
        results[resultKey] = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }

      return { key: resultKey, result: results[resultKey] };
    });

  // Wait for all promises to settle
  await Promise.allSettled(savePromises);

  return results;
}

