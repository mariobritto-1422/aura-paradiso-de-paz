import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { supabase, type DeudoFichado, type Servicio } from '../lib/supabase'

const FORM_URL = `${window.location.origin}/`

// ─── Session ──────────────────────────────────────────────────────────────────

type SessionUser = { nombre: string; rol: 'Administrador' | 'Operador' }

const STAFF_ROLES: SessionUser[] = [
  { nombre: 'Daniel Alegre', rol: 'Administrador' },
  { nombre: 'Aplicaciones Alemanas', rol: 'Operador' },
  { nombre: 'Carlos Venialgo', rol: 'Operador' },
  { nombre: 'Cristiano Maidana', rol: 'Operador' },
  { nombre: 'Jorfe Zariaga', rol: 'Operador' },
  { nombre: 'Jorge Amarillo', rol: 'Operador' },
  { nombre: 'Lorena Salguero', rol: 'Operador' },
  { nombre: 'Noelia Bolaño', rol: 'Operador' },
  { nombre: 'Soledad Alegre', rol: 'Operador' },
  { nombre: 'Ulises Velázquez', rol: 'Operador' },
]

function getStoredSession(): SessionUser | null {
  try { return JSON.parse(localStorage.getItem('aura_session_user') ?? 'null') } catch { return null }
}

function saveSession(u: SessionUser) {
  localStorage.setItem('aura_session_user', JSON.stringify(u))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionModal({ onSelect }: { onSelect: (u: SessionUser) => void }) {
  return (
    <div className="fixed inset-0 bg-[#1B3A6B]/95 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-7 w-full max-w-sm shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#B8956A]/40">
            <img src="/PP_jpg.png" alt="" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
          </div>
        </div>
        <h2 className="text-center font-semibold text-[#1B3A6B] mb-1">¿Quién opera?</h2>
        <p className="text-center text-xs text-gray-400 mb-6">Seleccioná tu nombre para continuar.</p>
        <div className="space-y-2">
          {STAFF_ROLES.map(u => (
            <button
              key={u.nombre}
              onClick={() => onSelect(u)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#1B3A6B] hover:bg-[#1B3A6B]/5 transition-colors text-left"
            >
              <span className="text-sm font-medium text-gray-800">{u.nombre}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.rol === 'Administrador' ? 'bg-[#1B3A6B]/10 text-[#1B3A6B]' : 'bg-gray-100 text-gray-500'}`}>
                {u.rol}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ servicio, onCancel, onConfirm, deleting }: {
  servicio: Servicio
  onCancel: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h3 className="text-center font-semibold text-gray-800 mb-1">Eliminar servicio</h3>
        <p className="text-center text-sm text-gray-500 mb-1">
          Orden <span className="font-bold text-[#1B3A6B]">#{servicio.numero_orden}</span> —{' '}
          {servicio.fallecido_nombre}
        </p>
        <p className="text-center text-xs text-red-400 mb-6">Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm disabled:opacity-60">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60">
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BlockedModal({ onClose, message }: { onClose: () => void; message: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="text-center font-semibold text-gray-800 mb-2">Acción no permitida</h3>
        <p className="text-center text-sm text-gray-500 mb-6">{message}</p>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium">
          Entendido
        </button>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PanelPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<DeudoFichado[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(getStoredSession)
  const [showSessionModal, setShowSessionModal] = useState(!getStoredSession())
  const [deleteTarget, setDeleteTarget] = useState<Servicio | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [blockedMsg, setBlockedMsg] = useState<string | null>(null)

  useEffect(() => {
    loadSessions()
    loadServicios()

    const channel = supabase
      .channel('deudos_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deudos_fichados' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setSessions(prev => [payload.new as DeudoFichado, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setSessions(prev =>
              prev.map(s => (s.id === (payload.new as DeudoFichado).id ? (payload.new as DeudoFichado) : s))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadSessions() {
    const { data } = await supabase
      .from('deudos_fichados')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (data) setSessions(data as DeudoFichado[])
    setLoading(false)
  }

  async function loadServicios() {
    const { data } = await supabase
      .from('servicios')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setServicios(data as Servicio[])
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'QR-Paraiso-de-Paz.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleSelectUser(u: SessionUser) {
    saveSession(u)
    setSessionUser(u)
    setShowSessionModal(false)
  }

  function requestDelete(s: Servicio) {
    if (!sessionUser) {
      setShowSessionModal(true)
      return
    }
    if (sessionUser.rol !== 'Administrador' && s.estado !== 'activo') {
      setBlockedMsg('Solo un Administrador puede eliminar este servicio.')
      return
    }
    setDeleteTarget(s)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await supabase.from('servicios').delete().eq('id', deleteTarget.id)
    setServicios(prev => prev.filter(s => s.id !== deleteTarget.id))
    setDeleteTarget(null)
    setDeleting(false)
  }

  const activos = sessions.filter(s => s.estado === 'activo').length
  const completos = sessions.filter(s => s.estado === 'completo').length
  const abandonados = sessions.filter(s => s.estado === 'abandonado').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B3A6B] text-white px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#B8956A]/40 flex-shrink-0">
          <img src="/PP_jpg.png" alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-base">Panel AURA — Paraíso de Paz</h1>
          {sessionUser ? (
            <button
              onClick={() => setShowSessionModal(true)}
              className="text-[#B8956A] text-xs hover:text-white transition-colors"
            >
              {sessionUser.nombre} · {sessionUser.rol} · cambiar
            </button>
          ) : (
            <p className="text-[#B8956A] text-xs">Sesiones en tiempo real</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/alta-servicio')}
            className="text-xs bg-[#B8956A] text-white px-3 py-1.5 rounded-lg hover:bg-[#a07a55] transition-colors font-medium"
          >
            + Alta del servicio
          </button>
          <button
            onClick={() => navigate('/configuracion')}
            className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Configuración
          </button>
          <button
            onClick={loadSessions}
            className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Activas" value={activos} bg="bg-emerald-500" />
          <Stat label="Completadas" value={completos} bg="bg-[#1B3A6B]" />
          <Stat label="Abandonadas" value={abandonados} bg="bg-gray-400" />
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[#1B3A6B] text-sm">Servicios registrados</h2>
            <button
              onClick={() => navigate('/alta-servicio')}
              className="text-xs bg-[#1B3A6B] text-white px-3 py-1.5 rounded-lg hover:bg-[#152e57]"
            >
              + Nuevo
            </button>
          </div>
          {servicios.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Sin servicios registrados aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs bg-gray-50">
                    <th className="px-4 py-3 font-medium">Orden</th>
                    <th className="px-4 py-3 font-medium">Fallecido</th>
                    <th className="px-4 py-3 font-medium">Tipo</th>
                    <th className="px-4 py-3 font-medium">Destino</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {servicios.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-[#1B3A6B]">#{s.numero_orden}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.fallecido_nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{s.tipo_servicio}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[130px] truncate">{s.destino_final ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/servicio/${s.id}`)}
                            className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-2.5 py-1 rounded-lg hover:bg-[#B8956A]/10 transition-colors"
                          >
                            Documentos
                          </button>
                          <button
                            onClick={() => requestDelete(s)}
                            className="text-xs text-red-400 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sesiones */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1B3A6B] text-sm">Sesiones recientes</h2>
            </div>
            {loading ? (
              <div className="p-10 text-center text-gray-400 text-sm">Cargando sesiones...</div>
            ) : sessions.length === 0 ? (
              <div className="p-10 text-center text-gray-400 text-sm">
                Sin sesiones aún. Escanee el QR para registrar el primer contacto.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 text-xs bg-gray-50">
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium">DNI</th>
                      <th className="px-4 py-3 font-medium">WhatsApp</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Relación</th>
                      <th className="px-4 py-3 font-medium">Canal</th>
                      <th className="px-4 py-3 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessions.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Badge estado={s.estado} createdAt={s.created_at} />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{s.nombre || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.dni || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.whatsapp || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{s.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.relacion_fallecido || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{s.canal_notificacion || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QR */}
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4">
            <h2 className="font-semibold text-[#1B3A6B] text-sm text-center">Código QR del formulario</h2>
            <div ref={qrRef} className="p-4 border-2 border-[#1B3A6B]/10 rounded-xl">
              <QRCode value={FORM_URL} size={150} fgColor="#1B3A6B" bgColor="#FFFFFF" />
            </div>
            <p className="text-gray-400 text-xs text-center break-all leading-relaxed">{FORM_URL}</p>
            <button
              onClick={downloadQR}
              className="w-full bg-[#1B3A6B] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#152e57] transition-colors"
            >
              Descargar QR (SVG)
            </button>
            <p className="text-gray-400 text-xs text-center">
              Imprimir y colocar en sala de espera y mostrador
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSessionModal && <SessionModal onSelect={handleSelectUser} />}

      {deleteTarget && (
        <DeleteModal
          servicio={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          deleting={deleting}
        />
      )}

      {blockedMsg && <BlockedModal message={blockedMsg} onClose={() => setBlockedMsg(null)} />}
    </div>
  )
}

function Stat({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <div className={`text-2xl font-bold text-white ${bg} w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2`}>
        {value}
      </div>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
}

function Badge({ estado, createdAt }: { estado: string; createdAt: string }) {
  const ageMin = (Date.now() - new Date(createdAt).getTime()) / 60000
  const effectiveEstado = estado === 'activo' && ageMin > 10 ? 'abandonado' : estado

  if (effectiveEstado === 'completo') {
    return (
      <span className="inline-flex px-2.5 py-1 bg-[#1B3A6B]/10 text-[#1B3A6B] rounded-full text-xs font-medium">
        Completo
      </span>
    )
  }
  if (effectiveEstado === 'abandonado') {
    return (
      <span className="inline-flex px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
        Abandonado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Activo
    </span>
  )
}
