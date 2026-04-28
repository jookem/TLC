import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { SituationNpc, Situation } from '@/lib/api/situations'
import { listSituations } from '@/lib/api/situations'
import { Upload, ImageIcon } from 'lucide-react'

// ── Storage helpers ────────────────────────────────────────────────

async function uploadToStorage(file: File, path: string): Promise<string | null> {
  const { error } = await supabase.storage
    .from('situation-assets')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) { toast.error(error.message); return null }

  const { data } = supabase.storage.from('situation-assets').getPublicUrl(path)
  return data.publicUrl
}

// ── Image slot ─────────────────────────────────────────────────────

function ImageSlot({
  label,
  currentUrl,
  placeholderColor,
  onUpload,
  accept = 'image/png,image/webp',
}: {
  label: string
  currentUrl?: string | null
  placeholderColor?: string
  onUpload: (file: File) => Promise<void>
  accept?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setPreviewUrl(currentUrl) }, [currentUrl])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const local = URL.createObjectURL(file)
    setPreviewUrl(local)
    await onUpload(file)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-brand transition-colors bg-gray-50 flex items-center justify-center group disabled:opacity-60"
        style={!previewUrl ? { backgroundColor: placeholderColor ? placeholderColor + '22' : undefined } : undefined}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={16} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            {uploading
              ? <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
              : <ImageIcon size={18} />}
          </div>
        )}
        {uploading && previewUrl && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

// ── Tab button ─────────────────────────────────────────────────────

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-brand text-white' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  )
}

// ── NPC section ────────────────────────────────────────────────────

function NpcSection() {
  const [npcs, setNpcs] = useState<SituationNpc[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [vrmInputs, setVrmInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const animFileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    supabase.from('situation_npcs').select('*').order('name').then(({ data }) => {
      const loaded = (data ?? []) as SituationNpc[]
      setNpcs(loaded)
      const inputs: Record<string, string> = {}
      loaded.forEach(n => { inputs[n.id] = n.vrm_url ?? '' })
      setVrmInputs(inputs)
      setLoading(false)
    })
  }, [])

  async function handleSaveVrm(npc: SituationNpc) {
    const url = vrmInputs[npc.id]?.trim() ?? ''
    setSaving(npc.id)
    const { error } = await supabase
      .from('situation_npcs')
      .update({ vrm_url: url || null })
      .eq('id', npc.id)

    if (error) { toast.error(error.message); setSaving(null); return }

    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, vrm_url: url || null } : n))
    setEditingId(null)
    setSaving(null)
    toast.success(`${npc.name} VRM updated`)
  }

  async function handleAnimationUpload(npc: SituationNpc, file: File) {
    const path = `npcs/${npc.id}/animation.vrma`
    const url = await uploadToStorage(file, path)
    if (!url) return

    const { error } = await supabase
      .from('situation_npcs')
      .update({ animation_url: url })
      .eq('id', npc.id)

    if (error) { toast.error(error.message); return }

    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, animation_url: url } : n))
    toast.success(`${npc.name} animation uploaded`)
  }

  async function handleAnimationClear(npc: SituationNpc) {
    const { error } = await supabase
      .from('situation_npcs')
      .update({ animation_url: null })
      .eq('id', npc.id)

    if (error) { toast.error(error.message); return }

    setNpcs(prev => prev.map(n => n.id === npc.id ? { ...n, animation_url: null } : n))
    toast.success(`${npc.name} animation removed`)
  }

  if (loading) return <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Assign a VRM model and optional idle animation to each NPC. Models render live in the situation game.
      </p>
      {npcs.map(npc => (
        <div key={npc.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: npc.placeholder_color }}
            >
              {npc.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">{npc.name}</p>
              <p className="text-xs text-gray-400">{npc.role}</p>
            </div>
            {npc.vrm_url
              ? <span className="text-xs text-green-600 font-medium shrink-0">✓ VRM set</span>
              : <span className="text-xs text-amber-500 shrink-0">No VRM</span>}
            <button
              onClick={() => setEditingId(editingId === npc.id ? null : npc.id)}
              className="text-xs text-brand hover:underline shrink-0"
            >
              {editingId === npc.id ? 'Cancel' : (npc.vrm_url ? 'Change VRM' : 'Set VRM')}
            </button>
          </div>

          {/* VRM URL editor */}
          {editingId === npc.id && (
            <div className="flex gap-2">
              <input
                value={vrmInputs[npc.id] ?? ''}
                onChange={e => setVrmInputs(prev => ({ ...prev, [npc.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSaveVrm(npc)}
                placeholder="Paste VRM URL…"
                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 min-w-0"
              />
              <button
                onClick={() => handleSaveVrm(npc)}
                disabled={saving === npc.id}
                className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg disabled:opacity-40 shrink-0"
              >
                {saving === npc.id ? '…' : 'Save'}
              </button>
            </div>
          )}

          {/* Animation row */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500 flex-1">
              {npc.animation_url
                ? <span className="text-green-600 font-medium">✓ Animation set</span>
                : 'Idle animation (.vrma)'}
            </span>
            {npc.animation_url && (
              <button
                onClick={() => handleAnimationClear(npc)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
            <button
              onClick={() => animFileRefs.current[npc.id]?.click()}
              className="text-xs text-brand hover:underline shrink-0"
            >
              {npc.animation_url ? 'Replace' : 'Upload .vrma'}
            </button>
            <input
              ref={el => { animFileRefs.current[npc.id] = el }}
              type="file"
              accept=".vrma"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleAnimationUpload(npc, file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Background section ─────────────────────────────────────────────

function BackgroundSection() {
  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSituations().then(({ situations: s }) => {
      setSituations(s ?? [])
      setLoading(false)
    })
  }, [])

  async function handleBackgroundUpload(situation: Situation, file: File) {
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `backgrounds/${situation.id}.${ext}`
    const url = await uploadToStorage(file, path)
    if (!url) return

    const { error } = await supabase
      .from('situations')
      .update({ background_image_url: url })
      .eq('id', situation.id)

    if (error) { toast.error(error.message); return }

    setSituations(prev => prev.map(s => s.id === situation.id ? { ...s, background_image_url: url } : s))
    toast.success(`"${situation.title}" background uploaded`)
  }

  if (loading) return <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Upload a background scene for each situation. JPEG or PNG, 1920×1080px recommended.
      </p>
      {situations.map(situation => (
        <div key={situation.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <ImageSlot
            label="Background"
            currentUrl={situation.background_image_url}
            placeholderColor={situation.background_color}
            onUpload={file => handleBackgroundUpload(situation, file)}
            accept="image/jpeg,image/png,image/webp"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900">{situation.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{situation.description}</p>
            {situation.background_image_url
              ? <p className="text-xs text-green-600 mt-1">✓ Background set</p>
              : <p className="text-xs text-amber-500 mt-1">Using colour placeholder</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Shared manager (used by MaterialsPage) ────────────────────────

export function SituationsManager() {
  const [tab, setTab] = useState<'npcs' | 'backgrounds'>('npcs')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
        <Tab label="🎭 Characters"   active={tab === 'npcs'}        onClick={() => setTab('npcs')} />
        <Tab label="🖼️ Backgrounds"  active={tab === 'backgrounds'} onClick={() => setTab('backgrounds')} />
      </div>

      {tab === 'npcs'        && <NpcSection />}
      {tab === 'backgrounds' && <BackgroundSection />}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────

export function SituationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Situation Assets</h1>
        <p className="text-gray-500 text-sm mt-1">Assign VRM models and backgrounds for the Situation Simulator</p>
      </div>
      <SituationsManager />
    </div>
  )
}
