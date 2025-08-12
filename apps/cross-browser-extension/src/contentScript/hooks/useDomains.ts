import { useState, useEffect } from 'react';
import { DomainOption } from '../../types';
import { logger } from '../../utils/logger';
import { sendChromeMessage } from '../lib/shorten';

const STORAGE_KEY = 'pimms_default_domain';
const DOMAINS_CACHE_KEY = 'pimms_domains_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

  console.log('[CONTENT] useDomains hook initialized, isLoading:', true);

  // Load default domain from Chrome storage
  useEffect(() => {
    const loadDefaultDomain = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result[STORAGE_KEY]) {
          setDefaultDomainState(result[STORAGE_KEY]);
        }
      } catch (err) {
        logger.error('Error loading default domain from storage:', err);
      }
    };

    loadDefaultDomain();
  }, []);

  // Fetch domains from API via offscreen script (with caching)
  useEffect(() => {
    console.log('[CONTENT] useDomains fetchDomains useEffect triggered');
    const fetchDomains = async () => {
      try {
        console.log('[CONTENT] useDomains starting fetchDomains...');
        setIsLoading(true);
        setError(null);

        // Check cache first
        const cached = await chrome.storage.local.get(DOMAINS_CACHE_KEY);
        const cacheData = cached[DOMAINS_CACHE_KEY];
        
        if (cacheData && cacheData.timestamp && (Date.now() - cacheData.timestamp < CACHE_DURATION)) {
          logger.debug('Using cached domains');
          setDomains(cacheData.domains);
          
          // If no default domain is set and we have domains, set the primary one as default
          if (!defaultDomain && cacheData.domains.length > 0) {
            const primaryDomain = cacheData.domains.find((d: DomainOption) => d.primary)?.slug || cacheData.domains[0].slug;
            await setDefaultDomain(primaryDomain);
          }
          
          setIsLoading(false);
          return;
        }

        logger.debug('Fetching domains via offscreen script...');

        // Get current workspace from URL or storage if needed
        const workspaceId = await getCurrentWorkspaceId();
        if (!workspaceId) {
          throw new Error('No workspace found');
        }

        logger.debug('Fetching domains for workspace:', workspaceId);

        // Send request to offscreen script for domains
        const requestId = `domains_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        logger.debug('Sending PIMMS_DOMAINS_REQUEST with requestId:', requestId);
        console.log('[CONTENT] Sending PIMMS_DOMAINS_REQUEST with requestId:', requestId);
        
        const result = await sendChromeMessage({
          type: "PIMMS_DOMAINS_REQUEST",
          requestId,
          workspaceId,
          _from: "content",
        });
        
        console.log('[CONTENT] PIMMS_DOMAINS_REQUEST result:', result);
        
        logger.debug('sendChromeMessage result:', result);

        if (result.__error) {
          throw new Error(`Chrome message error: ${result.__error}`);
        }

        if (result.__timeout) {
          throw new Error('Request timeout');
        }

        // Wait for the response
        const response = await new Promise<any>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Response timeout')), 10000);
          
          const listener = (message: any) => {
            if (message.type === "PIMMS_DOMAINS_RESULT" && message.requestId === requestId) {
              clearTimeout(timeout);
              chrome.runtime.onMessage.removeListener(listener);
              resolve(message);
            }
          };

          chrome.runtime.onMessage.addListener(listener);
        });

        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch domains');
        }

        const domainsData: DomainOption[] = response.domains || [];
        
        // Filter to only show active, verified domains
        const activeDomains = domainsData.filter(domain => 
          !domain.archived && domain.verified
        );

        // Cache the domains
        await chrome.storage.local.set({ 
          [DOMAINS_CACHE_KEY]: {
            domains: activeDomains,
            timestamp: Date.now()
          }
        });

        setDomains(activeDomains);

        // If no default domain is set and we have domains, set the primary one as default
        if (!defaultDomain && activeDomains.length > 0) {
          const primaryDomain = activeDomains.find(d => d.primary)?.slug || activeDomains[0].slug;
          await setDefaultDomain(primaryDomain);
        }

      } catch (err) {
        logger.error('Error fetching domains:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch domains');
        setDomains([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomains();
  }, []); // Remove defaultDomain dependency to prevent re-fetching

  // Set default domain and save to Chrome storage
  const setDefaultDomain = async (domain: string) => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: domain });
      setDefaultDomainState(domain);
      logger.debug('Default domain saved:', domain);
    } catch (err) {
      logger.error('Error saving default domain:', err);
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
    return 'default'; // This will be replaced by proper workspace detection in offscreen
  } catch (err) {
    logger.error('Error getting workspace ID:', err);
    return null;
  }
}
