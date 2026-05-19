import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) — calibrado 2026-05-19 ────────

const C = {
  // Fecha documento (encabezado superior)
  fecha_doc_dia:    { x: 177.7, y: 49.8 },
  fecha_doc_mes:    { x: 182.8, y: 49.6 },
  fecha_doc_anio:   { x: 188.7, y: 49.8 },

  empresa_nombre:   { x: 58.2,  y: 64 },

  // Fecha deceso
  fecha_dec_dia:    { x: 121.6, y: 68.7 },
  fecha_dec_mes:    { x: 128.6, y: 68.7 },
  fecha_dec_anio:   { x: 136.1, y: 68.7 },

  vel_sala:         { x: 46.1,  y: 73.3 },
  vel_calle:        { x: 100.1, y: 73.4 },
  vel_nro:          { x: 166.4, y: 73.1 },
  vel_localidad:    { x: 64.8,  y: 78.1 },
  vel_provincia:    { x: 132.8, y: 78 },

  cementerio:       { x: 71.3,  y: 82.7 },

  gestionado:       { x: 49.1,  y: 91.8 },
  obra_social:      { x: 52.3,  y: 96.3 },
  ga_nro:           { x: 172.3, y: 96.2 },

  deudo_nombre:     { x: 104,   y: 123.9 },
  deudo_dni:        { x: 74.1,  y: 128.8 },
  deudo_parentesco: { x: 141.2, y: 128.7 },
  deudo_domicilio:  { x: 41.1,  y: 133.2 },
  deudo_localidad:  { x: 135.6, y: 133 },
  deudo_provincia:  { x: 60.8,  y: 137.9 },
  deudo_tel:        { x: 140.5, y: 137.9 },

  fall_nombre:      { x: 109.8, y: 148.1 },
  fall_dni:         { x: 77.4,  y: 152.8 },
  fall_ec_soltero:  { x: 163.9, y: 153.1 },
  fall_ec_casado:   { x: 175.5, y: 153.1 },
  fall_ec_viudo:    { x: 187.5, y: 153 },
  fall_ec_separado: { x: 44,    y: 158.2 },
  fall_ec_divorciado: { x: 61,  y: 158.2 },
  fall_ec_unido:    { x: 82.5,  y: 158 },

  detalle_1:        { x: 41.1,  y: 181.6 },
  detalle_2:        { x: 41.2,  y: 186.2 },

  empresa_origen:      { x: 41.1,  y: 234.3 },
  asociacion_origen:   { x: 104.2, y: 234.3 },
  empresa_terminal:    { x: 70.6,  y: 239 },
  asociacion_terminal: { x: 137.7, y: 238.5 },
}

function splitFecha(fechaStr: string | null | undefined) {
  if (!fechaStr) return { dia: '', mes: '', anio: '' }
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return { dia: '', mes: '', anio: '' }
  return {
    dia:  String(d.getUTCDate()).padStart(2, '0'),
    mes:  String(d.getUTCMonth() + 1).padStart(2, '0'),
    anio: String(d.getUTCFullYear()).slice(2),
  }
}

function generarF3(pdf: jsPDF, s: ServicioConDeudo) {
  const fd  = splitFecha(s.fallecido_fecha_deceso ?? s.fecha_servicio ?? s.created_at)
  const hoy = new Date()
  const fDoc = {
    dia:  String(hoy.getDate()).padStart(2, '0'),
    mes:  String(hoy.getMonth() + 1).padStart(2, '0'),
    anio: String(hoy.getFullYear()).slice(2),
  }

  txt(pdf, fDoc.dia,  C.fecha_doc_dia.x,  C.fecha_doc_dia.y)
  txt(pdf, fDoc.mes,  C.fecha_doc_mes.x,  C.fecha_doc_mes.y)
  txt(pdf, fDoc.anio, C.fecha_doc_anio.x, C.fecha_doc_anio.y)

  txt(pdf, 'Paraíso de Paz', C.empresa_nombre.x, C.empresa_nombre.y)

  txt(pdf, fd.dia,  C.fecha_dec_dia.x,  C.fecha_dec_dia.y)
  txt(pdf, fd.mes,  C.fecha_dec_mes.x,  C.fecha_dec_mes.y)
  txt(pdf, fd.anio, C.fecha_dec_anio.x, C.fecha_dec_anio.y)

  // Lugar del velatorio
  const esDomicilio = s.sala === 'Domicilio'
  txt(pdf, esDomicilio ? (s.sala_domicilio ?? '') : (s.sala ?? ''),
                                                C.vel_sala.x,        C.vel_sala.y)
  txt(pdf, 'Posadas',                           C.vel_localidad.x,   C.vel_localidad.y)
  txt(pdf, 'Misiones',                          C.vel_provincia.x,   C.vel_provincia.y)

  txt(pdf, s.destino_final ?? '',               C.cementerio.x,      C.cementerio.y)
  txt(pdf, s.fallecido_obra_social ?? '',        C.obra_social.x,     C.obra_social.y)
  txt(pdf, s.fallecido_beneficio_nro ?? '',      C.ga_nro.x,          C.ga_nro.y)

  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',               C.deudo_nombre.x,     C.deudo_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                  C.deudo_dni.x,        C.deudo_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',   C.deudo_parentesco.x, C.deudo_parentesco.y)
    txt(pdf, s.deudo.domicilio ?? '',            C.deudo_domicilio.x,  C.deudo_domicilio.y)
    txt(pdf, s.deudo.telefono ?? '',             C.deudo_tel.x,        C.deudo_tel.y)
  }
  txt(pdf, 'Posadas',                            C.deudo_localidad.x,  C.deudo_localidad.y)
  txt(pdf, 'Misiones',                           C.deudo_provincia.x,  C.deudo_provincia.y)

  txt(pdf, s.fallecido_nombre,                   C.fall_nombre.x,      C.fall_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',                C.fall_dni.x,         C.fall_dni.y)

  // Estado civil — marcar la casilla correcta
  const ec = (s.fallecido_estado_civil ?? '').toLowerCase()
  if      (ec.includes('soltero') || ec.includes('soltera'))     txt(pdf, 'X', C.fall_ec_soltero.x,   C.fall_ec_soltero.y)
  else if (ec.includes('casado')  || ec.includes('casada'))      txt(pdf, 'X', C.fall_ec_casado.x,    C.fall_ec_casado.y)
  else if (ec.includes('viudo')   || ec.includes('viuda'))       txt(pdf, 'X', C.fall_ec_viudo.x,     C.fall_ec_viudo.y)
  else if (ec.includes('separado') || ec.includes('separada'))   txt(pdf, 'X', C.fall_ec_separado.x,  C.fall_ec_separado.y)
  else if (ec.includes('divorciado') || ec.includes('divorciada')) txt(pdf, 'X', C.fall_ec_divorciado.x, C.fall_ec_divorciado.y)
  else if (ec.includes('unido') || ec.includes('unida') || ec.includes('conviviente')) txt(pdf, 'X', C.fall_ec_unido.x, C.fall_ec_unido.y)

  txt(pdf, 'Paraíso de Paz', C.empresa_origen.x,   C.empresa_origen.y)
  txt(pdf, 'Paraíso de Paz', C.empresa_terminal.x, C.empresa_terminal.y)
}

export const F3_INFO: FormularioInfo = {
  id: 'F3',
  nombre: 'Conformidad S&G Convenios Nacionales',
  imagen: '/formularios/paz_3.png',
  generarFn: generarF3,
}
