import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/edge-config", () => ({
  isBlacklistedDomain: vi.fn().mockResolvedValue(false),
  isWhitelistedDomain: vi.fn().mockResolvedValue(false),
  updateConfig: vi.fn(),
}));

vi.mock("@/lib/folder/permissions", () => ({
  verifyFolderAccess: vi.fn(),
}));

vi.mock("@/lib/pangea", () => ({
  getPangeaDomainIntel: vi.fn(),
}));

vi.mock("@/lib/planetscale", () => ({
  checkIfUserExists: vi.fn(),
  getRandomKey: vi.fn(),
}));

vi.mock("@/lib/safeBrowsing", () => ({
  checkUrlWithSafeBrowsing: vi.fn(),
}));

vi.mock("@/lib/storage", () => ({
  isStored: vi.fn(),
}));

vi.mock("@dub/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@dub/email/templates/check-failure", () => ({
  CheckFailureEmail: vi.fn(),
}));

vi.mock("@dub/email/templates/free-plan-redirect-attempt", () => ({
  FreePlanRedirectAttemptEmail: vi.fn(),
}));

vi.mock("@dub/email/templates/malicious-link-attempt", () => ({
  MaliciousLinkAttemptEmail: vi.fn(),
}));

vi.mock("@dub/email/templates/too-many-redirects", () => ({
  TooManyRedirectsEmail: vi.fn(),
}));

vi.mock("@dub/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    project: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@dub/utils", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    log: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/api/tags/combine-tag-ids", () => ({
  combineTagIds: vi.fn().mockReturnValue([]),
}));

vi.mock("@/lib/api/links/plan-features-check", () => ({
  businessFeaturesCheck: vi.fn(),
  proFeaturesCheck: vi.fn(),
  proLinkFeaturesCheck: vi.fn(),
}));

vi.mock("@/lib/api/links/utils", () => ({
  keyChecks: vi.fn(),
  processKey: vi.fn(),
}));

import { checkRedirectRestrictions } from "@/lib/api/links/process-link";

type MockRoute = {
  status: number;
  location?: string;
};

/**
 * Simulates production behavior where HEAD requests fail but GET succeeds.
 * Many servers reject HEAD or time out on HEAD while GET works fine.
 */
function mockFetchHeadFailsGetSucceeds(routes: Record<string, MockRoute>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    const method = (init?.method || "GET").toUpperCase();

    if (method === "HEAD") {
      throw new Error("HEAD request failed: connection refused");
    }

    const route = routes[urlStr];
    if (!route) {
      throw new Error(`Unexpected fetch call: ${urlStr} (${method})`);
    }
    const headers = new Headers();
    if (route.location) {
      headers.set("Location", route.location);
    }
    return new Response(null, { status: route.status, headers });
  });
}

describe("checkRedirectRestrictions – free plan, HEAD fails but GET works", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("https://star-aid.fr/ – HEAD fails, GET 200, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://star-aid.fr/": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://star-aid.fr/",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("http://www.star-aid.fr – HEAD fails, GET follows 2 same-domain hops, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "http://www.star-aid.fr": {
        status: 301,
        location: "https://www.star-aid.fr/",
      },
      "https://www.star-aid.fr/": {
        status: 301,
        location: "https://star-aid.fr/",
      },
      "https://star-aid.fr/": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "http://www.star-aid.fr",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://vangart.com.my – HEAD fails, GET 200, second-level TLD .com.my, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://vangart.com.my": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://vangart.com.my",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://test.com/ – HEAD fails, GET 200, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://test.com/": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://test.com/",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://elevia.io – HEAD fails, GET redirects apex to www, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://elevia.io": { status: 301, location: "https://www.elevia.io/" },
      "https://www.elevia.io/": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://elevia.io",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://go.aros.com.br/planos – HEAD fails, GET redirects subdomain within .com.br, should accept", async () => {
    const originalUrl =
      "https://go.aros.com.br/planos?utm_source=docs&utm_medium=owned&utm_content=navbar";
    const redirectUrl =
      "https://lp.aros.com.br/planos?utm_source=docs&utm_medium=owned&utm_content=navbar";

    global.fetch = mockFetchHeadFailsGetSucceeds({
      [originalUrl]: { status: 301, location: redirectUrl },
      [redirectUrl]: { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: originalUrl,
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://veil-it.com/ – HEAD fails, GET redirects to /fr/ path, should accept", async () => {
    const originalUrl =
      "https://veil-it.com/?utm_source=email&utm_medium=signature-email";
    const redirectUrl =
      "https://veil-it.com/fr/?utm_source=email&utm_medium=signature-email";

    global.fetch = mockFetchHeadFailsGetSucceeds({
      [originalUrl]: { status: 301, location: redirectUrl },
      [redirectUrl]: { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: originalUrl,
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://cal.com/jonas-malka/ – HEAD fails, GET removes trailing slash, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://cal.com/jonas-malka/": {
        status: 301,
        location: "https://cal.com/jonas-malka",
      },
      "https://cal.com/jonas-malka": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://cal.com/jonas-malka/",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://www.youtube.com/@meenanitia – HEAD fails, GET follows 2 hops through consent subdomain, should accept", async () => {
    const consentUrl =
      "https://consent.youtube.com/m?continue=https%3A%2F%2Fwww.youtube.com%2F%40meenanitia%3Fcbrd%3D1&gl=FR&m=0&pc=yt&cm=2&hl=fr&src=1";
    const finalUrl = "https://www.youtube.com/@meenanitia?cbrd=1&ucbcb=1";

    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://www.youtube.com/@meenanitia": {
        status: 302,
        location: consentUrl,
      },
      [consentUrl]: { status: 302, location: finalUrl },
      [finalUrl]: { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://www.youtube.com/@meenanitia",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });

  it("https://framer.com – HEAD fails, GET redirects apex to www, should accept", async () => {
    global.fetch = mockFetchHeadFailsGetSucceeds({
      "https://framer.com": {
        status: 301,
        location: "https://www.framer.com/",
      },
      "https://www.framer.com/": { status: 200 },
    });

    const result = await checkRedirectRestrictions({
      url: "https://framer.com",
      workspacePlan: "free",
    });

    expect(result.error).toBeNull();
  });
});

