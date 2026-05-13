import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const INPUT_CLASS =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors text-sm'

type StockItem = { id: string; modelo: string; descripcion: string | null }

type Props = {
  tipo: 'ataud' | 'urna'
  value: string
  onChange: (id: string) => void
  required?: boolean
}

export function StockSelector({ tipo, value, onChange, required }: Props) {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('stock')
      .select('id, modelo, descripcion')
      .eq('tipo', tipo)
      .eq('disponible', true)
      .order('modelo')
      .then(({ data }) => {
        setItems((data as StockItem[]) ?? [])
        setLoading(false)
      })
  }, [tipo])

  if (loading) {
    return <p className="text-sm text-gray-400 py-3">Cargando stock...</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
        Sin stock disponible para {tipo === 'ataud' ? 'ataúdes' : 'urnas'}. Verificar inventario.
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      className={INPUT_CLASS}
    >
      <option value="">Seleccione {tipo === 'ataud' ? 'ataúd' : 'urna'}...</option>
      {items.map(i => (
        <option key={i.id} value={i.id}>
          {i.modelo}{i.descripcion ? ` — ${i.descripcion}` : ''}
        </option>
      ))}
    </select>
  )
}
