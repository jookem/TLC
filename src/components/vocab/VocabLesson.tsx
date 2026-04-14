import { useState } from 'react'
import { speak } from '@/lib/tts'
import type { VocabularyBankEntry } from '@/lib/types/database'

interface Props {
  words: VocabularyBankEntry[]
  deckName: string
  onComplete: () => void  // proceed to quiz
  onClose: () => void     // exit entirely
}

export function VocabLesson({ words, deckName, onComplete, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const word = words[index]
  const isLast = index === words.length - 1
  const pct = words.length > 1 ? Math.round((index / (words.length - 1)) * 100) : 100

  return (
    <div role="dialog" aria-modal="true" aria-label="Vocabulary lesson" className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={onClose} className="text-white/50 hover:text-white text-sm transition-colors">✕</button>
        <span className="text-white/50 text-xs font-medium tracking-wide uppercase">単語 · {deckName}</span>
        <button onClick={onComplete} className="text-white/50 hover:text-white text-xs transition-colors">
          Skip →
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 mx-4 rounded-full overflow-hidden shrink-0">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Counter */}
      <p className="text-center text-white/30 text-xs mt-2 shrink-0">
        {index + 1} / {words.length}
      </p>

      {/* Word content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Word + TTS */}
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-4xl font-bold text-white leading-tight">{word.word}</h1>
              <button
                onClick={() => speak(word.word)}
                className="text-white/40 hover:text-white text-2xl transition-colors"
                title="Listen"
              >
                🔊
              </button>
            </div>
            {word.reading && (
              <p className="text-white/50 text-lg">{word.reading}</p>
            )}
          </div>

          {/* Image */}
          {word.image_url && (
            <div className="flex justify-center">
              <img
                src={word.image_url}
                alt={word.word}
                className="max-h-40 object-contain rounded-2xl"
              />
            </div>
          )}

          {/* Definitions */}
          {(word.definition_ja || word.definition_en) && (
            <div className="bg-white/10 rounded-2xl p-5 space-y-2">
              {word.definition_ja && (
                <p className="text-white/90 text-xl font-medium leading-relaxed">{word.definition_ja}</p>
              )}
              {word.definition_en && (
                <p className="text-white/60 text-base leading-relaxed">{word.definition_en}</p>
              )}
            </div>
          )}

          {/* Example sentence */}
          {word.example && (
            <div className="space-y-1">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Example</p>
              <div className="bg-brand/20 border border-brand/30 rounded-xl px-4 py-3">
                <p className="text-white/85 text-base leading-relaxed italic">"{word.example}"</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8 pt-4 shrink-0">
        <div className="max-w-lg mx-auto flex gap-3">
          {index > 0 && (
            <button
              onClick={() => setIndex(i => i - 1)}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 text-sm font-medium hover:bg-white/15 transition-colors"
            >
              ← Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={onComplete}
              className="flex-1 py-3 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors"
            >
              Start Quiz →
            </button>
          ) : (
            <button
              onClick={() => setIndex(i => i + 1)}
              className="flex-1 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
