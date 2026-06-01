import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ElevprofilKlient from './ElevprofilKlient'

export default async function ElevprofilPage({
  params,
}: {
  params: Promise<{ elev_id: string }>
}) {
  const { elev_id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profil?.role !== 'larare' && profil?.role !== 'admin') redirect('/dashboard')

  // Hämta elevens profil
  const { data: elevProfil } = await supabase
    .from('profiles')
    .select('namn, email')
    .eq('id', elev_id)
    .single()

  if (!elevProfil) redirect('/dashboard')

  // Hämta inlämningar nyast överst
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('id, bild_url, skapad_at, uppgifter(titel)')
    .eq('elev_id', elev_id)
    .order('skapad_at', { ascending: false })

  const normerade = (inlamningar ?? []).map(inl => ({
    id: inl.id,
    bild_url: inl.bild_url,
    skapad_at: inl.skapad_at,
    uppgiftTitel: Array.isArray(inl.uppgifter)
      ? (inl.uppgifter[0] as any)?.titel ?? 'Okänd uppgift'
      : (inl.uppgifter as any)?.titel ?? 'Okänd uppgift',
  }))

  // Hämta befintlig anteckning
  const { data: anteckningRad } = await supabase
    .from('larare_anteckningar')
    .select('anteckning')
    .eq('larare_id', user.id)
    .eq('elev_id', elev_id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{elevProfil.namn ?? elevProfil.email}</span>
      </nav>
      <ElevprofilKlient
        elevId={elev_id}
        elevNamn={elevProfil.namn ?? elevProfil.email ?? 'Okänd elev'}
        inlamningar={normerade}
        befintligAnteckning={anteckningRad?.anteckning ?? ''}
      />
    </div>
  )
}
