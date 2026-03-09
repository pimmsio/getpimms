import { fetcher } from "@dub/utils";
import useSWR from "swr";
import useWorkspace from "./use-workspace";

type StartedProvider = {
  id: string;
  startedAt: number;
};

type OnboardingPreferences = {
  providerIds: string[];
  completedProviderIds: string[];
  startedProviderIds: StartedProvider[];
  otherMessage?: string;
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

  const postPreferences = async (body: Record<string, unknown>) => {
    const res = await fetch(
      `/api/onboarding-preferences?workspaceId=${workspaceId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("Failed to update onboarding preferences:", res.status);
    }
    await mutate();
  };

  const setProviderIds = async (providerIds: string[]) => {
    if (!workspaceId) return;
    await postPreferences({ providerIds });
  };

  const setCompletedProviderIds = async (completedProviderIds: string[]) => {
    if (!workspaceId) return;
    await postPreferences({ completedProviderIds });
  };

  const markProviderStarted = async (providerId: string) => {
    if (!workspaceId) return;
    if (!providerId) return;
    const completed = data?.completedProviderIds ?? [];
    if (completed.includes(providerId)) return;
    const existing = data?.startedProviderIds ?? [];
    if (existing.some((entry) => entry.id === providerId)) return;
    const next = [...existing, { id: providerId, startedAt: Date.now() }];
    await postPreferences({ startedProviderIds: next });
  };

  const setOtherMessage = async (otherMessage: string) => {
    if (!workspaceId) return;
    await postPreferences({ otherMessage });
  };

  return {
    providerIds: data?.providerIds ?? [],
    completedProviderIds: data?.completedProviderIds ?? [],
    startedProviderIds: data?.startedProviderIds ?? [],
    otherMessage: data?.otherMessage ?? "",
    loading: isLoading,
    error,
    setProviderIds,
    setCompletedProviderIds,
    markProviderStarted,
    setOtherMessage,
    mutate,
  };
}

