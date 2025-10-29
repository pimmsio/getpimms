import { DubApiError } from "@/lib/api/errors";
import { withWorkspace } from "@/lib/auth";
import z from "@/lib/zod";
import { getDefaultDomainsQuerySchema } from "@/lib/zod/schemas/domains";
import { prisma } from "@dub/prisma";
import { DUB_DOMAINS_ARRAY } from "@dub/utils";
import { NextResponse } from "next/server";

// GET /api/domains/default - get default domains
export const GET = withWorkspace(
  async ({ workspace, searchParams }) => {
    const { search } = getDefaultDomainsQuerySchema.parse(searchParams);

    const data = await prisma.defaultDomains.findUnique({
      where: {
        projectId: workspace.id,
      },
      select: {
        pimms: true,
        fcksubcom: true,
      },
    });

    let defaultDomains: Array<{
      slug: string;
      isDefaultDomain: true;
    }> = [];

    if (data) {
      const enabledDomains = Object.keys(data)
        .filter((key) => data[key])
        .map((domain) => {
          const slug = DUB_DOMAINS_ARRAY.find(
            (d) => d.replace(".", "") === domain,
          )!;
          return {
            slug,
            isDefaultDomain: true as const,
          };
        })
        .filter((domain) =>
          search ? domain.slug?.toLowerCase().includes(search.toLowerCase()) : true,
        );

      defaultDomains = enabledDomains;
    }

    return NextResponse.json(defaultDomains);
  },
  {
    requiredPermissions: ["domains.read"],
  },
);

const updateDefaultDomainsSchema = z.object({
  defaultDomains: z.array(z.enum(DUB_DOMAINS_ARRAY as [string, ...string[]])),
});

// PATCH /api/domains/default - edit default domains
export const PATCH = withWorkspace(
  async ({ req, workspace }) => {
    const { defaultDomains } = await updateDefaultDomainsSchema.parseAsync(
      await req.json(),
    );

    const response = await prisma.defaultDomains.update({
      where: {
        projectId: workspace.id,
      },
      data: {
        pimms: defaultDomains.includes("pim.ms"),
        fcksubcom: defaultDomains.includes("fcksub.com"),
      },
    });

    return NextResponse.json(response);
  },
  {
    requiredPermissions: ["domains.write"],
  },
);
