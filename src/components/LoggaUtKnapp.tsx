'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoggaUtKnapp() {
  const router = useRouter()

  const loggaUt = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button onClick={loggaUt} className="text-sm text-gray-500 hover:text-black transition">
      Logga ut
    </button>
  )
}
