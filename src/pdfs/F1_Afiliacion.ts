import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────

const C = {
  // "Posadas,...de....................20....."
  posadas_mes:  { x: 110, y: 55 },
  posadas_anio: { x: 170, y: 55 },

  // Titular
  apellido:    { x: 27, y: 66 },
  nombre:      { x: 110, y: 66 },
  dni:         { x: 25, y: 72 },
  domicilio:   { x: 30, y: 79 },
  barrio:      { x: 110, y: 86 },
  localidad:   { x: 110, y: 86 },
  tel:         { x: 25, y: 92 },
  profesion:   { x: 75, y: 92 },
  obra_social: { x: 30, y: 99 },

  // Plan contratado
  cb_sepelio:   { x: 92,  y: 108 },
  cb_cremacion: { x: 150, y: 108 },
}

function generarF1(pdf: jsPDF, s: ServicioConDeudo) {
  const fechaDoc = s.created_at ? new Date(s.created_at) : new Date()

  txt(pdf, fechaDoc.toLocaleString('es-AR', { month: 'long' }), C.posadas_mes.x,  C.posadas_mes.y)
  txt(pdf, String(fechaDoc.getFullYear()),                        C.posadas_anio.x, C.posadas_anio.y)

  const partes = s.fallecido_nombre.split(',')
  txt(pdf, partes[0]?.trim() ?? s.fallecido_nombre, C.apellido.x, C.apellido.y)
  txt(pdf, partes[1]?.trim() ?? '',                  C.nombre.x,   C.nombre.y)
  txt(pdf, s.fallecido_dni ?? '',                    C.dni.x,      C.dni.y)
  txt(pdf, s.fallecido_obra_social ?? '',            C.obra_social.x, C.obra_social.y)
  txt(pdf, s.fallecido_profesion ?? '',              C.profesion.x,   C.profesion.y)
  txt(pdf, 'Posadas',                                C.localidad.x,   C.localidad.y)

  if (s.deudo) {
    txt(pdf, s.deudo.telefono ?? '', C.tel.x, C.tel.y)
  }

  // Plan — Sepelio por defecto para afiliación
  checkbox(pdf, true,  C.cb_sepelio.x,   C.cb_sepelio.y)
  checkbox(pdf, false, C.cb_cremacion.x, C.cb_cremacion.y)
}

export const F1_INFO: FormularioInfo = {
  id: 'F1',
  nombre: 'Solicitud de Afiliación',
  imagen: '/formularios/paz_1.png',
  generarFn: generarF1,
}
