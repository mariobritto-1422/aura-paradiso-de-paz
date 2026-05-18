import { useState, useEffect, useRef } from 'react'
import { displayToIso, isoToDisplay, maskDate } from '../lib/dateUtils'

const BASE_CLASS =
  'border rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:ring-1 transition-colors text-sm w-full'
const OK_CLASS  = BASE_CLASS + ' border-gray-300 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]'
const ERR_CLASS = BASE_CLASS + ' border-red-400 focus:border-red-400 focus:ring-red-400'

const MSG = 'Ingresá una fecha válida en formato DD/MM/AAAA'

type Props = {
  value: string                      // ISO YYYY-MM-DDTHH:mm o ''
  onChange: (iso: string) => void    // emite YYYY-MM-DDTHH:mm cuando ambos válidos
  required?: boolean
}

function split(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const [d, t] = iso.split('T')
  return { date: d ?? '', time: (t ?? '').slice(0, 5) }
}

export function DateTimeInput({ value, onChange, required }: Props) {
  const parsed = split(value)
  const [display, setDisplay] = useState(() => isoToDisplay(parsed.date))
  const [time, setTime] = useState(parsed.time)
  const [dateErr, setDateErr] = useState('')
  const prevIso = useRef(value)

  useEffect(() => {
    if (value === prevIso.current) return
    prevIso.current = value
    const p = split(value)
    setDisplay(isoToDisplay(p.date))
    setTime(p.time)
    if (value) setDateErr('')
  }, [value])

  function emit(dateDisplay: string, t: string) {
    const digits = dateDisplay.replace(/\D/g, '')
    if (digits.length === 8) {
      const iso = displayToIso(dateDisplay)
      if (iso && t) {
        onChange(`${iso}T${t}`)
        return
      }
    }
    onChange('')
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = maskDate(e.target.value)
    setDisplay(masked)
    setDateErr('')
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8 && !displayToIso(masked)) {
      setDateErr(MSG)
    }
    emit(masked, time)
  }

  function handleDateBlur() {
    const digits = display.replace(/\D/g, '')
    if (digits.length > 0 && digits.length < 8) setDateErr(MSG)
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTime(e.target.value)
    emit(display, e.target.value)
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
            placeholder="DD/MM/AAAA"
            required={required}
            className={dateErr ? ERR_CLASS : OK_CLASS}
            autoComplete="off"
            maxLength={10}
          />
        </div>
        <div className="w-32 flex-shrink-0">
          <input
            type="time"
            value={time}
            onChange={handleTimeChange}
            required={required}
            className={OK_CLASS}
          />
        </div>
      </div>
      {dateErr && <p className="text-xs text-red-500">{dateErr}</p>}
    </div>
  )
}
