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

  const markProviderStarted = async (providerId: string) => {
    if (!workspaceId) return;
    if (!providerId) return;
    const completed = data?.completedProviderIds ?? [];
    if (completed.includes(providerId)) return;
    const existing = data?.startedProviderIds ?? [];
    const now = Date.now();
    const next = [...existing];
    const idx = next.findIndex((entry) => entry.id === providerId);
    if (idx >= 0) {
      next[idx] = { id: providerId, startedAt: now };
    } else {
      next.push({ id: providerId, startedAt: now });
    }
    await fetch(`/api/onboarding-preferences?workspaceId=${workspaceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startedProviderIds: next }),
    });
    await mutate();
  };

  return {
    providerIds: data?.providerIds ?? [],
    completedProviderIds: data?.completedProviderIds ?? [],
    startedProviderIds: data?.startedProviderIds ?? [],
    loading: isLoading,
    error,
    setProviderIds,
    setCompletedProviderIds,
    markProviderStarted,
    mutate,
  };
}

