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
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to create the test link. Please try again.");
  }

  const data = (await res.json()) as any;
  return {
    id: String(data?.id || ""),
    shortLink: String(data?.shortLink || ""),
    leads: typeof data?.leads === "number" ? data.leads : Number(data?.leads ?? 0),
  };
}

