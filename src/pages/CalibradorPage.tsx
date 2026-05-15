import { useState, useRef } from 'react'

const FORMULARIOS = [
  { id: 'F1', label: 'F1 — Solicitud de Afiliación',     src: '/formularios/paz_1.jpeg' },
  { id: 'F2', label: 'F2 — Conformidad S&G',              src: '/formularios/paz_2.jpeg' },
  { id: 'F3', label: 'F3 — S&G Convenios Nacionales',     src: '/formularios/paz_3.jpeg' },
  { id: 'F4', label: 'F4 — Solicitud de Cremación',       src: '/formularios/paz_4.jpeg' },
  { id: 'F5', label: 'F5 — Conformidad IPSM',             src: '/formularios/paz_5.jpeg' },
  { id: 'F6', label: 'F6 — Ficha Cementerio La Piedad',   src: '/formularios/paz_6.jpeg' },
  { id: 'F7', label: 'F7 — Conformidad del Servicio',     src: '/formularios/paz_7.jpeg' },
]

// A4 = 210mm × 297mm

export default function CalibradorPage() {
  const [selIdx, setSelIdx] = useState(6) // F7 por defecto
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<Array<{ x: number; y: number; label: string }>>([])
  const imgRef = useRef<HTMLImageElement>(null)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const mm_x = parseFloat(((px / rect.width)  * 210).toFixed(1))
    const mm_y = parseFloat(((py / rect.height) * 297).toFixed(1))
    setCoords({ x: mm_x, y: mm_y })
  }

  function savePoint() {
    if (!coords) return
    const label = prompt('Nombre del campo (ej: fall_nombre):') ?? ''
    if (!label) return
    setHistory(h => [...h, { ...coords, label }])
  }

  function copyHistory() {
    const lines = history.map(h => `  ${h.label}: { x: ${h.x}, y: ${h.y} },`).join('\n')
    navigator.clipboard.writeText(lines)
    alert('Coordenadas copiadas al portapapeles')
  }

  const actual = FORMULARIOS[selIdx]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 px-6 py-3 flex items-center gap-4 flex-wrap">
        <span className="text-[#B8956A] font-semibold text-sm">Calibrador de coordenadas</span>
        <select
          value={selIdx}
          onChange={e => { setSelIdx(Number(e.target.value)); setCoords(null) }}
          className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-600"
        >
          {FORMULARIOS.map((f, i) => (
            <option key={f.id} value={i}>{f.label}</option>
          ))}
        </select>
        <span className="text-gray-400 text-xs">Click en la imagen → obtené coordenadas en mm</span>
      </div>

      <div className="flex gap-4 p-4" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Imagen con overlay */}
        <div className="flex-1 overflow-auto bg-gray-800 rounded-xl">
          <div
            className="relative inline-block cursor-crosshair w-full"
            onClick={handleClick}
          >
            <img
              ref={imgRef}
              src={actual.src}
              alt={actual.label}
              className="w-full h-auto block"
              draggable={false}
            />
            {/* Punto de click */}
            {coords && (
              <div
                className="absolute w-3 h-3 rounded-full bg-red-500 border-2 border-white pointer-events-none"
                style={{
                  left: `${(coords.x / 210) * 100}%`,
                  top:  `${(coords.y / 297) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            {/* Puntos guardados */}
            {history.map((h, i) => (
              <div key={i}>
                <div
                  className="absolute w-2 h-2 rounded-full bg-yellow-400 border border-gray-800 pointer-events-none"
                  style={{
                    left: `${(h.x / 210) * 100}%`,
                    top:  `${(h.y / 297) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
                <div
                  className="absolute text-yellow-300 text-xs pointer-events-none whitespace-nowrap"
                  style={{
                    left: `calc(${(h.x / 210) * 100}% + 6px)`,
                    top:  `${(h.y / 297) * 100}%`,
                    fontSize: '9px',
                  }}
                >
                  {h.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="w-64 flex flex-col gap-3 flex-shrink-0">
          {/* Coordenadas actuales */}
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Último click</p>
            {coords ? (
              <>
                <p className="text-2xl font-mono font-bold text-[#B8956A]">
                  x: {coords.x}
                </p>
                <p className="text-2xl font-mono font-bold text-[#B8956A]">
                  y: {coords.y}
                </p>
                <p className="text-xs text-gray-500 mt-1">mm desde esquina superior izquierda</p>
                <button
                  onClick={savePoint}
                  className="mt-3 w-full bg-[#1B3A6B] text-white py-2 rounded-lg text-sm hover:bg-[#152e57]"
                >
                  Guardar punto
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Hacé click en la imagen</p>
            )}
          </div>

          {/* Historial */}
          <div className="bg-gray-800 rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Puntos guardados</p>
              {history.length > 0 && (
                <button
                  onClick={copyHistory}
                  className="text-xs text-[#B8956A] hover:underline"
                >
                  Copiar código
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="text-gray-600 text-xs">Sin puntos guardados</p>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-1">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-yellow-300 truncate flex-1">{h.label}</span>
                    <span className="text-gray-400 ml-2 font-mono">
                      {h.x},{h.y}
                    </span>
                    <button
                      onClick={() => setHistory(prev => prev.filter((_, j) => j !== i))}
                      className="ml-2 text-gray-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instrucciones */}
          <div className="bg-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1">
            <p>1. Hacé click sobre un campo del formulario</p>
            <p>2. Guardá el punto con su nombre</p>
            <p>3. Copiá el código y pegalo en el archivo FX.ts</p>
          </div>
        </div>
      </div>
    </div>
  )
}
