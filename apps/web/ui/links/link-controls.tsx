import { mutatePrefix } from "@/lib/swr/mutate";
import { useCheckFolderPermission } from "@/lib/swr/use-folder-permissions";
import useFoldersCount from "@/lib/swr/use-folders-count";
import useWorkspace from "@/lib/swr/use-workspace";
import { ExpandedLinkProps } from "@/lib/types";
import { useArchiveLinkModal } from "@/ui/modals/archive-link-modal";
import { useDeleteLinkModal } from "@/ui/modals/delete-link-modal";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import {
  IconMenu,
  PenWriting,
  Popover,
  SimpleTooltipContent,
  useCopyToClipboard,
  useKeyboardShortcut,
} from "@dub/ui";
import {
  BoxArchive,
  CircleCheck,
  Copy,
  FolderBookmark,
  QRCode,
} from "@dub/ui/icons";
import { cn, isDubDomain, nanoid } from "@dub/utils";
import { CopyPlus, Delete, FolderInput } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { useLinkBuilder } from "../modals/link-builder";
import { useLinkQRModal } from "../modals/link-qr-modal";
import { useMoveLinkToFolderModal } from "../modals/move-link-to-folder-modal";
import { useTransferLinkModal } from "../modals/transfer-link-modal";
import { ThreeDots } from "../shared/icons";

const OPTIONS = {
  edit: "e",
  qr: "q",
  duplicate: "d",
  id: "i",
  // move: "m",
  archive: "a",
  transfer: "t",
  delete: "x",
  ban: "b",
};

export function LinkControls({
  link,
  openPopover,
  setOpenPopover,
  shortcutsEnabled,
  options = Object.keys(OPTIONS),
  onMoveSuccess,
  onTransferSuccess,
  onDeleteSuccess,
  className,
  iconClassName,
}: {
  link: ExpandedLinkProps;
  openPopover: boolean;
  setOpenPopover: (open: boolean) => void;
  shortcutsEnabled: boolean;
  options?: string[];
  onMoveSuccess?: (folderId: string | null) => void;
  onTransferSuccess?: () => void;
  onDeleteSuccess?: () => void;
  className?: string;
  iconClassName?: string;
}) {
  const { flags } = useWorkspace();
  const router = useRouter();
  const { slug } = useParams() as { slug?: string };
  const { data: foldersCount } = useFoldersCount();
  const searchParams = useSearchParams();

  const [copiedLinkId, copyToClipboard] = useCopyToClipboard();

  const copyLinkId = () => {
    toast.promise(copyToClipboard(link.id), {
      success: "Link ID copied!",
    });
  };

  const openLinkBuilder = useCallback(() => {
    router.push(`/${slug}/links/${link.domain}/${link.key}`);
  }, [router, slug, link.domain, link.key]);

  const { setShowArchiveLinkModal, ArchiveLinkModal } = useArchiveLinkModal({
    props: link,
  });
  const { setShowTransferLinkModal, TransferLinkModal } = useTransferLinkModal({
    props: link,
    onSuccess: onTransferSuccess,
  });
  const { setShowDeleteLinkModal, DeleteLinkModal } = useDeleteLinkModal({
    props: link,
    onSuccess: onDeleteSuccess,
  });
  const { setShowLinkQRModal, LinkQRModal } = useLinkQRModal({
    props: link,
  });
  const { setShowMoveLinkToFolderModal, MoveLinkToFolderModal } =
    useMoveLinkToFolderModal({ link, onSuccess: onMoveSuccess });

  const isRootLink = link.key === "_root";
  const isProgramLink = link.programId !== null;
  const folderId = link.folderId || searchParams.get("folderId");

  // Duplicate link Modal
  const {
    id: _,
    createdAt: __,
    updatedAt: ___,
    userId: ____, // don't duplicate userId since the current user can be different
    externalId: _____, // don't duplicate externalId since it should be unique
    ...propsToDuplicate
  } = link;
  const {
    setShowLinkBuilder: setShowDuplicateLinkModal,
    LinkBuilder: DuplicateLinkModal,
  } = useLinkBuilder({
    // @ts-expect-error
    duplicateProps: {
      ...propsToDuplicate,
      key: nanoid(7),
      clicks: 0,
    },
  });

  const handleBanLink = () => {
    window.confirm(
      "Are you sure you want to ban this link? It will blacklist the domain and prevent any links from that domain from being created.",
    ) &&
      (setOpenPopover(false),
      toast.promise(
        fetch(`/api/admin/links/ban?domain=${link.domain}&key=${link.key}`, {
          method: "DELETE",
        }).then(async () => {
          await mutatePrefix("/api/admin/links");
        }),
        {
          loading: "Banning link...",
          success: "Link banned!",
          error: "Error banning link.",
        },
      ));
  };

  const canManageLink = useCheckFolderPermission(
    folderId,
    "folders.links.write",
  );

  useKeyboardShortcut(
    options.map((o) => OPTIONS[o]),
    (e) => {
      setOpenPopover(false);
      switch (e.key) {
        case "e":
          canManageLink && openLinkBuilder();
          break;
        case "d":
          canManageLink && setShowDuplicateLinkModal(true);
          break;
        case "q":
          setShowLinkQRModal(true);
          break;
        case "m":
          canManageLink && setShowMoveLinkToFolderModal(true);
          break;
        case "a":
          canManageLink && setShowArchiveLinkModal(true);
          break;
        case "t":
          canManageLink &&
            isDubDomain(link.domain) &&
            setShowTransferLinkModal(true);
          break;
        case "i":
          copyLinkId();
          break;
        case "x":
          canManageLink &&
            !isRootLink &&
            !isProgramLink &&
            setShowDeleteLinkModal(true);
          break;
        case "b":
          if (!slug) handleBanLink();
          break;
      }
    },
    {
      enabled: shortcutsEnabled,
      priority: 1, // Take priority over display options
    },
  );

  return (
    <div className="flex justify-end">
      {options.includes("qr") && <LinkQRModal />}
      {options.includes("duplicate") && <DuplicateLinkModal />}
      {options.includes("archive") && <ArchiveLinkModal />}
      {options.includes("transfer") && <TransferLinkModal />}
      {options.includes("delete") && <DeleteLinkModal />}
      {options.includes("move") && <MoveLinkToFolderModal />}
      <Popover
        content={
          <div className="w-full sm:w-48">
            <div className="grid gap-px p-2">
              {options.includes("edit") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenPopover(false);
                    openLinkBuilder();
                  }}
                  className="h-9 px-2 font-medium"
                  disabled={!canManageLink}
                  title={
                    !canManageLink
                      ? "You don't have permission to update this link."
                      : undefined
                  }
                >
                  <PenWriting className="mr-2 size-4" />
                  <span className="flex-1 text-left">Edit</span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    E
                  </kbd>
                </AppButton>
              )}
              {options.includes("qr") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowLinkQRModal(true);
                  }}
                  className="h-9 px-2 font-medium"
                >
                  <QRCode className="mr-2 size-4" />
                  <span className="flex-1 text-left">QR Code</span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    Q
                  </kbd>
                </AppButton>
              )}
              {options.includes("id") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => copyLinkId()}
                  className="h-9 px-2 font-medium"
                >
                  {copiedLinkId ? (
                    <CircleCheck className="mr-2 size-4" />
                  ) : (
                    <Copy className="mr-2 size-4" />
                  )}
                  <span className="flex-1 text-left">Copy Link ID</span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    I
                  </kbd>
                </AppButton>
              )}
              {options.includes("duplicate") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowDuplicateLinkModal(true);
                  }}
                  className="h-9 px-2 font-medium"
                  disabled={!canManageLink}
                  title={
                    !canManageLink
                      ? "You don't have permission to duplicate this link."
                      : undefined
                  }
                >
                  <CopyPlus className="mr-2 size-4" />
                  <span className="flex-1 text-left">Duplicate</span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    D
                  </kbd>
                </AppButton>
              )}
            </div>
            <div className="border-t border-neutral-100" />
            <div className="grid gap-px p-2">
              {options.includes("move") &&
                Boolean(flags?.linkFolders && foldersCount) && (
                  <AppButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-9 px-2 font-medium"
                    onClick={() => {
                      setOpenPopover(false);
                      setShowMoveLinkToFolderModal(true);
                    }}
                    disabled={!canManageLink}
                    title={
                      !canManageLink
                        ? "You don't have permission to move this link to another folder."
                        : undefined
                    }
                  >
                    <FolderBookmark className="mr-2 size-4 text-neutral-600" />
                    <span className="flex-1 text-left">Move</span>
                    <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                      M
                    </kbd>
                  </AppButton>
                )}
              {options.includes("archive") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowArchiveLinkModal(true);
                  }}
                  className="h-9 px-2 font-medium"
                  disabled={!canManageLink}
                  title={
                    !canManageLink
                      ? "You don't have permission to archive this link."
                      : undefined
                  }
                >
                  <BoxArchive className="mr-2 size-4" />
                  <span className="flex-1 text-left">
                    {link.archived ? "Unarchive" : "Archive"}
                  </span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    A
                  </kbd>
                </AppButton>
              )}
              {/* {options.includes("transfer") && (
                <Button
                  text="Transfer"
                  variant="outline"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowTransferLinkModal(true);
                  }}
                  icon={<FolderInput className="size-4" />}
                  shortcut="T"
                  className="h-9 px-2 font-medium"
                  disabledTooltip={
                    !isDubDomain(link.domain) ? (
                      <SimpleTooltipContent
                        title="Since this is a custom domain link, you can only transfer it to another workspace if you transfer the domain as well."
                        cta="Learn more."
                        href="https://dub.co/help/article/how-to-transfer-domains"
                      />
                    ) : !canManageLink ? (
                      "You don't have permission to transfer this link."
                    ) : undefined
                  }
                />
              )} */}
              {options.includes("delete") && (
                <AppButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setOpenPopover(false);
                    setShowDeleteLinkModal(true);
                  }}
                  className="h-9 px-2 font-medium text-red-600 hover:bg-red-50"
                  disabled={isRootLink || isProgramLink}
                  title={
                    !canManageLink
                      ? "You don't have permission to delete this link."
                      : isRootLink
                        ? "You can't delete a custom domain link. You can delete the domain instead."
                        : isProgramLink
                          ? "You can't delete a link that's part of a program."
                          : undefined
                  }
                >
                  <Delete className="mr-2 size-4" />
                  <span className="flex-1 text-left">Delete</span>
                  <kbd className="rounded border border-neutral-100 bg-white px-1.5 py-px text-[0.625rem] text-neutral-600">
                    X
                  </kbd>
                </AppButton>
              )}

              {options.includes("ban") &&
                !slug && ( // this is only shown in admin mode (where there's no slug)
                  <button
                    onClick={() => handleBanLink()}
                    className="group flex w-full items-center justify-between rounded p-2 text-left text-sm font-medium text-red-600 transition-all duration-75 hover:bg-red-600 hover:text-white"
                  >
                    <IconMenu text="Ban" icon={<Delete className="size-4" />} />
                    <kbd className="hidden rounded bg-red-100 px-2 py-0.5 text-xs font-light text-red-600 transition-all duration-75 group-hover:bg-red-500 group-hover:text-white sm:inline-block">
                      B
                    </kbd>
                  </button>
                )}
            </div>
          </div>
        }
        align="end"
        openPopover={openPopover}
        setOpenPopover={setOpenPopover}
      >
        <AppIconButton
          type="button"
          className={cn("h-8 w-8", className)}
          onClick={() => setOpenPopover(!openPopover)}
        >
          <ThreeDots className={cn("size-5 shrink-0", iconClassName)} />
        </AppIconButton>
      </Popover>
    </div>
  );
}
