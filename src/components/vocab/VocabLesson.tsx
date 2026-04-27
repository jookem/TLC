import { speak } from '@/lib/tts'
import type { VocabularyBankEntry } from '@/lib/types/database'

const MASTERY_COLORS = [
  'bg-gray-100 text-gray-500',
  'bg-yellow-100 text-yellow-700',
  'bg-brand-light text-brand-dark',
  'bg-green-100 text-green-700',
]
const MASTERY_LABELS = ['New', 'Seen', 'Familiar', 'Mastered']

interface Props {
  words: VocabularyBankEntry[]
  sessionName: string
  onStart: () => void   // → flashcards
  onClose: () => void
}

export function VocabLesson({ words, sessionName, onStart, onClose }: Props) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Vocabulary session overview" className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={onClose} className="text-white/50 hover:text-white text-sm transition-colors">✕</button>
        <span className="text-white/50 text-xs font-medium tracking-wide uppercase">単語 · {sessionName}</span>
        <button onClick={onStart} className="text-white/50 hover:text-white text-xs transition-colors">
          Skip →
        </button>
      </div>

      {/* Session info */}
      <p className="text-white/40 text-xs text-center py-2 shrink-0">
        {words.length} words in this session — review before practising
      </p>

      {/* Word grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {words.map(w => (
            <div key={w.id} className="bg-white/10 rounded-xl p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-1">
                <button
                  onClick={() => speak(w.word)}
                  className="font-bold text-white text-base leading-tight text-left hover:text-brand transition-colors"
                  title="Listen"
                >
                  {w.word}
                </button>
                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium ${MASTERY_COLORS[w.mastery_level]}`}>
                  {MASTERY_LABELS[w.mastery_level]}
                </span>
              </div>
              {w.reading && (
                <p className="text-white/50 text-xs">{w.reading}</p>
              )}
              {w.definition_ja && (
                <p className="text-white/85 text-sm leading-snug">{w.definition_ja}</p>
              )}
              {w.definition_en && (
                <p className="text-white/50 text-xs leading-snug">{w.definition_en}</p>
              )}
              {w.image_url && (
                <img
                  src={w.image_url}
                  alt={w.word}
                  className="w-12 h-12 object-cover rounded-md mt-1"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8 pt-4 shrink-0">
        <button
          onClick={onStart}
          className="w-full max-w-lg mx-auto block py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors"
        >
          フラッシュカード →
        </button>
      </div>
    </div>
  )
}
