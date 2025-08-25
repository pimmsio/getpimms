"use client";

import useLinks from "@/lib/swr/use-links";
import LinkDisplay from "@/ui/links/link-display";
import LinksContainer from "@/ui/links/links-container";
import { LinksDisplayProvider } from "@/ui/links/links-display-provider";
import { useLinkFilters } from "@/ui/links/use-link-filters";
import { SearchBoxPersisted } from "@/ui/shared/search-box";
import {
  Filter,
  MaxWidthWrapper,
} from "@dub/ui";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import posthog from "posthog-js";

export default function AdminLinksClient() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user["id"], {
        email: session.user.email,
        name: session.user.name,
      });
    }
  }, [session?.user]);

  return (
    <LinksDisplayProvider>
      <AdminLinks />
    </LinksDisplayProvider>
  );
}

function AdminLinks() {
  const { isValidating } = useLinks();

  const {
    filters,
    activeFilters,
    onSelect,
    onRemove,
    onRemoveAll,
    setSearch,
    setSelectedFilter,
  } = useLinkFilters();

  return (
    <>
      <div className="flex w-full items-center pt-2">
        <MaxWidthWrapper className="flex flex-col gap-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 lg:flex-nowrap">
            <div className="flex grow gap-x-4 max-md:w-full">
              <div className="w-full md:w-56 lg:w-64">
                <SearchBoxPersisted
                  loading={isValidating}
                  inputClassName="h-10"
                />
              </div>
            </div>
            <div className="flex w-full gap-2 md:w-auto">
              <div className="grow basis-0 md:grow-0">
                <Filter.Select
                  filters={filters}
                  activeFilters={activeFilters}
                  onSelect={onSelect}
                  onRemove={onRemove}
                  onSearchChange={setSearch}
                  onSelectedFilterChange={setSelectedFilter}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2 md:w-fit">
                <LinkDisplay />
              </div>
            </div>
          </div>
          <Filter.List
            filters={filters}
            activeFilters={activeFilters}
            onRemove={onRemove}
            onRemoveAll={onRemoveAll}
          />
        </MaxWidthWrapper>
      </div>
      
      <LinksContainer CreateLinkButton={() => <div className="h-10 w-10" />} />
    </>
  );
}