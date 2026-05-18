/** DD/MM/AAAA → YYYY-MM-DD. Returns null si la fecha es inválida. */
export function displayToIso(display: string): string | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const d = new Date(+yyyy, +mm - 1, +dd)
  if (d.getFullYear() !== +yyyy || d.getMonth() !== +mm - 1 || d.getDate() !== +dd) return null
  return `${yyyy}-${mm}-${dd}`
}

/** YYYY-MM-DD → DD/MM/AAAA. Retorna '' si el valor no es ISO válido. */
export function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Aplica máscara DD/MM/AAAA a partir de lo que el usuario teclea. */
export function maskDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
