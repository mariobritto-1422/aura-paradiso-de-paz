import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const IC =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors text-sm'

type StockRow = {
  id: string
  modelo: string
  descripcion: string | null
  medida: number | null
  ancho: string | null
}

type Props = {
  tipo: 'ataud' | 'urna'
  value: string
  onChange: (id: string, modelo?: string, medida?: number | null, ancho?: string | null) => void
  required?: boolean
}

export function StockSelector({ tipo, value, onChange, required }: Props) {
  const [rows, setRows] = useState<StockRow[]>([])
  const [loading, setLoading] = useState(false)
  const [modeloSel, setModeloSel] = useState('')

  useEffect(() => {
    setLoading(true)
    setModeloSel('')
    onChange('', undefined, undefined, undefined)
    supabase
      .from('stock')
      .select('id, modelo, descripcion, medida, ancho')
      .eq('tipo', tipo)
      .eq('disponible', true)
      .order('modelo')
      .then(({ data }) => {
        setRows((data as StockRow[]) ?? [])
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

  if (loading) return <p className="text-sm text-gray-400 py-3">Cargando stock...</p>

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        Sin stock disponible para {tipo === 'ataud' ? 'ataúdes' : 'urnas'}. Verificar inventario.
      </div>
    )
  }

  const modelos = [...new Set(rows.map(r => r.modelo))].sort()
  const opciones = modeloSel ? rows.filter(r => r.modelo === modeloSel) : []

  function handleModeloChange(m: string) {
    setModeloSel(m)
    onChange('', m, undefined, undefined)
    // Si solo hay una opción para ese modelo, seleccionarla automáticamente
    const opts = rows.filter(r => r.modelo === m)
    if (opts.length === 1) {
      onChange(opts[0].id, opts[0].modelo, opts[0].medida, opts[0].ancho)
    }
  }

  function handleItemChange(id: string) {
    const item = rows.find(r => r.id === id)
    if (item) onChange(item.id, item.modelo, item.medida, item.ancho)
  }

  const label = tipo === 'ataud' ? 'ataúd' : 'urna'

  return (
    <div className="space-y-3">
      {/* Paso 1: Modelo */}
      <select
        value={modeloSel}
        onChange={e => handleModeloChange(e.target.value)}
        required={required}
        className={IC}
      >
        <option value="">Seleccione modelo de {label}...</option>
        {modelos.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {/* Paso 2: Medida / variante — solo si hay opciones y más de una */}
      {modeloSel && opciones.length > 1 && (
        <select
          value={value}
          onChange={e => handleItemChange(e.target.value)}
          required={required}
          className={IC}
        >
          <option value="">Seleccione medida disponible...</option>
          {opciones.map(o => {
            const etiqueta = [
              o.medida ? `${o.medida} cm` : null,
              o.ancho,
              o.descripcion,
            ].filter(Boolean).join(' · ') || o.id
            return <option key={o.id} value={o.id}>{etiqueta}</option>
          })}
        </select>
      )}

      {/* Sin stock para ese modelo */}
      {modeloSel && opciones.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          Sin stock disponible para {modeloSel}. Verificar inventario.
        </div>
      )}
    </div>
  )
}
