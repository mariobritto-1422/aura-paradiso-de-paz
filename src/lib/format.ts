export function formatMonto(n: number | null | undefined): string {
  if (n == null) return ''
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
