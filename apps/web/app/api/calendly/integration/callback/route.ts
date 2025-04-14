import { OAUTH_CONFIG } from "@/lib/api/oauth/constants";
import { createToken } from "@/lib/api/oauth/utils";
import { hashToken } from "@/lib/auth";
import { installIntegration } from "@/lib/integrations/install";
import { generateRandomName } from "@/lib/names";
import { prisma } from "@dub/prisma";
import { APP_DOMAIN, getCurrentPlan } from "@dub/utils";
import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { z } from "zod";

const callbackSchema = z.object({
  code: z.string(),
  slug: z.string(),
});

const safeRedirect = (slug: string, error?: string) => {
  if (!slug) {
    return NextResponse.redirect(`${APP_DOMAIN}/?error=oauth_failed`);
  }

  const base = `${APP_DOMAIN}/${slug}/settings/integrations/calendly`;
  return NextResponse.redirect(
    error ? `${base}?error=${encodeURIComponent(error)}` : base,
  );
};

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams);

  try {
    const { code } = callbackSchema.parse(searchParams);

    const [app, accessCode] = await Promise.all([
      prisma.oAuthApp.findFirst({
        where: { oAuthCodes: { some: { code } } },
        select: {
          clientId: true,
          pkce: true,
          hashedClientSecret: true,
          integrationId: true,
        },
      }),
      prisma.oAuthCode.findUnique({
        where: { code },
        select: {
          clientId: true,
          userId: true,
          projectId: true,
          scopes: true,
          redirectUri: true,
          expiresAt: true,
          codeChallenge: true,
          codeChallengeMethod: true,
        },
      }),
    ]);

    if (!app || !accessCode) {
      console.error("Invalid or expired authorization code", {
        app,
        accessCode,
      });
      throw new Error("Invalid or expired authorization code");
    }

    console.log("app", app);

    if (accessCode.expiresAt < new Date()) {
      await prisma.oAuthCode.delete({ where: { code } });
      throw new Error("Authorization code has expired");
    }

    const clientId = process.env.CALENDLY_CLIENT_ID!;
    const clientSecret = process.env.CALENDLY_CLIENT_SECRET!;
    const webhookSigningKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY!;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    // let's construct the redirect
    // example: https://app.pimms.io/oauth/authorize
    // ?client_id=pimms_app_xyz
    // &redirect_uri=https://app.pimms.io/api/calendly/integration/callback
    // &response_type=code&scope=user.read
    const redirectUri = `${APP_DOMAIN}/oauth/authorize?client_id=${app.clientId}&redirect_uri=${accessCode.redirectUri}&response_type=code&scope=user.read`;

    const tokenResponse = await fetch("https://auth.calendly.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description || "Calendly token exchange failed",
      );
    }

    const calendlyAccessToken = tokenData.access_token;

    const userRes = await fetch("https://api.calendly.com/users/me", {
      headers: { Authorization: `Bearer ${calendlyAccessToken}` },
    });

    const userData = await userRes.json();
    if (!userRes.ok || !userData.resource) {
      console.error("Failed to fetch Calendly user info", userData);
      throw new Error("Failed to fetch Calendly user info");
    }

    const userUri = userData.resource.uri;
    const organizationUri = userData.resource.current_organization;

    console.log("user data", userData);

    const webhookUrl = `${APP_DOMAIN}/api/calendly/integration/webhook`;

    const webhookRes = await fetch("https://api.calendly.com/webhook_subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${calendlyAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        events: ["invitee.created"],
        organization: organizationUri,
        user: userUri,
        scope: "user",
        signing_key: webhookSigningKey,
      }),
    });

    const webhookData = await webhookRes.json();
    console.log("webhookData", webhookData);
    
    if (!webhookRes.ok || !webhookData.resource) {
      console.error("Webhook creation error", webhookData);
      throw new Error("Failed to create Calendly webhook");
    }

    const installation = await installIntegration({
      userId: accessCode.userId,
      workspaceId: accessCode.projectId,
      integrationId: app.integrationId,
      credentials: {
        accessToken: calendlyAccessToken,
        userUri,
        organizationUri,
        webhookUri: webhookData.resource.uri,
      },
    });

    const accessToken = createToken({
      length: OAUTH_CONFIG.ACCESS_TOKEN_LENGTH,
      prefix: OAUTH_CONFIG.ACCESS_TOKEN_PREFIX,
    });

    const refreshToken = createToken({
      length: OAUTH_CONFIG.REFRESH_TOKEN_LENGTH,
    });

    const accessTokenExpires = new Date(
      Date.now() + OAUTH_CONFIG.ACCESS_TOKEN_LIFETIME * 1000,
    );

    const restrictedToken = await prisma.restrictedToken.create({
      data: {
        name: generateRandomName(),
        hashedKey: await hashToken(accessToken),
        partialKey: `${accessToken.slice(0, 3)}...${accessToken.slice(-4)}`,
        scopes: accessCode.scopes,
        expires: accessTokenExpires,
        userId: accessCode.userId,
        projectId: accessCode.projectId,
        installationId: installation.id,
        refreshTokens: {
          create: {
            installationId: installation.id,
            hashedRefreshToken: await hashToken(refreshToken),
            expiresAt: new Date(
              Date.now() + OAUTH_CONFIG.REFRESH_TOKEN_LIFETIME * 1000,
            ),
          },
        },
      },
    });

    waitUntil(
      Promise.all([
        prisma.oAuthCode.delete({ where: { code } }),
        prisma.restrictedToken.deleteMany({
          where: {
            installationId: installation.id,
            id: { not: restrictedToken.id },
          },
        }),
        prisma.project
          .findUnique({
            where: { id: accessCode.projectId },
            select: { plan: true },
          })
          .then(async (project) => {
            if (!project?.plan) return;
            await prisma.restrictedToken.update({
              where: { id: restrictedToken.id },
              data: {
                rateLimit: getCurrentPlan(project.plan).limits.api,
              },
            });
          }),
      ]),
    );

    const workspace = await prisma.project.findUniqueOrThrow({
      where: { id: accessCode.projectId },
      select: { slug: true },
    });

    return safeRedirect(workspace.slug);
  } catch (err) {
    return safeRedirect(
      searchParams.slug,
      err instanceof Error ? err.message : "Unknown error",
    );
  }
};
