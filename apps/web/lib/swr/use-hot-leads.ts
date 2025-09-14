import { fetcher } from "@dub/utils";
import { useContext } from "react";
import useSWR from "swr";
import { AnalyticsContext } from "@/ui/analytics/analytics-provider";
import useWorkspace from "./use-workspace";

export type HotLeadsData = {
  cold: number;
  warm: number;
  hot: number;
  total: number;
};

export type ClickWithLead = {
  // Click data
  id: string;
  timestamp: Date;
  url: string;
  country: string;
  city: string;
  region: string;
  device: string;
  browser: string;
  os: string;
  referer: string;
  referer_url: string;
  qr: boolean;
  ip: string;
  anonymousId: string;
  
  // Link data
  link: {
    id: string;
    domain: string;
    key: string;
    shortLink: string;
    url: string;
  } | null;
  
  // Lead detection data
  leadDetection: {
    hasLead: boolean;
    isCurrentWorkspace: boolean;
    isCrossAccount: boolean;
    customer: {
      id: string;
      name: string | null;
      email: string | null;
      country: string | null;
      totalClicks: number;
      lastEventAt: Date | null;
      originalAccount: {
        id: string;
        name: string;
        slug: string;
      } | null;
    } | null;
  };
};

export type HotLeadsFilters = {
  start?: string;
  end?: string;
  domain?: string;
  key?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  referer?: string;
  limit?: number;
  offset?: number;
};

export default function useHotLeads() {
  const { id: workspaceId } = useWorkspace();
  const { start, end, interval } = useContext(AnalyticsContext);

  // Build query parameters to match the analytics time filter
  const queryParams = new URLSearchParams({
    workspaceId: workspaceId || "",
    ...(start && end && {
      start: start.toISOString(),
      end: end.toISOString(),
    }),
    ...(interval && { interval }),
  });

  const { data, error, isLoading } = useSWR<HotLeadsData>(
    !!workspaceId ? `/api/customers/hot-leads?${queryParams.toString()}` : undefined,
    fetcher,
    {
      dedupingInterval: 60000, // Cache for 1 minute
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    data,
    loading: isLoading,
    error,
  };
}