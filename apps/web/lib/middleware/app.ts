import { parse } from "@/lib/middleware/utils";
import { NextRequest, NextResponse } from "next/server";
import EmbedMiddleware from "./embed";
import NewLinkMiddleware from "./new-link";
import { appRedirect } from "./utils/app-redirect";
import { getDefaultWorkspace } from "./utils/get-default-workspace";
import { getOnboardingStep } from "./utils/get-onboarding-step";
import { getUserViaToken } from "./utils/get-user-via-token";
import { isTopLevelSettingsRedirect } from "./utils/is-top-level-settings-redirect";
import WorkspacesMiddleware from "./workspaces";
import { redis } from "../upstash/redis";

export default async function AppMiddleware(req: NextRequest) {
  const { path, fullPath, searchParamsString } = parse(req);

  if (path.startsWith("/embed")) {
    return EmbedMiddleware(req);
  }

  const user = await getUserViaToken(req);
  const isWorkspaceInvite =
    req.nextUrl.searchParams.get("invite") || path.startsWith("/invites/");

  // if there's no user and the path isn't /login or /register, redirect to /login
  if (
    !user &&
    path !== "/login" &&
    path !== "/forgot-password" &&
    path !== "/register" &&
    path !== "/auth/saml" &&
    !path.startsWith("/auth/reset-password/") &&
    !path.startsWith("/share/")
  ) {
    return NextResponse.redirect(
      new URL(
        // `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        `/login`,
        req.url,
      ),
    );
  }

  // if there's a user
  if (user) {
    // /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    if (path === "/new") {
      return NewLinkMiddleware(req, user);
    }

    // if the path is / or /login or /register, redirect to the default workspace
    if (
      [
        "/",
        "/login",
        "/register",
        "/workspaces",
        "/links",
        "/analytics",
        "/events",
        "/programs",
        "/settings",
        "/upgrade",
        "/wrapped",
      ].includes(path) ||
      path.startsWith("/settings/") ||
      isTopLevelSettingsRedirect(path)
    ) {
      return WorkspacesMiddleware(req, user);
    }

    if (appRedirect(path)) {
      return NextResponse.redirect(
        new URL(`${appRedirect(path)}${searchParamsString}`, req.url),
      );
    }

    // Check onboarding on workspace routes (before rewrite)
    // Only for new users (< 24h) to avoid unnecessary Redis calls
    if (!isWorkspaceInvite && !path.startsWith("/account") && !req.nextUrl.searchParams.has("onboarding")) {
      const isNewUser = new Date(user.createdAt).getTime() > Date.now() - 60 * 60 * 24 * 1000;
      
      if (isNewUser) {
        let step = await getOnboardingStep(user);
        const defaultWorkspace = await getDefaultWorkspace(user);
        
        // If no step, initialize it
        if (defaultWorkspace && !step) {
          const { redis } = await import("@/lib/upstash");
          step = "tracking-familiarity";
          await redis.set(`onboarding-step:${user.id}`, step);
        }
        
        if (defaultWorkspace && step && step !== "completed") {
          return NextResponse.redirect(
            new URL(`/${defaultWorkspace}/today?onboarding=${step}`, req.url),
          );
        }
      }
    }
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app.dub.co${fullPath}`, req.url));
}
