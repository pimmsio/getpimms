import { fetcher } from "@dub/utils";
import { IntegrationsWithInstallations } from "app/app.dub.co/(dashboard)/[slug]/settings/integrations/integrations-list";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export default function useListIntegrations() {
  const { id } = useWorkspace();

  const { data: integrations, error } = useSWR<IntegrationsWithInstallations>(
    id ? `/api/integrations/list?workspaceId=${id}` : null,
    fetcher,
    {
      dedupingInterval: 60000,
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  return {
    integrations,
    error,
    loading: !integrations && !error,
  };
}
