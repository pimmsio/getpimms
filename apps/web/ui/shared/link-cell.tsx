"use client";

import useDomain from "@/lib/swr/use-domain";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  CopyButton,
  LinkLogo,
  Tooltip,
  TooltipContent,
  useInViewport,
} from "@dub/ui";
import { ArrowTurnRight2, Check2 } from "@dub/ui/icons";
import {
  cn,
  formatDateTime,
  getApexDomain,
  getPrettyUrl,
  isDubDomain,
  linkConstructor,
  timeAgo,
} from "@dub/utils";
import { useContext, useRef } from "react";
import { CommentsBadge } from "../links/comments-badge";
import { useLinkSelection } from "../links/link-selection-provider";
import { LinksDisplayContext } from "../links/links-display-provider";
import { TestsBadge } from "../links/tests-badge";
import { UrlDecompositionTooltip } from "./url-decomposition-tooltip";

interface LinkData {
  domain: string;
  key: string;
  url: string;
  title?: string | null;
  comments?: string | null;
  archived?: boolean;
  description?: string | null;
  createdAt?: string | Date | null;
  // Additional props for /links page
  folderId?: string | null;
  testVariants?: any;
  testCompletedAt?: string | Date | null;
  ios?: string | null;
  android?: string | null;
  [key: string]: any; // For other settings
}

interface LinkCellProps {
  link: LinkData;
  variant?: "table" | "card" | "links-page";
  showCopyButton?: boolean;
  className?: string;
  maxWidth?: string;
  showComments?: boolean;
  showBadges?: boolean;
}

export function LinkCell({
  link,
  variant = "table",
  showCopyButton = false,
  className,
  maxWidth = "300px",
  showComments = true,
  showBadges = false,
}: LinkCellProps) {
  const {
    domain,
    key,
    url,
    title,
    comments,
    archived,
    description,
    createdAt,
  } = link;

  // Use display settings from LinksDisplayContext if available
  const displayContext = useContext(LinksDisplayContext);
  const displayProperties = displayContext?.displayProperties || [
    "title",
    "url",
  ];
  const switchPosition = displayContext?.switchPosition || false;

  const shortLink = linkConstructor({ domain, key, pretty: true });
  const fullShortLink = linkConstructor({ domain, key, pretty: false });

  // Selection functionality (optional - only available within LinkSelectionProvider)
  let isSelectMode = false;
  let isSelected = false;
  let handleLinkSelection: ((linkId: string, e: React.MouseEvent) => void) | undefined;
  
  try {
    const selection = useLinkSelection();
    isSelectMode = selection.isSelectMode;
    isSelected = selection.selectedLinkIds.includes(link.id);
    handleLinkSelection = selection.handleLinkSelection;
  } catch (e) {
    // LinkSelectionProvider not available - selection features disabled
  }

  const containerClassName =
    variant === "card"
      ? "flex items-center gap-3 rounded border border-neutral-100 bg-white px-4 py-3.5"
      : "flex items-center gap-3 py-1";

  return (
    <div className={cn(containerClassName, className)}>
      {/* Logo with checkbox selection */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        data-checked={isSelected}
        onClick={(e) => handleLinkSelection?.(link.id, e)}
        className={cn(
          "group relative flex shrink-0 items-center justify-center outline-none",
          isSelectMode && "flex",
        )}
      >
        {/* Link logo background circle */}
        <div className="absolute inset-0 shrink-0 rounded-full border border-neutral-100 bg-gradient-to-t from-neutral-100 opacity-100" />
        <div className={cn(
          "relative transition-[padding,transform] sm:p-1.5",
          isSelectMode ? "scale-90" : "group-hover:scale-90",
        )}>
          <LinkLogo
            apexDomain={getApexDomain(url)}
            className={cn(
              "size-4 shrink-0 sm:size-5 transition-opacity",
              isSelectMode && "opacity-0",
            )}
          />
        </div>
        {/* Checkbox overlay */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full border border-neutral-400 bg-white ring-0 ring-black/5",
            isSelectMode
              ? "opacity-100 ring"
              : "opacity-100 max-sm:ring sm:opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:ring group-focus-visible:opacity-100 group-focus-visible:ring",
            "group-data-[checked=true]:opacity-100",
          )}
        >
          <div
            className={cn(
              "rounded-full bg-neutral-800 p-0.5",
              "scale-90 opacity-0 transition-[transform,opacity] duration-100 group-data-[checked=true]:scale-100 group-data-[checked=true]:opacity-100",
            )}
          >
            <Check2 className="size-3 text-white" />
          </div>
        </div>
      </button>

      {/* Link info - same structure as LinkTitleColumn */}
      <div
        className="flex min-w-0 flex-col text-sm leading-tight"
        style={{ maxWidth }}
      >
        {/* Main title line */}
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {switchPosition ? (
              // When position is switched, show destination URL as main title
              displayProperties.includes("url") && url ? (
                <UrlDecompositionTooltip
                  url={url}
                  forceShow={variant === "table"}
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "truncate font-semibold text-neutral-800 transition-colors hover:text-black hover:underline",
                      archived && "text-neutral-600",
                    )}
                    title={url}
                  >
                    {getPrettyUrl(url)}
                  </a>
                </UrlDecompositionTooltip>
              ) : (
                <span
                  className={cn(
                    "truncate font-semibold text-neutral-400",
                    archived && "text-neutral-600",
                  )}
                >
                  No URL configured
                </span>
              )
            ) : // Default behavior: show title or short link as main title
            displayProperties.includes("title") && title ? (
              <span
                className={cn(
                  "truncate font-semibold text-neutral-800",
                  archived && "text-neutral-600",
                )}
                title={title}
              >
                {title}
              </span>
            ) : variant === "links-page" ? (
              <UnverifiedTooltip domain={domain} _key={key}>
                <a
                  href={fullShortLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={shortLink}
                  className={cn(
                    "truncate font-semibold text-neutral-800 transition-colors hover:text-black hover:underline",
                    archived && "text-neutral-600",
                  )}
                >
                  {shortLink}
                </a>
              </UnverifiedTooltip>
            ) : (
              <a
                href={fullShortLink}
                target="_blank"
                rel="noopener noreferrer"
                title={shortLink}
                className={cn(
                  "truncate font-semibold text-neutral-800 transition-colors hover:text-black hover:underline",
                  archived && "text-neutral-600",
                )}
              >
                {shortLink}
              </a>
            )}

            {/* Copy button */}
            {showCopyButton && (
              <CopyButton
                value={fullShortLink}
                variant="neutral"
                className="p-1.5"
                withText
              />
            )}
          </div>

          {/* Comments badge */}
          {(showBadges || showComments) && comments && (
            <CommentsBadge
              comments={comments}
              maxWidth={variant === "table" ? "150px" : undefined}
            />
          )}

          {/* Settings badge for links page */}
          {/* {showBadges &&
            variant === "links-page" &&
            (link.ios || link.android) && (
              <div className="rounded-full p-1.5 hover:bg-neutral-100">
                <Bolt className="size-3.5" />
              </div>
            )} */}

          {/* Tests badge */}
          {showBadges &&
            link.testVariants &&
            link.testCompletedAt &&
            new Date(link.testCompletedAt) > new Date() && (
              <TestsBadge
                link={{
                  testVariants: link.testVariants,
                  testCompletedAt:
                    link.testCompletedAt instanceof Date
                      ? link.testCompletedAt
                      : new Date(link.testCompletedAt),
                }}
              />
            )}
        </div>

        {/* Secondary line - destination URL or short link depending on switchPosition */}
        <div className="flex items-center gap-1.5">
          <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
          {switchPosition ? (
            // When position is switched, show short link in secondary line
            <a
              href={fullShortLink}
              target="_blank"
              rel="noopener noreferrer"
              title={shortLink}
              className="truncate max-w-lg text-neutral-500 transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2"
            >
              {shortLink}
            </a>
          ) : displayProperties.includes("url") ? (
            // Default: show destination URL in secondary line
            url ? (
              <UrlDecompositionTooltip
                url={url}
                forceShow={variant === "table"}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate max-w-lg text-neutral-500 transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2"
                  title={url}
                >
                  {getPrettyUrl(url)}
                </a>
              </UrlDecompositionTooltip>
            ) : (
              <span className="truncate text-neutral-400">
                No URL configured
              </span>
            )
          ) : (
            <span className="truncate text-neutral-500">
              {description || "No description"}
            </span>
          )}
          {/* Creation date display - inline with separator */}
          {createdAt && displayProperties.includes("createdAt") && (
            <>
              <span className="hidden shrink-0 text-neutral-300 sm:inline">
                •
              </span>
              <Tooltip content={formatDateTime(createdAt)} delayDuration={150}>
                <span className="hidden shrink-0 whitespace-nowrap text-neutral-400 sm:inline">
                  {timeAgo(new Date(createdAt))}
                </span>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UnverifiedTooltip({
  domain,
  _key,
  children,
}: {
  domain: string;
  _key: string;
  children: React.ReactNode;
}) {
  const { slug } = useWorkspace();

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useInViewport(ref);

  const { verified } = useDomain({ slug: domain, enabled: isVisible });

  return (
    <div ref={ref} className="min-w-0 truncate">
      {!isDubDomain(domain) && verified === false ? (
        <Tooltip
          content={
            <TooltipContent
              title="Your branded links won't work until you verify your domain."
              cta="Verify your domain"
              href={`/${slug}/settings/domains`}
            />
          }
        >
          <p className="cursor-default truncate font-semibold leading-6 text-neutral-500 line-through">
            {linkConstructor({ domain, key: _key, pretty: true })}
          </p>
        </Tooltip>
      ) : (
        children
      )}
    </div>
  );
}
