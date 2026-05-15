import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FormularioInfo = {
  id: string
  nombre: string
  imagen: string
  generarFn: (pdf: jsPDF, s: ServicioConDeudo) => void
}

// ─── Helpers de dibujo ────────────────────────────────────────────────────────

export function txt(pdf: jsPDF, valor: string | null | undefined, x: number, y: number, opts?: { size?: number; bold?: boolean }) {
  if (!valor) return
  if (opts?.bold) pdf.setFont('helvetica', 'bold')
  else pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(opts?.size ?? 9)
  pdf.text(valor, x, y)
}

export function checkbox(pdf: jsPDF, checked: boolean, x: number, y: number) {
  if (!checked) return
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text('X', x, y)
}

export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatFechaHora(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Carga imagen de fondo ────────────────────────────────────────────────────

export async function addImageBackground(pdf: jsPDF, src: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => {
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297)
      resolve()
    }
    img.onerror = () => {
      // Sin imagen disponible — continuar sin fondo
      resolve()
    }
    img.src = src
  })
}

// ─── Generar e imprimir un formulario ────────────────────────────────────────

export async function imprimirFormulario(s: ServicioConDeudo, info: FormularioInfo) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  await addImageBackground(pdf, info.imagen)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  info.generarFn(pdf, s)
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export async function imprimirTodos(s: ServicioConDeudo, formularios: FormularioInfo[]) {
  for (const info of formularios) {
    await imprimirFormulario(s, info)
  }
}

// ─── Lógica de activación ─────────────────────────────────────────────────────
// Importaciones diferidas para evitar circular — se resuelven en getFormulariosRequeridos

export function getFormulariosRequeridos(s: ServicioConDeudo): FormularioInfo[] {
  // Import dinámico síncrono no es posible; usamos el registry cargado al inicio
  return _registry.filter(f => _esRequerido(f.id, s))
}

function _esRequerido(id: string, s: ServicioConDeudo): boolean {
  const tipo = s.tipo_servicio
  const ipsm = s.fallecido_obra_social?.toUpperCase().includes('IPS') ?? false

  switch (id) {
    case 'F1': return tipo === 'Afiliación'
    case 'F2': return tipo === 'Cremación'
    case 'F3': return tipo === 'Cremación'
    case 'F4': return tipo === 'Cremación'
    case 'F5': return ipsm
    case 'F6': return tipo === 'Sepelio'
    case 'F7': return tipo !== 'Afiliación'
    default: return false
  }
}

// Se llena desde index.ts para evitar imports circulares
export const _registry: FormularioInfo[] = []
