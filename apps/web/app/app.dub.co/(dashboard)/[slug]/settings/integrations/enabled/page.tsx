import { text } from "@/ui/design/tokens";
import { IntegrationLogo } from "@/ui/integrations/integration-logo";
import { BackLink } from "@/ui/shared/back-link";
import { prisma } from "@dub/prisma";
import { Avatar } from "@dub/ui";
import { cn, formatDate, truncate } from "@dub/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default async function EnabledIntegrationsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex w-full flex-col gap-6">
      <BackLink href={`/${slug}/settings/integrations`}>
        Integrations
      </BackLink>
      <div className={text.pageTitle}>Enabled Integrations</div>
      <Suspense fallback={<div>Loading...</div>}>
        <EnabledIntegrationsPageRSC slug={slug} />
      </Suspense>
    </div>
  );
}

async function EnabledIntegrationsPageRSC({ slug }: { slug: string }) {
  const integrations = await prisma.integration.findMany({
    where: {
      verified: true,
      installations: {
        some: {
          project: {
            slug,
          },
        },
      },
    },
    include: {
      installations: {
        where: {
          project: {
            slug,
          },
        },
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <ul className="flex flex-col gap-2">
      {integrations.map((integration) => {
        const installation = integration.installations?.[0];
        const installerName =
          installation?.user?.name || installation?.user?.email;

        return (
          <li key={integration.id}>
            <Link
              href={`/${slug}/settings/integrations/${integration?.slug}`}
              className={cn(
                "group flex items-center justify-between rounded border border-neutral-100 p-3 pr-5 text-sm",
                "transition-colors duration-75 hover:bg-neutral-50",
              )}
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <IntegrationLogo
                  src={integration.logo}
                  alt={`Logo for ${integration.name}`}
                  className="size-10"
                />

                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-neutral-800">
                    {integration.name}
                  </span>
                  {installation && (
                    <span className="truncate text-[0.8125rem] text-neutral-500">
                      Enabled{" "}
                      {installerName ? (
                        <>
                          by{" "}
                          <Avatar
                            user={installation.user}
                            className="inline-block size-3 -translate-y-0.5 border-0"
                          />{" "}
                          <span className="text-neutral-600">
                            {truncate(installerName, 24)}
                          </span>{" "}
                        </>
                      ) : null}
                      {formatDate(installation.createdAt, {
                        month: "short",
                        year:
                          installation.createdAt.getFullYear() ===
                          new Date().getFullYear()
                            ? undefined
                            : "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-neutral-600" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
