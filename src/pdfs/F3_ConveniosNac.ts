import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) ────────────────────────────────

const C = {
  empresa_nombre:   { x: 51.7,  y: 63 },
  fecha_doc:        { x: 122.3, y: 67.2 },

  vel_sala:         { x: 43.2,  y: 72.6 },
  vel_calle:        { x: 96.8,  y: 72.2 },
  vel_nro:          { x: 165.5, y: 72.1 },
  vel_localidad:    { x: 61.5,  y: 77 },
  vel_provincia:    { x: 130.7, y: 77 },

  cementerio:       { x: 66.4,  y: 81.9 },

  obra_social:      { x: 48.9,  y: 95.1 },
  ga_nro:           { x: 170.4, y: 95.1 },

  deudo_nombre:     { x: 100,   y: 123.1 },
  deudo_dni:        { x: 70.6,  y: 127.8 },
  deudo_parentesco: { x: 138.9, y: 128 },
  deudo_domicilio:  { x: 38.1,  y: 131.7 },
  deudo_localidad:  { x: 132.8, y: 132.2 },
  deudo_provincia:  { x: 59.6,  y: 136.9 },
  deudo_tel:        { x: 137,   y: 136.7 },

  fall_nombre:      { x: 104.7, y: 147.1 },
  fall_dni:         { x: 75.5,  y: 151.4 },
  fall_ec_soltero:  { x: 159.7, y: 152.3 },
  fall_ec_casado:   { x: 172.3, y: 151.3 },
  fall_ec_viudo:    { x: 184.2, y: 152.2 },

  empresa_origen:   { x: 37.6,  y: 233.5 },
  empresa_terminal: { x: 68,    y: 237.8 },
}

function generarF3(pdf: jsPDF, s: ServicioConDeudo) {
  txt(pdf, 'Paraíso de Paz',                   C.empresa_nombre.x,  C.empresa_nombre.y)
  txt(pdf, formatFecha(s.fallecido_fecha_deceso ?? s.fecha_servicio ?? s.created_at),
                                                C.fecha_doc.x,       C.fecha_doc.y)

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
    txt(pdf, s.deudo.telefono ?? '',             C.deudo_tel.x,        C.deudo_tel.y)
  }
  txt(pdf, 'Posadas',                            C.deudo_localidad.x,  C.deudo_localidad.y)
  txt(pdf, 'Misiones',                           C.deudo_provincia.x,  C.deudo_provincia.y)

  txt(pdf, s.fallecido_nombre,                   C.fall_nombre.x,      C.fall_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',                C.fall_dni.x,         C.fall_dni.y)

  // Estado civil — marcar la casilla correcta
  const ec = (s.fallecido_estado_civil ?? '').toLowerCase()
  if (ec.includes('soltero') || ec.includes('soltera')) {
    txt(pdf, 'X', C.fall_ec_soltero.x, C.fall_ec_soltero.y)
  } else if (ec.includes('casado') || ec.includes('casada')) {
    txt(pdf, 'X', C.fall_ec_casado.x, C.fall_ec_casado.y)
  } else if (ec.includes('viudo') || ec.includes('viuda')) {
    txt(pdf, 'X', C.fall_ec_viudo.x, C.fall_ec_viudo.y)
  }

  txt(pdf, 'Paraíso de Paz',                     C.empresa_origen.x,   C.empresa_origen.y)
  txt(pdf, 'Paraíso de Paz',                     C.empresa_terminal.x, C.empresa_terminal.y)
}

export const F3_INFO: FormularioInfo = {
  id: 'F3',
  nombre: 'Conformidad S&G Convenios Nacionales',
  imagen: '/formularios/paz_3.png',
  generarFn: generarF3,
}
