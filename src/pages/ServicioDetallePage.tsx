import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, type Servicio, type DeudoFichado, type ServicioConDeudo, type PagoServicio } from '../lib/supabase'
import { getFormulariosRequeridos, imprimirFormulario, imprimirTodos, type FormularioInfo } from '../pdfs'
import { formatMonto } from '../lib/format'
import { generarComprobantePago } from '../pdfs/comprobante-pago'

const FORMAS_PAGO = ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'] as const

export default function ServicioDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [servicio, setServicio] = useState<ServicioConDeudo | null>(null)
  const [loading, setLoading] = useState(true)
  const [imprimiendo, setImprimiendo] = useState<string | null>(null)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())

  // Pagos
  const [pagos, setPagos] = useState<PagoServicio[]>([])
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoForma, setPagoForma] = useState<typeof FORMAS_PAGO[number]>('Efectivo')
  const [pagoObs, setPagoObs] = useState('')
  const [savingPago, setSavingPago] = useState(false)

  const formularios = servicio ? getFormulariosRequeridos(servicio) : []

  function toggleSeleccion(fid: string) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(fid) ? next.delete(fid) : next.add(fid)
      return next
    })
  }

  function toggleTodos() {
    if (seleccionados.size === formularios.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(formularios.map(f => f.id)))
    }
  }

  useEffect(() => {
    if (!id) return
    loadServicio(id)
    loadPagos(id)
  }, [id])

  async function loadPagos(sid: string) {
    const { data } = await supabase
      .from('pagos_servicio')
      .select('*')
      .eq('servicio_id', sid)
      .order('fecha_pago', { ascending: true })
    if (data) setPagos(data as PagoServicio[])
  }

  async function handleRegistrarPago() {
    if (!servicio || !pagoMonto) return
    const monto = parseFloat(pagoMonto)
    if (isNaN(monto) || monto <= 0) return
    setSavingPago(true)

    const { data: nuevoPago } = await supabase
      .from('pagos_servicio')
      .insert({
        servicio_id: servicio.id,
        monto,
        forma_pago: pagoForma,
        observacion: pagoObs.trim() || null,
      })
      .select('*')
      .single()

    if (nuevoPago) {
      const nuevosPagos = [...pagos, nuevoPago as PagoServicio]
      setPagos(nuevosPagos)
      const totalPagado = nuevosPagos.reduce((s, p) => s + p.monto, 0)
      const saldoRestante = Math.max(0, (servicio.importe_servicio ?? 0) - totalPagado)

      // Marcar como cancelado si saldo = 0
      if (servicio.importe_servicio && saldoRestante === 0) {
        await supabase.from('servicios').update({ estado: 'cancelado' }).eq('id', servicio.id)
        setServicio(prev => prev ? { ...prev, estado: 'cancelado' } : null)
      }

      generarComprobantePago(
        nuevoPago as PagoServicio,
        { numero_orden: servicio.numero_orden, fallecido_nombre: servicio.fallecido_nombre, importe_servicio: servicio.importe_servicio },
        saldoRestante,
      )
    }

    setPagoMonto(''); setPagoForma('Efectivo'); setPagoObs('')
    setSavingPago(false)
    setShowPagoModal(false)
  }

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

    let garante: DeudoFichado | null = null
    const srvTyped = srv as Servicio
    if (srvTyped.garante_id) {
      const { data } = await supabase
        .from('deudos_fichados')
        .select('*')
        .eq('id', srvTyped.garante_id)
        .single()
      garante = data as DeudoFichado | null
    } else if (deudo?.session_token) {
      const { data } = await supabase
        .from('deudos_fichados')
        .select('*')
        .eq('session_token', deudo.session_token + ':g')
        .maybeSingle()
      garante = data as DeudoFichado | null
    }

    setServicio({ ...(srv as Servicio), deudo, garante })
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

  async function handleImprimirSeleccionados() {
    if (!servicio || seleccionados.size === 0) return
    setImprimiendo('SEL')
    const subset = formularios.filter(f => seleccionados.has(f.id))
    await imprimirTodos(servicio, subset)
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
                <DataRow label="Solicitante" value={servicio.deudo.nombre} />
                <DataRow label="Celular"     value={servicio.deudo.whatsapp ?? servicio.deudo.telefono} />
              </>
            )}
            {servicio.garante && (
              <>
                <DataRow label="Garante"       value={servicio.garante.nombre} />
                <DataRow label="Cel. Garante"  value={servicio.garante.whatsapp ?? servicio.garante.telefono} />
              </>
            )}
          </div>
        </div>

        {/* Billetera de pagos */}
        <BilleteraSection
          servicio={servicio}
          pagos={pagos}
          onRegistrar={() => setShowPagoModal(true)}
          onReimprimir={(pago) => {
            const totalPagado = pagos.slice(0, pagos.indexOf(pago) + 1).reduce((s, p) => s + p.monto, 0)
            const saldo = Math.max(0, (servicio.importe_servicio ?? 0) - totalPagado)
            generarComprobantePago(
              pago,
              { numero_orden: servicio.numero_orden, fallecido_nombre: servicio.fallecido_nombre, importe_servicio: servicio.importe_servicio },
              saldo,
            )
          }}
        />

        {/* Formularios requeridos */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={seleccionados.size === formularios.length && formularios.length > 0}
                onChange={toggleTodos}
                className="w-4 h-4 accent-[#1B3A6B] cursor-pointer"
                title="Seleccionar todos"
              />
              <h3 className="font-semibold text-[#1B3A6B] text-sm">
                Documentos a preparar — {formularios.length} formulario{formularios.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="flex gap-2">
              {seleccionados.size > 0 && (
                <button
                  onClick={handleImprimirSeleccionados}
                  disabled={imprimiendo !== null}
                  className="text-xs bg-[#B8956A] text-white px-3 py-1.5 rounded-lg disabled:opacity-50 hover:bg-[#a07a55] transition-colors"
                >
                  {imprimiendo === 'SEL' ? 'Abriendo...' : `Imprimir seleccionados (${seleccionados.size})`}
                </button>
              )}
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
          </div>
          <ul className="divide-y divide-gray-50">
            {formularios.map(info => (
              <li
                key={info.id}
                className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${seleccionados.has(info.id) ? 'bg-[#1B3A6B]/5' : 'hover:bg-gray-50'}`}
                onClick={() => toggleSeleccion(info.id)}
              >
                <input
                  type="checkbox"
                  checked={seleccionados.has(info.id)}
                  onChange={() => toggleSeleccion(info.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 accent-[#1B3A6B] cursor-pointer flex-shrink-0"
                />
                <div className="w-9 h-9 rounded-xl bg-[#1B3A6B]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1B3A6B] text-xs font-bold">{info.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{info.nombre}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleImprimir(info) }}
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

      {/* Modal registrar pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-[#1B3A6B] mb-5">Registrar pago</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Monto ($)</label>
                <input
                  type="number" min={1} step={1000} value={pagoMonto} autoFocus
                  onChange={e => setPagoMonto(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                  placeholder="Ej: 500000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Forma de pago</label>
                <select value={pagoForma} onChange={e => setPagoForma(e.target.value as typeof FORMAS_PAGO[number])}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]">
                  {FORMAS_PAGO.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Observación (opcional)</label>
                <input type="text" value={pagoObs} onChange={e => setPagoObs(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]"
                  placeholder="Ej: Cheque N° 001234" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">Al confirmar se imprimirá el comprobante automáticamente.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPagoModal(false)} disabled={savingPago}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm disabled:opacity-60">
                Cancelar
              </button>
              <button onClick={handleRegistrarPago} disabled={savingPago || !pagoMonto}
                className="flex-1 py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-semibold disabled:opacity-60">
                {savingPago ? 'Guardando...' : 'Confirmar e imprimir'}
              </button>
            </div>
          </div>
        </div>
      )}
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
          <img src="/PP_jpg.png" alt="" className="w-full h-full object-cover"
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

// ─── Billetera ────────────────────────────────────────────────────────────────

function BilleteraSection({ servicio, pagos, onRegistrar, onReimprimir }: {
  servicio: ServicioConDeudo
  pagos: PagoServicio[]
  onRegistrar: () => void
  onReimprimir: (pago: PagoServicio) => void
}) {
  const importe = servicio.importe_servicio ?? 0
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0)
  const saldo = Math.max(0, importe - totalPagado)
  const cancelado = importe > 0 && saldo === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#B8956A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h3 className="font-semibold text-[#1B3A6B] text-sm">Billetera de pagos</h3>
          {cancelado && (
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Cancelado</span>
          )}
        </div>
        {!cancelado && (
          <button onClick={onRegistrar}
            className="text-xs bg-[#1B3A6B] text-white px-3 py-1.5 rounded-lg hover:bg-[#152e57] transition-colors">
            + Registrar pago
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Importe total</p>
          <p className="text-lg font-bold text-gray-800">
            {importe > 0 ? `$${formatMonto(importe)}` : '—'}
          </p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total pagado</p>
          <p className="text-lg font-bold text-emerald-700">${formatMonto(totalPagado)}</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Saldo pendiente</p>
          <p className={`text-lg font-bold ${cancelado ? 'text-emerald-600' : saldo > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {importe > 0 ? (cancelado ? 'Cancelado' : `$${formatMonto(saldo)}`) : '—'}
          </p>
        </div>
      </div>

      {/* Lista de pagos */}
      {pagos.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-sm">Sin pagos registrados aún.</div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {pagos.map((p, idx) => {
            const acum = pagos.slice(0, idx + 1).reduce((s, x) => s + x.monto, 0)
            const saldoTras = Math.max(0, importe - acum)
            return (
              <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">#{String(p.comprobante_nro).padStart(4, '0')}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.forma_pago}</span>
                    {p.observacion && <span className="text-xs text-gray-400 truncate">{p.observacion}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(p.fecha_pago).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {importe > 0 && ` · Saldo tras pago: $${formatMonto(saldoTras)}`}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-700 flex-shrink-0">${formatMonto(p.monto)}</p>
                <button onClick={() => onReimprimir(p)}
                  title="Reimprimir comprobante"
                  className="text-xs text-gray-400 hover:text-[#1B3A6B] px-2 py-1 flex-shrink-0 border border-gray-200 rounded-lg hover:border-[#1B3A6B] transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
