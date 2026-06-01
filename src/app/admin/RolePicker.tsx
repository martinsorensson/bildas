'use client'

import { useTransition } from 'react'
import { uppdateraRoll } from './actions'

const ROLLER = [
  { value: 'pending', label: 'Pending' },
  { value: 'elev',    label: 'Elev' },
  { value: 'larare',  label: 'Lärare' },
  { value: 'admin',   label: 'Admin' },
]

const ROLL_FARG: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  elev:    'bg-blue-100 text-blue-800',
  larare:  'bg-green-100 text-green-800',
  admin:   'bg-purple-100 text-purple-800',
}

export default function RolePicker({
  anvandareId,
  nuvarandeRoll,
}: {
  anvandareId: string
  nuvarandeRoll: string
}) {
  const [pending, startTransition] = useTransition()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nyRoll = e.target.value as any
    if (nyRoll === nuvarandeRoll) return
    startTransition(() => {
      uppdateraRoll(anvandareId, nyRoll)
    })
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLL_FARG[nuvarandeRoll] ?? 'bg-gray-100 text-gray-700'}`}>
        {nuvarandeRoll}
      </span>
      <select
        defaultValue={nuvarandeRoll}
        onChange={handleChange}
        disabled={pending}
        className="text-sm border rounded-lg px-2 py-1.5 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {ROLLER.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      {pending && <span className="text-xs text-gray-400">Sparar...</span>}
    </div>
  )
}
