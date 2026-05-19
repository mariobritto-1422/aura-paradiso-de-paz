import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) — calibrado 2026-05-19 ──────────────────

const C = {
  // Fallecido
  fall_apellido:   { x: 41.9,  y: 39.4 },
  fall_nombres:    { x: 118.1, y: 39.8 },
  fall_edad:       { x: 29.7,  y: 44.9 },
  fall_dni:        { x: 67.1,  y: 44.7 },

  // Responsable
  resp_apellido:   { x: 41.6,  y: 56.7 },
  resp_nombres:    { x: 129.3, y: 56.7 },
  resp_dni:        { x: 31.3,  y: 62.8 },
  resp_parentesco: { x: 148.7, y: 62.6 },
  resp_domicilio:  { x: 111.2, y: 68.6 },
  resp_tel:        { x: 46.1,  y: 74.8 },
  resp_celular:    { x: 119,   y: 74.6 },
  resp_email:      { x: 60.1,  y: 79.5 },

  // Servicio
  servicio:        { x: 69.2,  y: 105 },

  // Firmas
  firma_responsable: { x: 56.8,  y: 221.4 },
  firma_empresa:     { x: 155.2, y: 221.9 },

  // Recepción
  recibido_dia:  { x: 44,    y: 240.7 },
  recibido_mes:  { x: 76.7,  y: 240.4 },
  recibido_anio: { x: 125.1, y: 240.2 },
  siendo_las:    { x: 163.6, y: 240.2 },

  // Sepultura
  fosa:   { x: 59.2,  y: 251.3 },
  tablon: { x: 87.4,  y: 251.1 },
  sector: { x: 112,   y: 250.9 },
  nicho:  { x: 153.8, y: 250.6 },

  // Agente
  agente:              { x: 55.8,  y: 262.2 },
  firma_agente:        { x: 121.3, y: 260.1 },
  fecha_pantalla_dia:  { x: 66.9,  y: 272.2 },
  fecha_pantalla_mes:  { x: 79.2,  y: 272.4 },
  fecha_pantalla_anio: { x: 93,    y: 271.9 },
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

  // Asesor
  txt(pdf, s.asesor ?? '', C.agente.x, C.agente.y)

  // Fecha grabada en pantalla (= fecha del servicio)
  const fs = s.fecha_servicio ? new Date(s.fecha_servicio) : fechaDoc
  txt(pdf, String(fs.getDate()).padStart(2, '0'),    C.fecha_pantalla_dia.x,  C.fecha_pantalla_dia.y)
  txt(pdf, String(fs.getMonth() + 1).padStart(2, '0'), C.fecha_pantalla_mes.x, C.fecha_pantalla_mes.y)
  txt(pdf, String(fs.getFullYear()).slice(2),         C.fecha_pantalla_anio.x, C.fecha_pantalla_anio.y)
}

export const F1_INFO: FormularioInfo = {
  id: 'F1',
  nombre: 'Ficha Registro Ingreso Difuntos — Cementerio La Piedad',
  imagen: '/formularios/paz_1.png',
  generarFn: generarF1,
}
