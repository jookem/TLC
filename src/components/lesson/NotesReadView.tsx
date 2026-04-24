import type { VocabularyItem, GrammarPoint } from '@/lib/types/database'

export function NotesReadView({ notes }: { notes: any }) {
  return (
    <div className="space-y-5">
      {notes.summary && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Summary</p>
          <p className="text-sm text-gray-700">{notes.summary}</p>
        </div>
      )}
      {notes.vocabulary?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vocabulary</p>
          <div className="space-y-1.5">
            {(notes.vocabulary as VocabularyItem[]).map((v: VocabularyItem, i: number) => (
              <div key={i} className="p-2.5 bg-brand-light rounded-lg">
                <span className="font-medium text-brand-dark">{v.word}</span>
                <span className="text-gray-500 mx-2">—</span>
                <span className="text-gray-700 text-sm">{v.definition_ja ?? v.definition}</span>
                {v.definition_en && <span className="text-gray-400 text-xs ml-1">({v.definition_en})</span>}
                {v.example && <p className="text-xs text-gray-400 italic mt-0.5">&ldquo;{v.example}&rdquo;</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {notes.grammar_points?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Grammar Points</p>
          <div className="space-y-1.5">
            {(notes.grammar_points as GrammarPoint[]).map((gp: GrammarPoint, i: number) => (
              <div key={i} className="p-2.5 bg-green-50 rounded-lg">
                <p className="font-medium text-green-900 text-sm">{gp.point}</p>
                <p className="text-xs text-gray-600">{gp.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {notes.homework && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Homework / 宿題</p>
          <p className="text-sm text-gray-700">{notes.homework}</p>
        </div>
      )}
      {(notes.strengths || notes.areas_to_focus) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.strengths && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Strengths</p>
              <p className="text-sm text-gray-700">{notes.strengths}</p>
            </div>
          )}
          {notes.areas_to_focus && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Areas to Focus</p>
              <p className="text-sm text-gray-700">{notes.areas_to_focus}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
