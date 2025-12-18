"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { InstalledIntegrationProps } from "@/lib/types";
import { IntegrationLogo } from "@/ui/integrations/integration-logo";
import { cn } from "@dub/utils";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { HTMLProps, PropsWithChildren } from "react";
import { IntegrationsWithInstallations } from "./integrations-list";

export function IntegrationsCardsLight({
  integrations,
  integrationsToShow,
}: {
  integrationsToShow?: string[];
  integrations: IntegrationsWithInstallations;
}) {
  const integrationsList = integrations.filter((integration) =>
    !!integrationsToShow ? integrationsToShow.includes(integration.slug) : true,
  );

  return (
    <AnimatePresence initial={false} mode="wait">
      <>
        {integrationsList.length > 0 && (
          <div className="text-center text-balance">
            <h2 className="py-3 text-lg font-semibold text-neutral-900">
              Install an official integration or follow a guide
            </h2>
            {integrationsList.map((integration) => (
              <IntegrationCard
                key={integration.id}
                {...integration}
                installations={integration._count.installations}
              />
            ))}
          </div>
        )}
      </>
    </AnimatePresence>
  );
}

export default function IntegrationCard(
  integration: InstalledIntegrationProps,
) {
  return (
    <Wrapper integration={integration}>
      {integration.guideUrl ? (
        <Badge className="bg-[#3971ff] text-white">
          <span>Guide</span>
          <div className="flex w-0 justify-end overflow-hidden opacity-0 transition-[width,opacity] group-hover:w-3 group-hover:opacity-100">
            <ArrowUpRight className="size-2.5" strokeWidth={2.5} />
          </div>
        </Badge>
      ) : undefined}
      <IntegrationLogo src={integration.logo ?? null} alt={integration.name} />
      <h3 className="mt-4 flex items-center gap-3 text-sm font-semibold text-neutral-800">
        {integration.name}
      </h3>
    </Wrapper>
  );
}

function Wrapper({
  integration,
  children,
}: PropsWithChildren<{
  integration: InstalledIntegrationProps;
}>) {
  const { slug } = useWorkspace();

  const className = cn(
    "inline-flex m-2 group relative rounded-xl bg-neutral-50 p-2 h-[120px] w-[120px] flex-col items-center justify-center",
    integration.comingSoon ? "cursor-default" : "hover:bg-neutral-100/60",
  );

  return integration.comingSoon ? (
    <div className={className}>{children}</div>
  ) : (
    <Link
      href={
        integration.guideUrl ||
        `/${slug}/settings/integrations/${integration.slug}`
      }
      target={integration.guideUrl ? "_blank" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}

function Badge({ className, ...rest }: HTMLProps<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "absolute left-[50%] top-[-5px] flex translate-x-[-50%] items-center rounded px-2 py-1 text-[0.625rem] font-semibold uppercase leading-none",
        className,
      )}
      {...rest}
    />
  );
}
