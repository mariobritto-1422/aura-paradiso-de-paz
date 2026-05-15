import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────

const C = {
  // Fecha del documento (ángulo superior derecho)
  fecha_doc: { x: 170, y: 38 },

  // Fecha fallecimiento (en el texto del cuerpo)
  fecha_fall: { x: 170, y: 75 },

  // Velado en (localidad)
  vel_localidad: { x: 44, y: 80 },
  vel_provincia: { x: 100, y: 80 },

  // Cementerio de inhumación
  cementerio: { x: 38, y: 85 },

  // Obra social / G.A. Nro
  obra_social: { x: 28, y: 97 },
  ga_nro:      { x: 147, y: 97 },

  // Datos del deudo
  deudo_nombre:     { x: 59, y: 125 },
  deudo_dni:        { x: 35, y: 131 },
  deudo_parentesco: { x: 77, y: 131 },
  deudo_domicilio:  { x: 132, y: 131 },
  deudo_provincia:  { x: 38, y: 137 },
  deudo_tel:        { x: 98, y: 137 },

  // Datos del fallecido
  fall_nombre:      { x: 55, y: 147 },
  fall_dni:         { x: 35, y: 153 },
  fall_estado_civil:{ x: 113, y: 153 },
}

function generarF3(pdf: jsPDF, s: ServicioConDeudo) {
  txt(pdf, formatFecha(s.fecha_servicio ?? s.created_at), C.fecha_doc.x, C.fecha_doc.y)
  txt(pdf, formatFecha(s.fallecido_fecha_deceso),         C.fecha_fall.x, C.fecha_fall.y)

  txt(pdf, 'Posadas',  C.vel_localidad.x, C.vel_localidad.y)
  txt(pdf, 'Misiones', C.vel_provincia.x, C.vel_provincia.y)
  txt(pdf, s.destino_final ?? '',         C.cementerio.x,  C.cementerio.y)
  txt(pdf, s.fallecido_obra_social ?? '', C.obra_social.x, C.obra_social.y)
  txt(pdf, s.fallecido_beneficio_nro ?? '', C.ga_nro.x,    C.ga_nro.y)

  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',              C.deudo_nombre.x,     C.deudo_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                 C.deudo_dni.x,        C.deudo_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',  C.deudo_parentesco.x, C.deudo_parentesco.y)
    txt(pdf, s.deudo.telefono ?? '',            C.deudo_tel.x,        C.deudo_tel.y)
  }
  txt(pdf, 'Misiones', C.deudo_provincia.x, C.deudo_provincia.y)

  txt(pdf, s.fallecido_nombre,            C.fall_nombre.x,       C.fall_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',         C.fall_dni.x,          C.fall_dni.y)
  txt(pdf, s.fallecido_estado_civil ?? '', C.fall_estado_civil.x, C.fall_estado_civil.y)
}

export const F3_INFO: FormularioInfo = {
  id: 'F3',
  nombre: 'Conformidad S&G Convenios Nacionales',
  imagen: '/formularios/paz_3.jpeg',
  generarFn: generarF3,
}
