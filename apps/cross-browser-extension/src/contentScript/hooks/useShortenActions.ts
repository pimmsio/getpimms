import { useCallback, useEffect } from "react";
import { LinkData } from "../../types";
import { logger } from "../../utils/logger";
import { shortenViaOffscreen, copyToClipboard } from "../lib/shorten";
import { toast } from "../components/ui/Toast";
import useWorkspaceDomains from "./useWorkspaceDomains";
import useShortenedLinksCache from "./useShortenedLinksCache";
import useUserData from "./useUserData";
import { APP_DOMAIN } from "../../lib/constants";
import { getCurrentDomainConfig } from "../utils/normalizeUrl";

export interface ShortenActionsHook {
  handleShortenClick: (href: string, position: number, domain?: string) => Promise<boolean>;
  handleCopyShortened: (href: string) => Promise<void>;
}

interface UseShortenActionsProps {
  hoveredLink: LinkData | null;
  isShortening: boolean;
  setIsShortening: (shortening: boolean) => void;
  setShortenedById: (setter: (prev: Record<string, string>) => Record<string, string>) => void;
  links: LinkData[];
}

const showToast = (type: 'success' | 'error', title: string, description: string) => {
  console.log('[SHORTEN] showToast called with:', { type, title, description });
  toast({ type, title, description });
};

export default function useShortenActions({
  hoveredLink,
  isShortening,
  setIsShortening,
  setShortenedById,
  links,
}: UseShortenActionsProps): ShortenActionsHook {
  const { getCachedShortenedUrl, setCachedShortenedUrl, updatePositions, findExactUrlMatch } = useShortenedLinksCache();
  const { workspace } = useUserData();
  const { isWorkspaceLink } = useWorkspaceDomains();
  
  // Update cache positions when links change (but only if we have links)
  useEffect(() => {
    if (links.length > 0) {
      updatePositions(links);
    }
  }, [links, updatePositions]);
  
  const handleShortenClick = useCallback(async (href: string, position: number, domain?: string): Promise<boolean> => {
    if (isWorkspaceLink(href)) {
      showToast("error", "Already a workspace link", "This URL is already shortened with your workspace domain.");
      return false;
    }
    
    if (isShortening || !hoveredLink) {
      return false;
    }
    
    // Check if this URL at this position is already cached
    const cachedUrl = getCachedShortenedUrl(href, position);
    if (cachedUrl) {
      console.log('[SHORTEN] CACHED PATH: Using cached URL and showing success toast');
      // DON'T update shortenedById for cached URLs - keep them in "cache" state
      copyToClipboard(cachedUrl);
      showToast("success", "Short link copied", "Saved short link copied to clipboard - paste it in your email.");
      return true;
    }
    
    // Check for exact URL match if uniqueShortLinkPerUrl is enabled for current domain
    const domainConfig = getCurrentDomainConfig();
    if (domainConfig?.uniqueShortLinkPerUrl) {
      const exactMatchUrl = findExactUrlMatch(href);
      if (exactMatchUrl) {
        // Add to cache to show "Manual action required" in the list (not "Shortened")
        setCachedShortenedUrl(href, position, exactMatchUrl);
        copyToClipboard(exactMatchUrl);
        showToast("success", "Existing short link copied", "Found existing short link for this URL - copied to clipboard.");
        return true;
      }
    }
    
    try {
      setIsShortening(true);
      const result = await shortenViaOffscreen(href, domain);

      console.log('[SHORTEN] Result ok:', result.ok, 'shortened:', result.shortened, 'status:', result.status);
      
      if (result.ok && result.shortened && result.status !== 403) {
        console.log('[SHORTEN] SUCCESS PATH: Copying to clipboard and showing success toast');
        // Save to cache with position and current session state
        setCachedShortenedUrl(href, position, result.shortened);
        setShortenedById((prev) => ({ ...prev, [hoveredLink.id]: result.shortened! }));
        copyToClipboard(result.shortened!);
        showToast("success", "Link shortened successfully", "New short link copied to clipboard.");
        return true;
      } else {
        // Check if it's a link limit error
        const errorData = result.error || {};
        console.log('[SHORTEN] Full error result:', result);
        console.log('[SHORTEN] Error data:', errorData);
        
        // Handle both nested format { error: { code, message } } and flat format { code, message }
        const errorInfo = (typeof errorData === 'object' && errorData && 'error' in errorData) 
          ? errorData.error 
          : errorData;
        console.log('[SHORTEN] Error info:', errorInfo);
        
        const isLimitError = typeof errorInfo === 'object' && 
          errorInfo && 
          'code' in errorInfo && 
          'message' in errorInfo &&
          errorInfo.code === 'forbidden' && 
          typeof errorInfo.message === 'string' &&
          (errorInfo.message.toLowerCase().includes('limit') ||
           errorInfo.message.toLowerCase().includes('reached') ||
           errorInfo.message.toLowerCase().includes('upgrade'));
        
        console.log('[SHORTEN] Is limit error:', isLimitError);
        
        if (isLimitError) {
          // Show upgrade message for limit errors with action button
          const upgradeUrl = workspace?.slug ? `${APP_DOMAIN}/${workspace.slug}/upgrade` : `${APP_DOMAIN}/upgrade`;
          console.log('[SHORTEN] Showing upgrade toast with URL:', upgradeUrl);
          toast({
            type: "error",
            title: "Link limit reached",
            description: "You've reached your monthly link limit. Upgrade your plan to create more links.",
            action: {
              label: "Upgrade Plan",
              action: () => window.open(upgradeUrl, '_blank')
            }
          });
          console.log('[SHORTEN] Upgrade toast called');
        } else {
          console.log('[SHORTEN] Showing generic error toast');
          showToast("error", "Failed to shorten link", "Please try again.");
        }
        return false;
      }
    } catch (e) {
      logger.error("PANEL: Error shortening link", e);
      showToast("error", "Failed to shorten link", "Please try again.");
      return false;
    } finally {
      setIsShortening(false);
    }
  }, [hoveredLink, isShortening, setIsShortening, setShortenedById, getCachedShortenedUrl, setCachedShortenedUrl, isWorkspaceLink]);

  const handleCopyShortened = useCallback(async (href: string) => {
    console.log('[SHORTEN] COPY SHORTENED PATH: Copying existing shortened URL');
    const success = await copyToClipboard(href);
    showToast(
      success ? 'success' : 'error',
      success ? 'Copied' : 'Copy failed',
      success ? 'Short link copied to clipboard.' : 'Please copy the link manually.'
    );
  }, []);

  return {
    handleShortenClick,
    handleCopyShortened,
  };
}
