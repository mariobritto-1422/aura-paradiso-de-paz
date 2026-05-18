import { useState, useEffect, useRef } from 'react'
import { displayToIso, isoToDisplay, maskDate } from '../lib/dateUtils'

const BASE_CLASS =
  'w-full border rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:ring-1 transition-colors text-sm'
const OK_CLASS  = BASE_CLASS + ' border-gray-300 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]'
const ERR_CLASS = BASE_CLASS + ' border-red-400 focus:border-red-400 focus:ring-red-400'

const MSG = 'Ingresá una fecha válida en formato DD/MM/AAAA'

type Props = {
  value: string                      // ISO YYYY-MM-DD o ''
  onChange: (iso: string) => void    // emite ISO cuando válido, '' si vacío/inválido
  required?: boolean
  className?: string
  error?: string                     // error externo (ej: validación al guardar)
}

export function DateInput({ value, onChange, required, className, error }: Props) {
  const [display, setDisplay] = useState(() => isoToDisplay(value))
  const [selfErr, setSelfErr] = useState('')
  const prevIso = useRef(value)

  // Sincronizar display si el padre cambia el valor (reset, autoload)
  useEffect(() => {
    if (value === prevIso.current) return
    prevIso.current = value
    setDisplay(isoToDisplay(value))
    if (value) setSelfErr('')
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskDate(e.target.value)
    setDisplay(masked)
    setSelfErr('')

    const digits = masked.replace(/\D/g, '')
    if (digits.length === 0) {
      onChange('')
    } else if (digits.length === 8) {
      const iso = displayToIso(masked)
      if (iso) {
        onChange(iso)
      } else {
        setSelfErr(MSG)
        onChange('')
      }
    } else {
      onChange('')
    }
  }

  function handleBlur() {
    const digits = display.replace(/\D/g, '')
    if (digits.length > 0 && digits.length < 8) setSelfErr(MSG)
  }

  const showErr = selfErr || error
  const inputClass = className ?? (showErr ? ERR_CLASS : OK_CLASS)

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="DD/MM/AAAA"
        required={required}
        className={inputClass}
        autoComplete="off"
        maxLength={10}
      />
      {showErr && <p className="text-xs text-red-500 mt-1">{showErr}</p>}
    </div>
  )
}
