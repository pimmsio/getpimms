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
import { UrlDisplayWithUtm } from "./url-display-with-utm";

interface LinkData {
  id?: string;
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
  showComments?: boolean;
  showBadges?: boolean;
}

export function LinkCell({
  link,
  variant = "table",
  showCopyButton = false,
  className,
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
    "icon",
    "link",
    "comments",
    "url",
    "createdAt",
    "title",
    "description",
  ];

  // Get the first 4 non-icon properties for display (2 lines of 2)
  const sortableProperties = displayProperties.filter((p) => p !== "icon");
  const line1Property1 = sortableProperties[0] || "link";
  const line1Property2 = sortableProperties[1] || "comments";
  const line2Property1 = sortableProperties[2] || "url";
  const line2Property2 = sortableProperties[3] || "createdAt";

  const shortLink = linkConstructor({ domain, key, pretty: true });
  const fullShortLink = linkConstructor({ domain, key, pretty: false });

  // Helper function to check if a property should be shown (always show except comments when empty)
  const hasPropertyValue = (propertyId: string) => {
    switch (propertyId) {
      case "link":
      case "url":
        return true;
      case "title":
        return !!title;
      case "description":
        return !!description;
      case "comments":
        return !!comments;
      case "createdAt":
        return !!createdAt;
      default:
        return false;
    }
  };

  const shouldShowLine2 =
    hasPropertyValue(line2Property1) || hasPropertyValue(line2Property2);

  // Helper function to render a property value
  const renderProperty = (
    propertyId: string,
    opts: { primary?: boolean } = {},
  ) => {
    const { primary = false } = opts;
    const baseClass = primary
      ? "font-semibold text-neutral-800"
      : "text-neutral-500";

    switch (propertyId) {
      case "link":
        return variant === "links-page" ? (
          <UnverifiedTooltip domain={domain} _key={key}>
            <a
              href={fullShortLink}
              target="_blank"
              rel="noopener noreferrer"
              title={shortLink}
              className={cn(
                "block truncate transition-colors hover:text-black hover:underline",
                baseClass,
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
              "block truncate transition-colors hover:text-black hover:underline",
              baseClass,
              archived && "text-neutral-600",
            )}
          >
            {shortLink}
          </a>
        );

      case "url":
        return url ? (
          <UrlDecompositionTooltip url={url} forceShow={variant === "table"}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block truncate transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2",
                baseClass,
                archived && "text-neutral-600",
              )}
              title={url}
            >
              {primary ? (
                <UrlDisplayWithUtm url={url} className={cn("truncate block", baseClass)} />
              ) : (
                <UrlDisplayWithUtm url={url} className="truncate block" />
              )}
            </a>
          </UrlDecompositionTooltip>
        ) : (
          <span className={cn("truncate text-neutral-400", archived && "text-neutral-600")}>
            No URL
          </span>
        );

      case "title":
        return title ? (
          <span className={cn("block truncate", baseClass, archived && "text-neutral-600")} title={title}>
            {title}
          </span>
        ) : (
          <span className="block truncate text-neutral-400">No title</span>
        );

      case "description":
        return description ? (
          <span className={cn("block truncate", baseClass, archived && "text-neutral-600")} title={description}>
            {description}
          </span>
        ) : (
          <span className="block truncate text-neutral-400">No description</span>
        );

      case "comments":
        return comments ? (
          <span className={cn("block truncate", baseClass, archived && "text-neutral-600")} title={comments}>
            {comments}
          </span>
        ) : null;

      case "createdAt":
        return createdAt ? (
          <Tooltip content={formatDateTime(createdAt)} delayDuration={150}>
            <span className={cn("truncate whitespace-nowrap", baseClass)}>
              {timeAgo(new Date(createdAt))}
            </span>
          </Tooltip>
        ) : (
          <span className="truncate text-neutral-400">-</span>
        );

      default:
        return <span className="truncate text-neutral-400">-</span>;
    }
  };

  // Selection functionality (optional - only available within LinkSelectionProvider)
  let isSelectMode = false;
  let isSelected = false;
  let handleLinkSelection:
    | ((linkId: string, e: React.MouseEvent) => void)
    | undefined;

  try {
    const selection = useLinkSelection();
    isSelectMode = selection.isSelectMode;
    isSelected = link.id ? selection.selectedLinkIds.includes(link.id) : false;
    handleLinkSelection = selection.handleLinkSelection;
  } catch (e) {
    // LinkSelectionProvider not available - selection features disabled
  }

  const containerClassName =
    variant === "card"
      ? "flex items-center gap-3 rounded border border-neutral-100 bg-white px-4 py-3.5"
      : "flex items-center gap-3 py-1";

  return (
    <div 
      className={cn(containerClassName, className)}
    >
      {/* Logo with checkbox selection */}
      <button
        type="button"
        role="checkbox"
        aria-checked={isSelected}
        data-checked={isSelected}
        onClick={(e) => link.id && handleLinkSelection?.(link.id, e)}
        className={cn(
          "group relative flex shrink-0 items-center justify-center outline-none w-9 h-9 sm:w-10 sm:h-10",
          isSelectMode && "flex",
        )}
      >
        {/* Link logo background circle */}
        <div className="absolute inset-0 shrink-0 rounded-full border border-neutral-100 bg-gradient-to-t from-neutral-100 opacity-100" />
        <div
          className={cn(
            "relative transition-[padding,transform]",
            isSelectMode ? "scale-90" : "group-hover:scale-90",
          )}
        >
          <LinkLogo
            apexDomain={getApexDomain(url)}
            className={cn(
              "size-6 rounded-full shrink-0 transition-opacity sm:size-8",
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
              : "opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:ring group-focus-visible:opacity-100 group-focus-visible:ring",
            "group-data-[checked=true]:opacity-100 group-data-[checked=true]:ring",
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

      {/* Link info - 2 lines of 2 properties on desktop, 4 lines on mobile */}
      <div
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm leading-tight"
      >
        {/* Line 1 Property 1 - always shown */}
        <div className="flex items-center gap-2">
          {/* Spacer to align with line 2's arrow */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {hasPropertyValue(line1Property1) && (
              <div className="min-w-0 sm:max-w-[50%] shrink-0 overflow-hidden">
                {renderProperty(line1Property1, { primary: true })}
              </div>
            )}
            {/* Only show separator if both properties exist - desktop only */}
            {hasPropertyValue(line1Property1) && hasPropertyValue(line1Property2) && (
              <div className="hidden sm:block shrink-0 text-neutral-300">•</div>
            )}
            {/* Line 1 Property 2 - desktop: inline, mobile: hidden (shown on separate line below) */}
            {hasPropertyValue(line1Property2) && (
              <div className="hidden sm:block min-w-0 max-w-[50%] shrink overflow-hidden">
                {renderProperty(line1Property2, { primary: true })}
              </div>
            )}
          </div>
        </div>

        {/* Line 1 Property 2 - mobile only, full width */}
        {hasPropertyValue(line1Property2) && (
          <div className="flex items-center gap-2 sm:hidden">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden">
              {renderProperty(line1Property2, { primary: true })}
            </div>
          </div>
        )}

        {/* Line 2 (hide entirely if both values are missing) */}
        {shouldShowLine2 && (
          <>
            {/* Line 2 Property 1 */}
            <div className="flex items-center gap-2">
              <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                {hasPropertyValue(line2Property1) && (
                  <div className="min-w-0 sm:max-w-[50%] shrink-0 overflow-hidden">
                    {renderProperty(line2Property1)}
                  </div>
                )}
                {/* Only show separator if both properties exist - desktop only */}
                {hasPropertyValue(line2Property1) && hasPropertyValue(line2Property2) && (
                  <div className="hidden sm:block shrink-0 text-neutral-300">•</div>
                )}
                {/* Line 2 Property 2 - desktop: inline, mobile: hidden (shown on separate line below) */}
                {hasPropertyValue(line2Property2) && (
                  <div className="hidden sm:block min-w-0 max-w-[50%] shrink overflow-hidden">
                    {renderProperty(line2Property2)}
                  </div>
                )}
              </div>
            </div>

            {/* Line 2 Property 2 - mobile only, full width */}
            {hasPropertyValue(line2Property2) && (
              <div className="flex items-center gap-2 sm:hidden">
                <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
                <div className="flex min-w-0 flex-1 items-center overflow-hidden">
                  {renderProperty(line2Property2)}
                </div>
              </div>
            )}
          </>
        )}
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
