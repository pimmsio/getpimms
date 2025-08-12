import { cn } from "../../lib/utils";
import React, { memo, useState, useCallback } from "react";
import { LinkData } from "../../types";
import useShortenedLinksCache from "../hooks/useShortenedLinksCache";
import useDomains from "../hooks/useDomains";
import useWorkspaceDomains from "../hooks/useWorkspaceDomains";
import { formatUrl } from "../utils/formatUrl";
import Button from "./ui/Button";
import DomainSelector from "./DomainSelector";
import { IconArrowLeft } from "./ui/icons";

interface HoveredLinkProps {
  link: LinkData;
  onBackToList: () => void;
  onShortenClick: (href: string, position: number, domain?: string) => Promise<boolean>;
  isLoading?: boolean;
  isDomainsLoading?: boolean;
  shortenedHref?: string | null; // when present, show copy CTA
  onCopyShortened?: (href: string) => void;
  position: number; // position in the links list
}

const HoveredLink: React.FC<HoveredLinkProps> = memo(
  ({
    link,
    onBackToList,
    onShortenClick,
    isLoading = false,
    isDomainsLoading = false,
    shortenedHref,
    onCopyShortened,
    position,
  }) => {
    const [justCopied, setJustCopied] = useState(false);
    const { domainPart, pathAndParams } = formatUrl(link.href);
    const { isWorkspaceLink } = useWorkspaceDomains();
    const isAlreadyPimms = isWorkspaceLink(link.href);
    const hasShortened = Boolean(shortenedHref);
    const { isCached, getCachedShortenedUrl } = useShortenedLinksCache();
    const isInCache = isCached(link.href, position);
    const cachedUrl = getCachedShortenedUrl(link.href, position);
    
    // Domain selection
    const { domains, isLoading: domainsLoading, error: domainsError, defaultDomain, setDefaultDomain } = useDomains();
    
    // Disable actions when domains are loading, when shortening, or when no domains available
    const hasAvailableDomains = domains.length > 0;
    const isActionDisabled = isLoading || isDomainsLoading || domainsLoading || !hasAvailableDomains;

    const handleCopyClick = useCallback(async () => {
      if (shortenedHref && onCopyShortened) {
        await onCopyShortened(shortenedHref);
        setJustCopied(true);
        // Reset the "Copied!" state after 2 seconds
        setTimeout(() => setJustCopied(false), 2000);
      }
    }, [shortenedHref, onCopyShortened]);

    const handleShortenClick = useCallback(async () => {
      const success = await onShortenClick(link.href, position, defaultDomain || undefined);
      if (isInCache && success) {
        // For cached links, show copied feedback immediately on success
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
      }
    }, [link.href, position, onShortenClick, isInCache, defaultDomain]);

    const handleCreateAndCopyClick = useCallback(async () => {
      const success = await onShortenClick(link.href, position, defaultDomain || undefined);
      // Show copied feedback only after successful creation
      if (success) {
        setJustCopied(true);
        setTimeout(() => setJustCopied(false), 2000);
      }
    }, [link.href, position, onShortenClick, defaultDomain]);

    return (
      <div className="flex h-[315px] flex-col p-3">
        {/* Back button using shadcn Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToList}
          className={cn(
            "mb-2 justify-start gap-2 text-sm font-normal",
            "text-neutral-600 hover:text-neutral-900",
          )}
        >
          <IconArrowLeft className="h-3 w-3" />
          Back to list
        </Button>

        {/* Simplified Card */}
        <div className="mb-2 flex-1 space-y-2 rounded-xl border border-neutral-200 bg-white p-2.5">
          {/* Original URL */}
          <div>
            <div className="mb-1 text-xs font-medium text-neutral-500">
              Original URL:
            </div>
            <div className="break-all font-mono text-sm text-neutral-700">
              <span className="font-semibold text-blue-600">{domainPart}</span>
              <span>{pathAndParams}</span>
            </div>
          </div>

          {/* Domain Selection */}
          {!hasShortened && !isInCache && !isAlreadyPimms && (
            <div>
              <div className="mb-1 text-xs font-medium text-neutral-500">
                Short domain:
              </div>
              {domainsLoading ? (
                <div className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                  <div className="animate-pulse">Loading domains...</div>
                </div>
              ) : domainsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Error loading domains
                </div>
              ) : !hasAvailableDomains ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                  No domains available
                </div>
              ) : (
                <DomainSelector
                  domains={domains}
                  selectedDomain={defaultDomain}
                  onDomainChange={setDefaultDomain}
                  disabled={isActionDisabled}
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* Short Link (if available) */}
          {(hasShortened || isInCache) && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-2">
              <div className="mb-1 text-xs font-medium text-green-600">
                Short link ready:
              </div>
              <div className="break-all font-mono text-xs font-medium text-green-800">
                {hasShortened ? shortenedHref : cachedUrl}
              </div>
            </div>
          )}

          {/* Manual Action Message */}
          {(hasShortened || isInCache) && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
              <div className="text-xs font-medium text-blue-800">
                A manual action is required: Please copy and paste it in your
                email.
              </div>
            </div>
          )}
        </div>

        {/* Simple Action Button - Fixed height reserved */}
        <div className="flex h-12 items-center">
          {hasShortened ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCopyClick}
              className={cn(
                "h-10 w-full transition-colors",
                justCopied && "bg-green-600 hover:bg-green-700"
              )}
              disabled={justCopied}
            >
              {justCopied ? "Copied!" : "Copy Short Link"}
            </Button>
          ) : isAlreadyPimms ? (
            <Button
              variant="outline"
              size="lg"
              disabled
              className="h-10 w-full"
            >
              Already Shortened
            </Button>
          ) : isInCache ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleShortenClick}
              loading={isLoading}
              className={cn(
                "h-10 w-full transition-colors",
                justCopied && "bg-green-600 hover:bg-green-700"
              )}
              disabled={justCopied || isActionDisabled}
            >
              {justCopied 
                ? "Copied!" 
                : domainsLoading 
                  ? "Loading domains..." 
                  : !hasAvailableDomains 
                    ? "No domains available" 
                    : "Copy Short Link"}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateAndCopyClick}
              loading={isLoading}
              className={cn(
                "h-10 w-full transition-colors",
                justCopied && "bg-green-600 hover:bg-green-700"
              )}
              disabled={justCopied || isActionDisabled}
            >
              {justCopied 
                ? "Copied!" 
                : isLoading 
                  ? "Creating..." 
                  : domainsLoading 
                    ? "Loading domains..." 
                    : !hasAvailableDomains 
                      ? "No domains available" 
                      : "Create Short Link"}
            </Button>
          )}
        </div>
      </div>
    );
  },
);

HoveredLink.displayName = "HoveredLink";

export default HoveredLink;
