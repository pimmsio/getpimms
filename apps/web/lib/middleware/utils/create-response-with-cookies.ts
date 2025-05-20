import { NextResponse } from "next/server";

export function createResponseWithCookies(
  response: NextResponse,
  {
    path,
    pimmsIdCookieName,
    pimmsIdCookieValue,
    pimmsTestUrlValue,
  }: {
    path: string;
    pimmsIdCookieName: string;
    pimmsIdCookieValue: string;
    pimmsTestUrlValue?: string | null;
  },
): NextResponse {
  // set pimms_id_<domain>_<key> cookie
  // this caches pimms_id for 1 hour (for deduplication)
  response.cookies.set(pimmsIdCookieName, pimmsIdCookieValue, {
    path,
    maxAge: 60 * 60, // 1 hour
  });

  console.log("setting pimms_id cookie", pimmsIdCookieValue, path);

  // set pimms_test_url if this link has testVariants
  // caches for 1 week (for consistent user experience)
  if (pimmsTestUrlValue) {
    console.log("setting pimms_test_url cookie", pimmsTestUrlValue, path);

    response.cookies.set("pimms_test_url", pimmsTestUrlValue, {
      path,
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
  }

  return response;
}
