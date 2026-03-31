export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Bildas</h1>
        <span className="text-sm text-gray-500">Lärarvy</span>
      </nav>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Mina inlämningar</h2>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            + Ny inlämning
          </button>
        </div>
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
          <p className="text-lg">Inga inlämningar ännu</p>
          <p className="text-sm mt-1">Skapa din första inlämning för att komma igång</p>
        </div>
      </main>
    </div>
  )
}
