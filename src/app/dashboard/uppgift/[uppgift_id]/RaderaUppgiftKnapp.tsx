'use client'

import { useState, useTransition } from 'react'
import { raderaUppgift } from './actions'

export default function RaderaUppgiftKnapp({ uppgiftId }: { uppgiftId: string }) {
  const [visaDialog, setVisaDialog] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [raderar, startRadera] = useTransition()

  const handleBekrafta = () => {
    setFel(null)
    startRadera(async () => {
      const res = await raderaUppgift(uppgiftId)
      if (res && 'fel' in res) setFel(res.fel)
    })
  }

  return (
    <>
      <button
        onClick={() => setVisaDialog(true)}
        className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition"
      >
        Radera uppgift
      </button>

      {visaDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Radera uppgift?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Är du säker? Alla inlämningar kopplade till uppgiften raderas permanent.
            </p>
            {fel && <p className="text-sm text-red-600 mb-4">{fel}</p>}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setVisaDialog(false)}
                disabled={raderar}
                className="text-sm px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-40"
              >
                Avbryt
              </button>
              <button
                onClick={handleBekrafta}
                disabled={raderar}
                className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-40"
              >
                {raderar ? 'Raderar…' : 'Ja, radera'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
