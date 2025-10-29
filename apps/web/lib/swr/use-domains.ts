import { DomainProps } from "@/lib/types";
import { useRouterStuff } from "@dub/ui";
import {
  DUB_DOMAINS,
  DUB_WORKSPACE_ID,
  SHORT_DOMAIN,
  fetcher,
} from "@dub/utils";
import { useMemo } from "react";
import useSWR from "swr";
import { prefixWorkspaceId } from "../api/workspace-id";
import useDefaultDomains from "./use-default-domains";
import useWorkspace from "./use-workspace";

export default function useDomains({
  ignoreParams,
  opts,
}: {
  ignoreParams?: boolean;
  opts?: Record<string, string>;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error, mutate } = useSWR<DomainProps[]>(
    workspaceId &&
      `/api/domains${
        ignoreParams
          ? "?" +
            new URLSearchParams({
              ...opts,
              workspaceId,
            }).toString()
          : getQueryString({
              ...opts,
              workspaceId,
            })
      }`,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );
  const {
    defaultDomains: workspaceDefaultDomains,
    loading: loadingDefaultDomains,
  } = useDefaultDomains(opts);

  const allWorkspaceDomains = useMemo(() => data || [], [data]);
  const activeWorkspaceDomains = useMemo(
    () => data?.filter((domain) => !domain.archived),
    [data],
  );

  const activeDefaultDomains = useMemo(
    () =>
      (workspaceDefaultDomains &&
        DUB_DOMAINS.filter((d) => 
          workspaceDefaultDomains?.some((wd: any) => wd.slug === d.slug)
        )) ||
      DUB_DOMAINS,
    [workspaceDefaultDomains],
  );

  const allDomains = useMemo(
    () => [
      ...allWorkspaceDomains,
      ...(workspaceId === prefixWorkspaceId(DUB_WORKSPACE_ID)
        ? []
        : DUB_DOMAINS),
    ],
    [allWorkspaceDomains, workspaceId],
  );
  const allActiveDomains = useMemo(
    () => [
      ...(activeWorkspaceDomains || []),
      ...(workspaceId === prefixWorkspaceId(DUB_WORKSPACE_ID)
        ? []
        : activeDefaultDomains),
    ],
    [activeWorkspaceDomains, activeDefaultDomains, workspaceId],
  );

  // Merge workspace domains with default domains for the domains page
  const allDomainsForPage = useMemo(() => {
    // Check if viewing archived domains (allWorkspaceDomains would be filtered by the API based on archived query param)
    const isViewingArchived = allWorkspaceDomains.some((d) => d.archived);
    
    // Don't show default domains on archived tab
    if (!workspaceDefaultDomains || workspaceId === prefixWorkspaceId(DUB_WORKSPACE_ID) || isViewingArchived) {
      return allWorkspaceDomains;
    }

    // Check if any custom domain is primary
    const hasCustomPrimary = allWorkspaceDomains.some((d) => d.primary);

    // Get default domains with their metadata
    // First enabled default domain is primary if no custom domain is primary
    const defaultDomainsForPage = workspaceDefaultDomains.map((d: any, index: number) => ({
      slug: d.slug,
      primary: !hasCustomPrimary && index === 0, // First enabled default domain is primary
      isDefaultDomain: true,
      verified: true,
      archived: false,
    }));

    // Sort: primary first, then workspace domains, then default domains
    const sortedDomains = [
      ...allWorkspaceDomains,
      ...defaultDomainsForPage,
    ].sort((a: any, b: any) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      // Workspace domains before default domains
      if (!a.isDefaultDomain && b.isDefaultDomain) return -1;
      if (a.isDefaultDomain && !b.isDefaultDomain) return 1;
      return 0;
    });

    return sortedDomains;
  }, [allWorkspaceDomains, workspaceDefaultDomains, workspaceId]);

  const primaryDomain = useMemo(() => {
    // Check if a workspace domain is primary
    const primaryWorkspaceDomain = activeWorkspaceDomains?.find(({ primary }) => primary);
    if (primaryWorkspaceDomain) {
      return primaryWorkspaceDomain.slug;
    }
    
    // If no custom domain is primary, use the first enabled default domain
    if (workspaceDefaultDomains && workspaceDefaultDomains.length > 0) {
      return workspaceDefaultDomains[0].slug;
    }
    
    // Fallback to SHORT_DOMAIN (pim.ms)
    return SHORT_DOMAIN;
  }, [activeDefaultDomains, activeWorkspaceDomains, workspaceDefaultDomains]);

  return {
    activeWorkspaceDomains, // active workspace domains
    activeDefaultDomains, // active default Dub domains
    allWorkspaceDomains, // all workspace domains (active + archived)
    allActiveDomains, // all active domains (active workspace domains + active default Dub domains)
    allDomains, // all domains (all workspace domains + all default Dub domains)
    allDomainsForPage, // merged domains for the domains page (workspace + default)
    primaryDomain,
    loading: (!data && !error) || loadingDefaultDomains,
    mutate,
    error,
  };
}
