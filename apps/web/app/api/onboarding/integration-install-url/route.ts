import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { getStripeInstallationUrl } from "@/lib/integrations/stripe/install";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  integrationSlug: z.string().min(1),
  test: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional(),
});

// GET /api/onboarding/integration-install-url?integrationSlug=calendly
// Returns the install URL stored in DB for an integration (if any).
export const GET = withWorkspace(
  async ({ headers, searchParams, workspace }) => {
    const { integrationSlug, test } = querySchema.parse(searchParams);
    const testMode = test === "1" || test === "true";

    const integration = await prisma.integration.findUnique({
      where: { slug: integrationSlug },
      select: { slug: true, installUrl: true },
    });

    if (!integration) {
      throw new DubApiError({
        code: "not_found",
        message: "Integration not found.",
      });
    }

    // Some integrations (e.g. Stripe) have an environment-based install URL rather than a DB `installUrl`.
    if (!integration.installUrl && integrationSlug === "stripe") {
      const installUrl = await getStripeInstallationUrl(workspace.id, testMode);
      return NextResponse.json({ installUrl }, { headers });
    }

    return NextResponse.json({ installUrl: integration.installUrl ?? null }, { headers });
  },
  {
    requiredPermissions: ["workspaces.read"],
  },
);

