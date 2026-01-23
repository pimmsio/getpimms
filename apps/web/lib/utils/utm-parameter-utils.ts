import { normalizeUtmValue } from "@dub/utils";
import { 
  GlobePointer, 
  SatelliteDish, 
  Flag6, 
  InputSearch, 
  Page2 
} from "@dub/ui/icons";

export type UtmParameterType = "source" | "medium" | "campaign" | "term" | "content";

/**
 * Check if a UTM parameter already exists in the workspace
 */
export async function checkUtmParameterExists(
  type: UtmParameterType,
  name: string,
  workspaceId: string,
  options?: { raw?: boolean },
): Promise<boolean> {
  const isRaw = Boolean(options?.raw);
  const normalizedName = isRaw ? name : normalizeUtmValue(name);
  if (!normalizedName) return false;

  const endpoint = getUtmParameterEndpoint(type);
  
  try {
    const res = await fetch(
      `${endpoint}?workspaceId=${workspaceId}&search=${encodeURIComponent(normalizedName)}`
    );
    
    if (!res.ok) {
      return false;
    }
    
    const data = await res.json();
    
    // Check if the exact name exists
    return Array.isArray(data) && data.some(
      (item: { name: string }) => item.name === normalizedName
    );
  } catch (error) {
    console.error("Error checking UTM parameter existence:", error);
    return false;
  }
}

/**
 * Get the API endpoint for a specific UTM parameter type
 */
export function getUtmParameterEndpoint(type: UtmParameterType): string {
  const pluralMap: Record<UtmParameterType, string> = {
    source: "sources",
    medium: "mediums",
    campaign: "campaigns",
    term: "terms",
    content: "contents",
  };
  return `/api/utm-${pluralMap[type]}`;
}

/**
 * Get the icon component for a specific UTM parameter type
 */
export function getUtmParameterIcon(type: UtmParameterType): React.ComponentType<{ className?: string }> {
  const iconMap: Record<UtmParameterType, React.ComponentType<{ className?: string }>> = {
    source: GlobePointer,
    medium: SatelliteDish,
    campaign: Flag6,
    term: InputSearch,
    content: Page2,
  };
  return iconMap[type];
}

/**
 * Get the display name for a specific UTM parameter type
 */
export function getUtmParameterDisplayName(type: UtmParameterType): string {
  const displayNameMap: Record<UtmParameterType, string> = {
    source: "Source",
    medium: "Medium",
    campaign: "Campaign",
    term: "Term",
    content: "Content",
  };
  return displayNameMap[type];
}

/**
 * Get the plural form for a specific UTM parameter type
 */
export function getUtmParameterPlural(type: UtmParameterType): string {
  const pluralMap: Record<UtmParameterType, string> = {
    source: "sources",
    medium: "mediums",
    campaign: "campaigns",
    term: "terms",
    content: "contents",
  };
  return pluralMap[type];
}

/**
 * Get the placeholder text for a UTM parameter type
 */
export function getUtmParameterPlaceholder(type: UtmParameterType): string {
  const placeholderMap: Record<UtmParameterType, string> = {
    campaign: "e.g. holiday special, birthday promotion",
    medium: "e.g. post, email, ads",
    source: "e.g. linkedin, brevo, google",
    content: "Use to differentiate content e.g. email-1",
    term: "Identify the content with keywords e.g. magnet",
  };
  return placeholderMap[type];
}

