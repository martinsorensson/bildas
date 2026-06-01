import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import RolePicker from './RolePicker'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authFel } = await supabase.auth.getUser()
  if (authFel) console.error('[admin] getUser fel:', authFel.message)
  if (!user) {
    console.error('[admin] Ingen session — redirectar till login')
    redirect('/login')
  }

  const { data: egenprofil, error: profilFel } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profilFel) console.error('[admin] Profilhämtning fel:', profilFel.message, '| user.id:', user.id)
  if (!egenprofil) console.error('[admin] Ingen profilrad hittades för user.id:', user.id)
  if (egenprofil && egenprofil.role !== 'admin') console.error('[admin] Roll är', egenprofil.role, '— inte admin')

  if (egenprofil?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: anvandare } = await supabase
    .from('profiles')
    .select('id, namn, email, role')
    .order('role')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <span className="text-sm text-gray-500">Admin</span>
      </nav>
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Användare</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Namn</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">E-post</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Roll</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(anvandare ?? []).map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4 font-medium">{a.namn ?? '—'}</td>
                  <td className="px-5 py-4 text-gray-500">{a.email ?? '—'}</td>
                  <td className="px-5 py-4">
                    <RolePicker anvandareId={a.id} nuvarandeRoll={a.role ?? 'pending'} />
                  </td>
                </tr>
              ))}
              {(anvandare ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                    Inga användare hittades
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
