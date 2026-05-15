import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Servicio, type DeudoFichado, type ServicioConDeudo } from '../lib/supabase'
import { getFormulariosRequeridos, imprimirFormulario, imprimirTodos, type FormularioInfo } from '../pdfs'

export default function ServicioDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [servicio, setServicio] = useState<ServicioConDeudo | null>(null)
  const [loading, setLoading] = useState(true)
  const [imprimiendo, setImprimiendo] = useState<string | null>(null)

  const formularios = servicio ? getFormulariosRequeridos(servicio) : []

  useEffect(() => {
    if (!id) return
    loadServicio(id)
  }, [id])

  async function loadServicio(sid: string) {
    const { data: srv } = await supabase
      .from('servicios')
      .select('*')
      .eq('id', sid)
      .single()

    if (!srv) { setLoading(false); return }

    let deudo: DeudoFichado | null = null
    if ((srv as Servicio).deudo_id) {
      const { data } = await supabase
        .from('deudos_fichados')
        .select('*')
        .eq('id', (srv as Servicio).deudo_id)
        .single()
      deudo = data as DeudoFichado | null
    }

    setServicio({ ...(srv as Servicio), deudo })
    setLoading(false)
  }

  async function handleImprimir(info: FormularioInfo) {
    if (!servicio) return
    setImprimiendo(info.id)
    await imprimirFormulario(servicio, info)
    setImprimiendo(null)
  }

  async function handleImprimirTodos() {
    if (!servicio) return
    setImprimiendo('ALL')
    await imprimirTodos(servicio, formularios)
    setImprimiendo(null)
  }

  if (loading) return <PageShell><div className="p-10 text-center text-gray-400">Cargando...</div></PageShell>
  if (!servicio) return <PageShell><div className="p-10 text-center text-gray-400">Servicio no encontrado.</div></PageShell>

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Encabezado del servicio */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#1B3A6B] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[#B8956A] text-xs uppercase tracking-widest">Orden N°</p>
              <h2 className="text-white text-2xl font-bold">{servicio.numero_orden}</h2>
            </div>
            <span className="text-xs bg-white/10 text-white px-3 py-1 rounded-full capitalize">
              {servicio.tipo_servicio}
            </span>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <DataRow label="Fallecido"   value={servicio.fallecido_nombre} />
            <DataRow label="DNI"         value={servicio.fallecido_dni} />
            <DataRow label="Deceso"      value={fmtDt(servicio.fallecido_fecha_deceso)} />
            <DataRow label="Servicio"    value={fmtDt(servicio.fecha_servicio)} />
            <DataRow label="Destino"     value={servicio.destino_final} />
            <DataRow label="Asesor"      value={servicio.asesor} />
            {servicio.deudo && (
              <>
                <DataRow label="Deudo"   value={servicio.deudo.nombre} />
                <DataRow label="Celular" value={servicio.deudo.whatsapp ?? servicio.deudo.telefono} />
              </>
            )}
          </div>
        </div>

        {/* Formularios requeridos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-[#1B3A6B] text-sm">
              Documentos — {formularios.length} formulario{formularios.length !== 1 ? 's' : ''}
            </h3>
            {formularios.length > 1 && (
              <button
                onClick={handleImprimirTodos}
                disabled={imprimiendo !== null}
                className="text-xs bg-[#1B3A6B] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-[#152e57] transition-colors"
              >
                {imprimiendo === 'ALL' ? 'Abriendo...' : 'Imprimir todos'}
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-50">
            {formularios.map(info => (
              <li key={info.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1B3A6B] text-xs font-bold">{info.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{info.nombre}</p>
                </div>
                <button
                  onClick={() => handleImprimir(info)}
                  disabled={imprimiendo !== null}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-[#B8956A] text-white px-3 py-2 rounded-lg disabled:opacity-50 hover:bg-[#a07a55] transition-colors"
                >
                  {imprimiendo === info.id ? (
                    'Abriendo...'
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Imprimir
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate('/panel')}
          className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
        >
          ← Volver al panel
        </button>
      </div>
    </PageShell>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1B3A6B] text-white px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[#B8956A]/40 flex-shrink-0">
          <img src="/Paraiso_de_Paz.png" alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm">Detalle del Servicio</h1>
          <p className="text-[#B8956A] text-xs">Paraíso de Paz</p>
        </div>
        <button onClick={() => navigate('/panel')}
          className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-3 py-1.5 rounded-lg hover:bg-white/10">
          ← Panel
        </button>
      </div>
      {children}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-800 font-medium truncate">{value}</p>
    </div>
  )
}

function fmtDt(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
