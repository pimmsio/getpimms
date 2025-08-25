import React, { memo } from 'react';
import { LinkData } from '../../types';
import { cn } from '../../lib/utils';
import useWorkspaceDomains from '../hooks/useWorkspaceDomains';
import { formatUrl } from '../utils/formatUrl';
import LinkLogo from './LinkLogo';
import useShortenedLinksCache from '../hooks/useShortenedLinksCache';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/Tooltip';


interface LinksListProps {
  links: LinkData[];
  onLinkClick: (link: LinkData, position: number) => void;
  onLinkHover: (link: LinkData) => void;
  onLinkUnhover: (link: LinkData) => void;
  shortenedById?: Record<string, string>;
}

interface LinkItemProps {
  link: LinkData;
  index: number;
  onLinkClick: (link: LinkData, position: number) => void;
  onLinkHover: (link: LinkData) => void;
  onLinkUnhover: (link: LinkData) => void;
  isCurrentlyShortened: string | undefined;
  isInCache: boolean;
}

const LinkItem: React.FC<LinkItemProps> = memo(({ 
  link, 
  index, 
  onLinkClick, 
  onLinkHover, 
  onLinkUnhover, 
  isCurrentlyShortened, 
  isInCache 
}) => {
  const { domainPart, pathAndParams } = formatUrl(link.href);
  const { isWorkspaceLink } = useWorkspaceDomains();
  const isPimmsShortLink = isWorkspaceLink(link.href);
  
  // Show "Manual action required" only if URL is in cache but THIS specific link hasn't been shortened via UI
  const shouldShowReady = !isPimmsShortLink && !isCurrentlyShortened && isInCache;

  return (
    <div
      key={link.id}
      onClick={() => onLinkClick(link, index)}
      onMouseEnter={() => onLinkHover(link)}
      onMouseLeave={() => onLinkUnhover(link)}
      className={cn(
        "group flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-2.5 text-sm",
        "transition-colors duration-150 hover:bg-neutral-50 cursor-pointer"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-inset ring-[#cfe0ff]">
          <LinkLogo href={link.href} className="h-6 w-6 rounded-full" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[13px]">
            <span className="truncate">
              <span className="font-semibold text-[#3971ff]">{domainPart}</span>
              <span className="text-neutral-800">{pathAndParams}</span>
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[12px] text-neutral-500">
            <span className="opacity-70">↳</span>
            <span className="truncate">{link.text || link.href}</span>
          </div>
        </div>
      </div>
      {/* Status badges */}
      {isPimmsShortLink && (
        <span
          className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
          title="Already a pim.ms short link"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8.5 12.086 5.707 9.293a1 1 0 10-1.414 1.414l3.5 3.5a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          Short link
        </span>
      )}
      {!isPimmsShortLink && isCurrentlyShortened && (
        <span
          className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700"
          title="Shortened via PIMMS panel"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8.5 12.086 5.707 9.293a1 1 0 10-1.414 1.414l3.5 3.5a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          Shortened
        </span>
      )}
      {shouldShowReady && (
        <Tooltip 
          content="Short link already created - Click to copy and paste in your email"
          side="top"
        >
          <span className="ml-2 inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 cursor-help">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Manual action required
          </span>
        </Tooltip>
      )}
    </div>
  );
});

LinkItem.displayName = 'LinkItem';

const LinksList: React.FC<LinksListProps> = memo(({ links, onLinkClick, onLinkHover, onLinkUnhover, shortenedById = {} }) => {
  const { isCached } = useShortenedLinksCache();

  return (
    <div className="h-[340px] overflow-y-auto">
      {links.map((link, index) => {
        const isCurrentlyShortened = shortenedById[link.id]; // Shortened via UI in this session
        const isInCache = isCached(link.href, index); // Available in cache at this position

        return (
          <LinkItem
            key={link.id}
            link={link}
            index={index}
            onLinkClick={onLinkClick}
            onLinkHover={onLinkHover}
            onLinkUnhover={onLinkUnhover}
            isCurrentlyShortened={isCurrentlyShortened}
            isInCache={isInCache}
          />
        );
      })}
    </div>
  );
});

LinksList.displayName = 'LinksList';

export default LinksList;
