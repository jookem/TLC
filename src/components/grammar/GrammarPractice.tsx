import { useState, useEffect } from 'react'
import { CelebrationScreen } from '@/components/shared/CelebrationScreen'
import type { GrammarBankEntry } from '@/lib/api/grammar'

interface Props {
  cards: GrammarBankEntry[]
  onComplete: () => void
  onClose: () => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildChoices(card: GrammarBankEntry): string[] {
  const answer = card.answer ?? card.explanation
  const teacherDistractors = (card.distractors ?? []).filter(d => d && d !== answer)
  const fallbacks = [
    'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'can', 'could', 'should', 'may', 'might',
  ].filter(f => f !== answer && !teacherDistractors.includes(f))

  const distractors = [...teacherDistractors]
  while (distractors.length < 3) {
    distractors.push(fallbacks[distractors.length] ?? `option ${distractors.length + 1}`)
  }
  return shuffle([answer, ...distractors.slice(0, 3)])
}

function SentenceDisplay({ sentence, fill }: { sentence: string; fill?: string }) {
  const parts = sentence.split('_____')
  if (parts.length === 1) return <span>{sentence}</span>
  return (
    <span>
      {parts[0]}
      <span className={`inline-block min-w-[4rem] text-center font-bold mx-1 px-2 py-0.5 rounded-lg border-b-4 ${
        fill
          ? 'bg-green-500 border-green-600 text-white'
          : 'bg-transparent border-gray-300 text-transparent select-none'
      }`}>
        {fill ?? '_____'}
      </span>
      {parts[1]}
    </span>
  )
}

export function GrammarPractice({ cards, onComplete, onClose }: Props) {
  const [deck] = useState(() => shuffle(cards))
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 })

  const card = deck[index]
  const answer = card?.answer ?? card?.explanation ?? ''
  const sentence = card?.sentence_with_blank ?? card?.point ?? ''
  const isCorrect = selected === answer
  const pct = Math.round((index / deck.length) * 100)

  useEffect(() => {
    if (card) setChoices(buildChoices(card))
    setSelected(null)
  }, [index])

  function handleSelect(choice: string) {
    if (selected) return
    setSelected(choice)
    if (choice === answer) {
      setStats(s => ({ ...s, correct: s.correct + 1 }))
    } else {
      setStats(s => ({ ...s, incorrect: s.incorrect + 1 }))
    }
  }

  function handleNext() {
    if (index + 1 >= deck.length) {
      setDone(true)
    } else {
      setIndex(i => i + 1)
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-4">
        <CelebrationScreen
          title="Practice complete!"
          subtitle={`${stats.correct} / ${deck.length} correct — you're ready for the quiz.`}
          onClose={onComplete}
          closeLabel="Start Quiz →"
          stats={
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.correct}</div>
                <div className="text-xs text-gray-500 mt-1">Correct</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.incorrect}</div>
                <div className="text-xs text-gray-500 mt-1">Incorrect</div>
              </div>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Grammar practice" className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button onClick={onClose} className="text-white/50 hover:text-white text-sm transition-colors">✕</button>
        <span className="text-white/50 text-xs font-medium tracking-wide uppercase">Practice</span>
        <span className="text-white/40 text-xs">{index + 1} / {deck.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 mx-4 rounded-full overflow-hidden shrink-0">
        <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 gap-4 max-w-lg mx-auto w-full">

        {/* Explanation card — always visible */}
        <div className="bg-white/10 rounded-xl px-4 py-3 space-y-1">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">{card.point}</p>
          <p className="text-white/80 text-sm leading-relaxed">{card.explanation}</p>
          {card.hint_ja && (
            <p className="text-brand-light text-xs mt-1">{card.hint_ja}</p>
          )}
        </div>

        {/* Sentence */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
          <p className="text-gray-900 text-xl font-semibold leading-relaxed">
            <SentenceDisplay sentence={sentence} fill={selected ? answer : undefined} />
          </p>
        </div>

        {/* Feedback after answer */}
        {selected && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
            isCorrect
              ? 'bg-green-500/20 border border-green-500/40 text-green-300'
              : 'bg-red-500/20 border border-red-500/40 text-red-300'
          }`}>
            {isCorrect ? (
              <span>✓ Correct!</span>
            ) : (
              <span>✗ The answer is <strong className="text-white">{answer}</strong></span>
            )}
          </div>
        )}

        {/* Choices */}
        <div className="grid grid-cols-2 gap-2">
          {choices.map((choice, i) => {
            const isThis = choice === answer
            let cls = 'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors border-2 '
            if (!selected) {
              cls += 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:border-gray-600'
            } else if (isThis) {
              cls += 'bg-green-500/20 border-green-500 text-green-300'
            } else if (choice === selected) {
              cls += 'bg-red-500/20 border-red-500 text-red-300'
            } else {
              cls += 'bg-gray-800 border-gray-700 text-gray-500'
            }
            return (
              <button key={i} onClick={() => handleSelect(choice)} disabled={!!selected} className={cls}>
                <span className="opacity-50 mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
                {choice}
              </button>
            )
          })}
        </div>

        {/* Next */}
        {selected && (
          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors"
          >
            {index + 1 >= deck.length ? 'Finish Practice →' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}
