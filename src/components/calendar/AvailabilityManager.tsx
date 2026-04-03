'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAvailabilitySlot, deleteAvailabilitySlot, toggleAvailabilitySlot } from '@/app/actions/availability'
import type { AvailabilitySlot } from '@/lib/types/database'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

interface AvailabilityManagerProps {
  recurringSlots: AvailabilitySlot[]
  oneOffSlots: AvailabilitySlot[]
}

export function AvailabilityManager({ recurringSlots, oneOffSlots }: AvailabilityManagerProps) {
  const [tab, setTab] = useState<'recurring' | 'one_off'>('recurring')
  const [loading, setLoading] = useState(false)

  // Recurring form
  const [selectedDay, setSelectedDay] = useState(1)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  // One-off form
  const [specificDate, setSpecificDate] = useState('')
  const [oneOffStart, setOneOffStart] = useState('09:00')
  const [oneOffEnd, setOneOffEnd] = useState('10:00')

  async function handleAddRecurring() {
    setLoading(true)
    await createAvailabilitySlot({
      slot_type: 'recurring',
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
    })
    setLoading(false)
  }

  async function handleAddOneOff() {
    if (!specificDate) return
    setLoading(true)
    await createAvailabilitySlot({
      slot_type: 'one_off',
      specific_date: specificDate,
      start_time: oneOffStart,
      end_time: oneOffEnd,
    })
    setSpecificDate('')
    setLoading(false)
  }

  async function handleDelete(slotId: string) {
    await deleteAvailabilitySlot(slotId)
  }

  async function handleToggle(slotId: string, currentActive: boolean) {
    await toggleAvailabilitySlot(slotId, !currentActive)
  }

  // Group recurring by day
  const byDay = DAYS.map((_, i) => recurringSlots.filter(s => s.day_of_week === i))

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('recurring')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === 'recurring' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Recurring Schedule
        </button>
        <button
          onClick={() => setTab('one_off')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            tab === 'one_off' ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          One-off Dates
        </button>
      </div>

      {tab === 'recurring' && (
        <div className="space-y-6">
          {/* Add recurring form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Recurring Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Day</Label>
                  <select
                    value={selectedDay}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedDay(Number(e.target.value))}
                    className="border rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {DAYS.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Time (JST)</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time (JST)</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button onClick={handleAddRecurring} disabled={loading} size="sm">
                  Add Slot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Weekly grid */}
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => (
              <div key={i} className="space-y-2">
                <div className="text-center text-xs font-medium text-gray-500 py-1">
                  <div className="text-base text-gray-800">{DAYS_JA[i]}</div>
                  <div>{day.slice(0, 3)}</div>
                </div>
                <div className="space-y-1 min-h-[60px]">
                  {byDay[i].map(slot => (
                    <div
                      key={slot.id}
                      className={`rounded p-1.5 text-center ${
                        slot.is_active ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200 opacity-50'
                      }`}
                    >
                      <p className="text-xs font-medium text-gray-800">
                        {slot.start_time.slice(0, 5)}
                      </p>
                      <p className="text-xs text-gray-500">{slot.end_time.slice(0, 5)}</p>
                      <div className="flex justify-center gap-1 mt-1">
                        <button
                          onClick={() => handleToggle(slot.id, slot.is_active)}
                          className="text-xs text-gray-400 hover:text-brand"
                          title={slot.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {slot.is_active ? '⏸' : '▶'}
                        </button>
                        <button
                          onClick={() => handleDelete(slot.id)}
                          className="text-xs text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'one_off' && (
        <div className="space-y-4">
          {/* Add one-off form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add One-off Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="date"
                    value={specificDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSpecificDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Start Time (JST)</Label>
                  <Input
                    type="time"
                    value={oneOffStart}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOneOffStart(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">End Time (JST)</Label>
                  <Input
                    type="time"
                    value={oneOffEnd}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOneOffEnd(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button onClick={handleAddOneOff} disabled={loading || !specificDate} size="sm">
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* One-off list */}
          {oneOffSlots.length === 0 ? (
            <p className="text-sm text-gray-500">No one-off slots added yet.</p>
          ) : (
            <div className="space-y-2">
              {oneOffSlots
                .filter(s => s.specific_date && s.specific_date >= new Date().toISOString().split('T')[0])
                .sort((a, b) => (a.specific_date ?? '').localeCompare(b.specific_date ?? ''))
                .map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{slot.specific_date}</span>
                      <span className="text-gray-500 mx-2">·</span>
                      <span className="text-gray-600">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} JST</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(slot.id, slot.is_active)}
                        className={`text-sm px-2 py-0.5 rounded ${slot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDelete(slot.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
