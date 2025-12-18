"use client";

import useWorkspace from "@/lib/swr/use-workspace";
import { UtmTemplateWithUserProps } from "@/lib/types";
import UtmTemplateBadge from "@/ui/links/utm-template-badge";
import { useAddEditUtmTemplateModal } from "@/ui/modals/add-edit-utm-template.modal";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import { Delete, ThreeDots } from "@/ui/shared/icons";
import { Avatar, IconMenu, Popover, Tooltip } from "@dub/ui";
import {
  DiamondTurnRight,
  Flag6,
  GlobePointer,
  InputSearch,
  LoadingSpinner,
  Page2,
  PenWriting,
  SatelliteDish,
} from "@dub/ui/icons";
import { cn, formatDate } from "@dub/utils";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { TemplatesListContext } from "./page-client";

export function TemplateTable({
  templates,
  isLoading,
  mutate,
}: {
  templates?: UtmTemplateWithUserProps[];
  isLoading: boolean;
  mutate: () => Promise<any>;
}) {
  if (isLoading) {
    return <TemplateTableSkeleton />;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white">
      <table className="w-full">
        <thead className="border-b border-neutral-100 bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <DiamondTurnRight className="size-4" />
                Template
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <Flag6 className="size-4" />
                Campaign
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <SatelliteDish className="size-4" />
                Medium
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <GlobePointer className="size-4" />
                Source
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <Page2 className="size-4" />
                Content
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <InputSearch className="size-4" />
                Term
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              Updated
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              By
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {templates?.map((template) => (
            <TemplateRow key={template.id} template={template} mutate={mutate} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplateRow({ 
  template,
  mutate,
}: { 
  template: UtmTemplateWithUserProps;
  mutate: () => Promise<any>;
}) {
  const { id: workspaceId } = useWorkspace();
  const { openMenuTemplateId, setOpenMenuTemplateId } =
    useContext(TemplatesListContext);
  const openPopover = openMenuTemplateId === template.id;
  const setOpenPopover = (open: boolean) => {
    setOpenMenuTemplateId(open ? template.id : null);
  };

  const [processing, setProcessing] = useState(false);

  const { AddEditUtmTemplateModal, setShowAddEditUtmTemplateModal } =
    useAddEditUtmTemplateModal({
      props: template,
      mutate,
    });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenPopover(false);
    setProcessing(true);
    fetch(`/api/utm/${template.id}?workspaceId=${workspaceId}`, {
      method: "DELETE",
    })
      .then(async (res) => {
        if (res.ok) {
          await mutate();
          toast.success("Template deleted");
        } else {
          const { error } = await res.json();
          toast.error(error.message);
        }
      })
      .finally(() => setProcessing(false));
  };

  return (
    <>
      <AddEditUtmTemplateModal />
      <tr
        className={cn(
          "cursor-pointer transition-colors hover:bg-neutral-50",
          processing && "opacity-50",
        )}
        onClick={() => setShowAddEditUtmTemplateModal(true)}
      >
        <td className="px-4 py-3 text-sm font-medium text-neutral-900">
          <UtmTemplateBadge
            name={template.name}
            color={(template as any).color || "blue"}
          />
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          {template.utm_campaign ? (
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono">
              {template.utm_campaign}
            </code>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          {template.utm_medium ? (
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono">
              {template.utm_medium}
            </code>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          {template.utm_source ? (
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono">
              {template.utm_source}
            </code>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          {template.utm_content ? (
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono">
              {template.utm_content}
            </code>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          {template.utm_term ? (
            <code className="rounded bg-neutral-100 px-2 py-1 text-xs font-mono">
              {template.utm_term}
            </code>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-500">
          {formatDate(template.updatedAt, { month: "short" })}
        </td>
        <td className="px-4 py-3 text-sm text-neutral-600">
          <UserAvatar template={template} />
        </td>
        <td className="px-4 py-3 text-right">
          <Popover
            content={
              <div className="grid w-full gap-px p-2 sm:w-48">
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPopover(false);
                    setShowAddEditUtmTemplateModal(true);
                  }}
                  className="w-full justify-start"
                >
                  <IconMenu text="Edit" icon={<PenWriting className="h-4 w-4" />} />
                </AppButton>
                <AppButton
                  type="button"
                  variant="ghost"
                  onClick={handleDelete}
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                >
                  <IconMenu text="Delete" icon={<Delete className="h-4 w-4" />} />
                </AppButton>
              </div>
            }
            align="end"
            openPopover={openPopover}
            setOpenPopover={setOpenPopover}
          >
            <AppIconButton
              type="button"
              className={cn(
                "h-8 px-1.5 outline-none transition-all duration-200",
                "data-[state=open]:bg-neutral-100",
              )}
              onClick={(e) => {
                e.stopPropagation();
                setOpenPopover(!openPopover);
              }}
            >
              {processing ? (
                <LoadingSpinner className="h-5 w-5 shrink-0" />
              ) : (
                <ThreeDots className="h-5 w-5 shrink-0" />
              )}
            </AppIconButton>
          </Popover>
        </td>
      </tr>
    </>
  );
}

function UserAvatar({ template }: { template: UtmTemplateWithUserProps }) {
  const { user } = template;

  return (
    <Tooltip
      content={
        <div className="w-full p-3">
          <Avatar user={user} className="h-8 w-8" />
          <div className="mt-2 flex items-center gap-1.5">
            <p className="text-sm font-semibold text-neutral-700">
              {user?.name || user?.email || "Anonymous User"}
            </p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-neutral-500">
            {user?.name && user.email && <p>{user.email}</p>}
          </div>
        </div>
      }
    >
      <div className="inline-flex">
        <Avatar user={user} className="h-6 w-6" />
      </div>
    </Tooltip>
  );
}

function TemplateTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <DiamondTurnRight className="size-4" />
                Template
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <Flag6 className="size-4" />
                Campaign
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <SatelliteDish className="size-4" />
                Medium
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <GlobePointer className="size-4" />
                Source
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <Page2 className="size-4" />
                Content
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              <div className="flex items-center gap-2">
                <InputSearch className="size-4" />
                Term
              </div>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              Updated
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-600">
              By
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {Array.from({ length: 5 }).map((_, idx) => (
            <tr key={idx}>
              <td className="px-4 py-3">
                <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-20 animate-pulse rounded bg-neutral-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-24 animate-pulse rounded bg-neutral-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-20 animate-pulse rounded bg-neutral-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-28 animate-pulse rounded bg-neutral-100" />
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-20 animate-pulse rounded bg-neutral-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-6 w-6 animate-pulse rounded-full bg-neutral-200" />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="ml-auto h-8 w-8 animate-pulse rounded bg-neutral-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

