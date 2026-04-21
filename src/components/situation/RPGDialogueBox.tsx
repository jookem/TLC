import type { SituationNpc, AvatarPreset, DialogueNode } from '@/lib/api/situations'

interface Props {
  npc: SituationNpc | null
  avatarPreset: AvatarPreset | null
  studentName: string
  currentNode: DialogueNode
  background: { color: string; imageUrl?: string | null }
  onExit: () => void
  onContinue: () => void
  onSelectOption: (index: number) => void
  isEnd: boolean
  onComplete: () => void
}

function CharacterPortrait({
  color,
  imageUrl,
  initial,
  label,
  dim,
  flip = false,
}: {
  color: string
  imageUrl?: string | null
  initial: string
  label: string
  dim: boolean
  flip?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${dim ? 'opacity-35' : 'opacity-100'}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={label}
          className={`h-36 sm:h-52 w-auto object-contain drop-shadow-xl ${flip ? '-scale-x-100' : ''}`}
        />
      ) : (
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl sm:text-3xl font-bold"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
      )}
      <span className="text-[11px] font-medium text-white bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

export function RPGDialogueBox({
  npc,
  avatarPreset,
  studentName,
  currentNode,
  background,
  onExit,
  onContinue,
  onSelectOption,
  isEnd,
  onComplete,
}: Props) {
  const isNpcTurn = currentNode.speaker === 'npc'
  const isStudentTurn = currentNode.speaker === 'student'

  // Resolve NPC sprite: use the expression-specific image, fall back to neutral, then null
  const expression = currentNode.speaker === 'npc' ? (currentNode.expression ?? 'neutral') : 'neutral'
  const npcSprite = npc?.sprites?.[expression] ?? npc?.sprites?.['neutral'] ?? null

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Exit */}
      <button
        onClick={onExit}
        className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-lg transition-colors"
      >
        ← Exit
      </button>

      {/* Scene */}
      <div
        className="flex-1 flex items-end justify-between px-4 sm:px-10 pb-4 min-h-0 relative"
        style={{
          backgroundColor: background.color,
          backgroundImage: background.imageUrl ? `url(${background.imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* NPC — left */}
        <CharacterPortrait
          color={npc?.placeholder_color ?? '#6366f1'}
          imageUrl={npcSprite}
          initial={npc?.name?.[0] ?? 'N'}
          label={npc?.name ?? 'NPC'}
          dim={isStudentTurn}
        />

        <div className="flex-1" />

        {/* Student — right (mirrored so character faces left/inward) */}
        <CharacterPortrait
          color={avatarPreset?.placeholder_color ?? '#f59e0b'}
          imageUrl={avatarPreset?.image_url}
          initial={studentName?.[0] ?? 'S'}
          label={studentName}
          dim={isNpcTurn}
          flip={!!avatarPreset?.image_url}
        />
      </div>

      {/* Dialogue panel */}
      <div className="bg-slate-900 text-white flex-shrink-0">
        {isNpcTurn && (
          <div className="px-4 pt-4 pb-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-indigo-300 mb-1">
                {npc?.name} · {npc?.role}
              </p>
              <p className="text-sm leading-relaxed">{currentNode.text}</p>
            </div>
            {isEnd ? (
              <button
                onClick={onComplete}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
              >
                Scene Complete! ✓
              </button>
            ) : (
              <button
                onClick={onContinue}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Continue →
              </button>
            )}
          </div>
        )}

        {isStudentTurn && currentNode.options && (
          <div className="px-4 py-4 space-y-2">
            <p className="text-xs text-slate-400 mb-1">Choose what to say:</p>
            {currentNode.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelectOption(i)}
                className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-indigo-600 text-sm text-white rounded-xl transition-colors border border-slate-600 hover:border-indigo-500"
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
