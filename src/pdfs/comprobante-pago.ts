import jsPDF from 'jspdf'
import { formatMonto } from '../lib/format'
import type { PagoServicio } from '../lib/supabase'

type ServicioBasico = {
  numero_orden: number
  fallecido_nombre: string
  importe_servicio: number | null
}

export function generarComprobantePago(
  pago: PagoServicio,
  servicio: ServicioBasico,
  saldoRestante: number,
) {
  // A5 landscape = 210×148mm → media hoja A4, 2 comprobantes por hoja al imprimir
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' })
  const W = 210
  const margin = 12

  let y = margin

  function line(text: string, size = 9, align: 'left' | 'center' | 'right' = 'left', bold = false) {
    pdf.setFontSize(size)
    pdf.setFont('helvetica', bold ? 'bold' : 'normal')
    if (align === 'center') {
      pdf.text(text, W / 2, y, { align: 'center' })
    } else if (align === 'right') {
      pdf.text(text, W - margin, y, { align: 'right' })
    } else {
      pdf.text(text, margin, y)
    }
    y += size * 0.42
  }

  function skip(mm = 2) { y += mm }

  function rule() {
    pdf.setDrawColor(180)
    pdf.setLineWidth(0.3)
    pdf.line(margin, y, W - margin, y)
    y += 3
  }

  function row(label: string, value: string) {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text(label, margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(value, margin + 40, y)
    y += 5
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  line('EMPRESA PARAÍSO DE PAZ', 13, 'center', true)
  skip(1)
  line('"Hacemos más fácil, tus momentos difíciles"', 7, 'center')
  skip(1)
  line('Av. Martín Fierro N° 3282 — Posadas, Misiones  |  Tel: (0376) 4475785', 7, 'center')
  skip(3)
  rule()

  // ── Título ───────────────────────────────────────────────────────────────────
  line('COMPROBANTE DE PAGO', 12, 'center', true)
  skip(1)
  line(`N° ${String(pago.comprobante_nro).padStart(6, '0')}`, 10, 'center')
  skip(3)
  rule()

  // ── Datos del servicio ───────────────────────────────────────────────────────
  const fechaPago = new Date(pago.fecha_pago)
  const fechaStr = fechaPago.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const horaStr = fechaPago.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  row('Fecha y hora:', `${fechaStr} — ${horaStr}`)
  row('Orden de servicio:', `N° ${servicio.numero_orden}`)
  row('Fallecido:', servicio.fallecido_nombre)
  if (servicio.importe_servicio) {
    row('Importe total servicio:', `$ ${formatMonto(servicio.importe_servicio)}`)
  }

  skip(1)
  rule()

  // ── Detalle del pago ─────────────────────────────────────────────────────────
  line('DETALLE DEL PAGO', 9, 'left', true)
  skip(2)
  row('Forma de pago:', pago.forma_pago)
  if (pago.observacion) row('Observación:', pago.observacion)

  skip(1)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Monto recibido:', margin, y)
  pdf.text(`$ ${formatMonto(pago.monto)}`, W - margin, y, { align: 'right' })
  y += 7

  rule()

  // ── Saldo ────────────────────────────────────────────────────────────────────
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  const saldoColor = saldoRestante <= 0 ? [22, 101, 52] : [180, 90, 0]
  pdf.setTextColor(saldoColor[0], saldoColor[1], saldoColor[2])
  pdf.text('Saldo restante:', margin, y)
  pdf.text(
    saldoRestante <= 0 ? 'CANCELADO' : `$ ${formatMonto(saldoRestante)}`,
    W - margin, y, { align: 'right' }
  )
  pdf.setTextColor(0, 0, 0)
  y += 7
  rule()

  // ── Firma ────────────────────────────────────────────────────────────────────
  skip(5)
  pdf.setLineWidth(0.4)
  pdf.setDrawColor(100)
  const lineX = W / 2
  pdf.line(lineX - 30, y, lineX + 30, y)
  y += 4
  line('Firma y sello', 7, 'center')
  y += 1
  line('Paraíso de Paz', 7, 'center')

  const url = pdf.output('bloburl')
  window.open(url as unknown as string, '_blank')
}
