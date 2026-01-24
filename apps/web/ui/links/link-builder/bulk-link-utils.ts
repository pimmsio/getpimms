import type { BulkUtmTemplateSelection } from "./bulk-utm-parameters-section";

export type BulkCombo = {
  url: string;
  templateInstanceId: string | null;
};

/**
 * Generate a unique combo ID for a URL and template combination
 */
export function generateBulkComboId(
  url: string,
  templateInstanceId: string | null,
): string {
  return `${url}::${templateInstanceId || "no-template"}`;
}

/**
 * Calculate all possible combinations of URLs and templates
 */
export function calculateBulkCombos(
  urls: string[],
  templates: BulkUtmTemplateSelection[],
): BulkCombo[] {
  if (urls.length === 0) return [];
  if (templates.length === 0) {
    return urls.map((url) => ({
      url,
      templateInstanceId: null,
    }));
  }
  return urls.flatMap((url) =>
    templates.map((template) => ({
      url,
      templateInstanceId: template.instanceId,
    })),
  );
}

/**
 * Calculate total number of links that will be created
 */
export function calculateBulkTotalCount(
  urls: string[],
  templates: BulkUtmTemplateSelection[],
): number {
  if (urls.length === 0) return 0;
  return urls.length * Math.max(1, templates.length);
}

/**
 * Calculate number of unique URL+template combinations
 */
export function calculateBulkComboCount(
  urls: string[],
  templates: BulkUtmTemplateSelection[],
): number {
  if (urls.length === 0 || templates.length === 0) return 0;
  return urls.length * templates.length;
}

/**
 * Get the current bulk URL based on preview index
 */
export function getCurrentBulkUrl(
  urls: string[],
  previewIndex: number,
): string {
  if (urls.length === 0) return "";
  const clampedIndex = Math.min(
    Math.max(previewIndex, 0),
    urls.length - 1,
  );
  return urls[clampedIndex] || "";
}
