import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  listSituations,
  getSituationScript,
  saveSituationSession,
  type Situation,
  type DialogueNode,
} from '@/lib/api/situations'
import { SituationList } from './SituationList'
import { RPGDialogueBox } from './RPGDialogueBox'
import { CelebrationScreen } from '@/components/shared/CelebrationScreen'

function deriveAgeGroup(age: number | null): 'children' | 'teens' | 'adults' | undefined {
  if (!age) return undefined
  if (age < 13) return 'children'
  if (age < 18) return 'teens'
  return 'adults'
}

export function SituationSimulator() {
  const { user, profile } = useAuth()

  const [situations, setSituations] = useState<Situation[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [user])

  async function loadData() {
    if (!user) return

    const { data: details } = await supabase
      .from('student_details')
      .select('age, vrm_url')
      .eq('student_id', user.id)
      .maybeSingle()

    const group = deriveAgeGroup(details?.age ?? null)
    if (details?.vrm_url) {
      setStudentVrmUrl(details.vrm_url)
      setVrmInput(details.vrm_url)
    }

    const { situations: s } = await listSituations(group)
    setSituations(s ?? [])
    setLoading(false)
  }

  async function persistVrmUrl(url: string | null) {
    if (!user) return
    await supabase
      .from('student_details')
      .upsert({ student_id: user.id, vrm_url: url }, { onConflict: 'student_id' })
  }

  function handleVrmUrl() {
    const url = vrmInput.trim()
    if (!url) return
    setStudentVrmUrl(url)
    persistVrmUrl(url)
    setShowVrmInput(false)
  }

  function handleVrmFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (vrmObjectUrl.current) URL.revokeObjectURL(vrmObjectUrl.current)
    const url = URL.createObjectURL(file)
    vrmObjectUrl.current = url
    setStudentVrmUrl(url)
    // Blob URLs can't be persisted — session only
    setShowVrmInput(false)
    e.target.value = ''
  }

  function handleVrmClear() {
    if (vrmObjectUrl.current) { URL.revokeObjectURL(vrmObjectUrl.current); vrmObjectUrl.current = null }
    setStudentVrmUrl(null)
    setVrmInput('')
    persistVrmUrl(null)
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
      await saveSituationSession(user.id, activeSituation.id, null, finalTranscript)
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

  // ── Inline: VRM setup + situation selection ───────────────────

  if (loading) return <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />

  return (
    <div className="space-y-4">
      {/* Student VRM section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            {studentVrmUrl
              ? <span className="text-green-600">✓ Your VRM avatar is set</span>
              : 'Your VRM avatar (optional)'}
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
          <div className="mt-3 space-y-2">
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

      {/* Situation list */}
      <SituationList
        situations={situations}
        onSelect={handleSituationSelect}
        loading={scriptLoading}
      />
    </div>
  )
}
