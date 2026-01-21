import { DubApiError } from "@/lib/api/errors";
import { prisma } from "@dub/prisma";
import { DUB_WORKSPACE_ID, isDubDomain } from "@dub/utils";
import { Project } from "@prisma/client";
import { prefixWorkspaceId } from "../workspace-id";

/**
 * Checks whether a workspace can use a domain for link creation/filtering:
 * - Dub default domains: allowed (and optionally restricted for admin-only actions elsewhere)
 * - Custom domains: allowed if owned by workspace OR shared-access enabled
 */
export async function assertWorkspaceCanUseDomain({
  workspace,
  domain,
}: {
  workspace: Pick<Project, "id">;
  domain: string;
}) {
  if (isDubDomain(domain)) {
    return true;
  }

  const domainRecord = await prisma.domain.findUnique({
    where: { slug: domain },
    select: { projectId: true },
  });

  if (!domainRecord) {
    throw new DubApiError({
      code: "not_found",
      message: `Domain ${domain} not found.`,
    });
  }

  if (domainRecord.projectId === workspace.id) {
    return true;
  }

  const shared = await prisma.domainWorkspaceAccess.findUnique({
    where: {
      domainSlug_workspaceId: {
        domainSlug: domain,
        workspaceId: workspace.id,
      },
    },
    select: { enabled: true },
  });

  if (!shared?.enabled) {
    throw new DubApiError({
      code: "forbidden",
      message: `Domain ${domain} does not belong to workspace ${prefixWorkspaceId(workspace.id)}.`,
    });
  }

  return true;
}

