import { useState, useRef, useEffect } from 'react'
import { supabase, type DeudoFichado } from '../lib/supabase'

const INPUT_CLASS =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors text-sm'

type Props = {
  selected: DeudoFichado | null
  onSelect: (d: DeudoFichado | null) => void
  onFicharNuevo: () => void
}

export function DeudoBuscador({ selected, onSelect, onFicharNuevo }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DeudoFichado[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); setNoResults(false); return }
    debounceRef.current = setTimeout(search, 300)
  }, [query])

  async function search() {
    setLoading(true)
    const q = query.trim()
    const dniNorm = q.replace(/[.\-\s]/g, '')
    const nameNorm = q.normalize('NFD').replace(/[̀-ͯ]/g, '')

    const filters: string[] = [`nombre.ilike.%${q}%`]
    if (nameNorm !== q) filters.push(`nombre.ilike.%${nameNorm}%`)
    filters.push(`dni.ilike.%${dniNorm}%`)
    if (dniNorm !== q) filters.push(`dni.ilike.%${q}%`)

    const { data } = await supabase
      .from('deudos_fichados')
      .select('*')
      .eq('estado', 'completo')
      .or('rol.is.null,rol.eq.solicitante')
      .or(filters.join(','))
      .limit(8)
    const rows = (data as DeudoFichado[]) ?? []
    setResults(rows)
    setNoResults(rows.length === 0)
    setOpen(true)
    setLoading(false)
  }

  function pick(d: DeudoFichado) {
    onSelect(d)
    setQuery('')
    setOpen(false)
  }

  if (selected) {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#1B3A6B]/5 border border-[#1B3A6B]/20 rounded-xl">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-[#1B3A6B] truncate">{selected.nombre}</p>
          <p className="text-xs text-gray-500">
            DNI: {selected.dni ?? '—'} · WhatsApp: {selected.whatsapp ?? '—'} · {selected.relacion_fallecido ?? '—'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 underline"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="relative" onBlur={() => setTimeout(() => setOpen(false), 150)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre o DNI..."
          className={INPUT_CLASS}
          autoComplete="off"
        />
        {loading && (
          <span className="absolute right-3 top-3 text-gray-400 text-xs">Buscando...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map(d => (
            <button
              key={d.id}
              type="button"
              onMouseDown={() => pick(d)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
            >
              <p className="text-sm font-medium text-gray-800">{d.nombre}</p>
              <p className="text-xs text-gray-400">DNI: {d.dni} · {d.relacion_fallecido}</p>
            </button>
          ))}
        </div>
      )}

      {open && noResults && !loading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
          <p className="text-sm text-gray-500 mb-3">No se encontraron resultados para "{query}".</p>
          <button
            type="button"
            onMouseDown={onFicharNuevo}
            className="text-sm font-medium text-[#1B3A6B] underline"
          >
            Fichar nuevo deudo manualmente
          </button>
        </div>
      )}
    </div>
  )
}
