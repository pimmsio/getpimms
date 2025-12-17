"use client";

import { cn } from "@dub/utils";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  type CollisionDetection,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode, useMemo, useRef, useState } from "react";

export function DraggableGrid({
  ids,
  onReorder,
  disabled,
  isFullWidth,
  getItemClassName,
  className,
  children,
}: {
  ids: string[];
  onReorder: (next: string[]) => void;
  disabled?: boolean;
  isFullWidth?: (id: string) => boolean;
  getItemClassName?: (id: string) => string | undefined;
  className?: string;
  children: (id: string, opts: { dragHandleProps?: Record<string, any> }) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const gridRef = useRef<HTMLDivElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);

  const fullWidthSet = useMemo(() => {
    const s = new Set<string>();
    if (!isFullWidth) return s;
    ids.forEach((id) => {
      if (isFullWidth(id)) s.add(id);
    });
    return s;
  }, [ids, isFullWidth]);

  // Map each id to the "row anchor" id (first item in its visual row).
  // This prevents full-width cards from being inserted between two half-width cards.
  const idToRowAnchor = useMemo(() => {
    const map = new Map<string, string>();
    let i = 0;
    while (i < ids.length) {
      const id = ids[i]!;
      if (fullWidthSet.has(id)) {
        map.set(id, id);
        i += 1;
        continue;
      }

      // Pair row: [id, next?]
      const anchor = id;
      map.set(id, anchor);
      const next = ids[i + 1];
      if (next && !fullWidthSet.has(next)) {
        map.set(next, anchor);
        i += 2;
      } else {
        i += 1;
      }
    }
    return map;
  }, [ids, fullWidthSet]);

  const collisionDetection: CollisionDetection = (args) => {
    const isActiveFull = activeId ? fullWidthSet.has(activeId) : false;
    if (!isActiveFull) {
      return closestCenter(args);
    }

    // For full-width cards, pick the closest target by Y only, then snap to that row’s anchor.
    const { droppableContainers, collisionRect, pointerCoordinates } = args;
    const targetY =
      pointerCoordinates?.y ?? collisionRect.top + collisionRect.height / 2;

    let bestId: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const c of droppableContainers) {
      const rect = c.rect.current;
      if (!rect) continue;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.abs(centerY - targetY);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = String(c.id);
      }
    }

    if (!bestId) return [];
    const anchor = idToRowAnchor.get(bestId) ?? bestId;
    return [{ id: anchor }];
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const id = String(event.active.id);
    setActiveId(id);
    if (fullWidthSet.has(id)) {
      const w = gridRef.current?.getBoundingClientRect().width ?? null;
      setActiveWidth(w);
    } else {
      const w = event.active.rect.current.initial?.width ?? null;
      setActiveWidth(w);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    const activeKey = String(active.id);
    setActiveId(null);
    setActiveWidth(null);
    if (!over || active.id === over.id) return;

    const isActiveFull = fullWidthSet.has(activeKey);
    const overKeyRaw = String(over.id);
    const overKey = isActiveFull
      ? idToRowAnchor.get(overKeyRaw) ?? overKeyRaw
      : overKeyRaw;

    const oldIndex = ids.indexOf(activeKey);
    const newIndex = ids.indexOf(overKey);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setActiveWidth(null);
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          ref={gridRef}
          className={cn(
            "grid grid-cols-1 gap-5 xl:grid-cols-2",
            className,
          )}
        >
          {ids.map((id) => (
            <SortableGridItem
              key={id}
              id={id}
              disabled={disabled}
              className={getItemClassName?.(id)}
              isFullWidth={fullWidthSet.has(id)}
            >
              {children}
            </SortableGridItem>
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId ? (
          <div style={activeWidth ? { width: activeWidth } : undefined}>
            {children(activeId, { dragHandleProps: undefined })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableGridItem({
  id,
  disabled,
  className,
  isFullWidth,
  children,
}: {
  id: string;
  disabled?: boolean;
  className?: string;
  isFullWidth?: boolean;
  children: (id: string, opts: { dragHandleProps?: Record<string, any> }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : undefined,
    }),
    [transform, transition, isDragging],
  );

  const dragHandleProps = disabled ? undefined : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        className,
        isFullWidth && "xl:col-span-2",
        isDragging && "opacity-0",
      )}
    >
      {children(id, { dragHandleProps })}
    </div>
  );
}

