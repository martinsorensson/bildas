'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

function RegisterForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') ?? '/dashboard'

  const [namn, setNamn] = useState('')
  const [email, setEmail] = useState('')
  const [losenord, setLosenord] = useState('')
  const [bekrafta, setBekrafta] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [bekraftelseSkapad, setBekraftelseSkapad] = useState(false)

  const hanteraRegistrering = async (e: React.FormEvent) => {
    e.preventDefault()
    setFel(null)

    if (losenord !== bekrafta) {
      setFel('Lösenorden matchar inte.')
      return
    }
    if (losenord.length < 6) {
      setFel('Lösenordet måste vara minst 6 tecken.')
      return
    }

    setLaddar(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: losenord,
      options: { data: { full_name: namn } },
    })

    if (error) {
      setFel(error.message)
      setLaddar(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        namn,
        email,
        role: 'pending',
      }, { onConflict: 'id' })
    }

    // Om session finns direkt (e-postbekräftelse avstängd) → redirect
    if (data.session) {
      router.push(next)
      return
    }

    // Annars: bekräftelsemejl skickat
    setBekraftelseSkapad(true)
    setLaddar(false)
  }

  if (bekraftelseSkapad) {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold">Kolla din e-post</h2>
        <p className="text-sm text-gray-500">Vi har skickat en bekräftelselänk till <strong>{email}</strong>.</p>
        <Link href="/login" className="block text-sm underline hover:text-black">Tillbaka till inloggning</Link>
      </div>
    )
  }

  return (
    <form onSubmit={hanteraRegistrering} className="space-y-3">
      <input
        type="text"
        placeholder="Namn"
        value={namn}
        onChange={e => setNamn(e.target.value)}
        required
        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <input
        type="email"
        placeholder="E-post"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <input
        type="password"
        placeholder="Lösenord (minst 6 tecken)"
        value={losenord}
        onChange={e => setLosenord(e.target.value)}
        required
        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      <input
        type="password"
        placeholder="Bekräfta lösenord"
        value={bekrafta}
        onChange={e => setBekrafta(e.target.value)}
        required
        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
      {fel && <p className="text-sm text-red-600">{fel}</p>}
      <button
        type="submit"
        disabled={laddar}
        className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-40"
      >
        {laddar ? 'Skapar konto…' : 'Skapa konto'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Har du redan ett konto?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline hover:text-black">
          Logga in
        </Link>
      </p>
    </form>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Bildas</h1>
        <p className="text-center text-gray-500 mb-8">Skapa ett konto</p>
        <Suspense fallback={<div className="h-24" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
