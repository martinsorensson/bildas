import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LararDashboard from './LararDashboard'
import LoggaUtKnapp from '@/components/LoggaUtKnapp'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ flik?: string }>
}) {
  const { flik } = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const roll = profil?.role

  if (!roll || roll === 'pending') redirect('/join')

  // Lärar- och adminvy
  if (roll === 'larare' || roll === 'admin') {
    const [{ data: uppgifter }, { data: kurser }] = await Promise.all([
      supabase
        .from('uppgifter')
        .select('id, titel, beskrivning, bedomningsparametrar, skapad_at, kurs_id')
        .order('skapad_at', { ascending: false }),
      supabase
        .from('kurser')
        .select('id, namn, kod')
        .eq('larare_id', user.id)
        .order('skapad_at', { ascending: false }),
    ])

    return <LararDashboard uppgifter={uppgifter ?? []} kurser={kurser ?? []} />
  }

  // Elevvy
  const { data: kursElever } = await supabase
    .from('kurs_elever')
    .select(`
      joined_at,
      kurser (
        id, namn, kod,
        uppgifter ( id, titel, beskrivning, bedomningsparametrar )
      )
    `)
    .eq('elev_id', user.id)
    .order('joined_at', { ascending: true })

  if (!kursElever || kursElever.length === 0) redirect('/join')

  const aktivFlik = flik === 'portfolio' ? 'portfolio' : 'kurser'

  // Portfolio-data: hämta bara om fliken är aktiv
  let inlamningar: { id: string; bild_url: string | null; skapad_at: string; uppgiftTitel: string }[] = []
  if (aktivFlik === 'portfolio') {
    const { data: raw } = await supabase
      .from('inlamningar')
      .select('id, bild_url, skapad_at, uppgifter(titel)')
      .eq('elev_id', user.id)
      .order('skapad_at', { ascending: false })

    inlamningar = (raw ?? []).map(inl => ({
      id: inl.id,
      bild_url: inl.bild_url,
      skapad_at: inl.skapad_at,
      uppgiftTitel: Array.isArray(inl.uppgifter)
        ? (inl.uppgifter[0] as any)?.titel ?? 'Okänd uppgift'
        : (inl.uppgifter as any)?.titel ?? 'Okänd uppgift',
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <div className="flex items-center gap-4">
          <Link href="/join" className="text-sm text-gray-500 hover:text-black">
            + Gå med i kurs
          </Link>
          <LoggaUtKnapp />
        </div>
      </nav>

      {/* Flikar */}
      <div className="bg-white border-b px-6 flex gap-6">
        <Link
          href="/dashboard"
          className={`py-3 text-sm font-medium border-b-2 transition ${
            aktivFlik === 'kurser'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Kurser
        </Link>
        <Link
          href="/dashboard?flik=portfolio"
          className={`py-3 text-sm font-medium border-b-2 transition ${
            aktivFlik === 'portfolio'
              ? 'border-black text-black'
              : 'border-transparent text-gray-500 hover:text-black'
          }`}
        >
          Portfolio
        </Link>
      </div>

      <main className="max-w-3xl mx-auto p-6 space-y-8">
        {aktivFlik === 'kurser' && (
          <>
            <h2 className="text-2xl font-bold">Mina kurser</h2>
            {kursElever.map(({ kurser: kurs }) => {
              if (!kurs || Array.isArray(kurs)) return null
              const uppgifter = Array.isArray(kurs.uppgifter) ? kurs.uppgifter : []

              return (
                <div key={kurs.id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{kurs.namn}</h3>
                      <span className="text-xs font-mono text-gray-400 mt-0.5 block">{kurs.kod}</span>
                    </div>
                  </div>

                  {uppgifter.length === 0 ? (
                    <p className="px-6 py-5 text-sm text-gray-400">Inga uppgifter publicerade ännu.</p>
                  ) : (
                    <ul className="divide-y">
                      {uppgifter.map(u => (
                        <li key={u.id} className="px-6 py-4 flex justify-between items-start hover:bg-gray-50 transition">
                          <div>
                            <p className="font-medium">{u.titel}</p>
                            {u.beskrivning && (
                              <p className="text-sm text-gray-500 mt-0.5">{u.beskrivning}</p>
                            )}
                            {u.bedomningsparametrar && u.bedomningsparametrar.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {u.bedomningsparametrar.map((p: string, i: number) => (
                                  <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{p}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/uppgift/${u.id}`}
                            className="ml-4 shrink-0 text-sm border px-3 py-1.5 rounded-lg text-gray-500 hover:text-black transition"
                          >
                            Lämna in →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </>
        )}

        {aktivFlik === 'portfolio' && (
          <>
            <h2 className="text-2xl font-bold">Min portfolio</h2>
            {inlamningar.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
                <p>Inga inlämningar ännu.</p>
                <p className="text-sm mt-1">Lämna in din första uppgift för att bygga din portfolio.</p>
              </div>
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
          </>
        )}
      </main>
    </div>
  )
}
