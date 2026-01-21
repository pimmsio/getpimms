import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import { sendEmail } from "@dub/email";
import { prisma } from "@dub/prisma";
import { APP_DOMAIN_WITH_NGROK, isDubDomain } from "@dub/utils";
import { NextResponse } from "next/server";
import z from "@/lib/zod";

const bodySchema = z.object({
  domain: z
    .string({ required_error: "domain is required" })
    .min(1)
    .transform((d) => d.toLowerCase().replace(/^www\./, "")),
});

// POST /api/domains/access-request - request access to an existing custom domain (admin approval)
export const POST = withWorkspace(
  async ({ req, workspace, session }) => {
    const { domain } = bodySchema.parse(await req.json());

    if (isDubDomain(domain)) {
      throw new DubApiError({
        code: "bad_request",
        message:
          "This is a PiMMs default domain and does not require access approval.",
      });
    }

    const domainRecord = await prisma.domain.findUnique({
      where: { slug: domain },
      select: {
        slug: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!domainRecord) {
      throw new DubApiError({
        code: "not_found",
        message: `Domain ${domain} not found.`,
      });
    }

    if (domainRecord.projectId === workspace.id) {
      throw new DubApiError({
        code: "conflict",
        message: `Domain ${domain} is already owned by this workspace.`,
      });
    }

    const access = await prisma.domainWorkspaceAccess.upsert({
      where: {
        domainSlug_workspaceId: {
          domainSlug: domain,
          workspaceId: workspace.id,
        },
      },
      create: {
        domainSlug: domain,
        workspaceId: workspace.id,
        enabled: false,
        requestedByUserId: session.user.id,
      },
      update: {
        // keep enabled as-is; if it was already enabled, don't turn it off
        requestedByUserId: session.user.id,
      },
      select: {
        enabled: true,
      },
    });

    // Email global admin for manual approval
    const adminEmail = process.env.ADMIN_EMAIL || "alexandre@pimms.io";
    await sendEmail({
      email: adminEmail,
      subject: `Domain access request: ${domain} → ${workspace.slug}`,
      text: [
        `A workspace requested access to an existing domain.`,
        ``,
        `Domain: ${domain}`,
        `Requesting workspace: ${workspace.name} (${workspace.slug}, ${workspace.id})`,
        `Owner workspace: ${domainRecord.project?.name || "Unknown"} (${domainRecord.project?.slug || "unknown"}, ${domainRecord.projectId || "unknown"})`,
        `Requested by: ${session.user.email || session.user.id}`,
        ``,
        `Approve: ${APP_DOMAIN_WITH_NGROK}/api/admin/domains/access?domain=${encodeURIComponent(
          domain,
        )}&workspaceId=${encodeURIComponent(
          workspace.id,
        )}&enabled=true`,
        `Disable: ${APP_DOMAIN_WITH_NGROK}/api/admin/domains/access?domain=${encodeURIComponent(
          domain,
        )}&workspaceId=${encodeURIComponent(
          workspace.id,
        )}&enabled=false`,
      ].join("\n"),
      variant: "notifications",
    });

    return NextResponse.json({
      success: true,
      enabled: access.enabled,
    });
  },
  {
    requiredPermissions: ["domains.write"],
  },
);

