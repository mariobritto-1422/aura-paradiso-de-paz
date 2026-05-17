import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type DeudoFichado } from '../lib/supabase'
import { DeudoBuscador } from '../components/DeudoBuscador'
import { StockSelector } from '../components/StockSelector'
import { ComboSelect } from '../components/ComboSelect'

const IC =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors text-sm'

// ─── Data ─────────────────────────────────────────────────────────────────────

const LUGARES_DECESO = [
  'Sanatorio Boratti', 'Sanatorio Buenos Aires', 'Sanatorio Nosiglia',
  'Sanatorio Posadas', 'Sanatorio Caminos', 'Sanatorio IOT',
  'Hospital Ramón Madariaga', 'Hospital Favaloro', 'Clínica AMA',
  'Centro Médico Integral Alem', 'Casa de los Abuelos Candelaria',
  'Caps', 'Accidente de tránsito', 'Domicilio particular', 'Calle',
]

const TIPOS_ATAUD = [
  'PROTOTIPO (plano)', 'PROTOTIPO (baúl barniz)', 'PROTOTIPO (baúl l. lust)',
  'PROTOTIPO (baulito)', 'PROTOTIPO (baulito 3 paneles)', 'PROTOTIPO (jaspeado)',
  'PROTOTIPO (plano s.)', 'PROTOTIPO (barnizado)', 'PROTOTIPO (bau. lis.)',
  'PROTOTIPO (baúl)', 'PROTOTIPO (bau. 3 paneles)', 'PROTOTIPO (baulito jaspeado)',
  'PROTOTIPO (medida especial)', 'PROTOTIPO (baúl manija fija)', 'PROTOTIPO (baúl 2 paneles)',
  'PROTOTIPO (super medida)', 'PROTOTIPO (social)', 'ATAUD SOCIAL DREWNA',
  'ATAUD SOC. MEJ. DREWNA', 'ATAUD LISO FINO DREWNA',
]

const SALAS = ['A (Sala Fénix)', 'B (Sala Portal)', 'Garupa', 'Domicilio']

const CAPILLAS = ['Ninguna', 'Capilla VIP', 'Capilla Económica', 'Capilla Estándar']

const TIPOS_ENTIERRO = ['Tierra', 'Nicho', 'Cremación']

const STAFF = [
  'Aplicaciones Alemanas', 'Carlos Venialgo', 'Cristiano Maidana',
  'Daniel Alegre', 'Jorfe Zariaga', 'Jorge Amarillo',
  'Lorena Salguero', 'Noelia Bolaño', 'Soledad Alegre', 'Ulises Velázquez',
]

const DESTINOS = [
  'La Piedad', 'Garupa', 'Paraguay', 'Parque Privado El Portal',
  'Cementerio San Antonio', 'San José', 'Campo Viera', 'Santo Pipó',
  'Candelaria', 'Leandro N. Alem', 'San Vicente', 'El Soberbio',
  'Gobernador Roca', 'San Antonio', 'Alvear (Corrientes)', 'Posadas (otros cementerios)',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type ServicioForm = {
  fallecido_nombre: string; fallecido_dni: string
  fallecido_fecha_nacimiento: string; fallecido_fecha_deceso: string
  fallecido_lugar_deceso: string; fallecido_nacionalidad: string
  fallecido_estado_civil: string; fallecido_religion: string
  fallecido_profesion: string; fallecido_obra_social: string
  fallecido_beneficio_nro: string
  fallecido_talla: string; fallecido_peso_kg: string
  fallecido_causa_fallecimiento: string
  tipo_servicio: string
  ataud_tipo: string; ataud_medida: string; ataud_ancho: string
  sala: string; sala_domicilio: string
  capilla_ardiente: string; tipo_entierro: string
  preparador: string
  furgon_sanitario: boolean; coche_funebre: boolean
  coche_porta_corona: boolean; coche_acompanamiento: boolean; refrigerador: boolean
  tanatostetica: boolean; tanatopraxia: boolean
  destino_final: string; fecha_servicio: string
  ataud_urna_id: string
  doc_acta_def_orig: boolean; doc_acta_def_cop: boolean
  doc_libreta_orig: boolean; doc_libreta_cop: boolean
  doc_recibo_orig: boolean; doc_recibo_cop: boolean
  doc_factura_orig: boolean; doc_factura_cop: boolean
  doc_cenizas_orig: boolean; doc_cenizas_cop: boolean
  doc_carnet_orig: boolean; doc_carnet_cop: boolean
  doc_otros: string
  deudo_id: string
  asesor: string; asesor_custom: string
}

const EMPTY: ServicioForm = {
  fallecido_nombre: '', fallecido_dni: '',
  fallecido_fecha_nacimiento: '', fallecido_fecha_deceso: '',
  fallecido_lugar_deceso: '', fallecido_nacionalidad: '',
  fallecido_estado_civil: '', fallecido_religion: '',
  fallecido_profesion: '', fallecido_obra_social: '',
  fallecido_beneficio_nro: '',
  fallecido_talla: '', fallecido_peso_kg: '', fallecido_causa_fallecimiento: '',
  tipo_servicio: '',
  ataud_tipo: '', ataud_medida: '', ataud_ancho: '',
  sala: '', sala_domicilio: '',
  capilla_ardiente: '', tipo_entierro: '',
  preparador: '',
  furgon_sanitario: false, coche_funebre: false,
  coche_porta_corona: false, coche_acompanamiento: false, refrigerador: false,
  tanatostetica: false, tanatopraxia: false,
  destino_final: '', fecha_servicio: '',
  ataud_urna_id: '',
  doc_acta_def_orig: false, doc_acta_def_cop: false,
  doc_libreta_orig: false, doc_libreta_cop: false,
  doc_recibo_orig: false, doc_recibo_cop: false,
  doc_factura_orig: false, doc_factura_cop: false,
  doc_cenizas_orig: false, doc_cenizas_cop: false,
  doc_carnet_orig: false, doc_carnet_cop: false,
  doc_otros: '', deudo_id: '',
  asesor: '', asesor_custom: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRequiredDocs(tipo: string, obraSocial: string, destino: string): string[] {
  const docs: string[] = ['Compromiso de Pago']
  if (tipo === 'Sepelio') {
    docs.push('Conformidad del Servicio', 'Ficha Cementerio La Piedad')
  } else if (tipo === 'Cremación') {
    docs.push('Solicitud de Cremación', 'Autorización de Cremación', 'Declaración Jurada (DDJJ)')
  } else if (tipo === 'Traslado') {
    docs.push('Guía de Traslado')
    if (destino) docs.push(`Documentación destino: ${destino}`)
  }
  if (obraSocial.toUpperCase().includes('IPS')) docs.push('Conformidad IPSM')
  return docs
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, badge, isOpen, onToggle, children }: {
  title: string; badge?: string; isOpen: boolean
  onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {badge && (
          <span className="text-xs font-semibold text-[#B8956A] bg-[#B8956A]/10 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
        <h3 className="flex-1 font-semibold text-[#1B3A6B] text-sm">{title}</h3>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-5 pb-6 border-t border-gray-100 pt-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, children, required }: {
  label: string; children: React.ReactNode; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 accent-[#1B3A6B] flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function DocRow({ label, origVal, copVal, onOrig, onCop }: {
  label: string; origVal: boolean; copVal: boolean
  onOrig: (v: boolean) => void; onCop: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex gap-6">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={origVal} onChange={e => onOrig(e.target.checked)}
            className="w-4 h-4 accent-[#1B3A6B]" />
          Original
        </label>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={copVal} onChange={e => onCop(e.target.checked)}
            className="w-4 h-4 accent-[#1B3A6B]" />
          Copia
        </label>
      </div>
    </div>
  )
}

function FicharModal({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: (d: DeudoFichado) => void
}) {
  const [f, setF] = useState({
    nombre: '', dni: '', telefono: '', whatsapp: '',
    email: '', relacion_fallecido: '', canal_notificacion: 'WhatsApp',
  })
  const [saving, setSaving] = useState(false)
  const [sameTel, setSameTel] = useState(false)

  function ch(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setF(prev => ({ ...prev, [name]: value, ...(name === 'telefono' && sameTel ? { whatsapp: value } : {}) }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...f, whatsapp: sameTel ? f.telefono : f.whatsapp,
      session_token: crypto.randomUUID(), estado: 'completo' }
    const { data, error } = await supabase.from('deudos_fichados').insert(payload).select().single()
    setSaving(false)
    if (!error && data) onSuccess(data as DeudoFichado)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#1B3A6B]">Fichar nuevo deudo</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: 'Nombre completo', name: 'nombre', type: 'text' },
            { label: 'DNI', name: 'dni', type: 'text' },
            { label: 'Teléfono', name: 'telefono', type: 'tel' },
            { label: 'Email', name: 'email', type: 'email' },
          ].map(({ label, name, type }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
              <input type={type} name={name} value={(f as Record<string, string>)[name]}
                onChange={ch} required={name !== 'email'} className={IC} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">WhatsApp</label>
            <input type="tel" name="whatsapp" value={sameTel ? f.telefono : f.whatsapp}
              onChange={ch} disabled={sameTel} className={IC + (sameTel ? ' opacity-60' : '')} />
            <label className="flex items-center gap-2 mt-1.5 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={sameTel} onChange={e => setSameTel(e.target.checked)}
                className="w-4 h-4 accent-[#1B3A6B]" />
              Mismo que teléfono
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Relación</label>
            <select name="relacion_fallecido" value={f.relacion_fallecido} onChange={ch} required className={IC}>
              <option value="">Seleccionar...</option>
              {['Cónyuge', 'Hijo/a', 'Hermano/a', 'Padre/Madre', 'Otro'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Canal preferido</label>
            <select name="canal_notificacion" value={f.canal_notificacion} onChange={ch} className={IC}>
              <option>WhatsApp</option>
              <option>Email</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#1B3A6B] text-white text-sm disabled:opacity-60">
              {saving ? 'Guardando...' : 'Fichar y seleccionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ form, onCancel, onConfirm, saving }: {
  form: ServicioForm
  onCancel: () => void
  onConfirm: () => void
  saving: boolean
}) {
  const asesorDisplay = form.asesor === 'Otro' ? form.asesor_custom : form.asesor
  const salaDisplay = form.sala === 'Domicilio'
    ? `Domicilio — ${form.sala_domicilio || '(sin dirección)'}`
    : form.sala || '—'
  const rows: [string, string][] = [
    ['Fallecido', form.fallecido_nombre || '—'],
    ['DNI', form.fallecido_dni || '—'],
    ['Fecha de deceso', form.fallecido_fecha_deceso
      ? new Date(form.fallecido_fecha_deceso).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '—'],
    ['Causa', form.fallecido_causa_fallecimiento || '—'],
    ['Tipo de servicio', form.tipo_servicio || '—'],
    ['Sala', salaDisplay],
    ['Tipo de ataúd', form.ataud_tipo || '—'],
    ['Tipo de entierro', form.tipo_entierro || '—'],
    ['Destino final', form.destino_final || '—'],
    ['Preparador', form.preparador || '—'],
    ['Asesor', asesorDisplay || '—'],
  ]
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl my-4">
        <h3 className="font-semibold text-[#1B3A6B] mb-1">Confirmar servicio</h3>
        <p className="text-xs text-gray-400 mb-5">Verificá los datos antes de guardar.</p>
        <div className="divide-y divide-gray-50 mb-6">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between items-baseline py-2">
              <span className="text-xs text-gray-400 uppercase tracking-wide w-36 flex-shrink-0">{label}</span>
              <span className="text-sm text-gray-800 text-right font-medium">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm disabled:opacity-60">
            Corregir
          </button>
          <button type="button" onClick={onConfirm} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#1B3A6B] text-white text-sm font-semibold disabled:opacity-60">
            {saving ? 'Guardando...' : 'Confirmar y guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ orden, docs, onNuevo, onPanel }: {
  orden: number; docs: string[]; onNuevo: () => void; onPanel: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PanelHeader />
      <div className="max-w-2xl mx-auto w-full px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#1B3A6B]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#1B3A6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Servicio registrado</p>
          <h2 className="text-3xl font-bold text-[#1B3A6B]">Orden N° {orden}</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-[#1B3A6B] text-sm">Documentos a preparar</h3>
          </div>
          <ul className="divide-y divide-gray-50">
            {docs.map(doc => (
              <li key={doc} className="flex items-center gap-3 px-5 py-3.5">
                <div className="w-5 h-5 rounded border-2 border-[#B8956A] flex-shrink-0" />
                <span className="text-sm text-gray-700">{doc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={onPanel}
            className="flex-1 py-3.5 rounded-xl border border-[#1B3A6B] text-[#1B3A6B] text-sm font-medium">
            Volver al panel
          </button>
          <button onClick={onNuevo}
            className="flex-1 py-3.5 rounded-xl bg-[#1B3A6B] text-white text-sm font-medium">
            Nuevo servicio
          </button>
        </div>
      </div>
    </div>
  )
}

function PanelHeader() {
  const navigate = useNavigate()
  return (
    <div className="bg-[#1B3A6B] text-white px-6 py-4 flex items-center gap-4">
      <div className="w-9 h-9 rounded-full overflow-hidden border border-[#B8956A]/40 flex-shrink-0">
        <img src="/PP_jpg.png" alt="" className="w-full h-full object-cover"
          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
      </div>
      <div className="flex-1">
        <h1 className="font-semibold text-sm">Alta del Servicio</h1>
        <p className="text-[#B8956A] text-xs">Paraíso de Paz</p>
      </div>
      <button onClick={() => navigate('/panel')}
        className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
        ← Panel
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AltaServicioPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ServicioForm>(EMPTY)
  const [selectedDeudo, setSelectedDeudo] = useState<DeudoFichado | null>(null)
  const [saving, setSaving] = useState(false)
  const [showFichar, setShowFichar] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [screen, setScreen] = useState<'form' | 'success'>('form')
  const [savedOrden, setSavedOrden] = useState(0)
  const [requiredDocs, setRequiredDocs] = useState<string[]>([])
  const [open, setOpen] = useState({ s1: true, s2: true, s3: true, s4: false, s5: true, s6: true })

  function toggle(s: keyof typeof open) {
    setOpen(prev => ({ ...prev, [s]: !prev[s] }))
  }

  function set(field: keyof ServicioForm, value: string | boolean | number) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'tipo_servicio') next.ataud_urna_id = ''
      return next
    })
  }

  function setDoc(field: keyof ServicioForm) {
    return (v: boolean) => set(field, v)
  }

  function handleDeudoSelect(d: DeudoFichado | null) {
    setSelectedDeudo(d)
    set('deudo_id', d?.id ?? '')
  }

  function buildDocumentacion() {
    return {
      acta_defuncion: { original: form.doc_acta_def_orig, copia: form.doc_acta_def_cop },
      libreta_matrimonio: { original: form.doc_libreta_orig, copia: form.doc_libreta_cop },
      recibo_haberes: { original: form.doc_recibo_orig, copia: form.doc_recibo_cop },
      factura: { original: form.doc_factura_orig, copia: form.doc_factura_cop },
      cenizas_cert: { original: form.doc_cenizas_orig, copia: form.doc_cenizas_cop },
      carnet_obra_social: { original: form.doc_carnet_orig, copia: form.doc_carnet_cop },
      otros: form.doc_otros,
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSaving(true)
    const asesorFinal = form.asesor === 'Otro' ? form.asesor_custom : form.asesor
    const payload = {
      deudo_id: form.deudo_id || null,
      fallecido_nombre: form.fallecido_nombre,
      fallecido_dni: form.fallecido_dni || null,
      fallecido_fecha_nacimiento: form.fallecido_fecha_nacimiento || null,
      fallecido_fecha_deceso: form.fallecido_fecha_deceso || null,
      fallecido_lugar_deceso: form.fallecido_lugar_deceso || null,
      fallecido_nacionalidad: form.fallecido_nacionalidad || null,
      fallecido_estado_civil: form.fallecido_estado_civil || null,
      fallecido_religion: form.fallecido_religion || null,
      fallecido_profesion: form.fallecido_profesion || null,
      fallecido_obra_social: form.fallecido_obra_social || null,
      fallecido_beneficio_nro: form.fallecido_beneficio_nro || null,
      fallecido_talla: form.fallecido_talla || null,
      fallecido_peso_kg: form.fallecido_peso_kg ? parseFloat(form.fallecido_peso_kg) : null,
      fallecido_causa_fallecimiento: form.fallecido_causa_fallecimiento || null,
      tipo_servicio: form.tipo_servicio,
      ataud_tipo: form.ataud_tipo || null,
      ataud_medida: form.ataud_medida ? parseInt(form.ataud_medida) : null,
      ataud_ancho: form.ataud_ancho || null,
      sala: form.sala || null,
      sala_domicilio: form.sala === 'Domicilio' ? form.sala_domicilio || null : null,
      capilla_ardiente: form.capilla_ardiente || null,
      tipo_entierro: form.tipo_entierro || null,
      preparador: form.preparador || null,
      furgon_sanitario: form.furgon_sanitario,
      coche_funebre: form.coche_funebre,
      coche_porta_corona: form.coche_porta_corona,
      coche_acompanamiento: form.coche_acompanamiento,
      refrigerador: form.refrigerador,
      coche_escolta: false,
      coche_escolta_cantidad: 0,
      tanatostetica: form.tanatostetica,
      tanatopraxia: form.tanatopraxia,
      destino_final: form.destino_final || null,
      fecha_servicio: form.fecha_servicio || null,
      ataud_urna_id: form.ataud_urna_id || null,
      documentacion: buildDocumentacion(),
      asesor: asesorFinal || null,
      estado: 'activo',
    }

    const { data, error } = await supabase
      .from('servicios')
      .insert(payload)
      .select('id, numero_orden')
      .single()

    if (error || !data) {
      setSaving(false)
      setShowConfirm(false)
      alert('Error al guardar. Por favor reintente.')
      return
    }

    if (form.ataud_urna_id) {
      await supabase.from('stock').update({ disponible: false }).eq('id', form.ataud_urna_id)
    }

    const docs = getRequiredDocs(form.tipo_servicio, form.fallecido_obra_social, form.destino_final)
    setRequiredDocs(docs)
    setSavedOrden((data as { numero_orden: number }).numero_orden)
    setSaving(false)
    setShowConfirm(false)
    setScreen('success')
  }

  function resetForm() {
    setForm(EMPTY)
    setSelectedDeudo(null)
    setSavedOrden(0)
    setRequiredDocs([])
    setScreen('form')
    setOpen({ s1: true, s2: true, s3: true, s4: false, s5: true, s6: true })
  }

  const stockTipo: 'ataud' | 'urna' | null =
    form.tipo_servicio === 'Sepelio' ? 'ataud' :
    form.tipo_servicio === 'Cremación' ? 'urna' : null

  if (screen === 'success') {
    return (
      <SuccessScreen
        orden={savedOrden}
        docs={requiredDocs}
        onNuevo={resetForm}
        onPanel={() => navigate('/panel')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PanelHeader />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* S1 — Datos del fallecido */}
          <Section badge="1" title="Datos del fallecido" isOpen={open.s1} onToggle={() => toggle('s1')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Apellido y Nombre" required>
                  <input type="text" value={form.fallecido_nombre} required
                    onChange={e => set('fallecido_nombre', e.target.value)}
                    className={IC} placeholder="Apellido, Nombre completo" />
                </Field>
              </div>
              <Field label="DNI">
                <input type="text" value={form.fallecido_dni}
                  onChange={e => set('fallecido_dni', e.target.value)}
                  className={IC} placeholder="Sin puntos" />
              </Field>
              <Field label="Nacionalidad">
                <input type="text" value={form.fallecido_nacionalidad}
                  onChange={e => set('fallecido_nacionalidad', e.target.value)}
                  className={IC} placeholder="Ej: Argentina" />
              </Field>
              <Field label="Fecha de nacimiento">
                <input type="date" value={form.fallecido_fecha_nacimiento}
                  onChange={e => set('fallecido_fecha_nacimiento', e.target.value)}
                  className={IC} />
              </Field>
              <Field label="Fecha y hora de deceso">
                <input type="datetime-local" value={form.fallecido_fecha_deceso}
                  onChange={e => set('fallecido_fecha_deceso', e.target.value)}
                  className={IC} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Lugar de deceso">
                  <ComboSelect
                    options={LUGARES_DECESO}
                    value={form.fallecido_lugar_deceso}
                    onChange={v => set('fallecido_lugar_deceso', v)}
                    placeholder="Buscar sanatorio, hospital o ingresar..."
                  />
                </Field>
              </div>
              <Field label="Talla">
                <select value={form.fallecido_talla}
                  onChange={e => set('fallecido_talla', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  <option>Normal</option>
                  <option>Especial</option>
                </select>
              </Field>
              <Field label="Peso Kg aproximado">
                <input type="number" min={0} step={0.5} value={form.fallecido_peso_kg}
                  onChange={e => set('fallecido_peso_kg', e.target.value)}
                  className={IC} placeholder="Ej: 75" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Causa de fallecimiento">
                  <input type="text" value={form.fallecido_causa_fallecimiento}
                    onChange={e => set('fallecido_causa_fallecimiento', e.target.value)}
                    className={IC} placeholder="Descripción de la causa..." />
                </Field>
              </div>
              <Field label="Estado civil">
                <select value={form.fallecido_estado_civil}
                  onChange={e => set('fallecido_estado_civil', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  {['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a', 'Unido/a de hecho'].map(o => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Religión">
                <input type="text" value={form.fallecido_religion}
                  onChange={e => set('fallecido_religion', e.target.value)}
                  className={IC} placeholder="Ej: Católica" />
              </Field>
              <Field label="Profesión u ocupación">
                <input type="text" value={form.fallecido_profesion}
                  onChange={e => set('fallecido_profesion', e.target.value)}
                  className={IC} />
              </Field>
              <Field label="Obra social / Afiliado a">
                <input type="text" value={form.fallecido_obra_social}
                  onChange={e => set('fallecido_obra_social', e.target.value)}
                  className={IC} placeholder="Ej: IPSM, OSEP..." />
              </Field>
              <Field label="Beneficio N°">
                <input type="text" value={form.fallecido_beneficio_nro}
                  onChange={e => set('fallecido_beneficio_nro', e.target.value)}
                  className={IC} />
              </Field>
            </div>
          </Section>

          {/* S2 — Características del servicio */}
          <Section badge="2" title="Características del servicio" isOpen={open.s2} onToggle={() => toggle('s2')}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo de servicio" required>
                <select value={form.tipo_servicio} required
                  onChange={e => set('tipo_servicio', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  {['Sepelio', 'Cremación', 'Traslado'].map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Capilla ardiente">
                <select value={form.capilla_ardiente}
                  onChange={e => set('capilla_ardiente', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  {CAPILLAS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tipo de ataúd">
                  <ComboSelect
                    options={TIPOS_ATAUD}
                    value={form.ataud_tipo}
                    onChange={v => set('ataud_tipo', v)}
                    placeholder="Buscar modelo o ingresar..."
                  />
                </Field>
              </div>
              <Field label="Medida">
                <input type="number" min={1} value={form.ataud_medida}
                  onChange={e => set('ataud_medida', e.target.value)}
                  className={IC} placeholder="Ej: 15, 16, 17..." />
              </Field>
              <Field label="Ancho">
                <select value={form.ataud_ancho}
                  onChange={e => set('ataud_ancho', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  <option>Estándar</option>
                  <option>SuperMedida</option>
                </select>
              </Field>
              <Field label="Sala asignada">
                <select value={form.sala}
                  onChange={e => set('sala', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  {SALAS.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              {form.sala === 'Domicilio' && (
                <Field label="Dirección del domicilio">
                  <input type="text" value={form.sala_domicilio}
                    onChange={e => set('sala_domicilio', e.target.value)}
                    className={IC} placeholder="Calle, número, localidad..." />
                </Field>
              )}
              <Field label="Tipo de entierro">
                <select value={form.tipo_entierro}
                  onChange={e => set('tipo_entierro', e.target.value)} className={IC}>
                  <option value="">Seleccionar...</option>
                  {TIPOS_ENTIERRO.map(o => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Preparador">
                <ComboSelect
                  options={STAFF}
                  value={form.preparador}
                  onChange={v => set('preparador', v)}
                  placeholder="Buscar o ingresar..."
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Fecha y hora del servicio">
                  <input type="datetime-local" value={form.fecha_servicio}
                    onChange={e => set('fecha_servicio', e.target.value)} className={IC} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Destino final">
                  <ComboSelect
                    options={DESTINOS}
                    value={form.destino_final}
                    onChange={v => set('destino_final', v)}
                    placeholder="Buscar localidad o ingresar..."
                  />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Vehículos / Recursos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CheckItem label="Furgón Sanitario" checked={form.furgon_sanitario} onChange={v => set('furgon_sanitario', v)} />
                <CheckItem label="Coche Fúnebre" checked={form.coche_funebre} onChange={v => set('coche_funebre', v)} />
                <CheckItem label="Coche Porta Corona" checked={form.coche_porta_corona} onChange={v => set('coche_porta_corona', v)} />
                <CheckItem label="Coche de Acompañamiento" checked={form.coche_acompanamiento} onChange={v => set('coche_acompanamiento', v)} />
                <CheckItem label="Refrigerador" checked={form.refrigerador} onChange={v => set('refrigerador', v)} />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Servicios adicionales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CheckItem label="Tanatoestética" checked={form.tanatostetica} onChange={v => set('tanatostetica', v)} />
                <CheckItem label="Tanatopraxia" checked={form.tanatopraxia} onChange={v => set('tanatopraxia', v)} />
              </div>
            </div>
          </Section>

          {/* S3 — Ataúd / Urna (stock físico) */}
          {stockTipo && (
            <Section badge="3" title={stockTipo === 'ataud' ? 'Ataúd — Stock físico' : 'Urna — Stock físico'}
              isOpen={open.s3} onToggle={() => toggle('s3')}>
              <p className="text-xs text-gray-500 mb-2">
                Asignar ítem del inventario físico. Al guardar, se marca como no disponible.
              </p>
              <StockSelector
                tipo={stockTipo}
                value={form.ataud_urna_id}
                onChange={id => set('ataud_urna_id', id)}
              />
            </Section>
          )}

          {/* S4 — Documentación */}
          <Section badge="4" title="Documentación recibida" isOpen={open.s4} onToggle={() => toggle('s4')}>
            <div className="text-xs text-gray-400 grid grid-cols-2 gap-x-6 mb-1">
              <span />
              <div className="flex gap-6 justify-end">
                <span className="w-14 text-center">Original</span>
                <span className="w-14 text-center">Copia</span>
              </div>
            </div>
            <DocRow label="Acta de Defunción" origVal={form.doc_acta_def_orig} copVal={form.doc_acta_def_cop}
              onOrig={setDoc('doc_acta_def_orig')} onCop={setDoc('doc_acta_def_cop')} />
            <DocRow label="Libreta o Acta de Matrimonio" origVal={form.doc_libreta_orig} copVal={form.doc_libreta_cop}
              onOrig={setDoc('doc_libreta_orig')} onCop={setDoc('doc_libreta_cop')} />
            <DocRow label="Recibo de Haberes" origVal={form.doc_recibo_orig} copVal={form.doc_recibo_cop}
              onOrig={setDoc('doc_recibo_orig')} onCop={setDoc('doc_recibo_cop')} />
            <DocRow label="Factura por servicio" origVal={form.doc_factura_orig} copVal={form.doc_factura_cop}
              onOrig={setDoc('doc_factura_orig')} onCop={setDoc('doc_factura_cop')} />
            <DocRow label="Cenizas y Certificado de Cremación" origVal={form.doc_cenizas_orig} copVal={form.doc_cenizas_cop}
              onOrig={setDoc('doc_cenizas_orig')} onCop={setDoc('doc_cenizas_cop')} />
            <DocRow label="Carnet de Obra Social" origVal={form.doc_carnet_orig} copVal={form.doc_carnet_cop}
              onOrig={setDoc('doc_carnet_orig')} onCop={setDoc('doc_carnet_cop')} />
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Otros</label>
              <input type="text" value={form.doc_otros}
                onChange={e => set('doc_otros', e.target.value)}
                className={IC} placeholder="Descripción de otros documentos..." />
            </div>
          </Section>

          {/* S5 — Deudo */}
          <Section badge="5" title="Vinculación con el deudo" isOpen={open.s5} onToggle={() => toggle('s5')}>
            <p className="text-xs text-gray-500 mb-3">
              Buscá al deudo que ya completó el formulario QR. Si no está registrado, podés ficharlo manualmente.
            </p>
            <DeudoBuscador
              selected={selectedDeudo}
              onSelect={handleDeudoSelect}
              onFicharNuevo={() => setShowFichar(true)}
            />
          </Section>

          {/* S6 — Asesor */}
          <Section badge="6" title="Asesor" isOpen={open.s6} onToggle={() => toggle('s6')}>
            <Field label="Asesor que tomó el servicio" required>
              <select value={form.asesor} required
                onChange={e => set('asesor', e.target.value)} className={IC}>
                <option value="">Seleccionar...</option>
                {STAFF.map(n => <option key={n}>{n}</option>)}
                <option value="Otro">Otro</option>
              </select>
            </Field>
            {form.asesor === 'Otro' && (
              <div className="mt-3">
                <Field label="Nombre del asesor">
                  <input type="text" value={form.asesor_custom} required
                    onChange={e => set('asesor_custom', e.target.value)}
                    className={IC} placeholder="Nombre completo" />
                </Field>
              </div>
            )}
          </Section>

          {/* Submit */}
          <div className="pt-2 pb-8">
            <button type="submit"
              className="w-full bg-[#1B3A6B] text-white py-4 rounded-xl text-base font-semibold hover:bg-[#152e57] transition-colors">
              Revisar y guardar
            </button>
          </div>
        </form>
      </div>

      {showFichar && (
        <FicharModal
          onClose={() => setShowFichar(false)}
          onSuccess={d => { handleDeudoSelect(d); setShowFichar(false) }}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          form={form}
          onCancel={() => setShowConfirm(false)}
          onConfirm={handleConfirm}
          saving={saving}
        />
      )}
    </div>
  )
}
