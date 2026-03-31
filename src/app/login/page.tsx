export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Bildas</h1>
        <p className="text-center text-gray-500 mb-8">Portfolioverktyg för bildlärare</p>
        <button className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition">
          Logga in med Google
        </button>
        <button className="w-full mt-3 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
          Logga in med Microsoft
        </button>
      </div>
    </div>
  )
}
