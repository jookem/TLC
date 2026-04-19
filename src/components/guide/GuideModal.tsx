import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { teacherGuide, studentGuide, type GuideStep } from '@/data/guideSteps'
import { useAuth } from '@/contexts/AuthContext'

const STORAGE_KEY_TEACHER = 'guide_seen_teacher'
const STORAGE_KEY_STUDENT = 'guide_seen_student'

export function GuideModal() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const isTeacher = profile?.role === 'teacher'
  const steps: GuideStep[] = isTeacher ? teacherGuide : studentGuide
  const storageKey = isTeacher ? STORAGE_KEY_TEACHER : STORAGE_KEY_STUDENT

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Auto-show for first-time users
  useEffect(() => {
    if (!profile) return
    if (!localStorage.getItem(storageKey)) {
      setStep(0)
      setOpen(true)
    }
  }, [profile, storageKey])

  function close() {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  function prev() { setStep(s => Math.max(0, s - 1)) }

  function next() {
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      close()
    }
  }

  function openGuide() {
    setStep(0)
    setOpen(true)
  }

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <>
      {/* Floating help button */}
      <button
        onClick={openGuide}
        title="App Guide"
        className="flex items-center justify-center w-8 h-8 rounded-full bg-brand/10 hover:bg-brand/20 text-brand transition-colors"
      >
        <BookOpen className="w-4 h-4" />
      </button>

      {/* Modal backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Top bar with progress */}
            <div className="flex items-center gap-2 px-5 pt-4">
              <div className="flex-1 flex gap-1">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full flex-1 transition-all ${
                      i === step ? 'bg-brand' : i < step ? 'bg-brand/40' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={close}
                className="ml-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step counter */}
            <p className="px-5 pt-2 text-xs text-gray-400">
              Step {step + 1} of {steps.length}
            </p>

            {/* Content */}
            <div className="px-6 pt-4 pb-2 flex-1">
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0 mt-0.5">{current.icon}</span>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 leading-snug">{current.title}</h2>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {current.body}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-4 flex items-center justify-between gap-3 border-t border-gray-100 mt-4">
              <div className="flex items-center gap-2">
                {current.link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { navigate(current.link!); close() }}
                  >
                    {current.linkLabel ?? 'Go there →'}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prev}
                  disabled={step === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={next}
                  className="min-w-[80px]"
                >
                  {isLast ? 'Done ✓' : (
                    <>Next <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
