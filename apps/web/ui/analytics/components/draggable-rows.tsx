"use client";

import { cn } from "@dub/utils";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  type CollisionDetection,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeftRight } from "lucide-react";
import { ReactNode, useMemo, useRef, useState } from "react";

export type LayoutRow = {
  rowId: string;
  left: string | null;
  right: string | null;
  fullWidth?: boolean;
};

export function DraggableRows({
  rows,
  setRows,
  disabled,
  renderCard,
}: {
  rows: LayoutRow[];
  setRows: (next: LayoutRow[]) => void;
  disabled?: boolean;
  renderCard: (id: string, opts: { dragHandleProps?: any }) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const rowIds = useMemo(() => rows.map((r) => r.rowId), [rows]);

  // Pointer-first collision detection is much more intuitive for tall / uneven rows.
  // Fallback to closestCenter when the pointer is between droppables.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [activeSize, setActiveSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const id = String(event.active.id);
    setActiveRowId(id);
    const rect = event.active.rect.current.initial;
    if (rect) {
      setActiveSize({ width: rect.width, height: rect.height });
    } else {
      const c = containerRef.current?.getBoundingClientRect();
      if (c) setActiveSize({ width: c.width, height: c.height });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;
    setActiveRowId(null);
    setActiveSize(null);
    if (!over || active.id === over.id) return;
    const oldIndex = rowIds.indexOf(String(active.id));
    const newIndex = rowIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    setRows(arrayMove(rows, oldIndex, newIndex));
  };

  const swapRow = (rowId: string) => {
    setRows(
      rows.map((r) => {
        if (r.rowId !== rowId) return r;
        if (r.fullWidth) return r;
        if (!r.left || !r.right) return r;
        return { ...r, left: r.right, right: r.left };
      }),
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveRowId(null);
        setActiveSize(null);
      }}
    >
      <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
        <div ref={containerRef} className="flex flex-col gap-5">
          {rows.map((row) => (
            <SortableRow
              key={row.rowId}
              row={row}
              disabled={disabled}
              isActive={activeRowId === row.rowId}
              onSwap={() => swapRow(row.rowId)}
              renderCard={renderCard}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeRowId ? (
          <div
            style={
              activeSize
                ? { width: activeSize.width, height: activeSize.height }
                : undefined
            }
            className="pointer-events-none"
          >
            <RowPreview
              row={rows.find((r) => r.rowId === activeRowId) ?? null}
              renderCard={renderCard}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableRow({
  row,
  disabled,
  isActive,
  onSwap,
  renderCard,
}: {
  row: LayoutRow;
  disabled?: boolean;
  isActive?: boolean;
  onSwap: () => void;
  renderCard: (id: string, opts: { dragHandleProps?: any }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.rowId, disabled });

  const style = useMemo(() => {
    const t = transform ? { ...transform, scaleX: 1, scaleY: 1 } : null;
    return {
      transform: t ? CSS.Transform.toString(t) : undefined,
      transition,
      zIndex: isDragging ? 50 : undefined,
    };
  }, [transform, transition, isDragging]);

  const canSwap = Boolean(!row.fullWidth && row.left && row.right);

  // We attach the row-drag listeners to the left card handle (or to the full-width card).
  const dragHandleProps = disabled ? undefined : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-0")}
    >
      <div className="group relative grid grid-cols-1 gap-5 xl:grid-cols-2">
        {row.fullWidth ? (
          <div className="xl:col-span-2">
            {row.left ? renderCard(row.left, { dragHandleProps }) : null}
          </div>
        ) : (
          <>
            <div>{row.left ? renderCard(row.left, { dragHandleProps }) : null}</div>
            <div>{row.right ? renderCard(row.right, {}) : null}</div>
          </>
        )}

        {canSwap && !disabled && (
          <button
            type="button"
            aria-label="Swap left and right"
            onClick={onSwap}
            className={cn(
              "absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-md bg-white/95 px-2 py-1 text-xs text-neutral-600 backdrop-blur-sm",
              "opacity-0 transition-opacity hover:text-neutral-900 group-hover:opacity-100",
            )}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function RowPreview({
  row,
  renderCard,
}: {
  row: LayoutRow | null;
  renderCard: (id: string, opts: { dragHandleProps?: any }) => ReactNode;
}) {
  if (!row) return null;
  return (
    <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-2">
      {row.fullWidth ? (
        <div className="xl:col-span-2">{row.left ? renderCard(row.left, {}) : null}</div>
      ) : (
        <>
          <div>{row.left ? renderCard(row.left, {}) : null}</div>
          <div>{row.right ? renderCard(row.right, {}) : null}</div>
        </>
      )}
    </div>
  );
}

