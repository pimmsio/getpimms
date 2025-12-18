import {
  linksDisplayProperties,
  LinksDisplayProperty,
} from "@/lib/links/links-display";
import { useIsMegaFolder } from "@/lib/swr/use-is-mega-folder";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Popover, useKeyboardShortcut, useRouterStuff } from "@dub/ui";
import { ArrowsOppositeDirectionY, Sliders } from "@dub/ui/icons";
import { cn } from "@dub/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GripVertical, Layers3 } from "lucide-react";
import { useContext, useState } from "react";
import LinkGroupBy from "./link-group-by";
import LinkSort from "./link-sort";
import { LinksDisplayContext } from "./links-display-provider";
import { AppButton } from "@/ui/components/controls/app-button";

function SortableItem({
  property,
  index,
}: {
  property: LinksDisplayProperty;
  index: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const propertyLabel =
    linksDisplayProperties.find((p) => p.id === property)?.label || property;

  const isActive = index < 4;
  const lineNumber = Math.floor(index / 2) + 1;
  const positionLabel = index < 2 ? `1` : index < 4 ? `2` : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex cursor-grab items-center gap-2 rounded border-2 px-2.5 py-2 text-xs transition-all active:cursor-grabbing",
        isDragging && "opacity-50",
        isActive
          ? "border-blue-200 bg-blue-50 text-blue-950"
          : "border-neutral-200 bg-neutral-50 text-neutral-700",
        isActive && "border-dashed",
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
      <span className="grow truncate font-medium">{propertyLabel}</span>
      {isActive && (
        <span className="shrink-0 text-[10px] font-medium text-blue-600">
          {positionLabel}
        </span>
      )}
    </div>
  );
}

export default function LinkDisplay() {
  const {
    showArchived,
    setShowArchived,
    displayProperties,
    setDisplayProperties,
    isDirty,
    persist,
    reset,
  } = useContext(LinksDisplayContext);

  const { isMegaFolder } = useIsMegaFolder();

  const [openPopover, setOpenPopover] = useState(false);
  const { queryParams } = useRouterStuff();

  useKeyboardShortcut("a", () => setShowArchived((o) => !o), {
    enabled: !isMegaFolder,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayProperties.findIndex((id) => id === active.id);
      const newIndex = displayProperties.findIndex((id) => id === over.id);

      const newDisplayProperties = arrayMove(
        displayProperties,
        oldIndex,
        newIndex,
      );
      setDisplayProperties(newDisplayProperties);
    }
  };

  // Filter out icon from display (it's implicit)
  const sortableProperties = displayProperties.filter((p) => p !== "icon");

  return (
    <Popover
      content={
        <div className="w-full divide-y divide-neutral-100 text-sm md:w-[400px]">
          {!isMegaFolder && (
            <div className="flex h-16 items-center justify-between gap-2 px-4">
              <span className="flex items-center gap-2">
                <ArrowsOppositeDirectionY className="h-4 w-4 text-neutral-800" />
                Ordering
              </span>
              <div>
                <LinkSort />
              </div>
            </div>
          )}
          {!isMegaFolder && (
            <div className="flex h-16 items-center justify-between gap-2 px-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-neutral-800" />
                  <span className="font-medium">Group By</span>
                </div>
                <span className="text-xs text-neutral-500">
                  Organize links by criteria
                </span>
              </div>
              <div>
                <LinkGroupBy />
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase text-neutral-500">
                Display Properties
              </span>
              <span className="text-xs text-neutral-400">
                First 4 shown (2 lines)
              </span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableProperties}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-2">
                  {sortableProperties.map((property, index) => (
                    <SortableItem
                      key={property}
                      property={property}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
          <AnimatePresence initial={false}>
            {isDirty && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-end gap-2 p-2">
                  <AppButton type="button" variant="secondary" size="sm" onClick={reset}>
                    Reset to default
                  </AppButton>
                  <AppButton type="button" variant="primary" size="sm" onClick={persist}>
                    Set as default
                  </AppButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
      openPopover={openPopover}
      setOpenPopover={setOpenPopover}
    >
      <AppButton
        type="button"
        variant="secondary"
        size="md"
        className="h-10 w-full px-4"
      >
        <div className="flex w-full items-center gap-2.5">
          <div className="relative shrink-0">
            <Sliders className="h-4 w-4 text-neutral-600" />
            {isDirty && (
              <div className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-neutral-900" />
            )}
          </div>
          <span className="grow text-left font-medium">Customize Results</span>
          <ChevronDown
            className={cn("h-4 w-4 text-neutral-400", openPopover && "rotate-180")}
          />
        </div>
      </AppButton>
    </Popover>
  );
}
