import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const err = await login(email.trim().toLowerCase(), password)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      navigate('/panel', { replace: true })
    }
  }

  const IC = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-colors'

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-4 border border-[#B8956A]/40">
          <img src="/PP_jpg.png" alt="Paraíso de Paz" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Sistema interno</p>
        <h1 className="text-2xl font-bold text-[#1B3A6B] mb-8">Paraíso de Paz</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus autoComplete="email" className={IC}
              placeholder="nombre@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password" className={IC}
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-[#1B3A6B] hover:bg-[#152e57] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
