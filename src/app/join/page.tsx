import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import JoinForm from './JoinForm'
import LoggaUtKnapp from '@/components/LoggaUtKnapp'

export default async function JoinPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Om eleven redan är med i minst en kurs → skicka till dashboard
  const { count } = await supabase
    .from('kurs_elever')
    .select('id', { count: 'exact', head: true })
    .eq('elev_id', user.id)

  if (count && count > 0) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <LoggaUtKnapp />
      </nav>
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
          <h1 className="text-2xl font-bold mb-1">Gå med i en kurs</h1>
          <p className="text-gray-500 text-sm mb-6">
            Skriv in kurskoden du fått av din lärare.
          </p>
          <JoinForm />
        </div>
      </div>
    </div>
  )
}
