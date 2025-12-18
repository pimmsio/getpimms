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

    // if there's a user
  } else if (user) {
    // /new is a special path that creates a new link (or workspace if the user doesn't have one yet)
    if (path === "/new") {
      return NewLinkMiddleware(req, user);

      /* Onboarding redirects

        - User was created less than a day ago
        - User is not invited to a workspace (redirect straight to the workspace)
        - The path does not start with /account
        - The user has not completed the onboarding step
      */
    } else if (
      (path === "/onboarding" || path.startsWith("/onboarding/")) &&
      new Date(user.createdAt).getTime() > Date.now() - 60 * 60 * 24 * 1000 &&
      !isWorkspaceInvite
    ) {
      // Always redirect /onboarding paths to dashboard with onboarding modal
      const step = path === "/onboarding" ? "tracking-familiarity" : path.replace("/onboarding/", "");
      const defaultWorkspace = await getDefaultWorkspace(user);
      if (defaultWorkspace) {
        // Set step if not already set
        const currentStep = await getOnboardingStep(user);
        if (!currentStep) {
          const { redis } = await import("@/lib/upstash");
          await redis.set(`onboarding-step:${user.id}`, step);
        }
        return NextResponse.redirect(
          new URL(`/${defaultWorkspace}?onboarding=${step}`, req.url),
        );
      }
    } else if (
      new Date(user.createdAt).getTime() > Date.now() - 60 * 60 * 24 * 1000 &&
      !isWorkspaceInvite &&
      !path.startsWith("/account") &&
      !req.nextUrl.searchParams.has("onboarding") && // Don't redirect if already on dashboard with onboarding
      (await getOnboardingStep(user)) !== "completed"
    ) {
      const step = await getOnboardingStep(user);
      const defaultWorkspace = await getDefaultWorkspace(user);
      
      if (!step && defaultWorkspace) {
        const { redis } = await import("@/lib/upstash");
        await redis.set(`onboarding-step:${user.id}`, "tracking-familiarity");
        return NextResponse.redirect(
          new URL(`/${defaultWorkspace}?onboarding=tracking-familiarity`, req.url),
        );
      }
      
      if (step && step !== "completed" && defaultWorkspace && path !== `/${defaultWorkspace}`) {
        return NextResponse.redirect(
          new URL(`/${defaultWorkspace}?onboarding=${step}`, req.url),
        );
      }

      // if the path is / or /login or /register, redirect to the default workspace
    } else if (
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
    } else if (appRedirect(path)) {
      return NextResponse.redirect(
        new URL(`${appRedirect(path)}${searchParamsString}`, req.url),
      );
    }
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app.dub.co${fullPath}`, req.url));
}
