"use client";

import { useIsMegaFolder } from "@/lib/swr/use-is-mega-folder";
import useLinks from "@/lib/swr/use-links";
import useLinksCount from "@/lib/swr/use-links-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { ExpandedLinkProps, UserProps } from "@/lib/types";
import {
  buttonVariants,
  CardList,
  MaxWidthWrapper,
  useRouterStuff,
} from "@dub/ui";
import { CursorRays, Hyperlink } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";
import { AnimatedEmptyState } from "../shared/animated-empty-state";
import { LinkCard } from "./link-card";
import LinkCardPlaceholder from "./link-card-placeholder";
import { LinkSelectionProvider } from "./link-selection-provider";
import { LinksDisplayContext } from "./links-display-provider";
import { LinksToolbar } from "./links-toolbar";
import Link from "next/link";

export type ResponseLink = ExpandedLinkProps & {
  user: UserProps;
};

export default function LinksContainer({
  CreateLinkButton,
}: {
  CreateLinkButton: () => JSX.Element;
}) {
  const { defaultFolderId } = useWorkspace();
  const { searchParams } = useRouterStuff();
  const { viewMode, sortBy, showArchived } = useContext(LinksDisplayContext);

  // Decide on the folderId to use
  let folderId = searchParams.get("folderId");
  if (folderId) {
    folderId = folderId === "unsorted" ? "" : folderId;
  } else {
    folderId = defaultFolderId ?? "";
  }

  const { links, isValidating } = useLinks({
    sortBy,
    showArchived,
    folderId,
  });

  const { data: count } = useLinksCount<number>({
    query: {
      showArchived,
      folderId,
    },
  });

  return (
    <MaxWidthWrapper className="grid max-w-full gap-y-2 px-0 lg:px-0">
      <LinksList
        CreateLinkButton={CreateLinkButton}
        links={links}
        count={count}
        loading={isValidating}
        compact={viewMode === "rows"}
      />
    </MaxWidthWrapper>
  );
}

export const LinksListContext = createContext<{
  openMenuLinkId: string | null;
  setOpenMenuLinkId: Dispatch<SetStateAction<string | null>>;
}>({
  openMenuLinkId: null,
  setOpenMenuLinkId: () => {},
});

function LinksList({
  CreateLinkButton,
  links,
  count,
  loading,
  compact,
}: {
  CreateLinkButton: () => JSX.Element;
  links?: ResponseLink[];
  count?: number;
  loading?: boolean;
  compact: boolean;
}) {
  const searchParams = useSearchParams();
  const { isMegaFolder } = useIsMegaFolder();

  const [openMenuLinkId, setOpenMenuLinkId] = useState<string | null>(null);

  const isFiltered = [
    "folderId",
    "tagIds",
    "domain",
    //"userId",
    "url",
    "search",
    "showArchived",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ].some((param) => searchParams.has(param));

  return (
    <LinksListContext.Provider value={{ openMenuLinkId, setOpenMenuLinkId }}>
      <LinkSelectionProvider links={links}>
        {!links || links.length ? (
          // Cards
          <CardList variant={compact ? "compact" : "loose"} loading={loading}>
              {links?.length
                ? // Link cards
                  links.map((link) => <LinkCard key={link.id} link={link} />)
                : // Loading placeholder cards
                  Array.from({ length: 12 }).map((_, idx) => (
                    <CardList.Card
                      key={idx}
                      outerClassName="pointer-events-none"
                      innerClassName="flex items-center gap-4"
                    >
                      <LinkCardPlaceholder />
                    </CardList.Card>
                  ))}
          </CardList>
        ) : (
          <AnimatedEmptyState
            title={isFiltered ? "No links found" : "No links yet"}
            description={
              isFiltered
                ? "Bummer! There are no links that match your filters. Adjust your filters to yield more results."
                : "Start creating your first link."
            }
            cardContent={
              <>
                <Hyperlink className="size-4 text-neutral-700" />
                <div className="h-2.5 w-24 min-w-0 rounded bg-neutral-200" />
                <div className="xs:flex hidden grow items-center justify-end gap-1.5 text-neutral-500">
                  <CursorRays className="size-3.5" />
                </div>
              </>
            }
            addButton={
              <Link
                href="https://pim.ms/dAXN6jl"
                target="_blank"
                className={cn(
                  buttonVariants({ variant: "secondary" }),
                  "font-bold transition-all duration-300 hover:scale-105",
                  "mt-4 flex h-9 items-center justify-center rounded border px-4 text-sm",
                )}
              >
                Book a demo call
              </Link>
            }
          />
        )}

        {/* Pagination */}
        {links && (
          <LinksToolbar
            loading={!!loading}
            links={links}
            linksCount={isMegaFolder ? Infinity : count ?? links?.length ?? 0}
          />
        )}
      </LinkSelectionProvider>
    </LinksListContext.Provider>
  );
}
