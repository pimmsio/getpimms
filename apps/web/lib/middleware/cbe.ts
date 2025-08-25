import { parse } from "@/lib/middleware/utils";
import { NextRequest, NextResponse } from "next/server";
import { getUserViaToken } from "./utils/get-user-via-token";

const AUTHENTICATED_PATHS = ["/success", "/onboarding"];

export default async function CbeMiddleware(req: NextRequest) {
  const { path, fullPath, searchParamsObj } = parse(req);

  const user = await getUserViaToken(req);

  const isAuthenticatedPath = AUTHENTICATED_PATHS.some(
    (p) => path === "/" || path.startsWith(p),
  );

  const isLoginPath = ["/login", "/register"].some(
    (p) => path.startsWith(p) || path.endsWith(p),
  );

  // If no user and trying to access authenticated paths, redirect to login
  if (!user && isAuthenticatedPath) {
    return NextResponse.redirect(
      new URL(
        `/login${path === "/" ? "" : `?next=${encodeURIComponent(fullPath)}`}`,
        req.url,
      ),
    );
  }

  // If user is authenticated and trying to access login/register, redirect to success page
  if (user && isLoginPath) {
    if (searchParamsObj.next) {
      return NextResponse.redirect(new URL(searchParamsObj.next, req.url));
    }
    return NextResponse.redirect(new URL("/success", req.url));
  }

  // If authenticated user hits root, redirect to success
  if (user && path === "/") {
    return NextResponse.redirect(new URL("/success", req.url));
  }

  return NextResponse.rewrite(new URL(`/cbe.dub.co${fullPath}`, req.url));
}
