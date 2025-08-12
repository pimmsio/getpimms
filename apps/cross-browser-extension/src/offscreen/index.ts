// Offscreen document script: performs cross-origin fetches and returns results
import { APP_DOMAIN } from "../lib/constants";
import { AUTH_STORAGE_KEYS } from "../lib/storage";

// Helper to handle auth errors
const handleAuthError = async (response: Response, source: string) => {
  if (response.status === 401) {
    // 401 is always an auth error
    console.log(
      `[OFFSCREEN] Auth error (${response.status}) from ${source}, clearing storage`,
    );

    chrome.runtime.sendMessage({
      type: "PIMMS_AUTH_ERROR",
      status: response.status,
      source,
    });

    return true;
  }

  if (response.status === 403) {
    // 403 could be auth error OR business logic error (like link limits)
    try {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

      // Check if it's a link limit error or other business logic error
      // API errors are nested under 'error' property: { error: { code, message } }
      const errorInfo = data?.error || data; // Handle both formats
      const isLimitError =
        errorInfo?.code === "forbidden" &&
        errorInfo?.message &&
        (errorInfo.message.toLowerCase().includes("limit") ||
          errorInfo.message.toLowerCase().includes("reached") ||
          errorInfo.message.toLowerCase().includes("upgrade"));

      if (isLimitError) {
        // This is a business logic error (link limit), not an auth error
        console.log(
          `[OFFSCREEN] Business logic error (${response.status}) from ${source}: ${errorInfo.message}`,
        );
        return false;
      }
    } catch (e) {
      // If we can't parse the response, treat 403 as auth error
      console.log(`[OFFSCREEN] Failed to parse 403 response:`, e);
    }

    // Default: treat 403 as auth error
    console.log(
      `[OFFSCREEN] Auth error (${response.status}) from ${source}, clearing storage`,
    );

    chrome.runtime.sendMessage({
      type: "PIMMS_AUTH_ERROR",
      status: response.status,
      source,
    });

    return true;
  }

  return false;
};

// Helper to get auth headers (now relies on cookies only)
const getAuthHeaders = async (): Promise<HeadersInit> => {
  return {
    "Content-Type": "application/json",
  };
};

let cachedWorkspaceSlug: string | null = null;
let lastWorkspaceFetchTs = 0;
const WORKSPACE_CACHE_MS = 5 * 60 * 1000;

// Global singleton to prevent any duplicate calls
let globalWorkspacePromise: Promise<string | null> | null = null;

// Global singleton for CHECK_AUTH deduplication
let globalAuthCheckPromise: Promise<any> | null = null;

async function handleCheckAuth(
  requestId: string,
  storageData: any,
): Promise<any> {
  console.log(
    `[OFFSCREEN] handleCheckAuth called with requestId: ${requestId}`,
  );

  // If auth check is already in progress, wait for it and return the same result
  if (globalAuthCheckPromise) {
    console.log(
      `[OFFSCREEN] Auth check already in progress, waiting for result...`,
    );
    const result = await globalAuthCheckPromise;
    // Send the result with the current requestId
    chrome.runtime.sendMessage({
      ...result,
      requestId, // Override with current requestId
    });
    return result;
  }

  console.log(`[OFFSCREEN] Starting new auth check...`);

  // Create the global promise that all callers will share
  globalAuthCheckPromise = performAuthCheck(storageData);

  try {
    const result = await globalAuthCheckPromise;
    console.log(`[OFFSCREEN] Auth check completed, result:`, result);

    // Send result with current requestId
    chrome.runtime.sendMessage({
      ...result,
      requestId,
    });

    return result;
  } finally {
    // Clear the global promise so future calls can create a new one
    globalAuthCheckPromise = null;
  }
}

async function performAuthCheck(storageData: any): Promise<any> {
  try {
    console.log("[OFFSCREEN] performAuthCheck: Making /api/me request...");

    // Check if we have auth status in storage (user data)
    if (
      storageData &&
      storageData[AUTH_STORAGE_KEYS.STATUS] === "authenticated" &&
      storageData[AUTH_STORAGE_KEYS.USER]
    ) {
      // Test auth by making an API call (cookies will be sent automatically)
      try {
        const headers = await getAuthHeaders();
        const meRes = await fetch(`${APP_DOMAIN}/api/me`, {
          headers,
          credentials: "include",
        });

        if (meRes.ok) {
          const userData = await meRes.json();
          return {
            type: "CHECK_AUTH_RESULT",
            ok: true,
            user: userData,
          };
        } else if (meRes.status === 401) {
          // Session expired, clear auth
          chrome.runtime.sendMessage({
            type: "PIMMS_AUTH_ERROR",
            source: "session_expired",
          });
          return {
            type: "CHECK_AUTH_RESULT",
            ok: false,
            user: null,
          };
        } else {
          // Non-auth error (403, 500, network issue) - don't treat as logout
          // Since we had valid storage data, assume user is still logged in
          console.log(
            "[OFFSCREEN][CHECK_AUTH] API call failed with non-auth error, status:",
            meRes.status,
            "- assuming user still logged in due to valid storage"
          );
          return {
            type: "CHECK_AUTH_RESULT",
            ok: true,  // Assume still logged in since we have storage data
            user: storageData[AUTH_STORAGE_KEYS.USER], // Use cached user data
            error: `HTTP ${meRes.status}: ${meRes.statusText}`,
            isConnectionError: true,
            hadStorageData: true, // Flag to indicate we had cached auth data
          };
        }
      } catch (error) {
        console.error("[OFFSCREEN][CHECK_AUTH] Error testing session:", error);
        // Network/connection error - assume still logged in since we have storage data
        return {
          type: "CHECK_AUTH_RESULT",
          ok: true,  // Assume still logged in since we have storage data
          user: storageData[AUTH_STORAGE_KEYS.USER], // Use cached user data
          error: String(error),
          isConnectionError: true,
          hadStorageData: true, // Flag to indicate we had cached auth data
        };
      }
    } else {
      return {
        type: "CHECK_AUTH_RESULT",
        ok: false,
        user: null,
      };
    }
  } catch (error) {
    console.error("[OFFSCREEN][CHECK_AUTH] Error in performAuthCheck:", error);
    return {
      type: "CHECK_AUTH_RESULT",
      ok: false,
      user: null,
      error: String(error),
      isConnectionError: true,
    };
  }
}

async function getDefaultWorkspaceSlug(
  caller = "unknown",
): Promise<string | null> {
  const now = Date.now();

  console.log(`[OFFSCREEN] getDefaultWorkspaceSlug called by: ${caller}`);

  // Return cached result if still valid
  if (cachedWorkspaceSlug && now - lastWorkspaceFetchTs < WORKSPACE_CACHE_MS) {
    console.log(
      `[OFFSCREEN] ${caller}: Using cached workspace slug:`,
      cachedWorkspaceSlug,
    );
    return cachedWorkspaceSlug;
  }

  // GLOBAL singleton - if ANY call is in progress, wait for it
  if (globalWorkspacePromise) {
    console.log(
      `[OFFSCREEN] ${caller}: Waiting for global workspace fetch in progress...`,
    );
    return globalWorkspacePromise;
  }

  console.log(`[OFFSCREEN] ${caller}: Starting new global workspace fetch...`);

  // Create the global promise that all callers will share
  globalWorkspacePromise = fetchWorkspaceSlug();

  try {
    const result = await globalWorkspacePromise;
    console.log(
      `[OFFSCREEN] ${caller}: Global fetch completed, result:`,
      result,
    );
    return result;
  } finally {
    // Clear the global promise so future calls can create a new one
    globalWorkspacePromise = null;
  }
}

async function fetchWorkspaceSlug(): Promise<string | null> {
  const now = Date.now();
  console.log("[OFFSCREEN] fetchWorkspaceSlug: Making /api/me request...");
  try {
    const headers = await getAuthHeaders();
    const meRes = await fetch(`${APP_DOMAIN}/api/me`, { headers });

    // Check for auth errors
    if (await handleAuthError(meRes, "me")) {
      return null; // Stop processing if auth error detected
    }

    if (meRes.ok) {
      const me = await meRes.json().catch(() => null as any);
      const slug = (me?.defaultWorkspace as string | null) || null;
      if (slug) {
        cachedWorkspaceSlug = slug;
        lastWorkspaceFetchTs = now;
        return slug;
      }
    }
  } catch {}
  try {
    const headers = await getAuthHeaders();
    const wsRes = await fetch(`${APP_DOMAIN}/api/workspaces`, { headers });
    if (wsRes.ok) {
      const list = await wsRes.json().catch(() => [] as any[]);
      const slug =
        Array.isArray(list) && list.length > 0 && list[0]?.slug
          ? (list[0].slug as string)
          : null;
      if (slug) {
        cachedWorkspaceSlug = slug;
        lastWorkspaceFetchTs = now;
        return slug;
      }
    }
  } catch {}
  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;
  // Only process requests forwarded by the background to avoid double-processing
  if (
    message.type === "PIMMS_SHORTEN_REQUEST" &&
    (message.forwarded === true || message._from === "background")
  ) {
    const {
      href,
      domain,
      requestId,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
    } = message as any;

    (async () => {
      try {
        const slug = await getDefaultWorkspaceSlug("shorten");
        const url = slug
          ? `${APP_DOMAIN}/api/links?projectSlug=${encodeURIComponent(slug)}`
          : `${APP_DOMAIN}/api/links`;
        const headers = await getAuthHeaders();

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            url: href,
            domain: domain ?? null,
            utm_source: utm_source ?? null,
            utm_medium: utm_medium ?? null,
            utm_campaign: utm_campaign ?? null,
            utm_term: utm_term ?? null,
            utm_content: utm_content ?? null,
          }),
        });

        // Check for auth errors
        if (await handleAuthError(res, "shorten")) {
          return; // Stop processing if auth error detected
        }

        const data = await res.json().catch(() => ({}));
        const shortened =
          data?.shortLink ||
          data?.short_url ||
          data?.shortUrl ||
          data?.link ||
          data?.url;

        chrome.runtime.sendMessage({
          type: "PIMMS_SHORTEN_RESULT",
          requestId,
          ok: res.ok,
          status: res.status,
          data: res.ok ? { shortened, raw: data } : { error: data },
        });
      } catch (error) {
        console.error("[OFFSCREEN] Error during fetch", error);
        chrome.runtime.sendMessage({
          type: "PIMMS_SHORTEN_RESULT",
          requestId,
          ok: false,
          status: 0,
          data: { error: String(error) },
        });
      }
    })();
    return false; // async
  }
  if (
    message.type === "PIMMS_ANALYTICS_REQUEST" &&
    (message.forwarded === true || message._from === "background")
  ) {
    const { requestId, utm_source, utm_medium, utm_campaign } = message as any;
    (async () => {
      try {
        const qs = new URLSearchParams();
        // if (utm_source) qs.set('utm_source', utm_source);
        // if (utm_medium) qs.set('utm_medium', utm_medium);
        if (utm_campaign) qs.set("utm_campaign", utm_campaign);
        const slug = await getDefaultWorkspaceSlug("analytics");
        if (slug) qs.set("projectSlug", slug);
        const url = `${APP_DOMAIN}/api/analytics?${qs.toString()}`;
        const headers = await getAuthHeaders();
        const res = await fetch(url, { headers });

        // Check for auth errors
        if (await handleAuthError(res, "analytics")) {
          return; // Stop processing if auth error detected
        }

        // Handle other HTTP errors
        if (!res.ok) {
          console.log(`[OFFSCREEN] Analytics API error (${res.status}) from analytics: ${res.statusText}`);
          chrome.runtime.sendMessage({
            type: "PIMMS_ANALYTICS_RESULT",
            requestId,
            ok: false,
            status: res.status,
            error: `HTTP ${res.status}: ${res.statusText}`,
          });
          return;
        }

        const data = await res.json().catch(() => ({}) as any);
        let totals = (data?.totals || data?.summary || {}) as any;
        if (
          !totals ||
          (typeof totals === "object" && Object.keys(totals).length === 0)
        ) {
          // Support flat responses: clicks, leads, sales, saleAmount at top-level
          totals = {
            clicks: Number(data?.clicks ?? 0),
            leads: Number(data?.leads ?? 0),
            sales: Number(data?.sales ?? 0),
            saleAmount: Number(data?.saleAmount ?? 0),
          };
        }
        const timeseries = (data?.timeseries ||
          data?.series ||
          data?.timeSeries ||
          []) as any[];

        chrome.runtime.sendMessage({
          type: "PIMMS_ANALYTICS_RESULT",
          requestId,
          ok: res.ok,
          totals,
          timeseries,
        });
      } catch (e) {
        chrome.runtime.sendMessage({
          type: "PIMMS_ANALYTICS_RESULT",
          requestId,
          ok: false,
          error: String(e),
        });
      }
    })();
    return false;
  }
  if (
    message.type === "CHECK_AUTH" &&
    (message.forwarded === true || message._from === "background")
  ) {
    const { requestId, storageData } = message as any;
    (async () => {
      await handleCheckAuth(requestId, storageData);
    })();
    return false;
  }
  if (
    message.type === "PIMMS_WORKSPACE_REQUEST" &&
    (message.forwarded === true || message._from === "background")
  ) {
    const { requestId, workspaceSlug } = message as any;
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `${APP_DOMAIN}/api/workspaces/${encodeURIComponent(workspaceSlug)}`,
          {
            headers,
            cache: "no-store",
          },
        );

        // Check for auth errors
        if (await handleAuthError(res, "workspace")) {
          return; // Stop processing if auth error detected
        }

        let workspace: any = null;
        if (res.ok) {
          workspace = await res.json().catch(() => null);
        }
        chrome.runtime.sendMessage({
          type: "PIMMS_WORKSPACE_RESULT",
          requestId,
          ok: res.ok,
          workspace,
        });
      } catch (e) {
        chrome.runtime.sendMessage({
          type: "PIMMS_WORKSPACE_RESULT",
          requestId,
          ok: false,
          error: String(e),
        });
      }
    })();
    return false;
  }
  if (
    message.type === "PIMMS_DOMAINS_REQUEST" &&
    (message.forwarded === true || message._from === "background")
  ) {
    const { requestId, workspaceId } = message as any;
    console.log("[OFFSCREEN] Received PIMMS_DOMAINS_REQUEST", {
      requestId,
      workspaceId,
    });
    (async () => {
      try {
        const slug = await getDefaultWorkspaceSlug("domains");
        const headers = await getAuthHeaders();
        const apiUrl = slug
          ? `${APP_DOMAIN}/api/domains?workspaceId=${encodeURIComponent(slug)}`
          : `${APP_DOMAIN}/api/domains`;

        console.log("[OFFSCREEN] Fetching domains from:", apiUrl);

        const res = await fetch(apiUrl, {
          headers,
        });

        console.log("[OFFSCREEN] Domains API response status:", res.status);

        // Check for auth errors
        if (await handleAuthError(res, "domains")) {
          return; // Stop processing if auth error detected
        }

        let domains: any[] = [];
        if (res.ok) {
          domains = await res.json().catch(() => []);
        }

        chrome.runtime.sendMessage({
          type: "PIMMS_DOMAINS_RESULT",
          requestId,
          ok: res.ok,
          domains,
        });
      } catch (e) {
        chrome.runtime.sendMessage({
          type: "PIMMS_DOMAINS_RESULT",
          requestId,
          ok: false,
          error: String(e),
        });
      }
    })();
    return false;
  }
  return false;
});
