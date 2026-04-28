import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  listSituations,
  listAvatarPresets,
  getSituationScript,
  saveSituationSession,
  type Situation,
  type AvatarPreset,
  type DialogueNode,
} from '@/lib/api/situations'
import { useRef } from 'react'
import { AvatarSelector } from './AvatarSelector'
import { SituationList } from './SituationList'
import { RPGDialogueBox } from './RPGDialogueBox'
import { CelebrationScreen } from '@/components/shared/CelebrationScreen'

function deriveAgeGroup(age: number | null): 'children' | 'teens' | 'adults' | undefined {
  if (!age) return undefined
  if (age < 13) return 'children'
  if (age < 18) return 'teens'
  return 'adults'
}

const avatarStorageKey = (uid: string) => `situation_avatar_${uid}`
const vrmStorageKey   = (uid: string) => `situation_vrm_${uid}`

export function SituationSimulator() {
  const { user, profile } = useAuth()

  const [situations, setSituations] = useState<Situation[]>([])
  const [avatarPresets, setAvatarPresets] = useState<AvatarPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [ageGroup, setAgeGroup] = useState<'children' | 'teens' | 'adults' | undefined>()

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarPreset | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [studentVrmUrl, setStudentVrmUrl] = useState<string | null>(null)
  const [vrmInput, setVrmInput] = useState('')
  const [showVrmInput, setShowVrmInput] = useState(false)
  const vrmFileRef = useRef<HTMLInputElement>(null)
  const vrmObjectUrl = useRef<string | null>(null)

  const [activeSituation, setActiveSituation] = useState<Situation | null>(null)
  const [scriptNodes, setScriptNodes] = useState<DialogueNode[]>([])
  const [currentNodeId, setCurrentNodeId] = useState('start')
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string }>>([])
  const [phase, setPhase] = useState<'playing' | 'complete' | null>(null)
  const [scriptLoading, setScriptLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    loadData()

    const saved = localStorage.getItem(avatarStorageKey(user.id))
    if (saved) {
      try { setSelectedAvatar(JSON.parse(saved)) } catch {}
    }
    const savedVrm = localStorage.getItem(vrmStorageKey(user.id))
    if (savedVrm) { setStudentVrmUrl(savedVrm); setVrmInput(savedVrm) }
  }, [user])

  async function loadData() {
    if (!user) return

    const { data: details } = await supabase
      .from('student_details')
      .select('age')
      .eq('student_id', user.id)
      .maybeSingle()

    const group = deriveAgeGroup(details?.age ?? null)
    setAgeGroup(group)

    const [situationsRes, presetsRes] = await Promise.all([
      listSituations(group),
      listAvatarPresets(group),
    ])

    setSituations(situationsRes.situations ?? [])
    setAvatarPresets(presetsRes.presets ?? [])
    setLoading(false)
  }

  function handleVrmUrl() {
    const url = vrmInput.trim()
    if (!url) return
    setStudentVrmUrl(url)
    if (user) localStorage.setItem(vrmStorageKey(user.id), url)
    setShowVrmInput(false)
  }

  function handleVrmFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (vrmObjectUrl.current) URL.revokeObjectURL(vrmObjectUrl.current)
    const url = URL.createObjectURL(file)
    vrmObjectUrl.current = url
    setStudentVrmUrl(url)
    // Don't persist blob URLs — they die on reload
    setShowVrmInput(false)
    e.target.value = ''
  }

  function handleVrmClear() {
    if (vrmObjectUrl.current) { URL.revokeObjectURL(vrmObjectUrl.current); vrmObjectUrl.current = null }
    setStudentVrmUrl(null)
    setVrmInput('')
    if (user) localStorage.removeItem(vrmStorageKey(user.id))
  }

  function handleAvatarSelect(preset: AvatarPreset) {
    setSelectedAvatar(preset)
    if (user) localStorage.setItem(avatarStorageKey(user.id), JSON.stringify(preset))
    setShowAvatarPicker(false)
  }

  async function handleSituationSelect(situation: Situation) {
    setScriptLoading(true)
    const { script, error } = await getSituationScript(situation.id)
    if (error || !script) { setScriptLoading(false); return }

    setActiveSituation(situation)
    setScriptNodes(script.script.nodes)
    setCurrentNodeId('start')
    setTranscript([])
    setPhase('playing')
    setScriptLoading(false)
  }

  function currentNode(): DialogueNode | null {
    return scriptNodes.find(n => n.id === currentNodeId) ?? null
  }

  function handleContinue() {
    const node = currentNode()
    if (!node || node.speaker !== 'npc' || !node.next) return
    if (node.text) setTranscript(prev => [...prev, { speaker: 'npc', text: node.text! }])
    setCurrentNodeId(node.next)
  }

  function handleSelectOption(i: number) {
    const node = currentNode()
    if (!node || node.speaker !== 'student' || !node.options) return
    const opt = node.options[i]
    if (!opt) return
    setTranscript(prev => [...prev, { speaker: 'student', text: opt.text }])
    setCurrentNodeId(opt.next)
  }

  async function handleComplete() {
    const node = currentNode()
    const finalTranscript = node?.text
      ? [...transcript, { speaker: 'npc', text: node.text }]
      : transcript
    setPhase('complete')
    if (user && activeSituation) {
      await saveSituationSession(
        user.id,
        activeSituation.id,
        selectedAvatar?.id ?? null,
        finalTranscript,
      )
    }
  }

  function handleClose() {
    setActiveSituation(null)
    setScriptNodes([])
    setCurrentNodeId('start')
    setTranscript([])
    setPhase(null)
  }

  // ── Full-screen: playing ──────────────────────────────────────

  const node = currentNode()

  if (phase === 'playing' && activeSituation && node) {
    const isEnd = node.speaker === 'npc' && !node.next
    return (
      <RPGDialogueBox
        npc={activeSituation.npc ?? null}
        avatarPreset={selectedAvatar}
        studentVrmUrl={studentVrmUrl}
        studentName={profile?.display_name ?? profile?.full_name ?? 'You'}
        currentNode={node}
        background={{ color: activeSituation.background_color, imageUrl: activeSituation.background_image_url }}
        onExit={handleClose}
        onContinue={handleContinue}
        onSelectOption={handleSelectOption}
        isEnd={isEnd}
        onComplete={handleComplete}
      />
    )
  }

  // ── Full-screen: complete ─────────────────────────────────────

  if (phase === 'complete' && activeSituation) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-4">
        <CelebrationScreen
          title="Scene Complete!"
          subtitle={`Great job in "${activeSituation.title}"!`}
          onClose={handleClose}
          closeLabel="Back to Situations"
        />
      </div>
    )
  }

  // ── Inline: avatar + situation selection ──────────────────────

  if (loading) return <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />

  return (
    <div className="space-y-4">
      {/* Avatar section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Your character</p>
          <button
            onClick={() => setShowAvatarPicker(v => !v)}
            className="text-xs text-brand hover:underline"
          >
            {selectedAvatar ? 'Change' : 'Choose avatar'}
          </button>
        </div>

        {selectedAvatar ? (
          <div className="flex items-center gap-3 mt-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow overflow-hidden"
              style={{ backgroundColor: selectedAvatar.placeholder_color }}
            >
              {(() => {
                const preview = selectedAvatar.sprites?.['neutral'] ?? selectedAvatar.image_url
                return preview
                  ? <img src={preview} alt="" className="w-full h-full object-cover" />
                  : selectedAvatar.name[0]
              })()}
            </div>
            <span className="text-sm font-medium text-gray-800">{selectedAvatar.name}</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-2">Pick an avatar to get started</p>
        )}

        {showAvatarPicker && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <AvatarSelector
              presets={avatarPresets}
              selected={selectedAvatar}
              onSelect={handleAvatarSelect}
            />
          </div>
        )}

        {/* VRM avatar */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {studentVrmUrl
                ? <span className="text-green-600 font-medium">✓ VRM avatar active</span>
                : 'Use your own VRM avatar'}
            </p>
            <div className="flex gap-2">
              {studentVrmUrl && (
                <button onClick={handleVrmClear} className="text-xs text-red-400 hover:text-red-600">Remove</button>
              )}
              <button onClick={() => setShowVrmInput(v => !v)} className="text-xs text-brand hover:underline">
                {studentVrmUrl ? 'Change' : 'Set VRM'}
              </button>
            </div>
          </div>

          {showVrmInput && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <input
                  value={vrmInput}
                  onChange={e => setVrmInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVrmUrl()}
                  placeholder="Paste VRM URL (e.g. VRoid Hub)…"
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/30 min-w-0"
                />
                <button onClick={handleVrmUrl} disabled={!vrmInput.trim()} className="px-3 py-1.5 bg-brand text-white text-xs rounded-lg disabled:opacity-40">
                  Use
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => vrmFileRef.current?.click()} className="text-xs text-gray-500 hover:text-brand border border-gray-200 rounded-lg px-3 py-1.5 transition-colors">
                  📂 Upload .vrm file
                </button>
                <span className="text-xs text-gray-400">(session only)</span>
              </div>
              <input ref={vrmFileRef} type="file" accept=".vrm" className="hidden" onChange={handleVrmFile} />
            </div>
          )}
        </div>
      </div>

      {/* Situation list */}
      {!selectedAvatar ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">👆</p>
          <p className="text-sm">Choose your avatar first to start a situation</p>
        </div>
      ) : (
        <SituationList
          situations={situations}
          onSelect={handleSituationSelect}
          loading={scriptLoading}
        />
      )}
    </div>
  )
}
