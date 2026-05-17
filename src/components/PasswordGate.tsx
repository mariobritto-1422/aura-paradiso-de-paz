import { useState } from 'react'

const PANEL_PASSWORD = 'paraiso2026'
const STORAGE_KEY    = 'aura_panel_auth'

function isAuthorized() {
  return localStorage.getItem(STORAGE_KEY) === 'ok'
}

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(isAuthorized)
  const [input, setInput]           = useState('')
  const [error, setError]           = useState(false)

  if (authorized) return <>{children}</>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (input === PANEL_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'ok')
      setAuthorized(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Sistema interno</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Paraíso de Paz</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Contraseña"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false) }}
            autoFocus
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-red-500 text-sm">Contraseña incorrecta</p>
          )}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
