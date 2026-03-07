import { normalizeWorkspaceId } from "@/lib/api/workspace-id";
import z from "@/lib/zod";
import { Link } from "@dub/prisma/client";
import { describe, expect, onTestFinished, test } from "vitest";
import { randomId } from "../utils/helpers";
import { IntegrationHarness } from "../utils/integration";
import {
  E2E_LINK,
  E2E_NO_ACCESS_FOLDER_ID,
  E2E_READ_ONLY_FOLDER_ID,
  E2E_TAG,
  E2E_TAG_2,
  E2E_WRITE_ACCESS_FOLDER_ID,
} from "../utils/resource";
import { LinkSchema, expectedLink } from "../utils/schema";

const { domain } = E2E_LINK;

const setupBulkTest = async (ctx: any) => {
  const h = new IntegrationHarness(ctx);
  const { workspace, http, user } = await h.init();
  const workspaceId = workspace.id;
  const projectId = normalizeWorkspaceId(workspaceId);
  return { h, http, user, workspaceId, projectId };
};

interface VerifyBulkLinksParams {
  links: Link[];
  bulkLinks: Array<{
    url: string;
    domain: string;
    tagIds?: string[];
    tagNames?: string[];
  }>;
  context: {
    user: { id: string };
    projectId: string;
    workspaceId: string;
  };
  expectedTags?: { id: string; name: string; color: string }[];
}

const verifyBulkLinks = ({
  links,
  bulkLinks,
  context: { user, projectId, workspaceId },
  expectedTags,
}: VerifyBulkLinksParams) => {
  const firstLink = links.find((l) => l.url === bulkLinks[0].url);
  const secondLink = links.find((l) => l.url === bulkLinks[1].url);

  expect(links).toHaveLength(2);
  expect(firstLink).toStrictEqual({
    ...expectedLink,
    url: bulkLinks[0].url,
    userId: user.id,
    projectId,
    workspaceId,
    shortLink: `https://${domain}/${firstLink?.key}`,
    qrCode: `https://api.pimms.io/qr?url=https://${domain}/${firstLink?.key}?qr=1`,
    ...(expectedTags ? { tags: expectedTags, tagId: expectedTags[0].id } : {}),
  });
  expect(secondLink).toStrictEqual({
    ...expectedLink,
    url: bulkLinks[1].url,
    userId: user.id,
    projectId,
    workspaceId,
    shortLink: `https://${domain}/${secondLink?.key}`,
    qrCode: `https://api.pimms.io/qr?url=https://${domain}/${secondLink?.key}?qr=1`,
    ...(expectedTags ? { tags: expectedTags, tagId: expectedTags[0].id } : {}),
  });
  expect(z.array(LinkSchema.strict()).parse(links)).toBeTruthy();
};

test("POST /links/bulk", async (ctx) => {
  const testContext = await setupBulkTest(ctx);
  const { h } = testContext;

  const bulkLinks = Array.from({ length: 2 }, () => ({
    url: `https://example.com/${randomId()}`,
    domain,
  }));

  const { status, data: links } = await testContext.http.post<Link[]>({
    path: "/links/bulk",
    body: bulkLinks,
  });

  onTestFinished(async () => {
    await Promise.all([h.deleteLink(links[0].id), h.deleteLink(links[1].id)]);
  });

  expect(status).toEqual(200);
  verifyBulkLinks({ links, bulkLinks, context: testContext });
});

test("POST /links/bulk with tag ID", async (ctx) => {
  const testContext = await setupBulkTest(ctx);
  const { h } = testContext;

  const bulkLinks = Array.from({ length: 2 }, () => ({
    url: `https://example.com/${randomId()}`,
    domain,
    tagIds: [E2E_TAG.id],
  }));

  const { status, data: links } = await testContext.http.post<Link[]>({
    path: "/links/bulk",
    body: bulkLinks,
  });

  onTestFinished(async () => {
    await Promise.all([h.deleteLink(links[0].id), h.deleteLink(links[1].id)]);
  });

  expect(status).toEqual(200);
  verifyBulkLinks({
    links,
    bulkLinks,
    context: testContext,
    expectedTags: [E2E_TAG],
  });
});

test("POST /links/bulk with tag name", async (ctx) => {
  const testContext = await setupBulkTest(ctx);
  const { h } = testContext;

  const bulkLinks = Array.from({ length: 2 }, () => ({
    url: `https://example.com/${randomId()}`,
    domain,
    tagNames: [E2E_TAG.name],
  }));

  const { status, data: links } = await testContext.http.post<Link[]>({
    path: "/links/bulk",
    body: bulkLinks,
  });

  onTestFinished(async () => {
    await Promise.all([h.deleteLink(links[0].id), h.deleteLink(links[1].id)]);
  });

  expect(status).toEqual(200);
  verifyBulkLinks({
    links,
    bulkLinks,
    context: testContext,
    expectedTags: [E2E_TAG],
  });
});

test("POST /links/bulk with multiple tags (by ID)", async (ctx) => {
  const testContext = await setupBulkTest(ctx);
  const { h } = testContext;

  const bulkLinks = Array.from({ length: 2 }, () => ({
    url: `https://example.com/${randomId()}`,
    domain,
    tagIds: [E2E_TAG_2.id, E2E_TAG.id],
  }));

  const { status, data: links } = await testContext.http.post<Link[]>({
    path: "/links/bulk",
    body: bulkLinks,
  });

  onTestFinished(async () => {
    await Promise.all([h.deleteLink(links[0].id), h.deleteLink(links[1].id)]);
  });

  expect(status).toEqual(200);
  verifyBulkLinks({
    links,
    bulkLinks,
    context: testContext,
    expectedTags: [E2E_TAG_2, E2E_TAG],
  });
});

test("POST /links/bulk with multiple tags (by name)", async (ctx) => {
  const testContext = await setupBulkTest(ctx);
  const { h } = testContext;

  const bulkLinks = Array.from({ length: 2 }, () => ({
    url: `https://example.com/${randomId()}`,
    domain,
    tagNames: [E2E_TAG_2.name, E2E_TAG.name],
  }));

  const { status, data: links } = await testContext.http.post<Link[]>({
    path: "/links/bulk",
    body: bulkLinks,
  });

  onTestFinished(async () => {
    await Promise.all([h.deleteLink(links[0].id), h.deleteLink(links[1].id)]);
  });

  expect(status).toEqual(200);
  verifyBulkLinks({
    links,
    bulkLinks,
    context: testContext,
    expectedTags: [E2E_TAG_2, E2E_TAG],
  });
});

// --- Edge case tests ---

describe("bulk create edge cases", () => {
  test("rejects empty array", async (ctx) => {
    const testContext = await setupBulkTest(ctx);

    const { status, data } = await testContext.http.post<any>({
      path: "/links/bulk",
      body: [],
    });

    expect(status).toEqual(422);
    expect(data.error.message).toContain("at least one link");
  });

  test("rejects duplicate domain+key within batch", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const key = randomId();

    const { status, data } = await testContext.http.post<any>({
      path: "/links/bulk",
      body: [
        { url: `https://example.com/${randomId()}`, domain, key },
        { url: `https://example.com/${randomId()}`, domain, key },
      ],
    });

    expect(status).toEqual(400);
    expect(data.error.message).toContain("Duplicate links found");
  });

  test("rejects duplicate externalId within batch", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const externalId = `ext-${randomId()}`;

    const { status, data } = await testContext.http.post<any>({
      path: "/links/bulk",
      body: [
        { url: `https://example.com/${randomId()}`, domain, externalId },
        { url: `https://example.com/${randomId()}`, domain, externalId },
      ],
    });

    expect(status).toEqual(400);
    expect(data.error.message).toContain("Duplicate externalIds");
  });

  test("returns mixed success/error for invalid tagIds", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const validUrl = `https://example.com/${randomId()}`;
    const invalidUrl = `https://example.com/${randomId()}`;

    const { status, data } = await testContext.http.post<any[]>({
      path: "/links/bulk",
      body: [
        { url: validUrl, domain },
        { url: invalidUrl, domain, tagIds: ["nonexistent_tag_id"] },
      ],
    });

    const successful = data.filter((item: any) => "id" in item);
    const failed = data.filter((item: any) => "error" in item);

    onTestFinished(async () => {
      for (const link of successful) {
        await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(successful).toHaveLength(1);
    expect(successful[0].url).toEqual(validUrl);
    expect(failed).toHaveLength(1);
    expect(failed[0].error).toContain("Invalid tagIds");
  });

  test("creates links with UTM parameters", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const bulkLinks = Array.from({ length: 2 }, () => ({
      url: `https://example.com/${randomId()}`,
      domain,
      utm_source: "test-source",
      utm_medium: "test-medium",
      utm_campaign: "test-campaign",
    }));

    const { status, data: links } = await testContext.http.post<Link[]>({
      path: "/links/bulk",
      body: bulkLinks,
    });

    onTestFinished(async () => {
      for (const link of links) {
        if ("id" in link) await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.utm_source).toEqual("test-source");
      expect(link.utm_medium).toEqual("test-medium");
      expect(link.utm_campaign).toEqual("test-campaign");
    }
  });

  test("creates links with externalId", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const ext1 = `ext-${randomId()}`;
    const ext2 = `ext-${randomId()}`;

    const { status, data: links } = await testContext.http.post<Link[]>({
      path: "/links/bulk",
      body: [
        { url: `https://example.com/${randomId()}`, domain, externalId: ext1 },
        { url: `https://example.com/${randomId()}`, domain, externalId: ext2 },
      ],
    });

    onTestFinished(async () => {
      for (const link of links) {
        if ("id" in link) await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(links).toHaveLength(2);
    const externalIds = links.map((l) => l.externalId).sort();
    expect(externalIds).toEqual([ext1, ext2].sort());
  });

  test("assigns links to writable folder", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const { status, data: links } = await testContext.http.post<Link[]>({
      path: "/links/bulk",
      body: [
        {
          url: `https://example.com/${randomId()}`,
          domain,
          folderId: E2E_WRITE_ACCESS_FOLDER_ID,
        },
        {
          url: `https://example.com/${randomId()}`,
          domain,
          folderId: E2E_WRITE_ACCESS_FOLDER_ID,
        },
      ],
    });

    onTestFinished(async () => {
      for (const link of links) {
        if ("id" in link) await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.folderId).toEqual(E2E_WRITE_ACCESS_FOLDER_ID);
    }
  });

  test("rejects links targeting read-only folder", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const validUrl = `https://example.com/${randomId()}`;

    const { status, data } = await testContext.http.post<any[]>({
      path: "/links/bulk",
      body: [
        { url: validUrl, domain },
        {
          url: `https://example.com/${randomId()}`,
          domain,
          folderId: E2E_READ_ONLY_FOLDER_ID,
        },
      ],
    });

    const successful = data.filter((item: any) => "id" in item);
    const failed = data.filter((item: any) => "error" in item);

    onTestFinished(async () => {
      for (const link of successful) {
        await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(successful).toHaveLength(1);
    expect(successful[0].url).toEqual(validUrl);
    expect(failed).toHaveLength(1);
    expect(failed[0].error).toContain("write access");
  });

  test("rejects links targeting no-access folder", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const validUrl = `https://example.com/${randomId()}`;

    const { status, data } = await testContext.http.post<any[]>({
      path: "/links/bulk",
      body: [
        { url: validUrl, domain },
        {
          url: `https://example.com/${randomId()}`,
          domain,
          folderId: E2E_NO_ACCESS_FOLDER_ID,
        },
      ],
    });

    const successful = data.filter((item: any) => "id" in item);
    const failed = data.filter((item: any) => "error" in item);

    onTestFinished(async () => {
      for (const link of successful) {
        await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(successful).toHaveLength(1);
    expect(successful[0].url).toEqual(validUrl);
    expect(failed).toHaveLength(1);
  });

  test("returns correct response shape for mixed results", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const validUrl = `https://example.com/${randomId()}`;

    const { status, data } = await testContext.http.post<any[]>({
      path: "/links/bulk",
      body: [
        { url: validUrl, domain },
        { url: `https://example.com/${randomId()}`, domain, tagIds: ["fake"] },
      ],
    });

    const successful = data.filter((item: any) => "id" in item);
    const failed = data.filter((item: any) => "error" in item);

    onTestFinished(async () => {
      for (const link of successful) {
        await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);

    // Verify successful link shape
    expect(successful[0]).toHaveProperty("id");
    expect(successful[0]).toHaveProperty("shortLink");
    expect(successful[0]).toHaveProperty("domain");

    // Verify error link shape
    expect(failed[0]).toHaveProperty("error");
    expect(failed[0]).toHaveProperty("code");
    expect(failed[0]).toHaveProperty("link");
  });

  test("handles links with custom keys", async (ctx) => {
    const testContext = await setupBulkTest(ctx);
    const { h } = testContext;

    const key1 = `test-${randomId()}`;
    const key2 = `test-${randomId()}`;

    const { status, data: links } = await testContext.http.post<Link[]>({
      path: "/links/bulk",
      body: [
        { url: `https://example.com/${randomId()}`, domain, key: key1 },
        { url: `https://example.com/${randomId()}`, domain, key: key2 },
      ],
    });

    onTestFinished(async () => {
      for (const link of links) {
        if ("id" in link) await h.deleteLink(link.id);
      }
    });

    expect(status).toEqual(200);
    expect(links).toHaveLength(2);
    const keys = links.map((l) => l.key).sort();
    expect(keys).toEqual([key1, key2].sort());
  });
});
