import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { listGrammar, type GrammarBankEntry } from '@/lib/api/grammar'
import { Card, CardContent } from '@/components/ui/card'
import { GrammarSession } from '@/components/grammar/GrammarSession'
import { PageError } from '@/components/shared/PageError'

function getStudyBatch<T>(arr: T[]): T[] {
  const size = parseInt(localStorage.getItem('study_size') ?? '20', 10)
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return size === 0 ? shuffled : shuffled.slice(0, size)
}

const MASTERY_LABELS = ['新しい', '見た', '覚えてる', 'マスター']
const MASTERY_LABELS_EN = ['New', 'Seen', 'Familiar', 'Mastered']
const MASTERY_COLORS = [
  'bg-gray-100 text-gray-500',
  'bg-yellow-100 text-yellow-700',
  'bg-brand-light text-brand-dark',
  'bg-green-100 text-green-700',
]

type View = 'az' | 'mastery'

// ── Letter index bar ──────────────────────────────────────────────

function LetterIndex({ letters, onJump }: { letters: string[]; onJump: (l: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 py-2">
      {letters.map(l => (
        <button
          key={l}
          onClick={() => onJump(l)}
          className="w-7 h-7 text-xs font-bold rounded-md bg-gray-100 hover:bg-brand hover:text-white transition-colors"
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export function GrammarPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<GrammarBankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studyCards, setStudyCards] = useState<GrammarBankEntry[] | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('az')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  async function load() {
    if (!user) return
    try {
      const { entries: e, error: err } = await listGrammar(user.id)
      if (err) throw new Error(String(err))
      setEntries(e ?? [])
      setError(null)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load grammar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  if (error) return <PageError message={error} onRetry={load} />
  if (loading) return <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />

  const q = search.trim().toLowerCase()
  const filtered = q
    ? entries.filter(e =>
        e.point?.toLowerCase().includes(q) ||
        e.explanation?.toLowerCase().includes(q)
      )
    : entries

  const due = entries.filter(e => {
    if (!e.next_review) return e.mastery_level < 3
    return new Date(e.next_review) <= new Date()
  })

  const sessionLimit = parseInt(localStorage.getItem('study_size') ?? '20', 10)
  const reviewCount = sessionLimit === 0 ? due.length : Math.min(sessionLimit, due.length)

  // ── A-Z grouping ───────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => a.point.localeCompare(b.point))
  const letterMap: Record<string, GrammarBankEntry[]> = {}
  for (const e of sorted) {
    const letter = e.point[0]?.toUpperCase().match(/[A-Z]/) ? e.point[0].toUpperCase() : '#'
    if (!letterMap[letter]) letterMap[letter] = []
    letterMap[letter].push(e)
  }
  const letters = Object.keys(letterMap).sort((a, b) => a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b))

  function jumpTo(letter: string) {
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── By mastery grouping ────────────────────────────────────────
  const byMastery = [0, 1, 2, 3].map(level => ({
    level,
    items: filtered.filter(e => e.mastery_level === level),
  }))

  return (
    <>
      {studyCards && (
        <GrammarSession
          cards={studyCards}
          onClose={() => setStudyCards(null)}
          onComplete={() => { setStudyCards(null); load() }}
        />
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-semibold">文法 / Grammar</h1>
            <p className="text-gray-500 text-sm mt-1">
              {entries.length}点 collected · {due.length} due for review{sessionLimit > 0 && due.length > sessionLimit ? ` (${sessionLimit} per session)` : ''}
            </p>
          </div>
          {entries.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {due.length > 0 && (
                <button
                  onClick={() => setStudyCards(getStudyBatch(due))}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  復習 ({reviewCount})
                </button>
              )}
              <button
                onClick={() => setStudyCards(getStudyBatch(entries))}
                className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand/90 transition-colors"
              >
                全部学習
              </button>
            </div>
          )}
        </div>

        {/* Search + view toggle */}
        {entries.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search grammar points…"
              className="flex-1 min-w-0 sm:flex-none sm:w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button
                onClick={() => setView('az')}
                className={`px-3 py-2 font-medium transition-colors ${view === 'az' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                A–Z
              </button>
              <button
                onClick={() => setView('mastery')}
                className={`px-3 py-2 font-medium transition-colors ${view === 'mastery' ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                By Mastery
              </button>
            </div>
          </div>
        )}

        {/* ── A-Z view ── */}
        {view === 'az' && entries.length > 0 && (
          <>
            {!q && <LetterIndex letters={letters} onJump={jumpTo} />}

            {letters.length === 0 && q && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No grammar points match "{search}"</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              {letters.map(letter => (
                <section
                  key={letter}
                  ref={el => { sectionRefs.current[letter] = el }}
                  className="scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-brand w-7">{letter}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">{letterMap[letter].length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {letterMap[letter].map(e => (
                      <GrammarCard key={e.id} entry={e} onStudy={() => setStudyCards([e])} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}

        {/* ── By Mastery view ── */}
        {view === 'mastery' && entries.length > 0 && (
          <>
            {due.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-orange-600 uppercase tracking-wide">
                  復習が必要 / Review Due ({due.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {due.map(e => <GrammarCard key={e.id} entry={e} onStudy={() => setStudyCards([e])} />)}
                </div>
              </section>
            )}

            {byMastery.map(({ level, items }) =>
              items.length === 0 ? null : (
                <section key={level} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {MASTERY_LABELS[level]} / {MASTERY_LABELS_EN[level]} ({items.length})
                    </h2>
                    <button
                      onClick={() => setStudyCards(getStudyBatch(items))}
                      className="text-xs text-gray-400 hover:text-brand transition-colors"
                    >
                      Study this group →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map(e => <GrammarCard key={e.id} entry={e} onStudy={() => setStudyCards([e])} />)}
                  </div>
                </section>
              )
            )}

            {filtered.length === 0 && q && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No grammar points match "{search}"</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {entries.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <p className="text-4xl">📖</p>
              <p className="text-gray-600 font-medium">文法がまだありません。</p>
              <p className="text-sm text-gray-400">Your teacher will add grammar points from your lessons here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

function GrammarCard({ entry, onStudy }: { entry: GrammarBankEntry; onStudy: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-bold text-gray-900">{entry.point}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${MASTERY_COLORS[entry.mastery_level]}`}>
            {MASTERY_LABELS_EN[entry.mastery_level]}
          </span>
        </div>
        <p className="text-sm text-gray-600">{entry.explanation}</p>
        {entry.examples.length > 0 && (
          <p className="text-xs text-gray-400 italic">"{entry.examples[0]}"</p>
        )}
        <button
          onClick={onStudy}
          className="text-xs text-brand hover:text-brand/80 transition-colors mt-1"
        >
          Practice →
        </button>
      </CardContent>
    </Card>
  )
}
