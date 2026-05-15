import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { supabase, type DeudoFichado, type Servicio } from '../lib/supabase'

const FORM_URL = `${window.location.origin}/`

export default function PanelPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<DeudoFichado[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(true)
  const qrRef = useRef<HTMLDivElement>(null)

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

  const activos = sessions.filter(s => s.estado === 'activo').length
  const completos = sessions.filter(s => s.estado === 'completo').length
  const abandonados = sessions.filter(s => s.estado === 'abandonado').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1B3A6B] text-white px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#B8956A]/40 flex-shrink-0">
          <img
            src="/Paraiso_de_Paz.png"
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }}
          />
        </div>
        <div>
          <h1 className="font-semibold text-base">Panel AURA — Paraíso de Paz</h1>
          <p className="text-[#B8956A] text-xs">Sesiones en tiempo real</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => navigate('/alta-servicio')}
            className="text-xs bg-[#B8956A] text-white px-3 py-1.5 rounded-lg hover:bg-[#a07a55] transition-colors font-medium"
          >
            + Alta del servicio
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

        {/* Servicios recientes */}
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
                        <button
                          onClick={() => navigate(`/servicio/${s.id}`)}
                          className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-2.5 py-1 rounded-lg hover:bg-[#B8956A]/10 transition-colors"
                        >
                          Documentos
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tabla */}
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
