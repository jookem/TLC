import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface DeckRow {
  id: string
  name: string
  meta?: string        // e.g. "12 words", "3 points"
  badge?: string       // e.g. "Assigned"
  badgeClass?: string  // tailwind classes for badge
}

interface SortableItemProps {
  row: DeckRow
  actions: React.ReactNode
}

function SortableItem({ row, actions }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-200 ${isDragging ? 'opacity-50 shadow-lg z-10' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0 px-0.5"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900">{row.name}</span>
        {row.meta && <span className="text-xs text-gray-400 ml-2">{row.meta}</span>}
        {row.badge && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${row.badgeClass ?? 'bg-green-100 text-green-700'}`}>
            {row.badge}
          </span>
        )}
      </div>
      {actions}
    </div>
  )
}

interface Props {
  decks: DeckRow[]
  onReorder: (newOrder: DeckRow[]) => void
  renderActions: (row: DeckRow) => React.ReactNode
}

export function SortableDeckList({ decks, onReorder, renderActions }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 10 } }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = decks.findIndex(d => d.id === active.id)
      const newIndex = decks.findIndex(d => d.id === over.id)
      onReorder(arrayMove(decks, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={decks.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {decks.map(row => (
            <SortableItem key={row.id} row={row} actions={renderActions(row)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
