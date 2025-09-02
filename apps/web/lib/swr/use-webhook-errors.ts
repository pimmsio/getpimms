import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

export interface WebhookError {
  id: string;
  url: string | null;
  hasPimmsId: boolean;
  failedReason: string | null;
  createdAt: string;
}

export interface WebhookErrorsResponse {
  errors: WebhookError[];
}

export function useWebhookErrors() {
  const { slug } = useWorkspace();

  const { data, error, isLoading } = useSWR<WebhookErrorsResponse>(
    slug ? `/api/workspaces/${slug}/webhook-errors` : null,
    fetcher,
    {
      dedupingInterval: 60000, // Dedupe for 1 minute
      revalidateOnFocus: false,
    },
  );

  return {
    errors: data?.errors || [],
    loading: isLoading,
    error,
  };
}

