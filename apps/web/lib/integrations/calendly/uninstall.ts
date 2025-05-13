import { DubApiError } from "@/lib/api/errors";
import { InstalledIntegration } from "@dub/prisma/client";

export const uninstallCalendlyIntegration = async ({
  installation,
}: {
  installation: InstalledIntegration;
}) => {
  const { webhookUri, refreshToken } = installation.credentials as {
    refreshToken: string;
    webhookUri: string;
  };

  if (!refreshToken || !webhookUri) {
    throw new DubApiError({
      code: "bad_request",
      message: "Missing required credentials to uninstall Calendly integration.",
    });
  }

  let accessToken: string;

  try {
    const clientId = process.env.CALENDLY_CLIENT_ID!;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const tokenRes = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Calendly Token Refresh Error]", tokenData);
      throw new DubApiError({
        code: "bad_request",
        message: "Failed to refresh Calendly token before uninstall.",
      });
    }

    accessToken = tokenData.access_token;
  } catch (err) {
    console.error("[Calendly Refresh Error]", err);
    throw new DubApiError({
      code: "bad_request",
      message: "Could not refresh access token for Calendly.",
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
