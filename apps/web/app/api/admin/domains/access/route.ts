import { DubApiError } from "@/lib/api/errors";
import { withAdmin } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const querySchema = z.object({
  domain: z.string().min(1).transform((d) => d.toLowerCase().replace(/^www\./, "")),
  workspaceId: z.string().min(1),
  enabled: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
});

const bodySchema = z.object({
  domain: z.string().min(1).transform((d) => d.toLowerCase().replace(/^www\./, "")),
  workspaceId: z.string().min(1),
  enabled: z.boolean(),
});

// GET /api/admin/domains/access?domain=...&workspaceId=...&enabled=true
// Convenience endpoint for admin approval links (requires admin session).
export const GET = withAdmin(async ({ searchParams }) => {
  const { domain, workspaceId, enabled } = querySchema.parse(searchParams);

  const domainRecord = await prisma.domain.findUnique({
    where: { slug: domain },
    select: { slug: true },
  });
  if (!domainRecord) {
    throw new DubApiError({
      code: "not_found",
      message: `Domain ${domain} not found.`,
    });
  }

  const updated = await prisma.domainWorkspaceAccess.upsert({
    where: {
      domainSlug_workspaceId: {
        domainSlug: domain,
        workspaceId,
      },
    },
    create: {
      domainSlug: domain,
      workspaceId,
      enabled,
      enabledAt: enabled ? new Date() : null,
    },
    update: {
      enabled,
      enabledAt: enabled ? new Date() : null,
    },
    select: {
      domainSlug: true,
      workspaceId: true,
      enabled: true,
      enabledAt: true,
    },
  });

  return NextResponse.json({ success: true, access: updated });
});

// POST /api/admin/domains/access { domain, workspaceId, enabled }
export const POST = withAdmin(async ({ req }) => {
  const { domain, workspaceId, enabled } = bodySchema.parse(await req.json());

  const domainRecord = await prisma.domain.findUnique({
    where: { slug: domain },
    select: { slug: true },
  });
  if (!domainRecord) {
    throw new DubApiError({
      code: "not_found",
      message: `Domain ${domain} not found.`,
    });
  }

  const updated = await prisma.domainWorkspaceAccess.upsert({
    where: {
      domainSlug_workspaceId: {
        domainSlug: domain,
        workspaceId,
      },
    },
    create: {
      domainSlug: domain,
      workspaceId,
      enabled,
      enabledAt: enabled ? new Date() : null,
    },
    update: {
      enabled,
      enabledAt: enabled ? new Date() : null,
    },
    select: {
      domainSlug: true,
      workspaceId: true,
      enabled: true,
      enabledAt: true,
    },
  });

  return NextResponse.json({ success: true, access: updated });
});

