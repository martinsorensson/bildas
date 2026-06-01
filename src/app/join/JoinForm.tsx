'use client'

import { useState, useTransition } from 'react'
import { joinKurs } from './actions'

export default function JoinForm() {
  const [fel, setFel] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setFel(null)
    startTransition(async () => {
      const result = await joinKurs(formData)
      if (result?.fel) setFel(result.fel)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="kod" className="block text-sm font-medium text-gray-700 mb-1">
          Kurskod
        </label>
        <input
          id="kod"
          name="kod"
          type="text"
          required
          autoFocus
          autoComplete="off"
          placeholder="t.ex. KON24A"
          className="w-full border rounded-lg px-4 py-3 text-lg font-mono tracking-widest uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {fel && (
        <p className="text-sm text-red-600">{fel}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? 'Söker...' : 'Gå med i kurs'}
      </button>
    </form>
  )
}
