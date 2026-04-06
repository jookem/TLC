import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { addVocabularyToBank, deleteVocabEntry, uploadVocabImage, removeVocabImage } from '@/lib/api/lessons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnkiImporter } from './AnkiImporter'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { VocabularyBankEntry } from '@/lib/types/database'

const MASTERY_COLORS = [
  'bg-gray-100 text-gray-500',
  'bg-yellow-100 text-yellow-700',
  'bg-brand-light text-brand-dark',
  'bg-green-100 text-green-700',
]
const MASTERY_LABELS = ['New', 'Seen', 'Familiar', 'Mastered']

interface Props {
  studentId: string
}

export function StudentVocabManager({ studentId }: Props) {
  const [vocab, setVocab] = useState<VocabularyBankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [removingImage, setRemovingImage] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageTargetId, setImageTargetId] = useState<string | null>(null)

  const [word, setWord] = useState('')
  const [defEn, setDefEn] = useState('')
  const [defJa, setDefJa] = useState('')
  const [example, setExample] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('vocabulary_bank')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    if (error) console.error('VocabManager load error:', error.message)
    setVocab(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [studentId])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!word.trim() || !defEn.trim()) return
    setSaving(true)
    const result = await addVocabularyToBank([{
      student_id: studentId,
      word: word.trim(),
      definition_en: defEn.trim(),
      definition_ja: defJa.trim() || undefined,
      example: example.trim() || undefined,
    }])
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setWord('')
      setDefEn('')
      setDefJa('')
      setExample('')
      // Reload directly from DB to show the saved word
      const { data, error: loadError } = await supabase
        .from('vocabulary_bank')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
      if (loadError) {
        toast.error('Word saved but failed to reload list: ' + loadError.message)
      } else {
        setVocab(data ?? [])
        toast.success(`"${word.trim()}" added to vocab bank`)
      }
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !imageTargetId) return
    e.target.value = ''
    setUploadingImage(imageTargetId)
    const { url, error } = await uploadVocabImage(imageTargetId, file)
    setUploadingImage(null)
    setImageTargetId(null)
    if (error) {
      toast.error(error)
    } else {
      setVocab(prev => prev.map(v => v.id === imageTargetId ? { ...v, image_url: url ?? null } : v))
      toast.success('Image attached')
    }
  }

  function triggerImageUpload(entryId: string) {
    setImageTargetId(entryId)
    imageInputRef.current?.click()
  }

  async function handleRemoveImage(entryId: string) {
    setRemovingImage(entryId)
    const { error } = await removeVocabImage(entryId)
    setRemovingImage(null)
    if (error) {
      toast.error(error)
    } else {
      setVocab(prev => prev.map(v => v.id === entryId ? { ...v, image_url: null } : v))
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await deleteVocabEntry(id)
    setDeleting(null)
    if (error) {
      toast.error(error)
    } else {
      setVocab(prev => prev.filter(v => v.id !== id))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Vocabulary Bank
            {!loading && (
              <span className="ml-2 text-xs font-normal text-gray-400">{vocab.length} word{vocab.length !== 1 ? 's' : ''}</span>
            )}
          </CardTitle>
          <AnkiImporter studentId={studentId} onImported={load} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {/* Add word form */}
        <form onSubmit={handleAdd} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={word}
              onChange={e => setWord(e.target.value)}
              placeholder="Word *"
              required
            />
            <Input
              value={defEn}
              onChange={e => setDefEn(e.target.value)}
              placeholder="English definition *"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={defJa}
              onChange={e => setDefJa(e.target.value)}
              placeholder="Japanese definition (optional)"
            />
            <Input
              value={example}
              onChange={e => setExample(e.target.value)}
              placeholder="Example sentence (optional)"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !word.trim() || !defEn.trim()}
            className="px-4 py-1.5 bg-brand text-white text-sm rounded-md hover:bg-brand/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Adding…' : '+ Add Word'}
          </button>
        </form>

        {/* Word list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : vocab.length === 0 ? (
          <p className="text-sm text-gray-400">No vocabulary added yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {vocab.map(v => (
              <div key={v.id} className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{v.word}</span>
                    {v.reading && <span className="text-xs text-gray-400">{v.reading}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${MASTERY_COLORS[v.mastery_level]}`}>
                      {MASTERY_LABELS[v.mastery_level]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{v.definition_en}</p>
                  {v.definition_ja && <p className="text-xs text-gray-400">{v.definition_ja}</p>}
                  {v.example && <p className="text-xs text-gray-400 italic">"{v.example}"</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deleting === v.id}
                    className="text-xs text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deleting === v.id ? '…' : 'Remove'}
                  </button>
                  {v.image_url ? (
                    <button
                      onClick={() => handleRemoveImage(v.id)}
                      disabled={removingImage === v.id}
                      className="text-xs text-brand hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove image"
                    >
                      {removingImage === v.id ? '…' : '🖼 Remove img'}
                    </button>
                  ) : (
                    <button
                      onClick={() => triggerImageUpload(v.id)}
                      disabled={uploadingImage === v.id}
                      className="text-xs text-gray-400 hover:text-brand transition-colors disabled:opacity-50"
                      title="Attach image"
                    >
                      {uploadingImage === v.id ? 'Uploading…' : '+ Image'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
