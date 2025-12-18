export async function saveOnboardingAnswer(
  key: string,
  value: string | object,
  workspaceSlug: string,
) {
  if (!workspaceSlug) {
    throw new Error("Workspace slug not found");
  }

  const response = await fetch(
    `/api/workspaces/${workspaceSlug}/onboarding`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        [key]: value,
      }),
    },
  );

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error?.message || "Failed to save answer");
  }

  return response.json();
}
