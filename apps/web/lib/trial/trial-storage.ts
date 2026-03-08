const SHOWN_KEY = "pimms_trial_modal_shown";
const DISMISS_KEY = "pimms_trial_banner_dismissed";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function readTimestampMap(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Migrate old boolean values to 0 (treated as expired)
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      result[k] = typeof v === "number" ? v : 0;
    }
    return result;
  } catch {
    return {};
  }
}

function writeTimestamp(key: string, workspaceId: string) {
  try {
    const map = readTimestampMap(key);
    map[workspaceId] = Date.now();
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore (private browsing, storage full, etc.)
  }
}

function isWithinWindow(key: string, workspaceId: string): boolean {
  const ts = readTimestampMap(key)[workspaceId];
  if (!ts) return false;
  return Date.now() - ts < THREE_DAYS_MS;
}

export function hasTrialModalBeenShown(workspaceId: string): boolean {
  return isWithinWindow(SHOWN_KEY, workspaceId);
}

export function markTrialModalShown(workspaceId: string) {
  writeTimestamp(SHOWN_KEY, workspaceId);
}

export function isTrialBannerDismissed(workspaceId: string): boolean {
  return isWithinWindow(DISMISS_KEY, workspaceId);
}

export function dismissTrialBanner(workspaceId: string) {
  writeTimestamp(DISMISS_KEY, workspaceId);
}
