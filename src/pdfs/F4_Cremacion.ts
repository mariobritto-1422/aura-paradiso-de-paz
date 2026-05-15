import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox, formatFecha } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────

const C = {
  // Solicitante — primera línea
  sol_domicilio: { x: 33,  y: 50 },
  sol_localidad: { x: 92,  y: 50 },
  sol_prov:      { x: 159, y: 50 },

  // Segunda línea — Tel y DNI
  sol_tel: { x: 18,  y: 58 },
  sol_dni: { x: 110, y: 58 },

  // Nombre del fallecido (cremación de los restos de Don/ña)
  fall_nombre: { x: 50, y: 64 },

  // TOMO / ACTA / Fecha cremación
  tomo:           { x: 85,  y: 70 },
  acta:           { x: 111, y: 70 },
  fecha_cremacion:{ x: 147, y: 70 },

  // Tipo de cremación (tabla, col izquierda)
  // Fila 1: VOLUNTARIAS
  // Fila 2: OPERATIVAS INTEGRALES
  // Fila 3: OPERATIVAS REDUCIDAS
  // Se marca con X en la columna del número de fila
  cb_tipo_1: { x: 8, y: 80 },
  cb_tipo_2: { x: 8, y: 88 },
  cb_tipo_3: { x: 8, y: 96 },

  horario: { x: 165, y: 82 },

  // AUTORIZACIÓN — nombre del fallecido
  aut_nombre: { x: 130, y: 148 },

  // Presencia en cremación
  cb_presencia_si: { x: 63, y: 158 },
  cb_presencia_no: { x: 63, y: 166 },

  // DECLARACIÓN JURADA — declarante
  ddjj_nombre:     { x: 37,  y: 188 },
  ddjj_dni:        { x: 115, y: 194 },
  ddjj_parentesco: { x: 63,  y: 200 },
  ddjj_localidad:  { x: 70,  y: 206 },

  // RETIRO DE CENIZAS
  retiro_fallecido: { x: 40, y: 260 },
}

function generarF4(pdf: jsPDF, s: ServicioConDeudo) {
  // Solicitante = deudo
  if (s.deudo) {
    txt(pdf, s.deudo.telefono ?? '', C.sol_tel.x,  C.sol_tel.y)
    txt(pdf, s.deudo.dni ?? '',      C.sol_dni.x,  C.sol_dni.y)
  }
  txt(pdf, 'Posadas', C.sol_localidad.x, C.sol_localidad.y)
  txt(pdf, 'Misiones', C.sol_prov.x,     C.sol_prov.y)

  // Fallecido
  txt(pdf, s.fallecido_nombre, C.fall_nombre.x, C.fall_nombre.y)
  txt(pdf, formatFecha(s.fecha_servicio), C.fecha_cremacion.x, C.fecha_cremacion.y)

  // Tipo 2 — Operativa Integral (por defecto)
  checkbox(pdf, true, C.cb_tipo_2.x, C.cb_tipo_2.y)

  // AUTORIZACIÓN
  txt(pdf, s.fallecido_nombre, C.aut_nombre.x, C.aut_nombre.y)

  // Presencia NO por defecto
  checkbox(pdf, false, C.cb_presencia_si.x, C.cb_presencia_si.y)
  checkbox(pdf, true,  C.cb_presencia_no.x, C.cb_presencia_no.y)

  // DDJJ = deudo
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',              C.ddjj_nombre.x,     C.ddjj_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                 C.ddjj_dni.x,        C.ddjj_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',  C.ddjj_parentesco.x, C.ddjj_parentesco.y)
  }
  txt(pdf, 'Posadas', C.ddjj_localidad.x, C.ddjj_localidad.y)

  // Retiro de cenizas — nombre fallecido
  txt(pdf, s.fallecido_nombre, C.retiro_fallecido.x, C.retiro_fallecido.y)
}

export const F4_INFO: FormularioInfo = {
  id: 'F4',
  nombre: 'Solicitud de Cremación + Autorización + DDJJ',
  imagen: '/formularios/paz_4.png',
  generarFn: generarF4,
}
