import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) — calibrado 2026-05-19 ────────

const C = {
  // Registro (TOMO / ACTA / FOLIO)
  tomo:  { x: 154,   y: 35.5 },
  acta:  { x: 169.2, y: 35.1 },
  folio: { x: 187.9, y: 35.3 },

  // Fecha encabezado (fecha servicio)
  fecha_dia:       { x: 63.1,  y: 48.1 },
  fecha_mes:       { x: 72.7,  y: 48.4 },
  fecha_anio:      { x: 83.7,  y: 48.1 },

  // Datos del fallecido
  fall_nombre:       { x: 50.2,  y: 53.5 },
  fall_dni:          { x: 159.6, y: 53.5 },
  fall_fecha_nac:    { x: 55.2,  y: 58.9 },
  fall_domicilio:    { x: 105.6, y: 58.9 },
  fall_ciudad:       { x: 29.5,  y: 64.3 },
  fall_nacionalidad: { x: 101.9, y: 64 },
  fall_estado_civil: { x: 166.6, y: 64 },
  fall_religion:     { x: 32.2,  y: 69.6 },
  fall_profesion:    { x: 139.5, y: 69.6 },
  fall_obra_social:  { x: 32,    y: 75 },
  fall_beneficio:    { x: 126.9, y: 74.6 },
  fall_lugar_deceso: { x: 53.1,  y: 80.6 },
  fall_dec_dia:      { x: 137.5, y: 80.4 },
  fall_dec_mes:      { x: 148.7, y: 80.2 },
  fall_dec_anio:     { x: 159.6, y: 80.6 },
  fall_dec_hora:     { x: 184.9, y: 80.4 },

  // Características del servicio
  ataud_tipo:      { x: 26.7,  y: 95.6 },
  ataud_medida:    { x: 100.7, y: 95.6 },
  cb_tierra:       { x: 128.6, y: 97 },
  cb_nicho:        { x: 159.4, y: 96.9 },
  cb_cremacion:    { x: 197.8, y: 96.3 },

  cb_sala_eterno:  { x: 57.8,  y: 103 },
  cb_sala_paraiso: { x: 121.6, y: 102.6 },
  cb_sala_fenix:   { x: 197.3, y: 102.3 },

  capilla_ardiente: { x: 45.8,  y: 108.6 },
  hora_inicio:      { x: 168.5, y: 107.2 },

  cb_tanatostetica: { x: 44.4,  y: 119.6 },
  cb_tanatopraxia:  { x: 85.3,  y: 119.4 },

  cb_placa:         { x: 26.6,  y: 126 },
  cb_cruz:          { x: 69.6,  y: 125.9 },
  cb_urna_craft:    { x: 129.7, y: 125.2 },
  cb_urna:          { x: 155.4, y: 123.8 },

  cb_furgon:            { x: 52.4,  y: 132.5 },
  cb_carroza_americana: { x: 118.1, y: 132.2 },
  cb_carroza_europea:   { x: 134.4, y: 132 },
  cb_coche_escolta:     { x: 190.7, y: 132 },

  destino_final:    { x: 41.1,  y: 141.1 },
  serv_fecha_dia:   { x: 149.3, y: 140.7 },
  serv_fecha_mes:   { x: 155.9, y: 140.9 },
  serv_fecha_anio:  { x: 163.4, y: 140.7 },
  serv_hora:        { x: 187.2, y: 140.4 },

  traslado:         { x: 38.8,  y: 146.8 },
  traslado_hasta:   { x: 112.9, y: 146.7 },
  traslado_km:      { x: 185.4, y: 146.3 },

  importe:          { x: 32.7,  y: 152.4 },
  entrega:          { x: 107.5, y: 152.3 },
  saldo:            { x: 163.4, y: 152.3 },
  forma_pago:       { x: 73.4,  y: 158.2 },

  // Documentación — ORIGINAL y COPIA
  doc_acta_orig:   { x: 82.5,  y: 177.3 }, doc_acta_cop:  { x: 101.9, y: 177.1 },
  doc_lib_orig:    { x: 82.4,  y: 181.6 }, doc_lib_cop:   { x: 101.8, y: 181.3 },
  doc_rec_orig:    { x: 82.4,  y: 186 },   doc_rec_cop:   { x: 101.8, y: 186 },
  doc_fac_orig:    { x: 82.4,  y: 189.9 }, doc_fac_cop:   { x: 101.8, y: 189.9 },
  doc_cen_orig:    { x: 82.7,  y: 194.6 }, doc_cen_cop:   { x: 101.8, y: 194.4 },
  doc_car_orig:    { x: 82.7,  y: 199.3 }, doc_car_cop:   { x: 101.8, y: 198.9 },
  doc_otr_orig:    { x: 82.7,  y: 203.1 }, doc_otr_cop:   { x: 101.8, y: 203.3 },

  // Fecha y firma (columna derecha)
  firma_dia:       { x: 149.4, y: 172.1 },
  firma_mes:       { x: 162,   y: 170.8 },
  firma_anio:      { x: 192.9, y: 171 },
  solicitante:     { x: 144,   y: 179.2 },
  contacto:        { x: 144.2, y: 185.1 },

  // Asesor
  asesor:          { x: 57.3,  y: 213.3 },

  // Solicitante
  sol_nombre:      { x: 49.6,  y: 225.9 },
  sol_dni:         { x: 26.9,  y: 231.1 },
  sol_fecha_nac:   { x: 104.2, y: 231 },
  sol_cel:         { x: 151.9, y: 230.8 },
  sol_domicilio:   { x: 35.7,  y: 236.6 },
  sol_trabajo:     { x: 40,    y: 241.6 },

  // Garante
  gar_nombre:      { x: 51.9,  y: 260.2 },
  gar_dni:         { x: 28.3,  y: 265.1 },
  gar_fecha_nac:   { x: 104.7, y: 264.7 },
  gar_cel:         { x: 154.5, y: 264.4 },
  gar_domicilio:   { x: 39.8,  y: 270.5 },
  gar_trabajo:     { x: 38.8,  y: 275.9 },
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
  X(pdf, s.coche_funebre && s.coche_funebre_tipo !== 'Europea', C.cb_carroza_americana.x, C.cb_carroza_americana.y)
  X(pdf, s.coche_funebre && s.coche_funebre_tipo === 'Europea', C.cb_carroza_europea.x,   C.cb_carroza_europea.y)
  X(pdf, s.coche_escolta,    C.cb_coche_escolta.x, C.cb_coche_escolta.y)

  // — Destino y fecha del servicio —
  txt(pdf, s.destino_final ?? '', C.destino_final.x,  C.destino_final.y)
  txt(pdf, fs.dia,                C.serv_fecha_dia.x, C.serv_fecha_dia.y)
  txt(pdf, fs.mes,                C.serv_fecha_mes.x, C.serv_fecha_mes.y)
  txt(pdf, fs.anio,               C.serv_fecha_anio.x, C.serv_fecha_anio.y)
  txt(pdf, fs.hora,               C.serv_hora.x,      C.serv_hora.y)

  // — Importe —
  if (s.importe_servicio) txt(pdf, String(s.importe_servicio), C.importe.x, C.importe.y)

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
  txt(pdf, String(hoy.getDate()),                C.firma_dia.x,    C.firma_dia.y)
  txt(pdf, MESES_LARGO[hoy.getMonth()],          C.firma_mes.x,    C.firma_mes.y)
  txt(pdf, String(hoy.getFullYear()).slice(2),    C.firma_anio.x,   C.firma_anio.y)
  txt(pdf, s.deudo?.nombre ?? '',               C.solicitante.x,  C.solicitante.y)
  txt(pdf, s.deudo?.whatsapp ?? s.deudo?.telefono ?? '', C.contacto.x, C.contacto.y)

  // — Asesor —
  txt(pdf, s.asesor ?? '', C.asesor.x, C.asesor.y)

  // — Solicitante —
  txt(pdf, s.deudo?.nombre ?? '',                        C.sol_nombre.x,    C.sol_nombre.y)
  txt(pdf, s.deudo?.dni ?? '',                           C.sol_dni.x,       C.sol_dni.y)
  txt(pdf, formatFecha(s.deudo?.fecha_nacimiento),       C.sol_fecha_nac.x, C.sol_fecha_nac.y)
  txt(pdf, s.deudo?.whatsapp ?? s.deudo?.telefono ?? '', C.sol_cel.x,       C.sol_cel.y)
  txt(pdf, s.deudo?.domicilio ?? '',                     C.sol_domicilio.x, C.sol_domicilio.y)
  txt(pdf, s.deudo?.trabajo_ocupacion ?? '',             C.sol_trabajo.x,   C.sol_trabajo.y)

  // — Garante —
  if (s.garante) {
    txt(pdf, s.garante.nombre ?? '',                           C.gar_nombre.x,    C.gar_nombre.y)
    txt(pdf, s.garante.dni ?? '',                              C.gar_dni.x,       C.gar_dni.y)
    txt(pdf, formatFecha(s.garante.fecha_nacimiento),          C.gar_fecha_nac.x, C.gar_fecha_nac.y)
    txt(pdf, s.garante.whatsapp ?? s.garante.telefono ?? '',   C.gar_cel.x,       C.gar_cel.y)
    txt(pdf, s.garante.domicilio ?? '',                        C.gar_domicilio.x, C.gar_domicilio.y)
    txt(pdf, s.garante.trabajo_ocupacion ?? '',                C.gar_trabajo.x,   C.gar_trabajo.y)
  }
}

export const F6_INFO: FormularioInfo = {
  id: 'F6',
  nombre: 'Conformidad del Servicio Principal — Paraíso de Paz',
  imagen: '/formularios/paz_6.png',
  generarFn: generarF6,
}
