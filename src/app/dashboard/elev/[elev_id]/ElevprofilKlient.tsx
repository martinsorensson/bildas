'use client'

import { useState, useTransition } from 'react'
import { sparaAnteckning, genererFeedback } from './actions'

type Inlamning = {
  id: string
  bild_url: string | null
  skapad_at: string
  uppgiftTitel: string
}

type Props = {
  elevId: string
  elevNamn: string
  inlamningar: Inlamning[]
  befintligAnteckning: string
}

const DEFAULT_PROMPT = 'Jag vill ha generell feedback på hur eleven utvecklats över tid.'

export default function ElevprofilKlient({ elevId, elevNamn, inlamningar, befintligAnteckning }: Props) {
  const [anteckning, setAnteckning] = useState(befintligAnteckning)
  const [anteckningStatus, setAnteckningStatus] = useState<'idle' | 'sparad' | 'fel'>('idle')

  const [feedbackPrompt, setFeedbackPrompt] = useState('')
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackFel, setFeedbackFel] = useState<string | null>(null)

  const [sparar, startSpara] = useTransition()
  const [genererar, startGenerera] = useTransition()

  const handleSparaAnteckning = () => {
    setAnteckningStatus('idle')
    startSpara(async () => {
      const res = await sparaAnteckning(elevId, anteckning)
      setAnteckningStatus('fel' in res ? 'fel' : 'sparad')
    })
  }

  const handleGenereraFeedback = () => {
    setFeedbackFel(null)
    startGenerera(async () => {
      const res = await genererFeedback(elevId, feedbackPrompt)
      if ('fel' in res) setFeedbackFel(res.fel)
      else setFeedbackText(res.text)
    })
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">{elevNamn}</h2>

      {/* Portfolio-feed */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Portfolio</h3>
        {inlamningar.length === 0 ? (
          <p className="text-sm text-gray-400">Inga inlämningar ännu.</p>
        ) : (
          <div className="space-y-4">
            {inlamningar.map(inl => (
              <div key={inl.id} className="bg-white rounded-xl border overflow-hidden">
                {inl.bild_url && (
                  <img
                    src={inl.bild_url}
                    alt={inl.uppgiftTitel}
                    className="w-full max-h-96 object-contain bg-gray-50"
                  />
                )}
                <div className="px-5 py-3">
                  <p className="font-medium text-sm">{inl.uppgiftTitel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(inl.skapad_at).toLocaleDateString('sv-SE', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anteckningar */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Mina anteckningar</h3>
        <p className="text-xs text-gray-400 mb-3">Privata — visas bara för dig</p>
        <textarea
          value={anteckning}
          onChange={e => { setAnteckning(e.target.value); setAnteckningStatus('idle') }}
          rows={5}
          placeholder="Skriv dina anteckningar om eleven här..."
          className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleSparaAnteckning}
            disabled={sparar}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition disabled:opacity-40"
          >
            {sparar ? 'Sparar...' : 'Spara anteckning'}
          </button>
          {anteckningStatus === 'sparad' && <span className="text-sm text-green-600">Sparad</span>}
          {anteckningStatus === 'fel' && <span className="text-sm text-red-600">Kunde inte spara</span>}
        </div>
      </section>

      {/* AI-feedback */}
      <section className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="text-lg font-semibold">AI-feedback</h3>
        <div>
          <label className="block text-sm font-medium mb-1">
            Beskriv vilken feedback du vill ha ett utkast på
          </label>
          <textarea
            value={feedbackPrompt}
            onChange={e => setFeedbackPrompt(e.target.value)}
            rows={3}
            placeholder={DEFAULT_PROMPT}
            className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Om du inte fyller i något används standardtexten ovan.
          </p>
        </div>

        <button
          onClick={handleGenereraFeedback}
          disabled={genererar || inlamningar.length === 0}
          className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {genererar ? 'Genererar feedback…' : 'Generera feedback'}
        </button>

        {inlamningar.length === 0 && (
          <p className="text-xs text-amber-600">Eleven har inga inlämningar att analysera.</p>
        )}

        {feedbackFel && (
          <p className="text-sm text-red-600">{feedbackFel}</p>
        )}

        {feedbackText && (
          <div>
            <label className="block text-sm font-medium mb-1">Feedback-utkast (redigerbart)</label>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              rows={10}
              className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>
        )}
      </section>
    </div>
  )
}
