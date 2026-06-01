'use client'

import { useState } from 'react'
import { genereraTvaStjarnor } from './actions'

export default function FeedbackKnapp({ inlamningId }: { inlamningId: string }) {
  const [oppen, setOppen] = useState(false)
  const [text, setText] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const hanteraGenera = async () => {
    setLaddar(true)
    setFel(null)
    const res = await genereraTvaStjarnor(inlamningId)
    if ('fel' in res) {
      setFel(res.fel)
    } else {
      setText(res.text)
      setOppen(true)
    }
    setLaddar(false)
  }

  return (
    <div className="px-5 pb-4">
      <button
        onClick={() => {
          if (!oppen && !text) {
            hanteraGenera()
          } else {
            setOppen(v => !v)
          }
        }}
        disabled={laddar}
        className="text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        {laddar ? 'Genererar feedback…' : oppen ? 'Dölj feedback' : text ? 'Visa feedback' : 'Feedback'}
      </button>

      {oppen && (
        <div className="mt-3 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {fel && <p className="text-xs text-red-600">{fel}</p>}
          <button
            onClick={hanteraGenera}
            disabled={laddar}
            className="text-sm text-gray-500 hover:text-gray-800 disabled:opacity-40"
          >
            Generera om
          </button>
        </div>
      )}
    </div>
  )
}
