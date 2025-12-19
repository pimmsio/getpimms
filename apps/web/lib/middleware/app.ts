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

    // Check onboarding for new users (< 24h) before workspace redirects
    const createdAtMs = (user as any)?.createdAt
      ? new Date((user as any).createdAt).getTime()
      : NaN;
    const isNewUser =
      Number.isFinite(createdAtMs) &&
      createdAtMs > Date.now() - 60 * 60 * 24 * 1000;

    if (isNewUser && !isWorkspaceInvite && !path.startsWith("/account")) {
      const defaultWorkspace = await getDefaultWorkspace(user);
      let step = await getOnboardingStep(user);

      // If no step, initialize it
      if (defaultWorkspace && !step) {
        step = "tracking-familiarity";
        await redis.set(`onboarding-step:${user.id}`, step);
      }

      // If onboarding is completed, allow access
      if (step === "completed") {
        // Allow access, but remove onboarding query param if present
        const onboardingParam = req.nextUrl.searchParams.get("onboarding");
        if (onboardingParam) {
          const newUrl = new URL(req.url);
          newUrl.searchParams.delete("onboarding");
          return NextResponse.redirect(newUrl);
        }
      } else if (defaultWorkspace && step) {
        const onboardingParam = req.nextUrl.searchParams.get("onboarding");

        // If there's an onboarding query param, validate it matches the stored step
        if (onboardingParam) {
          if (onboardingParam !== step) {
            // Query param doesn't match stored step - redirect to correct step
            return NextResponse.redirect(
              new URL(`/${defaultWorkspace}/today?onboarding=${step}`, req.url),
            );
          }
          // Query param matches, allow access
        } else if (!path.startsWith("/onboarding")) {
          // No query param but user is in onboarding - redirect to current step
          return NextResponse.redirect(
            new URL(`/${defaultWorkspace}/today?onboarding=${step}`, req.url),
          );
        }
      }
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
  }

  // otherwise, rewrite the path to /app
  return NextResponse.rewrite(new URL(`/app.dub.co${fullPath}`, req.url));
}
