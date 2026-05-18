import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type CatalogoItem, type StockItem, type CatalogoAsesor, type ConfiguracionComisiones } from '../lib/supabase'

type Tab = 'ataud' | 'preparador' | 'asesor' | 'destino' | 'comisiones'

const IC = 'border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]'

export default function ConfiguracionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ataud')

  const TABS: [Tab, string][] = [
    ['ataud', 'Ataúdes'],
    ['preparador', 'Preparadores'],
    ['asesor', 'Asesores'],
    ['destino', 'Destinos'],
    ['comisiones', 'Comisiones'],
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1B3A6B] text-white px-6 py-4 flex items-center gap-4">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-[#B8956A]/40 flex-shrink-0">
          <img src="/PP_jpg.png" alt="" className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-sm">Configuración</h1>
          <p className="text-[#B8956A] text-xs">Paraíso de Paz — Catálogos</p>
        </div>
        <button onClick={() => navigate('/panel')}
          className="text-xs text-[#B8956A] border border-[#B8956A]/40 px-3 py-1.5 rounded-lg hover:bg-white/10">
          ← Panel
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Tabs — 2 filas en mobile */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-white rounded-xl p-1 shadow-sm">
          {TABS.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${tab === t
                ? 'bg-[#1B3A6B] text-white'
                : 'text-gray-500 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'ataud'      && <StockTab />}
        {tab === 'preparador' && <CatalogoTab tabla="catalogos_preparador" label="Preparador" withWhatsapp />}
        {tab === 'asesor'     && <AsesorTab />}
        {tab === 'destino'    && <CatalogoTab tabla="catalogos_destino" label="Destino" />}
        {tab === 'comisiones' && <ComisionesTab />}
      </div>
    </div>
  )
}

// ─── Stock (Ataúdes) ──────────────────────────────────────────────────────────

function StockTab() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modelo, setModelo] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('stock').select('*').eq('tipo', 'ataud').order('modelo')
    setItems((data as StockItem[]) ?? [])
    setLoading(false)
  }

  async function add() {
    if (!modelo.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('stock')
      .insert({ modelo: modelo.trim(), descripcion: desc.trim() || null, tipo: 'ataud', disponible: true })
      .select().single()
    if (data) setItems(prev => [...prev, data as StockItem].sort((a, b) => a.modelo.localeCompare(b.modelo)))
    setModelo(''); setDesc('')
    setSaving(false)
  }

  async function toggleDisponible(item: StockItem) {
    await supabase.from('stock').update({ disponible: !item.disponible }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, disponible: !i.disponible } : i))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este ataúd?')) return
    await supabase.from('stock').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <CardHeader title="Stock de ataúdes" sub="Solo los disponibles aparecen en el formulario de alta." />
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Modelo *"
            className={`flex-1 ${IC}`} />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opc.)"
            className={`flex-1 ${IC}`} />
          <AddBtn onClick={add} disabled={saving || !modelo.trim()} saving={saving} />
        </div>
      </div>
      <ListBody loading={loading} empty="Sin ataúdes en stock.">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{item.modelo}</p>
              {item.descripcion && <p className="text-xs text-gray-400">{item.descripcion}</p>}
            </div>
            <ToggleBtn active={item.disponible} labelOn="Disponible" labelOff="Sin stock"
              onClick={() => toggleDisponible(item)} />
            <RemoveBtn onClick={() => remove(item.id)} />
          </li>
        ))}
      </ListBody>
    </div>
  )
}

// ─── Catálogo genérico con opción de WhatsApp (Preparadores / Destinos) ───────

type CatalogoConWA = CatalogoItem & { whatsapp?: string | null }

function CatalogoTab({ tabla, label, withWhatsapp }: { tabla: string; label: string; withWhatsapp?: boolean }) {
  const [items, setItems] = useState<CatalogoConWA[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [tabla])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from(tabla).select('*').order('nombre')
    setItems((data as CatalogoConWA[]) ?? [])
    setLoading(false)
  }

  async function add() {
    if (!nombre.trim()) return
    setSaving(true)
    const { data } = await supabase.from(tabla).insert({ nombre: nombre.trim(), activo: true }).select().single()
    if (data) setItems(prev => [...prev, data as CatalogoConWA].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setNombre('')
    setSaving(false)
  }

  async function toggleActivo(item: CatalogoConWA) {
    await supabase.from(tabla).update({ activo: !item.activo }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, activo: !i.activo } : i))
  }

  async function saveWhatsapp(item: CatalogoConWA, wa: string) {
    await supabase.from(tabla).update({ whatsapp: wa || null }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, whatsapp: wa || null } : i))
  }

  async function remove(id: string) {
    if (!confirm(`¿Eliminar este ${label.toLowerCase()}?`)) return
    await supabase.from(tabla).delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <CardHeader title={`${label}s`} sub="Solo los activos aparecen en el formulario de alta." />
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder={`Nombre del ${label.toLowerCase()} *`}
            onKeyDown={e => e.key === 'Enter' && add()}
            className={`flex-1 ${IC}`} />
          <AddBtn onClick={add} disabled={saving || !nombre.trim()} saving={saving} />
        </div>
      </div>
      <ListBody loading={loading} empty={`Sin ${label.toLowerCase()}s registrados.`}>
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
            <p className="flex-1 text-sm font-medium text-gray-800 min-w-[120px]">{item.nombre}</p>
            {withWhatsapp && (
              <WhatsappInline
                value={item.whatsapp ?? ''}
                onSave={wa => saveWhatsapp(item, wa)}
              />
            )}
            <ToggleBtn active={item.activo} labelOn="Activo" labelOff="Inactivo"
              onClick={() => toggleActivo(item)} />
            <RemoveBtn onClick={() => remove(item.id)} />
          </li>
        ))}
      </ListBody>
    </div>
  )
}

// ─── Asesores (con WhatsApp) ──────────────────────────────────────────────────

function AsesorTab() {
  const [items, setItems] = useState<CatalogoAsesor[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [wa, setWa] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('catalogos_asesor').select('*').order('nombre')
    setItems((data as CatalogoAsesor[]) ?? [])
    setLoading(false)
  }

  async function add() {
    if (!nombre.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('catalogos_asesor')
      .insert({ nombre: nombre.trim(), whatsapp: wa.trim() || null, activo: true })
      .select().single()
    if (data) setItems(prev => [...prev, data as CatalogoAsesor].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setNombre(''); setWa('')
    setSaving(false)
  }

  async function toggleActivo(item: CatalogoAsesor) {
    await supabase.from('catalogos_asesor').update({ activo: !item.activo }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, activo: !i.activo } : i))
  }

  async function saveWhatsapp(item: CatalogoAsesor, newWa: string) {
    await supabase.from('catalogos_asesor').update({ whatsapp: newWa || null }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, whatsapp: newWa || null } : i))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este asesor?')) return
    await supabase.from('catalogos_asesor').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <CardHeader title="Asesores" sub="Nombre y WhatsApp de cada asesor. Solo los activos aparecen en el formulario." />
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2 flex-wrap">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre *"
            className={`flex-1 min-w-[140px] ${IC}`} />
          <input value={wa} onChange={e => setWa(e.target.value)} placeholder="WhatsApp (549376...)"
            className={`flex-1 min-w-[140px] ${IC}`} />
          <AddBtn onClick={add} disabled={saving || !nombre.trim()} saving={saving} />
        </div>
      </div>
      <ListBody loading={loading} empty="Sin asesores registrados.">
        {items.map(item => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3 flex-wrap">
            <p className="flex-1 text-sm font-medium text-gray-800 min-w-[120px]">{item.nombre}</p>
            <WhatsappInline value={item.whatsapp ?? ''} onSave={newWa => saveWhatsapp(item, newWa)} />
            <ToggleBtn active={item.activo} labelOn="Activo" labelOff="Inactivo"
              onClick={() => toggleActivo(item)} />
            <RemoveBtn onClick={() => remove(item.id)} />
          </li>
        ))}
      </ListBody>
    </div>
  )
}

// ─── Comisiones (configuración) ───────────────────────────────────────────────

function ComisionesTab() {
  const [cfg, setCfg] = useState<ConfiguracionComisiones | null>(null)
  const [base, setBase] = useState('')
  const [porc, setPorc] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('configuracion_comisiones').select('*').single().then(({ data }) => {
      if (data) {
        setCfg(data as ConfiguracionComisiones)
        setBase(String((data as ConfiguracionComisiones).base_minima))
        setPorc(String((data as ConfiguracionComisiones).porcentaje))
      }
    })
  }, [])

  async function save() {
    if (!cfg) return
    setSaving(true)
    await supabase
      .from('configuracion_comisiones')
      .update({ base_minima: parseFloat(base), porcentaje: parseFloat(porc), updated_at: new Date().toISOString() })
      .eq('id', cfg.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!cfg) return <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">Cargando...</div>

  const preview = parseFloat(base) > 0 && parseFloat(porc) > 0
    ? Math.round(parseFloat(base) * parseFloat(porc) / 100)
    : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <CardHeader title="Configuración de comisiones" sub="Parámetros aplicados al calcular comisiones de asesores." />
      <div className="px-5 py-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Base mínima ($)
            </label>
            <input type="number" min={0} step={10000} value={base}
              onChange={e => setBase(e.target.value)}
              className={`w-full ${IC}`} placeholder="500000" />
            <p className="text-xs text-gray-400 mt-1">Servicios por debajo no generan comisión.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
              Porcentaje (%)
            </label>
            <input type="number" min={0} step={0.5} value={porc}
              onChange={e => setPorc(e.target.value)}
              className={`w-full ${IC}`} placeholder="3" />
            <p className="text-xs text-gray-400 mt-1">Porcentaje sobre el importe total.</p>
          </div>
        </div>

        {preview > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            Ejemplo: servicio de ${parseFloat(base).toLocaleString('es-AR')} genera comisión de
            ${preview.toLocaleString('es-AR')} ({porc}%)
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="bg-[#1B3A6B] text-white px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#152e57] transition-colors">
          {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}

// ─── Micro-componentes reutilizables ──────────────────────────────────────────

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="font-semibold text-[#1B3A6B] text-sm">{title}</h2>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}

function AddBtn({ onClick, disabled, saving }: { onClick: () => void; disabled: boolean; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#152e57] flex-shrink-0">
      {saving ? '...' : '+ Agregar'}
    </button>
  )
}

function ToggleBtn({ active, labelOn, labelOff, onClick }: {
  active: boolean; labelOn: string; labelOff: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${active
        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
      {active ? labelOn : labelOff}
    </button>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 flex-shrink-0">
      ✕
    </button>
  )
}

function ListBody({ loading, empty, children }: {
  loading: boolean; empty: string; children: React.ReactNode
}) {
  if (loading) return <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
  const arr = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean)
  if (arr.length === 0) return <div className="p-8 text-center text-gray-400 text-sm">{empty}</div>
  return <ul className="divide-y divide-gray-50">{children}</ul>
}

function WhatsappInline({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (!editing) {
    return (
      <button onClick={() => { setDraft(value); setEditing(true) }}
        className="text-xs text-gray-400 hover:text-[#1B3A6B] flex-shrink-0 underline">
        {value ? `WA: ${value}` : 'Agregar WA'}
      </button>
    )
  }
  return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      placeholder="549376..."
      className="text-xs border border-[#1B3A6B] rounded-lg px-2 py-1 w-32 focus:outline-none"
    />
  )
}
