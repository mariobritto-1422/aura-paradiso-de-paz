import { useId } from 'react'

const IC =
  'w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-white ' +
  'focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B] transition-colors text-sm'

interface ComboSelectProps {
  options: string[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}

export function ComboSelect({ options, value, onChange, placeholder, required }: ComboSelectProps) {
  const rawId = useId()
  const listId = rawId.replace(/[^a-zA-Z0-9]/g, '_')
  return (
    <>
      <input
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Escribí para buscar o ingresá manualmente'}
        required={required}
        autoComplete="off"
        className={IC}
      />
      <datalist id={listId}>
        {options.map(o => <option key={o} value={o} />)}
      </datalist>
    </>
  )
}
