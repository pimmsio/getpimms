"use client";

import { clientAccessCheck } from "@/lib/api/tokens/permissions";
import useDomains from "@/lib/swr/use-domains";
import useDomainsCount from "@/lib/swr/use-domains-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { DOMAINS_MAX_PAGE_SIZE } from "@/lib/zod/schemas/domains";
import DomainCard from "@/ui/domains/domain-card";
import DomainCardPlaceholder from "@/ui/domains/domain-card-placeholder";
import { useAddEditDomainModal } from "@/ui/modals/add-edit-domain-modal";
import { useRegisterDomainModal } from "@/ui/modals/register-domain-modal";
import { useRegisterDomainSuccessModal } from "@/ui/modals/register-domain-success-modal";
import { AnimatedEmptyState } from "@/ui/shared/animated-empty-state";
import EmptyState from "@/ui/shared/empty-state";
import { SearchBoxPersisted } from "@/ui/shared/search-box";
import {
  Button,
  CursorRays,
  Globe,
  PaginationControls,
  ToggleGroup,
  TooltipContent,
  usePagination,
  useRouterStuff,
} from "@dub/ui";
import { capitalize, pluralize } from "@dub/utils";
import { useEffect, useState } from "react";

export default function WorkspaceDomainsClient() {
  const {
    id: workspaceId,
    plan,
    nextPlan,
    role,
    domainsLimit,
    exceededDomains,
    dotLinkClaimed,
  } = useWorkspace();

  const [openPopover, setOpenPopover] = useState(false);
  const { searchParams, queryParams } = useRouterStuff();
  const { allWorkspaceDomains, allDomainsForPage, loading } = useDomains({
    opts: { includeLink: "true" },
  });
  const { data: domainsCount } = useDomainsCount();

  const { pagination, setPagination } = usePagination(DOMAINS_MAX_PAGE_SIZE);

  const archived = searchParams.get("archived");
  const search = searchParams.get("search");

  const { AddEditDomainModal, AddDomainButton, setShowAddEditDomainModal } =
    useAddEditDomainModal({
      buttonProps: {
        className: "h-9 rounded",
      },
    });

  const { RegisterDomainModal, setShowRegisterDomainModal } =
    useRegisterDomainModal();

  const { RegisterDomainSuccessModal, setShowRegisterDomainSuccessModal } =
    useRegisterDomainSuccessModal();

  useEffect(
    () => setShowRegisterDomainSuccessModal(searchParams.has("registered")),
    [searchParams],
  );

  const { error: permissionsError } = clientAccessCheck({
    action: "domains.write",
    role,
  });

  const disabledTooltip = exceededDomains ? (
    <TooltipContent
      title={`You can only add up to ${domainsLimit} ${pluralize(
        "domain",
        domainsLimit || 0,
      )} on the ${capitalize(plan)} plan. Upgrade to add more domains`}
      cta="Upgrade"
      onClick={() => {
        queryParams({
          set: {
            upgrade: nextPlan.name.toLowerCase(),
          },
        });
      }}
    />
  ) : (
    permissionsError || undefined
  );

  return (
    <>
      <RegisterDomainSuccessModal />
      <div className="grid gap-5">
        <div className="flex flex-wrap justify-between gap-6">
          <div className="flex items-center gap-x-2">
            <h1 className="text-2xl font-semibold tracking-tight text-black">
              Domains
            </h1>
            {/* <InfoTooltip
              content={
                <TooltipContent
                  title="Learn more about how to add, configure, and verify custom domains on PiMMs."
                  href="https://dub.co/help/article/how-to-add-custom-domain"
                  target="_blank"
                  cta="Learn more"
                />
              }
            /> */}
          </div>
          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
            {/* <div className="w-full sm:w-auto">
              <SearchBoxPersisted
                loading={loading}
                onChangeDebounced={(t) => {
                  if (t) {
                    queryParams({ set: { search: t }, del: "page" });
                  } else {
                    queryParams({ del: "search" });
                  }
                }}
              />
            </div> */}
            <ToggleGroup
              options={[
                { value: "active", label: "Active" },
                { value: "archived", label: "Archived" },
              ]}
              selected={archived ? "archived" : "active"}
              selectAction={(id) =>
                id === "active"
                  ? queryParams({ del: ["archived", "page"] })
                  : queryParams({ set: { archived: "true" }, del: "page" })
              }
            />

            <Button
              variant="primary"
              className="h-9 w-fit rounded"
              text={<div className="flex items-center gap-2">Add domain</div>}
              onClick={() => setShowAddEditDomainModal(true)}
              disabledTooltip={disabledTooltip}
            />
          </div>
        </div>

        {workspaceId && (
          <>
            <AddEditDomainModal />
            <RegisterDomainModal />
          </>
        )}

        {/* {!dotLinkClaimed && <FreeDotLinkBanner />} */}

        <div key={archived} className="animate-fade-in">
          {!loading ? (
            allDomainsForPage.length > 0 ? (
              <ul className="grid grid-cols-1 gap-3">
                {allDomainsForPage.map((domain: any) => (
                  <li key={domain.slug}>
                    <DomainCard props={domain} />
                  </li>
                ))}
              </ul>
            ) : archived || search ? (
              <div className="flex flex-col items-center gap-4 rounded border border-neutral-100 py-10">
                <EmptyState
                  icon={Globe}
                  title={
                    archived
                      ? "No archived domains found"
                      : "No custom domains found"
                  }
                />
                <AddDomainButton />
              </div>
            ) : (
              <AnimatedEmptyState
                title="No domains found"
                description="Tips: Use custom domains to increase the deliverability of your links for emailing."
                cardContent={
                  <>
                    <Globe className="size-4 text-neutral-700" />
                    <div className="h-2.5 w-24 min-w-0 rounded bg-neutral-200" />
                    <div className="xs:flex hidden grow items-center justify-end gap-1.5 text-neutral-500">
                      <CursorRays className="size-3.5" />
                    </div>
                  </>
                }
                addButton={<AddDomainButton />}
                // learnMoreHref="https://dub.co/help/article/how-to-add-custom-domain"
              />
            )
          ) : (
            <ul className="grid grid-cols-1 gap-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <li key={idx}>
                  <DomainCardPlaceholder />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="sticky bottom-0 rounded-b-[inherit] border-x border-neutral-100 bg-white px-3.5 py-2">
          <PaginationControls
            pagination={pagination}
            setPagination={setPagination}
            totalCount={domainsCount || 0}
            unit={(p) => `domain${p ? "s" : ""}`}
          />
        </div>
      </div>
    </>
  );
}
