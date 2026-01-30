import { DubApiError, ErrorCodes } from "@/lib/api/errors";
import { assertWorkspaceCanUseDomain } from "@/lib/api/domains/assert-workspace-can-use-domain";
import { createLink, processLink } from "@/lib/api/links";
import { createId } from "@/lib/api/create-id";
import { parseRequestBody } from "@/lib/api/utils";
import { withWorkspace } from "@/lib/auth";
import z from "@/lib/zod";
import { prisma } from "@dub/prisma";
import { getUrlFromString, isValidUrl, nanoid } from "@dub/utils";
import { NextResponse } from "next/server";

const TEST_FOLDER_NAME = "Test";

const bodySchema = z.object({
  url: z.string().min(1),
  domain: z.string().min(1).optional(),
});

function assertValidUrl(url: string) {
  const parsed = getUrlFromString(url);
  if (!parsed || !isValidUrl(parsed)) {
    throw new DubApiError({
      code: "unprocessable_entity",
      message: "Invalid destination URL.",
    });
  }

  return parsed;
}

async function ensureTestFolder({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  const existing = await prisma.folder.findFirst({
    where: { projectId: workspaceId, name: TEST_FOLDER_NAME },
    select: { id: true },
  });
  if (existing?.id) return existing.id;

  try {
    const created = await prisma.folder.create({
      data: {
        id: createId({ prefix: "fold_" }),
        projectId: workspaceId,
        name: TEST_FOLDER_NAME,
        accessLevel: "write",
        users: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
      select: { id: true },
    });
    return created.id;
  } catch (error: any) {
    // If 2 requests race, just return the folder.
    if (error?.code === "P2002") {
      const raced = await prisma.folder.findFirst({
        where: { projectId: workspaceId, name: TEST_FOLDER_NAME },
        select: { id: true },
      });
      if (raced?.id) return raced.id;
    }
    throw error;
  }
}

// POST /api/onboarding/test-link
// Create an ephemeral onboarding "/test" link that:
// - is stored in the "Test" folder
// - expires in 24h (set at DB level)
// - does NOT count toward the workspace links monthly quota and does NOT increment counters
export const POST = withWorkspace(
  async ({ req, headers, workspace, session }) => {
    const { url, domain } = bodySchema.parse(await parseRequestBody(req));
    const normalizedUrl = assertValidUrl(url);

    if (domain) {
      await assertWorkspaceCanUseDomain({ workspace, domain });
    }

    const folderId = await ensureTestFolder({
      workspaceId: workspace.id,
      userId: session.user.id,
    });

    const key = `${nanoid(8)}/test`;

    // Use the standard link processing pipeline, but omit expiresAt to avoid plan-gating.
    const { link, error, code } = await processLink({
      payload: {
        url: normalizedUrl,
        key,
        ...(domain ? { domain } : {}),
        // explicitly keep conversion tracking on for the onboarding flow
        trackConversion: true,
      },
      workspace,
      userId: session.user.id,
    });

    if (error != null) {
      throw new DubApiError({
        code: code as ErrorCodes,
        message: error,
      });
    }

    // Create the link without affecting usage/counters.
    const created = await createLink(link, { skipUsageIncrement: true });

    // Set folder + 24h expiry at DB level (onboarding-only exemption on Free plan).
    // This bypasses `processLink` folder checks which are plan-gated for normal link creation.
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.link.update({
      where: { id: created.id },
      data: { expiresAt, folderId },
    });

    return NextResponse.json(created, { headers });
  },
  {
    requiredPermissions: ["links.write"],
  },
);

