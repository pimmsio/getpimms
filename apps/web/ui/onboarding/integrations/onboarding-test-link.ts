export type OnboardingTestLink = {
  id: string;
  shortLink: string;
  leads?: number;
};

export async function createOnboardingTestLink({
  workspaceId,
  url,
  domain,
}: {
  workspaceId: string;
  url: string;
  domain?: string;
}): Promise<OnboardingTestLink> {
  const res = await fetch(
    `/api/onboarding/test-link?workspaceId=${encodeURIComponent(workspaceId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, ...(domain ? { domain } : {}) }),
    },
  );

  if (!res.ok) {
    const fallback = "Failed to create the test link. Please try again.";
    let message = fallback;
    try {
      const data = await res.json();
      message = data?.error?.message || data?.message || fallback;
    } catch {
      // response wasn't JSON — use fallback
    }
    throw new Error(message);
  }

  const data = (await res.json()) as any;
  return {
    id: String(data?.id || ""),
    shortLink: String(data?.shortLink || ""),
    leads: typeof data?.leads === "number" ? data.leads : Number(data?.leads ?? 0),
  };
}

