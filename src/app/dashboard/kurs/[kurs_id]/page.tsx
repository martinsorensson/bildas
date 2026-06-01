import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import KlassFeedback from './KlassFeedback'

export default async function KurssidaPage({
  params,
}: {
  params: Promise<{ kurs_id: string }>
}) {
  const { kurs_id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Hämta kursen — RLS säkerställer att läraren äger den
  const { data: kurs } = await supabase
    .from('kurser')
    .select('id, namn, kod, larare_id')
    .eq('id', kurs_id)
    .single()

  if (!kurs || kurs.larare_id !== user.id) redirect('/dashboard')

  // Hämta uppgifter kopplade till kursen
  const { data: uppgifter } = await supabase
    .from('uppgifter')
    .select('id, titel, beskrivning')
    .eq('kurs_id', kurs_id)
    .order('skapad_at', { ascending: true })

  // Hämta inskrivna elever via kurs_elever + profiles
  const { data: kursElever } = await supabase
    .from('kurs_elever')
    .select('elev_id, joined_at, profiles!elev_id(id, namn, email)')
    .eq('kurs_id', kurs_id)
    .order('joined_at', { ascending: true })

  const elever = (kursElever ?? []).map(ke => {
    const p = Array.isArray(ke.profiles) ? ke.profiles[0] : ke.profiles
    return {
      id: ke.elev_id,
      namn: (p as any)?.namn ?? null,
      email: (p as any)?.email ?? null,
      joinedAt: ke.joined_at,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium">{kurs.namn}</span>
        <span className="text-xs font-mono text-gray-400 ml-1">({kurs.kod})</span>
      </nav>
      <main className="max-w-3xl mx-auto p-6 space-y-10">

        {/* Uppgifter */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Uppgifter</h2>
          {(uppgifter ?? []).length === 0 ? (
            <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
              Inga uppgifter kopplade till den här kursen.
            </div>
          ) : (
            <div className="grid gap-3">
              {(uppgifter ?? []).map(u => (
                <Link
                  key={u.id}
                  href={`/dashboard/uppgift/${u.id}`}
                  className="bg-white rounded-xl border px-5 py-4 hover:bg-gray-50 hover:border-gray-300 transition flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{u.titel}</p>
                    {u.beskrivning && (
                      <p className="text-sm text-gray-500 mt-0.5">{u.beskrivning}</p>
                    )}
                  </div>
                  <span className="text-gray-400 text-sm shrink-0 ml-4">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Klassfeedback */}
        <KlassFeedback
          uppgifter={(uppgifter ?? []).map(u => ({ id: u.id, titel: u.titel }))}
          kursId={kurs_id}
        />

        {/* Elever */}
        <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Elever</h2>
          <span className="text-sm text-gray-500">{elever.length} inskrivna</span>
        </div>

        {elever.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
            <p>Inga elever inskrivna ännu.</p>
            <p className="text-sm mt-1">Dela kurskoden <span className="font-mono font-medium">{kurs.kod}</span> med dina elever.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border divide-y">
            {elever.map(elev => (
              <Link
                key={elev.id}
                href={`/dashboard/elev/${elev.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium">{elev.namn ?? '—'}</p>
                  <p className="text-sm text-gray-400">{elev.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(elev.joinedAt).toLocaleDateString('sv-SE')}
                  </span>
                  <span className="text-gray-400 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        </section>

      </main>
    </div>
  )
}
