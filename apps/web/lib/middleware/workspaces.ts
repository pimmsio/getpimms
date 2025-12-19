import { UserProps } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { parse } from "./utils";
import { getDefaultWorkspace } from "./utils/get-default-workspace";
import { isTopLevelSettingsRedirect } from "./utils/is-top-level-settings-redirect";
import { getOnboardingStep } from "./utils/get-onboarding-step";

export default async function WorkspacesMiddleware(
  req: NextRequest,
  user: UserProps,
) {
  const { path, searchParamsObj } = parse(req);

  // special case for handling ?next= query param
  if (searchParamsObj.next) {
    return NextResponse.redirect(new URL(searchParamsObj.next, req.url));
  }

  const defaultWorkspace = await getDefaultWorkspace(user);

  if (defaultWorkspace) {
    let redirectPath = path;
    if (["/", "/login", "/register", "/workspaces"].includes(path)) {
      redirectPath = "";
    } else if (isTopLevelSettingsRedirect(path)) {
      redirectPath = `/settings/${path}`;
    }

    // If this is a brand-new user, ensure the first redirect into the workspace includes onboarding.
    // This closes a race where the workspace exists before the onboarding-step is initialized.
    const createdAtMs = (user as any)?.createdAt
      ? new Date((user as any).createdAt).getTime()
      : NaN;
    const isNewUser =
      Number.isFinite(createdAtMs) &&
      createdAtMs > Date.now() - 60 * 60 * 24 * 1000;
    const hasOnboardingParam = req.nextUrl.searchParams.has("onboarding");

    let onboardingStep: string | null = null;
    if (isNewUser && !hasOnboardingParam) {
      onboardingStep = (await getOnboardingStep(user)) as string | null;
      if (!onboardingStep) {
        const { redis } = await import("@/lib/upstash");
        onboardingStep = "tracking-familiarity";
        await redis.set(`onboarding-step:${user.id}`, onboardingStep);
      }
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    if (onboardingStep && onboardingStep !== "completed" && !params.has("onboarding")) {
      params.set("onboarding", onboardingStep);
    }
    const query = params.toString();
    const queryString = query.length > 0 ? `?${query}` : "";

    return NextResponse.redirect(
      new URL(
        `/${defaultWorkspace}${redirectPath || "/today"}${queryString}`,
        req.url,
      ),
    );
  } else {
    // Should never happen - workspace is auto-created on signup
    return NextResponse.redirect(new URL("/", req.url));
  }
}
