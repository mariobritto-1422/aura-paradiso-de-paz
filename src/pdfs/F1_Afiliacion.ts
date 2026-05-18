import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) — calibrado 2026-05-15 ──────────────────

const C = {
  // Fallecido
  fall_apellido:   { x: 37.9,  y: 38.9 },
  fall_nombres:    { x: 115.5, y: 38.5 },
  fall_edad:       { x: 27.3,  y: 43.8 },
  fall_dni:        { x: 65.2,  y: 43.6 },

  // Responsable
  resp_apellido:   { x: 38.3,  y: 56 },
  resp_nombres:    { x: 125.7, y: 55.6 },
  resp_dni:        { x: 30.8,  y: 61.6 },
  resp_parentesco: { x: 147,   y: 61.4 },
  resp_domicilio:  { x: 109.8, y: 67.6 },
  resp_tel:        { x: 44.7,  y: 73.7 },
  resp_celular:    { x: 116.4, y: 73.5 },
  resp_email:      { x: 57.3,  y: 78.5 },

  // Servicio
  servicio:        { x: 48.9,  y: 103.8 },

  // Firmas
  firma_responsable: { x: 56.8,  y: 221.4 },
  firma_empresa:     { x: 155.2, y: 221.9 },

  // Recepción
  recibido_dia:  { x: 43.3,  y: 239.5 },
  recibido_mes:  { x: 74.6,  y: 239.5 },
  recibido_anio: { x: 123.4, y: 239.1 },
  siendo_las:    { x: 162.2, y: 238.8 },

  // Sepultura
  fosa:   { x: 57.8,  y: 249.9 },
  tablon: { x: 86.7,  y: 250 },
  sector: { x: 111.5, y: 250 },
  nicho:  { x: 150.3, y: 250 },

  // Agente
  agente:              { x: 53.1,  y: 261.3 },
  firma_agente:        { x: 121.3, y: 260.1 },
  fecha_pantalla:      { x: 64.1,  y: 270.3 },
  firma_aclaracion:    { x: 169.2, y: 270.3 },
}

function calcularEdad(fechaNac: string | null | undefined, fechaRef: string | null | undefined): string {
  if (!fechaNac) return ''
  const nac = new Date(fechaNac)
  const ref = fechaRef ? new Date(fechaRef) : new Date()
  let edad = ref.getFullYear() - nac.getFullYear()
  const m = ref.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < nac.getDate())) edad--
  return String(edad)
}

function generarF1(pdf: jsPDF, s: ServicioConDeudo) {
  const fechaDoc = s.created_at ? new Date(s.created_at) : new Date()
  const dia  = String(fechaDoc.getDate()).padStart(2, '0')
  const mes  = fechaDoc.toLocaleString('es-AR', { month: 'long' })
  const anio = String(fechaDoc.getFullYear())

  // Fallecido
  const partes = s.fallecido_nombre.split(',')
  txt(pdf, partes[0]?.trim() ?? s.fallecido_nombre, C.fall_apellido.x, C.fall_apellido.y)
  txt(pdf, partes[1]?.trim() ?? '',                  C.fall_nombres.x,  C.fall_nombres.y)
  txt(pdf, calcularEdad(s.fallecido_fecha_nacimiento, s.fallecido_fecha_deceso), C.fall_edad.x, C.fall_edad.y)
  txt(pdf, s.fallecido_dni ?? '',                    C.fall_dni.x,      C.fall_dni.y)

  // Responsable (solicitante = deudo principal)
  const resp = s.deudo
  if (resp) {
    const dPartes = (resp.nombre ?? '').split(',')
    txt(pdf, dPartes[0]?.trim() ?? resp.nombre ?? '', C.resp_apellido.x,   C.resp_apellido.y)
    txt(pdf, dPartes[1]?.trim() ?? '',                 C.resp_nombres.x,    C.resp_nombres.y)
    txt(pdf, resp.dni                  ?? '',           C.resp_dni.x,        C.resp_dni.y)
    txt(pdf, resp.relacion_fallecido   ?? '',           C.resp_parentesco.x, C.resp_parentesco.y)
    txt(pdf, resp.domicilio            ?? '',           C.resp_domicilio.x,  C.resp_domicilio.y)
    txt(pdf, resp.telefono             ?? '',           C.resp_tel.x,        C.resp_tel.y)
    txt(pdf, resp.whatsapp ?? resp.telefono ?? '',      C.resp_celular.x,    C.resp_celular.y)
    txt(pdf, resp.email                ?? '',           C.resp_email.x,      C.resp_email.y)
  }

  // Tipo de servicio
  txt(pdf, s.tipo_servicio ?? '', C.servicio.x, C.servicio.y)

  // Fecha de recepción
  txt(pdf, dia,  C.recibido_dia.x,  C.recibido_dia.y)
  txt(pdf, mes,  C.recibido_mes.x,  C.recibido_mes.y)
  txt(pdf, anio, C.recibido_anio.x, C.recibido_anio.y)
}

export const F1_INFO: FormularioInfo = {
  id: 'F1',
  nombre: 'Ficha Registro Ingreso Difuntos — Cementerio La Piedad',
  imagen: '/formularios/paz_1.png',
  generarFn: generarF1,
}
