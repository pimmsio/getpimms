import { DubApiError } from "@/lib/api/errors";
import { InstalledIntegration } from "@dub/prisma/client";

export const uninstallCalendlyIntegration = async ({
  installation,
}: {
  installation: InstalledIntegration;
}) => {
  const { accessToken, webhookUri } = installation.credentials as {
    accessToken: string;
    webhookUri: string;
  };

  if (!accessToken || !webhookUri) {
    throw new DubApiError({
      code: "bad_request",
      message: "Missing required credentials to uninstall Calendly integration.",
    });
  }

  const res = await fetch(webhookUri, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.json();
    console.error("[Calendly Uninstall]", error);

    throw new DubApiError({
      code: "bad_request",
      message: "Failed to remove Calendly webhook subscription.",
    });
  }
};
