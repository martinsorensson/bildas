'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

function LoginForm() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [losenord, setLosenord] = useState('')
  const [laddar, setLaddar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  const callbackUrl = () => {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const url = new URL(`${base}/auth/callback`)
    url.searchParams.set('next', next)
    return url.toString()
  }

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() }
    })
  }

  const loginWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: callbackUrl() }
    })
  }

  const loginWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setFel(null)
    setLaddar(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: losenord })
    if (error) {
      setFel('Felaktig e-post eller lösenord.')
      setLaddar(false)
      return
    }
    router.push(next)
  }

  return (
    <>
      <form onSubmit={loginWithEmail} className="space-y-3">
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
          placeholder="Lösenord"
          value={losenord}
          onChange={e => setLosenord(e.target.value)}
          required
          className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        {fel && <p className="text-sm text-red-600">{fel}</p>}
        <button
          type="submit"
          disabled={laddar}
          className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-40"
        >
          {laddar ? 'Loggar in…' : 'Logga in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Inget konto?{' '}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline hover:text-black">
          Registrera dig
        </Link>
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">eller</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button onClick={loginWithGoogle} className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
        Logga in med Google
      </button>
      <button onClick={loginWithMicrosoft} className="w-full border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
        Logga in med Microsoft
      </button>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Bildas</h1>
        <p className="text-center text-gray-500 mb-8">Portfolioverktyg för bildlärare</p>
        <Suspense fallback={<div className="h-24" />}>
          <div className="space-y-4">
            <LoginForm />
          </div>
        </Suspense>
      </div>
    </div>
  )
}
