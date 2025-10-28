import useWorkspace from "./use-workspace";
import { useRouterStuff } from "@dub/ui";
import { fetcher } from "@dub/utils";
import useSWR from "swr";
import z from "../zod";
import { getUtmTermsQuerySchemaExtended, UTM_PARAMETERS_MAX_PAGE_SIZE } from "../zod/schemas/utm-parameters";

const partialQuerySchema = getUtmTermsQuerySchemaExtended.partial();

export default function useUtmTerms({
  query,
  enabled = true,
}: {
  query?: z.infer<typeof partialQuerySchema>;
  enabled?: boolean;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data: utmTerms, error } = useSWR<
    Array<{
      id: string;
      name: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  >(
    workspaceId && enabled
      ? `/api/utm-terms${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    utmTerms,
    loading: !error && !utmTerms,
    error,
  };
}

export function useUtmTermsCount({
  query,
}: {
  query?: Pick<
    z.infer<typeof getUtmTermsQuerySchemaExtended>,
    "search" | "sortBy" | "sortOrder"
  >;
} = {}) {
  const { id: workspaceId } = useWorkspace();
  const { getQueryString } = useRouterStuff();

  const { data, error } = useSWR<number>(
    workspaceId
      ? `/api/utm-terms/count${getQueryString({ workspaceId, ...query })}`
      : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    data,
    loading: !error && data === undefined,
    error,
  };
}

