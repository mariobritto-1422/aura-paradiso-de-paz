import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) — calibrado 2026-05-19 ────────

const C = {
  // SOLICITUD — solicitante (deudo)
  sol_nombre:     { x: 97.2,  y: 43.6 },
  sol_domicilio:  { x: 31.8,  y: 49 },
  sol_nro:        { x: 92.6,  y: 49.1 },
  sol_localidad:  { x: 121.8, y: 49 },
  sol_prov:       { x: 174.8, y: 49.3 },
  sol_tel:        { x: 18.2,  y: 54.5 },
  sol_dni:        { x: 141.6, y: 55 },

  // SOLICITUD — fallecido
  fall_nombre:       { x: 60.1,  y: 60.2 },
  fall_dni:          { x: 28.1,  y: 65.9 },
  fall_tomo:         { x: 89.7,  y: 66 },
  fall_acta:         { x: 116,   y: 65.9 },
  fecha_crem_dia:    { x: 150.3, y: 65.9 },
  fecha_crem_mes:    { x: 162.2, y: 66.4 },
  fecha_crem_anio:   { x: 191.5, y: 66.5 },

  // Tipo de cremación
  cb_crem_voluntaria:  { x: 73.2, y: 75.9 },
  cb_crem_op_integra:  { x: 73.4, y: 83.4 },
  cb_crem_op_reducida: { x: 73.4, y: 90.8 },
  horario:             { x: 172.3, y: 74.4 },

  // SOLICITUD — firma/aclaración del solicitante
  aclaracion_sol:    { x: 134.9, y: 91 },

  // AUTORIZACIÓN — nombre del fallecido y presencia
  aut_nombre:        { x: 15,    y: 120.7 },
  cb_presencia_si:   { x: 54.9,  y: 128 },
  cb_presencia_no:   { x: 55.1,  y: 133.7 },
  aclaracion_aut:    { x: 131.6, y: 133.4 },

  // DDJJ — declarante (deudo)
  ddjj_nombre:       { x: 40.2,  y: 151.3 },
  ddjj_dni:          { x: 48.9,  y: 157.8 },
  ddjj_domicilio:    { x: 106.3, y: 157.8 },
  ddjj_nro:          { x: 16.1,  y: 163.6 },
  ddjj_depto:        { x: 46.8,  y: 163.6 },
  ddjj_localidad:    { x: 88.8,  y: 163.3 },
  ddjj_provincia:    { x: 136.7, y: 163.6 },

  // DDJJ — extinto y fecha de deceso
  ddjj_relacion:     { x: 33.9,  y: 169.3 },
  ddjj_fall_nombre:  { x: 170.6, y: 168.8 },
  ddjj_fall_nombre2: { x: 11.9,  y: 174.7 },
  ddjj_dec_dia:      { x: 120.6, y: 174.7 },
  ddjj_dec_mes:      { x: 132.5, y: 174.7 },
  ddjj_dec_anio:     { x: 145.1, y: 174.7 },
  cementerio:        { x: 12.4,  y: 180.2 },
  destino:           { x: 98.2,  y: 180.2 },

  // DDJJ — firma principal
  aclaracion_ddjj:   { x: 120.2, y: 198.1 },

  // TESTIGOS — primera firma (deudo como primer testigo)
  testigo1_acl:      { x: 55.1,  y: 214.3 },
  testigo1_par:      { x: 55.2,  y: 220 },

  // RETIRO DE CENIZAS
  retiro_fecha_dia:  { x: 91.8,  y: 239.2 },
  retiro_fecha_mes:  { x: 115.2, y: 239.2 },
  retiro_fecha_anio: { x: 161.1, y: 239.2 },
  retiro_fallecido:  { x: 41.9,  y: 245.3 },
  retiro_receptor:   { x: 30.1,  y: 251.2 },
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
  txt(pdf, deudoNombre,            C.sol_nombre.x,      C.sol_nombre.y)
  txt(pdf, 'Posadas',              C.sol_localidad.x,   C.sol_localidad.y)
  txt(pdf, 'Misiones',             C.sol_prov.x,        C.sol_prov.y)
  if (s.deudo) {
    txt(pdf, s.deudo.domicilio ?? '',  C.sol_domicilio.x,  C.sol_domicilio.y)
    txt(pdf, s.deudo.telefono ?? '',   C.sol_tel.x,        C.sol_tel.y)
    txt(pdf, s.deudo.dni ?? '',        C.sol_dni.x,        C.sol_dni.y)
  }
  txt(pdf, s.fallecido_nombre,     C.fall_nombre.x,     C.fall_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',  C.fall_dni.x,        C.fall_dni.y)

  // Tipo de cremación
  const ts = (s.tipo_servicio ?? '').toLowerCase()
  if (ts.includes('voluntaria'))                              txt(pdf, 'X', C.cb_crem_voluntaria.x,  C.cb_crem_voluntaria.y)
  else if (ts.includes('íntegra') || ts.includes('integra')) txt(pdf, 'X', C.cb_crem_op_integra.x,  C.cb_crem_op_integra.y)
  else if (ts.includes('reducida'))                          txt(pdf, 'X', C.cb_crem_op_reducida.x, C.cb_crem_op_reducida.y)

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
    txt(pdf, s.deudo.dni ?? '',         C.ddjj_dni.x,         C.ddjj_dni.y)
    txt(pdf, s.deudo.domicilio ?? '',   C.ddjj_domicilio.x,   C.ddjj_domicilio.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '', C.ddjj_relacion.x, C.ddjj_relacion.y)
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
