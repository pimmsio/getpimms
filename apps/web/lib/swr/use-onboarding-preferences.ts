import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

type OnboardingPreferences = {
  providerIds: string[];
  completedProviderIds: string[];
};

export function useOnboardingPreferences() {
  const { id: workspaceId } = useWorkspace();

  const key = workspaceId
    ? `/api/onboarding-preferences?workspaceId=${workspaceId}`
    : null;

  const { data, isLoading, mutate, error } = useSWR<OnboardingPreferences>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const setProviderIds = async (providerIds: string[]) => {
    if (!workspaceId) return;
    await fetch(`/api/onboarding-preferences?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerIds }),
    });
    await mutate();
  };

  const setCompletedProviderIds = async (completedProviderIds: string[]) => {
    if (!workspaceId) return;
    await fetch(`/api/onboarding-preferences?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedProviderIds }),
    });
    await mutate();
  };

  return {
    providerIds: data?.providerIds ?? [],
    completedProviderIds: data?.completedProviderIds ?? [],
    loading: isLoading,
    error,
    setProviderIds,
    setCompletedProviderIds,
    mutate,
  };
}

