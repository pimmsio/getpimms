import { getPlanCapabilities } from "@/lib/plan-capabilities";
import { useFolderPermissions } from "@/lib/swr/use-folder-permissions";
import { useIsMegaFolder } from "@/lib/swr/use-is-mega-folder";
import useWorkspace from "@/lib/swr/use-workspace";
import { AppButton } from "@/ui/components/controls/app-button";
import { AppIconButton } from "@/ui/components/controls/app-icon-button";
import {
  AnimatedSizeContainer,
  BoxArchive,
  CircleCheck,
  CircleDollar,
  Icon,
  LoadingSpinner,
  PaginationControls,
  Popover,
  Tag,
  useKeyboardShortcut,
  usePagination,
} from "@dub/ui";
import { cn } from "@dub/utils";
import { memo, ReactNode, useContext, useMemo, useState } from "react";
import { useArchiveLinkModal } from "../modals/archive-link-modal";
import { useDeleteLinkModal } from "../modals/delete-link-modal";
import { useLinkBuilder } from "../modals/link-builder";
import { useLinkConversionTrackingModal } from "../modals/link-conversion-tracking-modal";
import { useMoveLinkToFolderModal } from "../modals/move-link-to-folder-modal";
import { useTagLinkModal } from "../modals/tag-link-modal";
import { ThreeDots, X } from "../shared/icons";
import ArchivedLinksHint from "./archived-links-hint";
import { useLinkSelection } from "./link-selection-provider";
import { LinksListContext, ResponseLink } from "./links-container";

type BulkAction = {
  label: string;
  icon: Icon;
  action: () => void;
  disabledTooltip?: string | ReactNode;
  keyboardShortcut?: string;
};

export const LinksToolbar = memo(
  ({
    loading,
    links,
    linksCount,
  }: {
    loading: boolean;
    links: ResponseLink[];
    linksCount: number;
  }) => {
    const { flags, slug, plan } = useWorkspace();

    const { isMegaFolder } = useIsMegaFolder();

    const { canManageFolderPermissions } = getPlanCapabilities(plan);
    const { folders } = useFolderPermissions();
    // const conversionsEnabled = !!plan && plan !== "free";

    const { openMenuLinkId } = useContext(LinksListContext);
    const {
      isSelectMode,
      setIsSelectMode,
      selectedLinkIds,
      setSelectedLinkIds,
    } = useLinkSelection();
    const { pagination, setPagination } = usePagination();

    const selectedLinks = useMemo(
      () => links.filter(({ id }) => selectedLinkIds.includes(id)),
      [links, selectedLinkIds],
    );

    const hasAllFolderPermissions = useMemo(() => {
      // `folders` is undefined for users without access, so just check if all links are not in a folder first
      if (selectedLinks.every((link) => !link.folderId)) return true;

      // If the workspace plan doesn't support folder permissions, assume write access
      if (!canManageFolderPermissions) return true;

      if (!folders || !Array.isArray(folders)) return false;

      return selectedLinks.every(
        (link) =>
          !link.folderId ||
          folders
            .find((folder) => folder.id === link.folderId)
            ?.permissions.includes("folders.links.write"),
      );
    }, [selectedLinks, canManageFolderPermissions, folders]);

    const { LinkBuilder, CreateLinkButton } = useLinkBuilder({
      floating: true,
    });

    const { setShowTagLinkModal, TagLinkModal } = useTagLinkModal({
      props: selectedLinks,
    });
    const { setShowMoveLinkToFolderModal, MoveLinkToFolderModal } =
      useMoveLinkToFolderModal({
        links: selectedLinks,
      });
    const { setShowLinkConversionTrackingModal, LinkConversionTrackingModal } =
      useLinkConversionTrackingModal({
        props: selectedLinks,
      });
    const { setShowArchiveLinkModal, ArchiveLinkModal } = useArchiveLinkModal({
      props: selectedLinks,
    });
    const { setShowDeleteLinkModal, DeleteLinkModal } = useDeleteLinkModal({
      props: selectedLinks,
    });

    const bulkActions: BulkAction[] = useMemo(
      () => [
        {
          label: "Edit tags",
          icon: Tag,
          action: () => setShowTagLinkModal(true),
          keyboardShortcut: "t",
        },
        ...(flags?.linkFolders
          ? [
              // {
              //   label: "Move to folder",
              //   icon: Folder,
              //   action: () => setShowMoveLinkToFolderModal(true),
              //   disabledTooltip:
              //     plan === "free" ? (
              //       <TooltipContent
              //         title="You can only use Link Folders on a Pro plan and above. Upgrade to Pro to continue."
              //         cta="Upgrade to Pro"
              //         href={`/${slug}/upgrade`}
              //       />
              //     ) : undefined,
              //   keyboardShortcut: "m",
              // },
            ]
          : []),
        {
          label:
            selectedLinks.length &&
            selectedLinks.every(({ trackConversion }) => trackConversion)
              ? "Disable tracking"
              : "Enable tracking",
          icon: CircleDollar,
          action: () => setShowLinkConversionTrackingModal(true),
          // disabledTooltip: conversionsEnabled ? undefined : (
          //   <TooltipContent
          //     title="Conversion tracking is only available on Pro plans and above."
          //     cta="Upgrade to Pro"
          //     href={slug ? `/${slug}/upgrade` : "https://pimms.io/pricing"}
          //     target="_blank"
          //   />
          // ),
          // keyboardShortcut: "c",
        },
        {
          label:
            selectedLinks.length &&
            selectedLinks.every(({ archived }) => archived)
              ? "Unarchive links"
              : "Archive links",
          icon: BoxArchive,
          action: () => setShowArchiveLinkModal(true),
          keyboardShortcut: "a",
        },
        // {
        //   label: "Delete",
        //   icon: Trash,
        //   action: () => setShowDeleteLinkModal(true),
        //   disabledTooltip: selectedLinks.some(({ programId }) => programId)
        //     ? "You can't delete a link that's part of a program."
        //     : undefined,
        //   keyboardShortcut: "x",
        // },
      ],
      [plan, selectedLinks],
    );

    // Split actions for mobile display
    const tagsAction = useMemo(
      () => bulkActions.find((action) => action.label === "Edit tags"),
      [bulkActions],
    );

    const dropdownActions = useMemo(
      () => bulkActions.filter((action) => action.label !== "Edit tags"),
      [bulkActions],
    );

    const [openMorePopover, setOpenMorePopover] = useState(false);

    useKeyboardShortcut(
      bulkActions
        .map(({ keyboardShortcut }) => keyboardShortcut)
        .filter(Boolean) as string[],
      (e) => {
        const action = bulkActions.find(
          ({ keyboardShortcut }) => keyboardShortcut === e.key,
        );
        if (action && !action.disabledTooltip && hasAllFolderPermissions)
          action.action();
      },
      {
        enabled: selectedLinkIds.length > 0 && openMenuLinkId === null,
        priority: 2, // Take priority over individual link controls
        modal: false,
      },
    );

    useKeyboardShortcut("Escape", () => setSelectedLinkIds([]), {
      enabled: selectedLinkIds.length > 0 && openMenuLinkId === null,
      priority: 2, // Take priority over clearing filters
      modal: false,
    });

    const isSelecting = isSelectMode || selectedLinkIds.length > 0;

    return (
      <>
        <TagLinkModal />
        <MoveLinkToFolderModal />
        <LinkConversionTrackingModal />
        <ArchiveLinkModal />
        <DeleteLinkModal />
        <LinkBuilder />

        {/* Leave room at bottom of list */}
        <div className="h-[90px]" />

        <div className="fixed bottom-0 left-0 w-full md:left-[240px] md:w-[calc(100%-240px)]">
          <div
            className={cn(
              "relative w-full px-3 lg:px-10",
              // "max-[1330px]:left-0 max-[1330px]:translate-x-0",
            )}
          >
            <div className="rounded-t-xl border-t border-neutral-100 bg-white/95 p-0 backdrop-blur">
              <AnimatedSizeContainer height>
                <div
                  className={cn(
                    "relative px-2 py-2.5 transition-[opacity,transform] duration-100 sm:px-5 sm:py-4",
                    isSelecting &&
                      "pointer-events-none absolute inset-0 translate-y-1/2 opacity-0",
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    {/* Mobile: Select button on the left */}
                    <div className="flex shrink-0 items-center gap-2 md:hidden">
                      <AppIconButton
                        type="button"
                        className="h-8 w-8"
                        onClick={() => setIsSelectMode(true)}
                      >
                        <CircleCheck className="size-4" />
                      </AppIconButton>
                    </div>

                    <PaginationControls
                      pagination={pagination}
                      setPagination={setPagination}
                      totalCount={linksCount}
                      unit={(plural) => `${plural ? "links" : "link"}`}
                      showTotalCount={!isMegaFolder}
                      className="min-w-0 flex-1"
                    >
                      {!isMegaFolder && (
                        <>
                          {loading ? (
                            <LoadingSpinner className="size-4" />
                          ) : (
                            <div className="hidden sm:block">
                              <ArchivedLinksHint />
                            </div>
                          )}
                          <div className="hidden md:block">
                            <AppButton
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="w-auto px-3 sm:px-4"
                              onClick={() => setIsSelectMode(true)}
                            >
                              <CircleCheck className="mr-2 size-4 text-neutral-500" />
                              Select
                            </AppButton>
                          </div>
                        </>
                      )}
                    </PaginationControls>

                    {/* Mobile: New Link button on the right */}
                    <div className="flex shrink-0 items-center gap-2 md:hidden">
                      <CreateLinkButton />
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative px-2 py-2.5 transition-[opacity,transform] duration-100 sm:px-5 sm:py-4",
                    !isSelecting &&
                      "pointer-events-none absolute inset-0 translate-y-1/2 opacity-0",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <AppIconButton
                        type="button"
                        onClick={() => {
                          setSelectedLinkIds([]);
                          setIsSelectMode(false);
                        }}
                        className="h-8 w-8"
                      >
                        <X className="size-4 text-neutral-900" />
                      </AppIconButton>
                      <span className="whitespace-nowrap text-sm font-medium text-neutral-600">
                        <strong className="font-semibold">
                          {selectedLinkIds.length}
                        </strong>{" "}
                        checked
                      </span>
                      <span className="text-neutral-300">•</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedLinkIds.length === links.length) {
                            setSelectedLinkIds([]);
                          } else {
                            setSelectedLinkIds(links.map((l) => l.id));
                          }
                        }}
                        className="whitespace-nowrap text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                      >
                        {selectedLinkIds.length === links.length
                          ? "Clear all"
                          : "Check all"}
                      </button>
                    </div>

                    {/* Mobile screen controls */}
                    <div
                      className={cn(
                        "flex items-center gap-2 transition-[transform,opacity] duration-150 md:hidden",
                        selectedLinkIds.length > 0
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-1/2 opacity-0",
                      )}
                    >
                      {/* Tags button */}
                      {tagsAction && (
                        <AppIconButton
                          type="button"
                          className="h-8 w-8 shrink-0 p-0"
                          onClick={tagsAction.action}
                          disabled={
                            !!tagsAction.disabledTooltip ||
                            !hasAllFolderPermissions
                          }
                          title={
                            typeof tagsAction.disabledTooltip === "string"
                              ? tagsAction.disabledTooltip
                              : !hasAllFolderPermissions
                                ? "You don't have permission to perform this action."
                                : undefined
                          }
                        >
                          <tagsAction.icon className="size-4" />
                        </AppIconButton>
                      )}

                      {/* Actions dropdown menu */}
                      {dropdownActions.length > 0 && (
                        <Popover
                          content={
                            <div className="w-56 p-1.5">
                              <div className="grid gap-0.5">
                                {dropdownActions.map(
                                  (
                                    {
                                      label,
                                      icon: Icon,
                                      action,
                                      disabledTooltip,
                                    },
                                    idx,
                                  ) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        if (
                                          !disabledTooltip &&
                                          hasAllFolderPermissions
                                        ) {
                                          action();
                                          setOpenMorePopover(false);
                                        }
                                      }}
                                      disabled={
                                        !!disabledTooltip ||
                                        !hasAllFolderPermissions
                                      }
                                      className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                        disabledTooltip ||
                                          !hasAllFolderPermissions
                                          ? "cursor-not-allowed bg-neutral-50/50 text-neutral-400"
                                          : "text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "flex h-8 w-8 items-center justify-center rounded-md",
                                          disabledTooltip ||
                                            !hasAllFolderPermissions
                                            ? "bg-neutral-100"
                                            : "bg-neutral-100 group-hover:bg-neutral-200",
                                        )}
                                      >
                                        <Icon className="size-4" />
                                      </div>
                                      <span className="flex-1">{label}</span>
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          }
                          openPopover={openMorePopover}
                          setOpenPopover={setOpenMorePopover}
                          align="end"
                        >
                          <AppIconButton
                            type="button"
                            onClick={() => setOpenMorePopover(!openMorePopover)}
                            className="h-8 w-8"
                          >
                            <ThreeDots className="size-4 text-neutral-600" />
                          </AppIconButton>
                        </Popover>
                      )}
                    </div>

                    {/* Large screen controls */}
                    <div
                      className={cn(
                        "xs:gap-2 hidden items-center gap-1.5 transition-[transform,opacity] duration-150 md:flex",
                        selectedLinkIds.length > 0
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-1/2 opacity-0",
                      )}
                    >
                      {bulkActions.map(
                        (
                          {
                            label,
                            icon: Icon,
                            action,
                            disabledTooltip,
                            keyboardShortcut,
                          },
                          idx,
                        ) => (
                          <AppButton
                            key={idx}
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1.5 bg-white px-2 text-xs hover:border-neutral-300"
                            onClick={action}
                            disabled={
                              !!disabledTooltip || !hasAllFolderPermissions
                            }
                            title={
                              typeof disabledTooltip === "string"
                                ? disabledTooltip
                                : !hasAllFolderPermissions
                                  ? "You don't have permission to perform this action."
                                  : undefined
                            }
                          >
                            <Icon className="size-3.5" />
                            <span className="max-[1120px]:hidden">{label}</span>
                            {keyboardShortcut && (
                              <kbd className="px-1 py-px text-[0.625rem] leading-snug md:hidden min-[1120px]:inline-block">
                                {keyboardShortcut.toUpperCase()}
                              </kbd>
                            )}
                          </AppButton>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSizeContainer>
            </div>
          </div>
        </div>
      </>
    );
  },
);
