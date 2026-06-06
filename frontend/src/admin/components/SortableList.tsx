import { type ReactNode, type CSSProperties } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent, type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  rectSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface DndHandle {
  setNodeRef: (el: HTMLElement | null) => void;
  style: CSSProperties;
  handleProps: Record<string, unknown>;
  isDragging: boolean;
}

// Узагальнений список із перетягуванням мишкою (drag-handle спреадиться на «ручку» зліва).
export function SortableList<T>({ items, getId, onReorder, layout = 'list', className, children }: {
  items: T[];
  getId: (item: T) => UniqueIdentifier;
  onReorder: (items: T[]) => void;
  layout?: 'list' | 'grid';
  className?: string;
  children: (item: T, dnd: DndHandle) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIndex = ids.indexOf(active.id);
      const newIndex = ids.indexOf(over.id);
      if (oldIndex >= 0 && newIndex >= 0) onReorder(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={ids} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map(it => <SortableRow key={getId(it)} id={getId(it)}>{dnd => children(it, dnd)}</SortableRow>)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: UniqueIdentifier; children: (dnd: DndHandle) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: isDragging ? 'relative' : undefined,
  };
  return <>{children({ setNodeRef, style, handleProps: { ...attributes, ...listeners }, isDragging })}</>;
}

// Зберігає новий порядок: оновлює лише ті записи, чий order змінився.
export async function persistOrder<T extends { id: number; order?: number }>(
  items: T[], update: (id: number, data: object) => Promise<unknown>,
) {
  const ups = items.map((it, i) => (it.order !== i ? update(it.id, { order: i }) : null)).filter(Boolean);
  await Promise.all(ups as Promise<unknown>[]);
}
