import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function CambiarContrasenaPage() {
  const { user, markPasswordChanged } = useAuth()
  const navigate = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const IC = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] transition-colors'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (nueva.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (nueva !== confirmar) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const { error: authError } = await supabase.auth.updateUser({ password: nueva })
    if (authError) { setError('Error al actualizar. Intentá de nuevo.'); setLoading(false); return }

    await markPasswordChanged()
    setLoading(false)
    navigate('/panel', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1B3A6B]">Cambiar contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hola {user?.nombre}. Por seguridad, elegí una nueva contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Nueva contraseña
            </label>
            <input
              type="password" value={nueva} onChange={e => setNueva(e.target.value)}
              required minLength={8} autoFocus autoComplete="new-password" className={IC}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Confirmar contraseña
            </label>
            <input
              type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
              required autoComplete="new-password" className={IC}
              placeholder="Repetir contraseña"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-[#1B3A6B] hover:bg-[#152e57] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
