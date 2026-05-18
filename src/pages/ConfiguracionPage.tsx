import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type CatalogoItem, type StockItem } from '../lib/supabase'

type Tab = 'ataud' | 'preparador' | 'destino'

export default function ConfiguracionPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ataud')

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
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          {([['ataud', 'Ataúdes'], ['preparador', 'Preparadores'], ['destino', 'Destinos']] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t
                ? 'bg-[#1B3A6B] text-white'
                : 'text-gray-500 hover:text-gray-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'ataud'      && <StockTab />}
        {tab === 'preparador' && <CatalogoTab tabla="catalogos_preparador" label="Preparador" />}
        {tab === 'destino'    && <CatalogoTab tabla="catalogos_destino"    label="Destino" />}
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
    const { data } = await supabase
      .from('stock')
      .select('*')
      .eq('tipo', 'ataud')
      .order('modelo')
    setItems((data as StockItem[]) ?? [])
    setLoading(false)
  }

  async function add() {
    if (!modelo.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('stock')
      .insert({ modelo: modelo.trim(), descripcion: desc.trim() || null, tipo: 'ataud', disponible: true })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data as StockItem].sort((a, b) => a.modelo.localeCompare(b.modelo)))
    setModelo(''); setDesc('')
    setSaving(false)
  }

  async function toggleDisponible(item: StockItem) {
    await supabase.from('stock').update({ disponible: !item.disponible }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, disponible: !i.disponible } : i))
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este ataúd del stock?')) return
    await supabase.from('stock').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-[#1B3A6B] text-sm">Stock de ataúdes</h2>
        <p className="text-xs text-gray-400 mt-0.5">Solo los marcados como disponibles aparecen en el formulario de alta.</p>
      </div>

      {/* Formulario de alta */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Modelo *"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Descripción (opcional)"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
          <button onClick={add} disabled={saving || !modelo.trim()}
            className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#152e57]">
            {saving ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Sin ataúdes en stock.</div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.modelo}</p>
                {item.descripcion && <p className="text-xs text-gray-400">{item.descripcion}</p>}
              </div>
              <button onClick={() => toggleDisponible(item)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${item.disponible
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                {item.disponible ? 'Disponible' : 'Sin stock'}
              </button>
              <button onClick={() => remove(item.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Catálogo genérico (Preparadores / Destinos) ──────────────────────────────

function CatalogoTab({ tabla, label }: { tabla: string; label: string }) {
  const [items, setItems] = useState<CatalogoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [tabla])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from(tabla).select('*').order('nombre')
    setItems((data as CatalogoItem[]) ?? [])
    setLoading(false)
  }

  async function add() {
    if (!nombre.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from(tabla)
      .insert({ nombre: nombre.trim(), activo: true })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data as CatalogoItem].sort((a, b) => a.nombre.localeCompare(b.nombre)))
    setNombre('')
    setSaving(false)
  }

  async function toggleActivo(item: CatalogoItem) {
    await supabase.from(tabla).update({ activo: !item.activo }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, activo: !i.activo } : i))
  }

  async function remove(id: string) {
    if (!confirm(`¿Eliminar este ${label.toLowerCase()}?`)) return
    await supabase.from(tabla).delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-[#1B3A6B] text-sm">{label}s</h2>
        <p className="text-xs text-gray-400 mt-0.5">Solo los marcados como activos aparecen en el formulario de alta.</p>
      </div>

      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder={`Nombre del ${label.toLowerCase()} *`}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A6B]" />
          <button onClick={add} disabled={saving || !nombre.trim()}
            className="bg-[#1B3A6B] text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-[#152e57]">
            {saving ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Sin {label.toLowerCase()}s registrados.</div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-3 px-5 py-3">
              <p className="flex-1 text-sm text-gray-800">{item.nombre}</p>
              <button onClick={() => toggleActivo(item)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${item.activo
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                {item.activo ? 'Activo' : 'Inactivo'}
              </button>
              <button onClick={() => remove(item.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
