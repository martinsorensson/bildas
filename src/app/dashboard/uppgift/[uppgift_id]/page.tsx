import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import RaderaUppgiftKnapp from './RaderaUppgiftKnapp'
import FeedbackKnapp from './FeedbackKnapp'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  inkommen:             { label: 'Inkommen',           className: 'bg-gray-100 text-gray-600' },
  feedback_genererad:   { label: 'Feedback genererad', className: 'bg-blue-100 text-blue-700' },
  feedback_godkand:     { label: 'Feedback godkänd',   className: 'bg-green-100 text-green-700' },
}

export default async function UppgiftInlamningarPage({
  params,
}: {
  params: Promise<{ uppgift_id: string }>
}) {
  const { uppgift_id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profil?.role !== 'larare' && profil?.role !== 'admin') redirect('/dashboard')

  // Hämta uppgiften — verifiera att läraren äger kursen
  const { data: uppgift } = await supabase
    .from('uppgifter')
    .select('id, titel, beskrivning, kurs_id, kurser(id, namn, larare_id)')
    .eq('id', uppgift_id)
    .single()

  if (!uppgift) redirect('/dashboard')

  const kurs = Array.isArray(uppgift.kurser) ? uppgift.kurser[0] : uppgift.kurser
  if (!kurs || (kurs as any).larare_id !== user.id) redirect('/dashboard')

  // Hämta alla elever i kursen
  const { data: kursElever } = await supabase
    .from('kurs_elever')
    .select('profiles!elev_id(id, namn, email)')
    .eq('kurs_id', (kurs as any).id)

  const elever = (kursElever ?? []).map(ke => {
    const p = Array.isArray(ke.profiles) ? ke.profiles[0] : ke.profiles
    return {
      id: (p as any)?.id as string,
      namn: (p as any)?.namn ?? (p as any)?.email ?? '—',
    }
  }).filter(e => e.id)

  // Hämta inlämningar — elev_id direkt + profil för namn
  const { data: inlamningar } = await supabase
    .from('inlamningar')
    .select('id, elev_id, bild_url, skapad_at, status, profiles!elev_id(id, namn, email)')
    .eq('uppgift_id', uppgift_id)
    .order('skapad_at', { ascending: false })

  const normerade = (inlamningar ?? []).map(inl => {
    const p = Array.isArray(inl.profiles) ? inl.profiles[0] : inl.profiles
    return {
      id: inl.id,
      bild_url: inl.bild_url,
      skapad_at: inl.skapad_at,
      status: inl.status ?? 'inkommen',
      elevId: inl.elev_id ?? (p as any)?.id ?? null,
      elevNamn: (p as any)?.namn ?? (p as any)?.email ?? '—',
    }
  })

  // Bygg set av elev-id:n som lämnat in — direkt jämförelse utan join-beroende
  const inlamnadeElevIds = new Set(normerade.map(inl => inl.elevId).filter(Boolean))

  console.log('[uppgift] elever i kursen:', elever.map(e => `${e.namn} (${e.id})`))
  console.log('[uppgift] elev_id i inlämningar:', [...inlamnadeElevIds])

  const eleverMedStatus = elever.map(e => ({
    ...e,
    harLamnatIn: inlamnadeElevIds.has(e.id),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/dashboard" className="text-gray-500 hover:text-black text-sm">← Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/dashboard/kurs/${(kurs as any).id}`}
            className="text-gray-500 hover:text-black text-sm"
          >
            {(kurs as any).namn}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium">{uppgift.titel}</span>
        </div>
        <RaderaUppgiftKnapp uppgiftId={uppgift_id} />
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{uppgift.titel}</h2>
          {uppgift.beskrivning && (
            <p className="text-gray-500 mt-1">{uppgift.beskrivning}</p>
          )}
        </div>

        {eleverMedStatus.length > 0 && (
          <div className="bg-white rounded-xl border p-5">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Elever i kursen</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {eleverMedStatus.map(e => (
                <Link
                  key={e.id}
                  href={`/dashboard/elev/${e.id}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, display: 'inline-block', backgroundColor: e.harLamnatIn ? '#22c55e' : '#f87171' }} />
                  {e.namn}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Inlämningar</h3>
          <span className="text-sm text-gray-500">{normerade.length} st</span>
        </div>

        {normerade.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
            Inga inlämningar på den här uppgiften ännu.
          </div>
        ) : (
          <div className="space-y-4">
            {normerade.map(inl => {
              const statusInfo = STATUS_LABEL[inl.status] ?? STATUS_LABEL.inkommen
              return (
                <div key={inl.id} className="bg-white rounded-xl border overflow-hidden">
                  {inl.bild_url && (
                    <img
                      src={inl.bild_url}
                      alt={`Inlämning av ${inl.elevNamn}`}
                      className="w-full max-h-96 object-contain bg-gray-50"
                    />
                  )}
                  <div className="px-5 py-3 flex items-center justify-between gap-4">
                    <div>
                      {inl.elevId ? (
                        <Link
                          href={`/dashboard/elev/${inl.elevId}`}
                          className="font-medium hover:underline"
                        >
                          {inl.elevNamn}
                        </Link>
                      ) : (
                        <p className="font-medium">{inl.elevNamn}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(inl.skapad_at).toLocaleDateString('sv-SE', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <FeedbackKnapp inlamningId={inl.id} />
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
