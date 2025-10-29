import { getPlanCapabilities } from "@/lib/plan-capabilities";
import { useFolderPermissions } from "@/lib/swr/use-folder-permissions";
import { useIsMegaFolder } from "@/lib/swr/use-is-mega-folder";
import useWorkspace from "@/lib/swr/use-workspace";
import {
  AnimatedSizeContainer,
  BoxArchive,
  Button,
  CircleCheck,
  CircleDollar,
  Folder,
  Icon,
  LoadingSpinner,
  PaginationControls,
  Popover,
  Tag,
  TooltipContent,
  Trash,
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
              "relative w-full px-4",
              // "max-[1330px]:left-0 max-[1330px]:translate-x-0",
            )}
          >
            <div className="rounded-t-xl border border-b-0 border-neutral-200 bg-white p-0 shadow-lg">
              <AnimatedSizeContainer height>
                <div
                  className={cn(
                    "relative px-2 sm:px-5 py-2.5 sm:py-4 transition-[opacity,transform] duration-100",
                    isSelecting &&
                      "pointer-events-none absolute inset-0 translate-y-1/2 opacity-0",
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    {/* Mobile: Select button on the left */}
                    <div className="flex items-center gap-2 md:hidden shrink-0">
                      <Button
                        variant="secondary"
                        className="h-8 w-fit px-2"
                        icon={<CircleCheck className="size-4" />}
                        onClick={() => setIsSelectMode(true)}
                      />
                    </div>
                    
                    <PaginationControls
                      pagination={pagination}
                      setPagination={setPagination}
                      totalCount={linksCount}
                      unit={(plural) => `${plural ? "links" : "link"}`}
                      showTotalCount={!isMegaFolder}
                      className="flex-1 min-w-0"
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
                            <Button
                              variant="secondary"
                              className="h-9 w-fit px-3 sm:px-4 font-medium border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all"
                              icon={<CircleCheck className="size-4" />}
                              text="Select"
                              onClick={() => setIsSelectMode(true)}
                            />
                          </div>
                        </>
                      )}
                    </PaginationControls>
                    
                    {/* Mobile: New Link button on the right */}
                    <div className="flex items-center gap-2 md:hidden shrink-0">
                      <CreateLinkButton />
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "relative px-2 sm:px-5 py-2.5 sm:py-4 transition-[opacity,transform] duration-100",
                    !isSelecting &&
                      "pointer-events-none absolute inset-0 translate-y-1/2 opacity-0",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLinkIds([]);
                          setIsSelectMode(false);
                        }}
                        className="rounded p-1.5 transition-colors duration-75 hover:bg-neutral-50 active:bg-neutral-100"
                      >
                        <X className="size-4 text-neutral-900" />
                      </button>
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
                        className="whitespace-nowrap text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                      >
                        {selectedLinkIds.length === links.length
                          ? "Clear all"
                          : "Check all"}
                      </button>
                    </div>

                    {/* Mobile screen controls */}
                    <div
                      className={cn(
                        "flex md:hidden items-center gap-2 transition-[transform,opacity] duration-150",
                        selectedLinkIds.length > 0
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-1/2 opacity-0",
                      )}
                    >
                      {/* Tags button */}
                      {tagsAction && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-8 w-8 p-0 shrink-0"
                          icon={<tagsAction.icon className="size-4" />}
                          onClick={tagsAction.action}
                          disabledTooltip={
                            tagsAction.disabledTooltip ||
                            (!hasAllFolderPermissions
                              ? "You don't have permission to perform this action."
                              : undefined)
                          }
                        />
                      )}
                      
                      {/* Actions dropdown menu */}
                      {dropdownActions.length > 0 && (
                        <Popover
                          content={
                            <div className="w-56 p-1.5">
                              <div className="grid gap-0.5">
                                {dropdownActions.map(
                                  ({
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
                                      if (!disabledTooltip && hasAllFolderPermissions) {
                                        action();
                                        setOpenMorePopover(false);
                                      }
                                    }}
                                    disabled={!!disabledTooltip || !hasAllFolderPermissions}
                                    className={cn(
                                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                                      disabledTooltip || !hasAllFolderPermissions
                                        ? "cursor-not-allowed text-neutral-400 bg-neutral-50/50"
                                        : "text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200",
                                    )}
                                  >
                                    <div className={cn(
                                      "flex h-8 w-8 items-center justify-center rounded-md",
                                      disabledTooltip || !hasAllFolderPermissions
                                        ? "bg-neutral-100"
                                        : "bg-neutral-100 group-hover:bg-neutral-200",
                                    )}>
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
                          <Button
                            type="button"
                            variant="secondary"
                            className="h-8 px-3 gap-1.5 shrink-0 font-medium w-fit"
                            icon={<ThreeDots className="size-4" />}
                            onClick={() => setOpenMorePopover(!openMorePopover)}
                          />
                        </Popover>
                      )}
                    </div>

                    {/* Large screen controls */}
                    <div
                      className={cn(
                        "hidden md:flex xs:gap-2 items-center gap-1.5 transition-[transform,opacity] duration-150",
                        selectedLinkIds.length > 0
                          ? "translate-y-0 opacity-100"
                          : "pointer-events-none translate-y-1/2 opacity-0",
                      )}
                    >
                      {bulkActions.map(
                        ({
                          label,
                          icon: Icon,
                          action,
                          disabledTooltip,
                          keyboardShortcut,
                        },
                        idx,
                      ) => (
                        <Button
                          key={idx}
                          type="button"
                          variant="secondary"
                          className="xs:px-2.5 h-7 gap-1.5 px-2 text-xs min-[1120px]:pr-1.5"
                          textWrapperClassName="max-[1120px]:hidden"
                            icon={<Icon className="size-3.5" />}
                            text={label}
                            onClick={action}
                            disabledTooltip={
                              disabledTooltip ||
                              (!hasAllFolderPermissions
                                ? "You don't have permission to perform this action."
                                : undefined)
                            }
                            shortcut={keyboardShortcut?.toUpperCase()}
                            shortcutClassName="py-px px-1 text-[0.625rem] leading-snug md:hidden min-[1120px]:inline-block"
                          />
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
