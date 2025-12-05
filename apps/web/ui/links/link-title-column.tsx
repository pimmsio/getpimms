"use client";

import useDomain from "@/lib/swr/use-domain";
import useFolder from "@/lib/swr/use-folder";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  ArrowTurnRight2,
  Avatar,
  CardList,
  CopyButton,
  LinkLogo,
  Switch,
  Tooltip,
  TooltipContent,
  useInViewport,
} from "@dub/ui";
import {
  AppleLogo,
  ArrowRight,
  Bolt,
  BoxArchive,
  Cards,
  Check2,
  CircleHalfDottedClock,
  EarthPosition,
  Incognito,
  InputPassword,
  Robot,
  SquareChart,
} from "@dub/ui/icons";
import {
  cn,
  formatDateTime,
  getApexDomain,
  getPrettyUrl,
  isDubDomain,
  linkConstructor,
  timeAgo,
} from "@dub/utils";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Apple, Mail, TargetIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, PropsWithChildren, useContext, useRef, useState } from "react";
import { FolderIcon } from "../folders/folder-icon";
import { useLinkBuilder } from "../modals/link-builder";
import { UrlDecompositionTooltip } from "../shared/url-decomposition-tooltip";
import { CommentsBadge } from "./comments-badge";
import { useLinkSelection } from "./link-selection-provider";
import { ResponseLink } from "./links-container";
import { LinksDisplayContext } from "./links-display-provider";
import { TestsBadge } from "./tests-badge";

const quickViewSettings = [
  // { label: "Lead Tracking", icon: TargetIcon, key: "trackConversion" },
  // { label: "Custom Link Preview", icon: Cards, key: "proxy" },
  // { label: "Link Cloaking", icon: Incognito, key: "rewrite" },
  // { label: "Password Protection", icon: InputPassword, key: "password" },
  // { label: "Link Expiration", icon: CircleHalfDottedClock, key: "expiresAt" },
  { label: "Open in Apple Store", icon: Apple, key: "ios" },
  { label: "Open in Google Play Store", icon: Robot, key: "android" },
  // { label: "Geo Targeting", icon: EarthPosition, key: "geo" },
];

const LOGO_SIZE_CLASS_NAME = "size-4 sm:size-6";

export function LinkTitleColumn({ link }: { link: ResponseLink }) {
  const { domain, key } = link;

  const { displayProperties } = useContext(LinksDisplayContext);

  // Get the first 2 non-icon properties for display
  const sortableProperties = displayProperties.filter((p) => p !== "icon");
  const primaryProperty = sortableProperties[0] || "link";
  const secondaryProperty = sortableProperties[1] || "url";

  const ref = useRef<HTMLDivElement>(null);

  const hasQuickViewSettings = quickViewSettings.some(({ key }) => link?.[key]);

  const searchParams = useSearchParams();
  const { slug, defaultFolderId } = useWorkspace();
  const { folder } = useFolder({ folderId: link.folderId });

  return (
    <div
      ref={ref}
      className="flex h-[60px] items-center gap-3"
    >
      <LinkIcon link={link} />
      <div className="h-[46px] min-w-0 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {primaryProperty === "url" && link.url ? (
              <UrlDecompositionTooltip url={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "truncate font-semibold leading-6 text-neutral-800 transition-colors hover:text-black",
                    link.archived && "text-neutral-600",
                  )}
                >
                  {getPrettyUrl(link.url)}
                </a>
              </UrlDecompositionTooltip>
            ) : primaryProperty === "url" && !link.url ? (
              <span className={cn("truncate font-semibold leading-6 text-neutral-400", link.archived && "text-neutral-600")}>
                No URL configured
              </span>
            ) : primaryProperty === "title" && link.title ? (
              <span
                className={cn("truncate font-semibold leading-6 text-neutral-800", link.archived && "text-neutral-600")}
              >
                {link.title}
              </span>
            ) : primaryProperty === "description" && link.description ? (
              <span
                className={cn("truncate font-semibold leading-6 text-neutral-800", link.archived && "text-neutral-600")}
              >
                {link.description}
              </span>
            ) : primaryProperty === "comments" && link.comments ? (
              <span
                className={cn("truncate font-semibold leading-6 text-neutral-800", link.archived && "text-neutral-600")}
              >
                {link.comments}
              </span>
            ) : (
              <UnverifiedTooltip domain={domain} _key={key}>
                <a
                  href={linkConstructor({ domain, key })}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={linkConstructor({ domain, key, pretty: true })}
                  className={cn(
                    "truncate font-semibold leading-6 text-neutral-800 transition-colors hover:text-black",
                    link.archived && "text-neutral-600",
                  )}
                >
                  {linkConstructor({ domain, key, pretty: true })}
                </a>
              </UnverifiedTooltip>
            )}
            <CopyButton
              value={linkConstructor({
                domain,
                key,
                pretty: false,
              })}
              variant="neutral"
              className="p-1.5"
              withText
            />
          </div>
          {/* {link.comments && <CommentsBadge comments={link.comments} />}
          {hasQuickViewSettings && <SettingsBadge link={link} />} */}
          {link.testVariants &&
            link.testCompletedAt &&
            new Date(link.testCompletedAt) > new Date() && (
              <TestsBadge link={link} />
            )}
          <Details link={link} />
        </div>

        <Details link={link} />
      </div>
    </div>
  );
}

function UnverifiedTooltip({
  domain,
  _key,
  children,
}: PropsWithChildren<{ domain: string; _key: string }>) {
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

function SettingsBadge({ link }: { link: ResponseLink }) {
  const settings = quickViewSettings.filter(({ key }) => link?.[key]);

  const { LinkBuilder, setShowLinkBuilder } = useLinkBuilder({
    props: link,
  });

  const [open, setOpen] = useState(false);

  return (
    <div className="hidden sm:block">
      <LinkBuilder />
      <HoverCard.Root open={open} onOpenChange={setOpen} openDelay={100}>
        <HoverCard.Portal>
          <HoverCard.Content
            side="bottom"
            sideOffset={8}
            className="animate-slide-up-fade z-[99] items-center overflow-hidden rounded border border-neutral-100 bg-white shadow-sm"
          >
            <div className="flex w-[340px] flex-col p-3 text-sm">
              {settings.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setShowLinkBuilder(true);
                  }}
                  className="flex items-center justify-between gap-4 rounded p-3 transition-colors hover:bg-neutral-100"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-neutral-600" />
                    <span className="text-neutral-950">{label}</span>
                  </div>
                  <Switch checked />
                </button>
              ))}
            </div>
          </HoverCard.Content>
        </HoverCard.Portal>
        <HoverCard.Trigger asChild>
          <div className="rounded-full p-1.5 hover:bg-neutral-100">
            <Bolt className="size-3.5" />
          </div>
        </HoverCard.Trigger>
      </HoverCard.Root>
    </div>
  );
}

const LinkIcon = memo(({ link }: { link: ResponseLink }) => {
  const { isSelectMode, selectedLinkIds, handleLinkSelection } =
    useLinkSelection();
  const isSelected = selectedLinkIds.includes(link.id);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isSelected}
      data-checked={isSelected}
      onClick={(e) => handleLinkSelection(link.id, e)}
      className={cn(
        "group relative hidden shrink-0 items-center justify-center outline-none sm:flex",
        isSelectMode && "flex",
      )}
    >
      {/* Link logo background circle */}
      <div className="absolute inset-0 shrink-0 rounded border border-neutral-100 opacity-100" />
        <div className="relative transition-[padding,transform] group-hover:scale-90 sm:p-1">
        <div className="hidden sm:block">
          {link.archived ? (
            <BoxArchive
              className={cn(
                "shrink-0 p-0.5 text-neutral-600 transition-[width,height]",
                LOGO_SIZE_CLASS_NAME,
              )}
            />
          ) : (
            <LinkLogo
              apexDomain={getApexDomain(link.url)}
              className={cn(
                "shrink-0 transition-[width,height]",
                LOGO_SIZE_CLASS_NAME,
              )}
              imageProps={{
                loading: "lazy",
              }}
            />
          )}
        </div>
        <div className="size-5 sm:size-6 sm:hidden" />
      </div>
      {/* Checkbox */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full border border-neutral-400 bg-white ring-0 ring-black/5",
          "opacity-100 max-sm:ring sm:opacity-0",
          "transition-all duration-150 group-hover:opacity-100 group-hover:ring group-focus-visible:opacity-100 group-focus-visible:ring",
          "group-data-[checked=true]:opacity-100",
        )}
      >
        <div
          className={cn(
            "rounded-full bg-neutral-800 p-0.5 sm:p-1",
            "scale-90 opacity-0 transition-[transform,opacity] duration-100 group-data-[checked=true]:scale-100 group-data-[checked=true]:opacity-100",
          )}
        >
          <Check2 className="size-3 text-white" />
        </div>
      </div>
    </button>
  );
});

const Details = memo(
  ({ link }: { link: ResponseLink }) => {
    const { url, createdAt } = link;

    const { displayProperties } = useContext(LinksDisplayContext);

    // Get the first 2 non-icon properties for display
    const sortableProperties = displayProperties.filter((p) => p !== "icon");
    const primaryProperty = sortableProperties[0] || "link";
    const secondaryProperty = sortableProperties[1] || "url";

    return (
      <div className="flex min-w-0 items-center whitespace-nowrap text-sm gap-1.5 md:gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <ArrowTurnRight2 className="h-3 w-3 shrink-0 text-neutral-400" />
          {secondaryProperty === "link" ? (
            <UnverifiedTooltip domain={link.domain} _key={link.key}>
              <a
                href={linkConstructor({ domain: link.domain, key: link.key })}
                target="_blank"
                rel="noopener noreferrer"
                title={linkConstructor({ domain: link.domain, key: link.key, pretty: true })}
                className="truncate text-neutral-500 transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2"
              >
                {linkConstructor({ domain: link.domain, key: link.key, pretty: true })}
              </a>
            </UnverifiedTooltip>
          ) : secondaryProperty === "url" && url ? (
            <UrlDecompositionTooltip url={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-neutral-500 transition-colors hover:text-neutral-700 hover:underline hover:underline-offset-2"
              >
                {getPrettyUrl(url)}
              </a>
            </UrlDecompositionTooltip>
          ) : secondaryProperty === "url" && !url ? (
            <span className="truncate text-neutral-400">No URL configured</span>
          ) : secondaryProperty === "title" && link.title ? (
            <span className="truncate text-neutral-500">{link.title}</span>
          ) : secondaryProperty === "description" && link.description ? (
            <span className="truncate text-neutral-500">{link.description}</span>
          ) : secondaryProperty === "comments" && link.comments ? (
            <span className="truncate text-neutral-500">{link.comments}</span>
          ) : (
            <span className="truncate text-neutral-500">-</span>
          )}
          {/* <div
            className={cn(
              "hidden shrink-0",
              "sm:block",
            )}
          >
            <UserAvatar link={link} />
          </div> */}
          {displayProperties.includes("createdAt") && (
            <>
              <span className="hidden shrink-0 text-neutral-300 sm:inline">•</span>
              <Tooltip content={formatDateTime(createdAt)} delayDuration={150}>
                <span className="hidden shrink-0 text-neutral-400 sm:inline whitespace-nowrap">{timeAgo(createdAt)}</span>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    );
  },
);

function UserAvatar({ link }: { link: ResponseLink }) {
  const { user } = link;
  const { slug } = useWorkspace();

  return (
    <Tooltip
      content={
        <div className="w-full p-3">
          <Avatar user={user} className="h-8 w-8" />
          <div className="mt-2 flex items-center gap-1.5">
            <p className="text-sm font-semibold text-neutral-700">
              {user?.name || user?.email || "Anonymous User"}
            </p>
            {!slug && // this is only shown in admin mode (where there's no slug)
              user?.email && (
                <CopyButton
                  value={user.email}
                  icon={Mail}
                  className="[&>*]:h-3 [&>*]:w-3"
                />
              )}
          </div>
          <div className="flex flex-col gap-1 text-xs text-neutral-500">
            {user?.name && user.email && <p>{user.email}</p>}
          </div>
        </div>
      }
      delayDuration={150}
    >
      <div>
        <Avatar user={user} className="size-4" />
      </div>
    </Tooltip>
  );
}
