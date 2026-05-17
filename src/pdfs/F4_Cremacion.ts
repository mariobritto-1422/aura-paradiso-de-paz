import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) ────────────────────────────────

const C = {
  // SOLICITUD — solicitante (deudo)
  sol_domicilio:  { x: 29.2,  y: 47.3 },
  sol_localidad:  { x: 118.8, y: 47.7 },
  sol_prov:       { x: 172.3, y: 48.2 },
  sol_tel:        { x: 16.1,  y: 53.5 },
  sol_dni:        { x: 140,   y: 54 },

  // SOLICITUD — fallecido
  fall_nombre:       { x: 55.6,  y: 59.4 },
  fecha_crem_dia:    { x: 148.9, y: 64.9 },
  fecha_crem_mes:    { x: 161,   y: 64.9 },
  fecha_crem_anio:   { x: 190.7, y: 65.2 },
  horario:           { x: 171.8, y: 72.7 },

  // SOLICITUD — firma/aclaración del solicitante
  aclaracion_sol:    { x: 134.9, y: 91 },

  // AUTORIZACIÓN — nombre del fallecido y presencia
  aut_nombre:        { x: 171.3, y: 113.2 },
  cb_presencia_si:   { x: 54.9,  y: 126.7 },
  cb_presencia_no:   { x: 55.1,  y: 132.4 },
  aclaracion_aut:    { x: 131.6, y: 133.4 },

  // DDJJ — declarante (deudo)
  ddjj_nombre:       { x: 33.7,  y: 150.3 },
  ddjj_dni:          { x: 47.5,  y: 156.2 },
  ddjj_localidad:    { x: 85.8,  y: 162.8 },
  ddjj_provincia:    { x: 134.9, y: 162.7 },

  // DDJJ — extinto y fecha de deceso
  ddjj_fall_nombre:  { x: 168.5, y: 167.9 },
  ddjj_dec_dia:      { x: 113.9, y: 173.4 },
  ddjj_dec_mes:      { x: 132.1, y: 173.5 },
  ddjj_dec_anio:     { x: 146.1, y: 173.2 },
  cementerio:        { x: 10.3,  y: 179.4 },

  // DDJJ — firma principal
  aclaracion_ddjj:   { x: 120.2, y: 198.1 },

  // TESTIGOS — primera firma (deudo como primer testigo)
  testigo1_acl:      { x: 55.1,  y: 214.3 },
  testigo1_par:      { x: 55.2,  y: 220 },

  // RETIRO DE CENIZAS
  retiro_fecha_dia:  { x: 90.9,  y: 238 },
  retiro_fecha_mes:  { x: 112.9, y: 238 },
  retiro_fecha_anio: { x: 161.1, y: 238 },
  retiro_fallecido:  { x: 39.7,  y: 244.5 },
  retiro_receptor:   { x: 27.3,  y: 250.2 },
  retiro_aclaracion: { x: 117.3, y: 260.7 },
}

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const MESES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
]

function parseFecha(fechaStr: string | null | undefined) {
  if (!fechaStr) return { dia: '', mes: '', anio: '' }
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return { dia: '', mes: '', anio: '' }
  return {
    dia:  String(d.getUTCDate()),
    mes:  MESES[d.getUTCMonth()],
    anio: String(d.getUTCFullYear()).slice(2),
  }
}

// ─── Generador ────────────────────────────────────────────────────────────────

function generarF4(pdf: jsPDF, s: ServicioConDeudo) {
  const fc = parseFecha(s.fecha_servicio ?? s.created_at)
  const fd = parseFecha(s.fallecido_fecha_deceso)
  const deudoNombre = s.deudo?.nombre ?? ''

  // — SOLICITUD —
  txt(pdf, 'Posadas',              C.sol_localidad.x,   C.sol_localidad.y)
  txt(pdf, 'Misiones',             C.sol_prov.x,        C.sol_prov.y)
  if (s.deudo) {
    txt(pdf, s.deudo.telefono ?? '', C.sol_tel.x,  C.sol_tel.y)
    txt(pdf, s.deudo.dni ?? '',      C.sol_dni.x,  C.sol_dni.y)
  }
  txt(pdf, s.fallecido_nombre,     C.fall_nombre.x,     C.fall_nombre.y)
  txt(pdf, fc.dia,                 C.fecha_crem_dia.x,  C.fecha_crem_dia.y)
  txt(pdf, fc.mes,                 C.fecha_crem_mes.x,  C.fecha_crem_mes.y)
  txt(pdf, fc.anio,                C.fecha_crem_anio.x, C.fecha_crem_anio.y)
  txt(pdf, deudoNombre,            C.aclaracion_sol.x,  C.aclaracion_sol.y)

  // — AUTORIZACIÓN —
  txt(pdf, s.fallecido_nombre,     C.aut_nombre.x,      C.aut_nombre.y)
  checkbox(pdf, false,             C.cb_presencia_si.x, C.cb_presencia_si.y)
  checkbox(pdf, true,              C.cb_presencia_no.x, C.cb_presencia_no.y)
  txt(pdf, deudoNombre,            C.aclaracion_aut.x,  C.aclaracion_aut.y)

  // — DDJJ —
  txt(pdf, deudoNombre,            C.ddjj_nombre.x,       C.ddjj_nombre.y)
  if (s.deudo) {
    txt(pdf, s.deudo.dni ?? '',    C.ddjj_dni.x,          C.ddjj_dni.y)
  }
  txt(pdf, 'Posadas',              C.ddjj_localidad.x,    C.ddjj_localidad.y)
  txt(pdf, 'Misiones',             C.ddjj_provincia.x,    C.ddjj_provincia.y)
  txt(pdf, s.fallecido_nombre,     C.ddjj_fall_nombre.x,  C.ddjj_fall_nombre.y)
  txt(pdf, fd.dia,                 C.ddjj_dec_dia.x,      C.ddjj_dec_dia.y)
  txt(pdf, fd.mes,                 C.ddjj_dec_mes.x,      C.ddjj_dec_mes.y)
  txt(pdf, fd.anio,                C.ddjj_dec_anio.x,     C.ddjj_dec_anio.y)
  txt(pdf, s.destino_final ?? '',  C.cementerio.x,        C.cementerio.y)
  txt(pdf, deudoNombre,            C.aclaracion_ddjj.x,   C.aclaracion_ddjj.y)

  // — TESTIGOS (primer testigo = deudo) —
  txt(pdf, deudoNombre,                          C.testigo1_acl.x, C.testigo1_acl.y)
  txt(pdf, s.deudo?.relacion_fallecido ?? '',    C.testigo1_par.x, C.testigo1_par.y)

  // — RETIRO DE CENIZAS —
  txt(pdf, s.fallecido_nombre,     C.retiro_fallecido.x,   C.retiro_fallecido.y)
  txt(pdf, deudoNombre,            C.retiro_receptor.x,    C.retiro_receptor.y)
  txt(pdf, deudoNombre,            C.retiro_aclaracion.x,  C.retiro_aclaracion.y)
}

export const F4_INFO: FormularioInfo = {
  id: 'F4',
  nombre: 'Solicitud de Cremación + Autorización + DDJJ',
  imagen: '/formularios/paz_4.png',
  generarFn: generarF4,
}
