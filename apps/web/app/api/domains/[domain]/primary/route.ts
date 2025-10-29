import { getDomainOrThrow } from "@/lib/api/domains/get-domain-or-throw";
import { transformDomain } from "@/lib/api/domains/transform-domain";
import { withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { DUB_DOMAINS_ARRAY } from "@dub/utils";
import { NextResponse } from "next/server";

// POST /api/domains/[domain]/primary – set a domain as primary
export const POST = withWorkspace(
  async ({ headers, workspace, params }) => {
    const domain = params.domain;
    
    // Check if this is a default domain (pim.ms or fcksub.com)
    const isDefaultDomain = DUB_DOMAINS_ARRAY.includes(domain);
    
    if (isDefaultDomain) {
      // Handle default domain as primary
      // Simply clear all custom domain primary flags
      // The default domain will be primary by default when no custom domain is primary
      await prisma.domain.updateMany({
        where: {
          projectId: workspace.id,
          primary: true,
        },
        data: {
          primary: false,
        },
      });
      
      return NextResponse.json(
        {
          slug: domain,
          primary: true,
          isDefaultDomain: true,
        },
        { headers }
      );
    } else {
      // Handle custom domain primary setting
      const { slug: domainSlug } = await getDomainOrThrow({
        workspace,
        domain: params.domain,
        dubDomainChecks: true,
      });

      const [domainRecord] = await Promise.all([
        prisma.domain.update({
          where: {
            slug: domainSlug,
          },
          data: {
            primary: true,
          },
          include: {
            registeredDomain: true,
          },
        }),

        // Set all other custom domains as not primary
        prisma.domain.updateMany({
          where: {
            projectId: workspace.id,
            primary: true,
            slug: {
              not: domainSlug,
            },
          },
          data: {
            primary: false,
          },
        }),
      ]);

      return NextResponse.json(transformDomain(domainRecord), { headers });
    }
  },
  {
    requiredPermissions: ["domains.write"],
  },
);
