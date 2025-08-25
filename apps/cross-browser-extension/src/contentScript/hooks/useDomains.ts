import { useEffect, useState } from "react";
import { DomainOption } from "../../types";
import { logger } from "../../utils/logger";
import { sendChromeMessage } from "../lib/shorten";
import { SHORT_DOMAIN } from "../../lib/constants";

const STORAGE_KEY = "pimms_default_domain";
const LAST_USED_DOMAIN_KEY = "pimms_last_used_domain";
const DOMAINS_CACHE_KEY = "pimms_domains_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Create default domain option from environment variable
function createDefaultDomain(): DomainOption {
  return {
    id: "default-short-domain",
    slug: SHORT_DOMAIN,
    verified: true,
    primary: true,
    archived: false,
  };
}

// Order domains with last used first, then default domain, then others
function orderDomains(domains: DomainOption[], lastUsedDomain: string | null): DomainOption[] {
  const defaultDomain = createDefaultDomain();
  const otherDomains = domains.filter(d => d.slug !== SHORT_DOMAIN);
  
  // Clear primary flag from all API domains - only default should be primary
  const cleanedOtherDomains = otherDomains.map(d => ({ ...d, primary: false }));
  
  if (lastUsedDomain && lastUsedDomain !== SHORT_DOMAIN) {
    // If lastUsedDomain is not SHORT_DOMAIN, put it first, then SHORT_DOMAIN, then others
    const lastUsedDomainObj = cleanedOtherDomains.find(d => d.slug === lastUsedDomain);
    const remainingDomains = cleanedOtherDomains.filter(d => d.slug !== lastUsedDomain);
    
    if (lastUsedDomainObj) {
      return [lastUsedDomainObj, defaultDomain, ...remainingDomains];
    }
  }
  
  // Default case: SHORT_DOMAIN first, then others
  return [defaultDomain, ...cleanedOtherDomains];
}

interface UsDomainsReturn {
  domains: DomainOption[];
  isLoading: boolean;
  error: string | null;
  defaultDomain: string | null;
  setDefaultDomain: (domain: string) => Promise<void>;
}

export default function useDomains(): UsDomainsReturn {
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultDomain, setDefaultDomainState] = useState<string | null>(null);
  const [lastUsedDomain, setLastUsedDomain] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [domainsFetched, setDomainsFetched] = useState(false);

  // Load default domain and last used domain from Chrome storage
  useEffect(() => {
    const loadStoredDomains = async () => {
      try {
        const result = await chrome.storage.local.get([STORAGE_KEY, LAST_USED_DOMAIN_KEY]);
        if (result[STORAGE_KEY]) {
          setDefaultDomainState(result[STORAGE_KEY]);
        }
        if (result[LAST_USED_DOMAIN_KEY]) {
          setLastUsedDomain(result[LAST_USED_DOMAIN_KEY]);
        }
        setStorageLoaded(true);
      } catch (err) {
        logger.error("Error loading stored domains:", err);
        setStorageLoaded(true);
      }
    };

    loadStoredDomains();
  }, []);

  // Fetch domains from API via offscreen script (with caching)
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cached = await chrome.storage.local.get(DOMAINS_CACHE_KEY);
        const cacheData = cached[DOMAINS_CACHE_KEY];

        if (
          cacheData &&
          cacheData.timestamp &&
          Date.now() - cacheData.timestamp < CACHE_DURATION
        ) {
          logger.debug("Using cached domains");
          const orderedDomains = orderDomains(cacheData.domains, lastUsedDomain);
          setDomains(orderedDomains);

          // If no default domain is set after loading storage, set the SHORT_DOMAIN as default
          if (!defaultDomain) {
            await setDefaultDomain(SHORT_DOMAIN);
          }

          setIsLoading(false);
          return;
        }

        logger.debug("Fetching domains via offscreen script...");

        // Get current workspace from URL or storage if needed
        const workspaceId = await getCurrentWorkspaceId();
        if (!workspaceId) {
          throw new Error("No workspace found");
        }

        logger.debug("Fetching domains for workspace:", workspaceId);

        // Send request to offscreen script for domains
        const requestId = `domains_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        logger.debug("Sending PIMMS_DOMAINS_REQUEST with requestId:", requestId);

        const result = await sendChromeMessage({
          type: "PIMMS_DOMAINS_REQUEST",
          requestId,
          workspaceId,
          _from: "content",
        });

        logger.debug("sendChromeMessage result:", result);

        if (result.__error) {
          throw new Error(`Chrome message error: ${result.__error}`);
        }

        if (result.__timeout) {
          throw new Error("Request timeout");
        }

        // Wait for the response
        const response = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Response timeout")),
            10000,
          );

          const listener = (message: any) => {
            if (
              message.type === "PIMMS_DOMAINS_RESULT" &&
              message.requestId === requestId
            ) {
              clearTimeout(timeout);
              chrome.runtime.onMessage.removeListener(listener);
              resolve(message);
            }
          };

          chrome.runtime.onMessage.addListener(listener);
        });

        if (!response.ok) {
          throw new Error(response.error || "Failed to fetch domains");
        }

        const domainsData: DomainOption[] = response.domains || [];

        // Filter to only show active, verified domains
        const activeDomains = domainsData.filter(
          (domain) => !domain.archived && domain.verified,
        );

        // Cache the domains (without the default domain to avoid duplication)
        await chrome.storage.local.set({
          [DOMAINS_CACHE_KEY]: {
            domains: activeDomains,
            timestamp: Date.now(),
          },
        });

        // Order domains with default domain and last used
        const orderedDomains = orderDomains(activeDomains, lastUsedDomain);
        setDomains(orderedDomains);

        // If no default domain is set after loading storage, set the SHORT_DOMAIN as default
        if (!defaultDomain) {
          await setDefaultDomain(SHORT_DOMAIN);
        }
      } catch (err) {
        logger.error("Error fetching domains:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch domains",
        );
        setDomains([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch domains after storage has been loaded, and only once
    if (storageLoaded && !domainsFetched) {
      setDomainsFetched(true);
      fetchDomains();
    }
  }, [storageLoaded, domainsFetched]); // Wait for storage to load before fetching domains

  // Set default domain and save to Chrome storage
  const setDefaultDomain = async (domain: string) => {
    try {
      await chrome.storage.local.set({ 
        [STORAGE_KEY]: domain,
        [LAST_USED_DOMAIN_KEY]: domain 
      });
      
      setDefaultDomainState(domain);
      setLastUsedDomain(domain);
      
      logger.debug("Default domain and last used domain saved:", domain);
    } catch (err) {
      logger.error("Error saving default domain:", err);
      throw err;
    }
  };

  return {
    domains,
    isLoading,
    error,
    defaultDomain,
    setDefaultDomain,
  };
}

// Helper function to get current workspace ID
async function getCurrentWorkspaceId(): Promise<string | null> {
  try {
    // For now, we'll use the same approach as the offscreen script
    // which gets the default workspace slug from /api/me
    // We could either duplicate that logic or simplify to use a default

    // Simple approach: try to get from storage or use a hardcoded fallback
    // The offscreen script already handles workspace detection via /api/me
    // So we can use a placeholder that will work with the API

    // For development, we can return the first available workspace
    // The offscreen script will handle the actual workspace resolution
    return "default"; // This will be replaced by proper workspace detection in offscreen
  } catch (err) {
    logger.error("Error getting workspace ID:", err);
    return null;
  }
}
