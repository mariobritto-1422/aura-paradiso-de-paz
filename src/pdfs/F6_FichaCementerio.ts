import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) ────────────────────────────────

const C = {
  // Fecha encabezado (fecha servicio)
  fecha_dia:       { x: 62.2,  y: 47.6 },
  fecha_mes:       { x: 71.8,  y: 47.6 },
  fecha_anio:      { x: 83,    y: 47.4 },

  // Datos del fallecido
  fall_nombre:       { x: 47.9,  y: 52.7 },
  fall_dni:          { x: 156.6, y: 52.3 },
  fall_fecha_nac:    { x: 53.5,  y: 57.6 },
  fall_ciudad:       { x: 28,    y: 62.8 },
  fall_nacionalidad: { x: 101,   y: 63 },
  fall_estado_civil: { x: 165,   y: 62.8 },
  fall_religion:     { x: 28.5,  y: 68.7 },
  fall_profesion:    { x: 136.5, y: 68.2 },
  fall_obra_social:  { x: 30.1,  y: 74.2 },
  fall_beneficio:    { x: 118.8, y: 73.8 },
  fall_lugar_deceso: { x: 50.3,  y: 79.6 },
  fall_dec_dia:      { x: 136.1, y: 79.5 },
  fall_dec_mes:      { x: 148.4, y: 79.2 },
  fall_dec_anio:     { x: 160.1, y: 79.4 },
  fall_dec_hora:     { x: 182.6, y: 79.2 },

  // Características del servicio
  ataud_tipo:      { x: 23.8,  y: 94.9 },
  ataud_medida:    { x: 98.6,  y: 94.6 },
  cb_tierra:       { x: 128.8, y: 95.5 },
  cb_nicho:        { x: 159,   y: 95.6 },
  cb_cremacion:    { x: 197.3, y: 95.3 },

  cb_sala_eterno:  { x: 57.5,  y: 101.2 },
  cb_sala_paraiso: { x: 121.6, y: 101.2 },
  cb_sala_fenix:   { x: 197.5, y: 101 },

  capilla_ardiente: { x: 46,    y: 107.2 },
  hora_inicio:      { x: 164.3, y: 105.6 },

  cb_tanatostetica: { x: 44.4,  y: 118.4 },
  cb_tanatopraxia:  { x: 84.9,  y: 118.2 },

  cb_furgon:        { x: 52.3,  y: 131.3 },
  cb_coche_escolta: { x: 190.7, y: 130.8 },

  destino_final:    { x: 38.6,  y: 139.5 },
  serv_fecha_dia:   { x: 147.7, y: 139.3 },
  serv_fecha_mes:   { x: 156.1, y: 139.3 },
  serv_fecha_anio:  { x: 164.1, y: 139.5 },
  serv_hora:        { x: 184.7, y: 139.3 },

  // Documentación — ORIGINAL (x≈83) y COPIA (x≈102)
  doc_acta_orig:   { x: 83.4,  y: 176.7 }, doc_acta_cop:  { x: 102.8, y: 176.6 },
  doc_lib_orig:    { x: 83.5,  y: 180.9 }, doc_lib_cop:   { x: 102.9, y: 181.1 },
  doc_rec_orig:    { x: 83.4,  y: 185.7 }, doc_rec_cop:   { x: 102.8, y: 185.7 },
  doc_fac_orig:    { x: 83.5,  y: 189.7 }, doc_fac_cop:   { x: 102.8, y: 189.7 },
  doc_cen_orig:    { x: 83.5,  y: 194.1 }, doc_cen_cop:   { x: 102.8, y: 194.1 },
  doc_car_orig:    { x: 83.9,  y: 198.8 }, doc_car_cop:   { x: 102.8, y: 198.6 },
  doc_otr_orig:    { x: 83.5,  y: 203 },   doc_otr_cop:   { x: 102.8, y: 202.8 },

  // Fecha y firma (columna derecha)
  firma_ciudad:    { x: 147.3, y: 171 },
  firma_mes:       { x: 162,   y: 170.8 },
  firma_anio:      { x: 192.9, y: 171 },
  solicitante:     { x: 144,   y: 179.2 },
  contacto:        { x: 144.2, y: 185.1 },

  // Asesor
  asesor:          { x: 53.7,  y: 212.6 },

  // Deudo principal
  deudo_nombre:    { x: 49.1,  y: 224.9 },
  deudo_dni:       { x: 25.3,  y: 230.3 },
  deudo_cel:       { x: 149.6, y: 229.4 },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MESES_CORTOS = ['01','02','03','04','05','06','07','08','09','10','11','12']
const MESES_LARGO  = ['enero','febrero','marzo','abril','mayo','junio',
                      'julio','agosto','septiembre','octubre','noviembre','diciembre']

function splitFecha(fechaStr: string | null | undefined) {
  if (!fechaStr) return { dia: '', mes: '', anio: '', hora: '', mesLargo: '' }
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return { dia: '', mes: '', anio: '', hora: '', mesLargo: '' }
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return {
    dia:      String(d.getUTCDate()).padStart(2, '0'),
    mes:      MESES_CORTOS[d.getUTCMonth()],
    anio:     String(d.getUTCFullYear()).slice(2),
    hora:     `${h}:${m}`,
    mesLargo: MESES_LARGO[d.getUTCMonth()],
  }
}

// Pone una X si la condición es verdadera
function X(pdf: jsPDF, cond: boolean | undefined, x: number, y: number) {
  if (cond) txt(pdf, 'X', x, y)
}

// ─── Generador ────────────────────────────────────────────────────────────────

function generarF6(pdf: jsPDF, s: ServicioConDeudo) {
  const fs  = splitFecha(s.fecha_servicio)
  const fd  = splitFecha(s.fallecido_fecha_deceso)
  const doc = s.documentacion
  const hoy = new Date()
  const sala = (s.sala ?? '').toLowerCase()

  // — Fecha encabezado —
  txt(pdf, fs.dia,  C.fecha_dia.x,  C.fecha_dia.y)
  txt(pdf, fs.mes,  C.fecha_mes.x,  C.fecha_mes.y)
  txt(pdf, fs.anio, C.fecha_anio.x, C.fecha_anio.y)

  // — Fallecido —
  txt(pdf, s.fallecido_nombre,              C.fall_nombre.x,       C.fall_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',           C.fall_dni.x,          C.fall_dni.y)
  txt(pdf, formatFecha(s.fallecido_fecha_nacimiento), C.fall_fecha_nac.x, C.fall_fecha_nac.y)
  txt(pdf, 'Posadas',                       C.fall_ciudad.x,       C.fall_ciudad.y)
  txt(pdf, s.fallecido_nacionalidad ?? '',  C.fall_nacionalidad.x, C.fall_nacionalidad.y)
  txt(pdf, s.fallecido_estado_civil ?? '',  C.fall_estado_civil.x, C.fall_estado_civil.y)
  txt(pdf, s.fallecido_religion ?? '',      C.fall_religion.x,     C.fall_religion.y)
  txt(pdf, s.fallecido_profesion ?? '',     C.fall_profesion.x,    C.fall_profesion.y)
  txt(pdf, s.fallecido_obra_social ?? '',   C.fall_obra_social.x,  C.fall_obra_social.y)
  txt(pdf, s.fallecido_beneficio_nro ?? '', C.fall_beneficio.x,    C.fall_beneficio.y)
  txt(pdf, s.fallecido_lugar_deceso ?? '',  C.fall_lugar_deceso.x, C.fall_lugar_deceso.y)
  txt(pdf, fd.dia,                          C.fall_dec_dia.x,      C.fall_dec_dia.y)
  txt(pdf, fd.mes,                          C.fall_dec_mes.x,      C.fall_dec_mes.y)
  txt(pdf, fd.anio,                         C.fall_dec_anio.x,     C.fall_dec_anio.y)
  txt(pdf, fd.hora,                         C.fall_dec_hora.x,     C.fall_dec_hora.y)

  // — Ataúd y tipo de entierro —
  txt(pdf, s.ataud_tipo ?? '',              C.ataud_tipo.x,    C.ataud_tipo.y)
  txt(pdf, s.ataud_medida ? String(s.ataud_medida) : '', C.ataud_medida.x, C.ataud_medida.y)
  X(pdf, s.tipo_entierro === 'Tierra',    C.cb_tierra.x,    C.cb_tierra.y)
  X(pdf, s.tipo_entierro === 'Nicho',     C.cb_nicho.x,     C.cb_nicho.y)
  X(pdf, s.tipo_entierro === 'Cremación', C.cb_cremacion.x, C.cb_cremacion.y)

  // — Sala —
  X(pdf, sala.includes('fenix') || sala.includes('fénix'),     C.cb_sala_fenix.x,   C.cb_sala_fenix.y)
  X(pdf, sala.includes('paraiso') || sala.includes('paraíso'), C.cb_sala_paraiso.x, C.cb_sala_paraiso.y)
  X(pdf, sala.includes('eterno') || sala.includes('descanso'), C.cb_sala_eterno.x,  C.cb_sala_eterno.y)

  // — Capilla y hora de inicio —
  if (s.capilla_ardiente && s.capilla_ardiente !== 'Ninguna') {
    txt(pdf, s.capilla_ardiente, C.capilla_ardiente.x, C.capilla_ardiente.y)
  }
  txt(pdf, fs.hora, C.hora_inicio.x, C.hora_inicio.y)

  // — Servicios adicionales y vehículos —
  X(pdf, s.tanatostetica,    C.cb_tanatostetica.x, C.cb_tanatostetica.y)
  X(pdf, s.tanatopraxia,     C.cb_tanatopraxia.x,  C.cb_tanatopraxia.y)
  X(pdf, s.furgon_sanitario, C.cb_furgon.x,        C.cb_furgon.y)
  X(pdf, s.coche_acompanamiento || s.coche_funebre, C.cb_coche_escolta.x, C.cb_coche_escolta.y)

  // — Destino y fecha del servicio —
  txt(pdf, s.destino_final ?? '', C.destino_final.x,  C.destino_final.y)
  txt(pdf, fs.dia,                C.serv_fecha_dia.x, C.serv_fecha_dia.y)
  txt(pdf, fs.mes,                C.serv_fecha_mes.x, C.serv_fecha_mes.y)
  txt(pdf, fs.anio,               C.serv_fecha_anio.x, C.serv_fecha_anio.y)
  txt(pdf, fs.hora,               C.serv_hora.x,      C.serv_hora.y)

  // — Documentación —
  X(pdf, doc?.acta_defuncion?.original,    C.doc_acta_orig.x, C.doc_acta_orig.y)
  X(pdf, doc?.acta_defuncion?.copia,       C.doc_acta_cop.x,  C.doc_acta_cop.y)
  X(pdf, doc?.libreta_matrimonio?.original, C.doc_lib_orig.x, C.doc_lib_orig.y)
  X(pdf, doc?.libreta_matrimonio?.copia,    C.doc_lib_cop.x,  C.doc_lib_cop.y)
  X(pdf, doc?.recibo_haberes?.original,    C.doc_rec_orig.x,  C.doc_rec_orig.y)
  X(pdf, doc?.recibo_haberes?.copia,       C.doc_rec_cop.x,   C.doc_rec_cop.y)
  X(pdf, doc?.factura?.original,           C.doc_fac_orig.x,  C.doc_fac_orig.y)
  X(pdf, doc?.factura?.copia,              C.doc_fac_cop.x,   C.doc_fac_cop.y)
  X(pdf, doc?.cenizas_cert?.original,      C.doc_cen_orig.x,  C.doc_cen_orig.y)
  X(pdf, doc?.cenizas_cert?.copia,         C.doc_cen_cop.x,   C.doc_cen_cop.y)
  X(pdf, doc?.carnet_obra_social?.original, C.doc_car_orig.x, C.doc_car_orig.y)
  X(pdf, doc?.carnet_obra_social?.copia,    C.doc_car_cop.x,  C.doc_car_cop.y)

  // — Fecha y firma (columna derecha) —
  txt(pdf, 'Posadas',                           C.firma_ciudad.x, C.firma_ciudad.y)
  txt(pdf, MESES_LARGO[hoy.getMonth()],         C.firma_mes.x,    C.firma_mes.y)
  txt(pdf, String(hoy.getFullYear()).slice(2),   C.firma_anio.x,   C.firma_anio.y)
  txt(pdf, s.deudo?.nombre ?? '',               C.solicitante.x,  C.solicitante.y)
  txt(pdf, s.deudo?.whatsapp ?? s.deudo?.telefono ?? '', C.contacto.x, C.contacto.y)

  // — Asesor —
  txt(pdf, s.asesor ?? '', C.asesor.x, C.asesor.y)

  // — Deudo principal —
  txt(pdf, s.deudo?.nombre ?? '',    C.deudo_nombre.x, C.deudo_nombre.y)
  txt(pdf, s.deudo?.dni ?? '',       C.deudo_dni.x,    C.deudo_dni.y)
  txt(pdf, s.deudo?.whatsapp ?? s.deudo?.telefono ?? '', C.deudo_cel.x, C.deudo_cel.y)
}

export const F6_INFO: FormularioInfo = {
  id: 'F6',
  nombre: 'Ficha Ingreso Cementerio La Piedad',
  imagen: '/formularios/paz_6.png',
  generarFn: generarF6,
}
