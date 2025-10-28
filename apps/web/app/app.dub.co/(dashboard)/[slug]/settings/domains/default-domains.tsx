"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useDefaultDomains from "@/lib/swr/use-default-domains";
import useWorkspace from "@/lib/swr/use-workspace";
import { DomainCardTitleColumn } from "@/ui/domains/domain-card-title-column";
import { UpgradeRequiredToast } from "@/ui/shared/upgrade-required-toast";
import { Logo, Switch, TooltipContent } from "@dub/ui";
import {
  Amazon,
  CalendarDays,
  ChatGPT,
  Figma,
  GitHubEnhanced,
  GoogleEnhanced,
  Spotify,
} from "@dub/ui/icons";
import { DUB_DOMAINS } from "@dub/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function DefaultDomains() {
  const { id, plan, role, flags } = useWorkspace();
  const permissionsError = clientAccessCheck({
    action: "domains.write",
    role,
    customPermissionDescription: "manage default domains",
  }).error;

  const { defaultDomains: initialDefaultDomains, mutate } = useDefaultDomains();
  const [defaultDomains, setDefaultDomains] = useState<string[]>([]);
  useEffect(() => {
    if (initialDefaultDomains) {
      setDefaultDomains(initialDefaultDomains);
    }
  }, [initialDefaultDomains]);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="my-10 grid gap-5 border-x border-neutral-100 py-10">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-black">
          Default Domains
        </h2>
        <p className="mt-3 text-sm text-neutral-500">
          Leverage default branded domains from PIMMS for specific links.{" "}
          {/* <Link
            href="https://dub.co/help/article/default-dub-domains"
            target="_blank"
            className="underline transition-colors hover:text-neutral-800"
          >
            Learn more.
          </Link> */}
        </p>
      </div>
      <div className="mt-2 grid grid-cols-1 gap-3">
        {DUB_DOMAINS.map(({ slug, description }) => {
          return (
            <div
              key={slug}
              className="flex items-center justify-between gap-4 rounded border border-neutral-100 bg-white p-5"
            >
              <DomainCardTitleColumn
                domain={slug}
                icon={Logo}
                description={description}
                defaultDomain
              />
              <Switch
                disabled={submitting}
                disabledTooltip={
                  permissionsError || undefined
                }
                checked={defaultDomains?.includes(slug)}
                fn={() => {
                  const oldDefaultDomains = defaultDomains.slice();
                  const newDefaultDomains = defaultDomains.includes(slug)
                    ? defaultDomains.filter((d) => d !== slug)
                    : [...defaultDomains, slug];

                  setDefaultDomains(newDefaultDomains);
                  setSubmitting(true);
                  fetch(`/api/domains/default?workspaceId=${id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      defaultDomains: newDefaultDomains.filter(
                        (d) => d !== null,
                      ),
                    }),
                  })
                    .then(async (res) => {
                      if (res.ok) {
                        toast.success(
                          `${slug} ${newDefaultDomains.includes(slug) ? "added to" : "removed from"} default domains.`,
                        );
                        await mutate();
                      } else {
                        const { error } = await res.json();
                        if (error.message.includes("Upgrade to Pro")) {
                          toast.custom(() => (
                            <UpgradeRequiredToast
                              planToUpgradeTo="Pro"
                              message={error.message}
                            />
                          ));
                        } else {
                          toast.error(error.message);
                        }
                        setDefaultDomains(oldDefaultDomains);
                      }
                    })
                    .finally(() => setSubmitting(false));
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
