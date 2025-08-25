import { APP_DOMAIN, CBE_DOMAIN } from "../lib/constants";
import { logger } from "../utils/logger";
import { EMAIL_MARKETING_DOMAINS } from "../contentScript/../types";
import { AUTH_STORAGE_KEYS, AUTH_STORAGE_KEYS_ARRAY } from "../lib/storage";

const reqToTab = new Map<string, number>(); // requestId -> tabId
let creatingOffscreen: Promise<void> | null = null;

const ensureOffscreenDocument = async (): Promise<void> => {
  if (!chrome.offscreen?.createDocument) return;
  if (creatingOffscreen) { await creatingOffscreen; return; }
  
  try {
    if ((chrome.offscreen as any)?.hasDocument) {
      const has = await (chrome.offscreen as any).hasDocument();
      if (has) return;
    }
    
    creatingOffscreen = chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("offscreen.html"),
      reasons: [(chrome.offscreen as any).Reason?.IFRAME_SCRIPTING || "IFRAME_SCRIPTING"],
      justification: "PIMMS cross-origin fetch",
    } as any).finally(() => { creatingOffscreen = null; });
    
    await creatingOffscreen;
  } catch (e) {
    logger.warn("offscreen ensure failed", e);
  }
};

// Clear auth storage and notify all tabs
const clearAuthAndNotify = async (source: string) => {
  logger.info("🚪 Clearing auth storage and cookies", { source });
  
  // Clear extension storage
  await chrome.storage.local.remove(AUTH_STORAGE_KEYS_ARRAY);

  // Clear session cookies - determine domain from APP_DOMAIN
  try {
    // Extract domain from APP_DOMAIN (similar to API logic)
    const url = new URL(APP_DOMAIN);
    const host = url.hostname;
    
    let cookieDomain: string;
    if (host.includes("localhost")) {
      cookieDomain = ".localhost";
    } else {
      // For production, extract root domain (e.g., "pimms.io" from "app.pimms.io")
      cookieDomain = `.${host.split('.').slice(-2).join('.')}`;
    }
    
    const cookies = await chrome.cookies.getAll({ domain: cookieDomain });
    for (const cookie of cookies) {
      if (cookie.name.includes("next-auth")) {
        await chrome.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
      }
    }
  } catch (error) {
    logger.error("Failed to clear cookies", error);
  }
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs
          .sendMessage(tab.id, {
            type: "PIMMS_AUTH_STATUS_CHANGED",
            status: "unauthenticated",
          })
          .catch(() => {});
      }
    });
  });
  
  logger.info("✅ Auth and cookies cleared successfully", { source });
};

const forwardToOffscreen = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (resp: any) => void) => {
  (async () => {
    await ensureOffscreenDocument();
    const tabId = sender.tab?.id;
    if (tabId && message.requestId) {
      reqToTab.set(message.requestId, tabId);
    }
    
    // For CHECK_AUTH, include storage data
    if (message.type === 'CHECK_AUTH') {
              const storageData = await chrome.storage.local.get(AUTH_STORAGE_KEYS_ARRAY);
      chrome.runtime.sendMessage({ ...message, forwarded: true, _from: "background", storageData });
    } else {
      chrome.runtime.sendMessage({ ...message, forwarded: true, _from: "background" });
    }
    
    sendResponse({ ok: true });
  })();
  return true;
};

logger.info("🚀 PIMMS Background script loaded");
ensureOffscreenDocument();

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: CBE_DOMAIN });
});

chrome.runtime.onInstalled.addListener((details) => {
  ensureOffscreenDocument();
  if (details.reason === "install") {
    chrome.tabs.create({ url: `${CBE_DOMAIN}/register` });
  }
});

// Listen to internal messages (from content scripts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
    switch (message.type) {
      case "PIMMS_SHOULD_INJECT": {
        try {
          const href: string = message.href || sender.tab?.url || "";
          const host = (() => {
            try { return new URL(href).hostname.toLowerCase(); } catch { return ""; }
          })();
          const cfg = EMAIL_MARKETING_DOMAINS.find(d => host === d.domain || host.endsWith(`.${d.domain}`));
          if (!cfg) { sendResponse({ ok: false, reason: "host_not_supported" }); return false; }

          const patterns: string[] = [];
          if (cfg.detectionPageUrlPattern) patterns.push(cfg.detectionPageUrlPattern);
          if (cfg.analyticsPageUrlPattern) patterns.push(cfg.analyticsPageUrlPattern);
          if (Array.isArray(cfg.onboardingPageUrlPatterns)) patterns.push(...cfg.onboardingPageUrlPatterns);
          const allowed = patterns.some(p => {
            try { return new RegExp(p).test(href); } catch { return false; }
          });
          sendResponse({ ok: allowed, reason: allowed ? "matched" : "no_pattern_match" });
          return true;
        } catch {
          sendResponse({ ok: false, reason: "error" });
          return true;
        }
      }
      case "PIMMS_INJECT_CONTENT_BUNDLE":
        try {
          chrome.scripting.executeScript({
            target: { tabId: sender.tab?.id!, allFrames: false },
            files: ["static/js/contentScript.bundle.js"],
          });
        } catch {}
        return false;
      case "ENSURE_OFFSCREEN":
        (async () => { await ensureOffscreenDocument(); sendResponse({ ok: true }); })();
        return true;

      case "GET_EXTENSION_AUTH":
        (async () => {
          try {
            const storage = await chrome.storage.local.get([AUTH_STORAGE_KEYS.STATUS, AUTH_STORAGE_KEYS.USER]);
            
            if (storage[AUTH_STORAGE_KEYS.STATUS] === 'authenticated' && storage[AUTH_STORAGE_KEYS.USER]) {
              sendResponse({ 
                auth: {
                  user: storage[AUTH_STORAGE_KEYS.USER],
                  status: storage[AUTH_STORAGE_KEYS.STATUS]
                }
              });
            } else {
              sendResponse({ auth: null });
            }
          } catch (error) {
            sendResponse({ auth: null });
          }
        })();
        return true;
      case "PIMMS_SHORTEN_REQUEST":
      case "PIMMS_ANALYTICS_REQUEST":
      case "CHECK_AUTH":
      case "PIMMS_WORKSPACE_REQUEST":
      case "PIMMS_DOMAINS_REQUEST":
        console.log('[BACKGROUND] Forwarding to offscreen:', message.type);
        return forwardToOffscreen(message, sender, sendResponse);
      case "PIMMS_SHORTEN_RESULT":
      case "PIMMS_ANALYTICS_RESULT":
      case "CHECK_AUTH_RESULT":
      case "PIMMS_WORKSPACE_RESULT":
      case "PIMMS_DOMAINS_RESULT": {
        const requestId = message.requestId as string | undefined;
        if (requestId && reqToTab.has(requestId)) {
          const tabId = reqToTab.get(requestId)!;
          chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error('[BACKGROUND] Error sending message to tab:', chrome.runtime.lastError.message);
            } else {
              console.log('[BACKGROUND] Message sent successfully to tab:', tabId);
            }
          });
          reqToTab.delete(requestId);
        } else {
        }
        return false;
      }
      case "PIMMS_AUTH_ERROR":
        clearAuthAndNotify(`offscreen_${message.source || 'unknown'}`);
        return false;
      case "OPEN_WEB_APP":
        chrome.tabs.create({ url: message.url || APP_DOMAIN });
        return false;

      default:
        return false;
    }
  } catch {
    return false;
  }
});

// Listen to external messages (from web pages)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  logger.info("🌐 External message received", message.type, "from", sender.url);
  
  try {
    switch (message.type) {
      case "PIMMS_AUTH_SUCCESS": {
        // Set the NextAuth session cookie for domain sharing
        logger.info("🔐 Received auth success from web app", message.user?.email);
        
        (async () => {
          try {
            // Try to set the session cookie, but don't fail if it doesn't work
            // The extension can still function without cross-domain cookie sharing
            if (message.sessionCookie) {
              const cookie = message.sessionCookie;
              
              logger.info("🍪 Processing session cookie:", {
                name: cookie.name,
                domain: cookie.domain,
                appDomain: APP_DOMAIN,
                expires: cookie.expires
              });
              
              try {
                // For __Secure- prefixed cookies, we need HTTPS and secure flag
                const isSecureCookie = cookie.name.startsWith('__Secure-');
                const appUrl = new URL(APP_DOMAIN);
                const isHttps = appUrl.protocol === 'https:';
                
                // If it's a secure cookie but we're not on HTTPS, skip cookie setting
                if (isSecureCookie && !isHttps) {
                  logger.warn("⚠️ Skipping __Secure- cookie on non-HTTPS domain", {
                    cookieName: cookie.name,
                    appDomain: APP_DOMAIN,
                    isHttps
                  });
                } else {
                  // Set cookie for the root domain (e.g., .pimms.io) so it works across all subdomains
                  const cookieOptions = {
                    url: APP_DOMAIN, // Use APP_DOMAIN as the URL for the cookie API call
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain, // This should be the root domain like .pimms.io from the API
                    path: cookie.path,
                    secure: isSecureCookie || isHttps, // Set secure flag for __Secure- cookies or HTTPS
                    sameSite: "lax" as chrome.cookies.SameSiteStatus,
                    expirationDate: Math.floor(new Date(cookie.expires).getTime() / 1000),
                  };
                  
                  logger.info(`🍪 Setting cookie for root domain ${cookie.domain}:`, cookieOptions);
                  
                  try {
                    const result = await chrome.cookies.set(cookieOptions);
                    logger.info(`🍪 Cookie set successfully for root domain:`, result);
                  } catch (cookieError) {
                    logger.warn(`🍪 Cookie setting failed for root domain:`, cookieError);
                  }
                }
              } catch (cookieError) {
                logger.warn("⚠️ Cookie processing failed, but proceeding with authentication:", cookieError);
              }
            }
            
            // Still store user data for extension use
            await chrome.storage.local.set({
              [AUTH_STORAGE_KEYS.USER]: message.user,
              [AUTH_STORAGE_KEYS.STATUS]: 'authenticated'
            });
            
            // Notify all tabs about auth status change  
            chrome.tabs.query({}, (tabs) => {
              tabs.forEach(tab => {
                if (tab.id) {
                  chrome.tabs.sendMessage(tab.id, {
                    type: 'PIMMS_AUTH_STATUS_CHANGED',
                    status: 'authenticated'
                  }).catch(() => {
                    // Ignore errors for tabs without content scripts
                  });
                }
              });
            });
            
            logger.info("✅ Auth status change broadcasted to all tabs");
            
            sendResponse({ success: true });
          } catch (error) {
            logger.error("❌ Failed to process auth success", error);
            
            // Don't fail the entire process for cookie-related errors since we've made them non-fatal
            // Only fail for critical errors like storage failures
            if (String(error).includes('storage') || String(error).includes('chrome.storage')) {
              sendResponse({ success: false, error: "Failed to store authentication data in extension" });
            } else {
              // For other errors (like cookie issues), still report success since user data was stored
              logger.warn("⚠️ Non-critical auth error, but user is still authenticated:", error);
              sendResponse({ success: true });
            }
          }
        })();
        return true;
      }
      case "PIMMS_AUTH_ERROR":
      case "PIMMS_LOGOUT":
        (async () => {
          try {
            await clearAuthAndNotify('external_web_page');
            sendResponse({ success: true });
          } catch (error) {
            sendResponse({ success: false, error: String(error) });
          }
        })();
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
});
