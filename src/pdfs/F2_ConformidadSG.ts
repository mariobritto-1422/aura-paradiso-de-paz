import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────
// F2 — El cuerpo del formulario es texto fijo hasta la sección "INDICAR CON X"
// Solo marcamos los campos interactivos en la parte inferior

// ─── COORDENADAS (mm en A4 210×297) — calibrado 2026-05-15 ──────────────────

const C = {
  // Velatorio SI/NO
  cb_vel_si:    { x: 59.6, y: 157.5 },
  cb_vel_no:    { x: 84.1, y: 157.5 },

  // Alquilado SI/NO — Propio SI/NO
  cb_alq_si:    { x: 59.4,  y: 161.8 },
  cb_alq_no:    { x: 84.2,  y: 161.7 },
  cb_prop_si:   { x: 118.8, y: 161.8 },
  cb_prop_no:   { x: 135.4, y: 161.7 },

  // Autos de acompañamiento SI/NO — Marca y tipo
  cb_autos_si:  { x: 82,    y: 171.2 },
  cb_autos_no:  { x: 98.6,  y: 171.2 },
  autos_marca:  { x: 135.6, y: 170 },

  // Portacoronas SI/NO — Cantidad SI/NO
  cb_porta_si:  { x: 55.6,  y: 175.7 },
  cb_porta_no:  { x: 72,    y: 175.7 },
  cb_cant_si:   { x: 104.5, y: 175.7 },
  cb_cant_no:   { x: 121.5, y: 175.5 },

  // Cantidades / textos
  cantidad:     { x: 48.6,  y: 180.7 },
  funebre:      { x: 70.3,  y: 180.7 },
  portacoronas: { x: 104.2, y: 180.6 },
  otros_1:      { x: 172.3, y: 179.5 },
  otros_2:      { x: 34.6,  y: 184 },

  // Inhumado
  cementerio:   { x: 80.4,  y: 193.4 },
  localidad:    { x: 51.7,  y: 198.1 },
  provincia:    { x: 139.8, y: 197.7 },

  // Tipo sepultura
  cb_tierra:    { x: 44.2,  y: 203.8 },
  cb_nicho:     { x: 78.6,  y: 203.5 },
  cb_panteon:   { x: 115.3, y: 203.3 },
  cb_boveda:    { x: 148,   y: 202.9 },

  // Otro beneficio SI/NO — Indicar cuál
  cb_otro_si:   { x: 89.1,  y: 212.3 },
  cb_otro_no:   { x: 102.9, y: 212.3 },
  otro_cual:    { x: 54.5,  y: 216.6 },
}

function generarF2(pdf: jsPDF, s: ServicioConDeudo) {
  const tieneVelatorio = !!s.sala
  checkbox(pdf, tieneVelatorio,  C.cb_vel_si.x, C.cb_vel_si.y)
  checkbox(pdf, !tieneVelatorio, C.cb_vel_no.x, C.cb_vel_no.y)
  checkbox(pdf, true, C.cb_prop_si.x, C.cb_prop_si.y)

  checkbox(pdf, s.coche_escolta,  C.cb_autos_si.x, C.cb_autos_si.y)
  checkbox(pdf, !s.coche_escolta, C.cb_autos_no.x, C.cb_autos_no.y)
  if (s.vehiculo) txt(pdf, s.vehiculo, C.autos_marca.x, C.autos_marca.y)

  txt(pdf, s.destino_final ?? '', C.cementerio.x, C.cementerio.y)
  txt(pdf, 'Posadas',  C.localidad.x, C.localidad.y)
  txt(pdf, 'Misiones', C.provincia.x, C.provincia.y)

  const dest = s.destino_final ?? ''
  checkbox(pdf, dest.includes('Piedad'),      C.cb_tierra.x,  C.cb_tierra.y)
  checkbox(pdf, dest.includes('Nicho'),       C.cb_nicho.x,   C.cb_nicho.y)
  checkbox(pdf, dest.includes('Panteón'),     C.cb_panteon.x, C.cb_panteon.y)
  checkbox(pdf, dest.includes('Bóveda'),      C.cb_boveda.x,  C.cb_boveda.y)

  checkbox(pdf, false, C.cb_otro_si.x, C.cb_otro_si.y)
  checkbox(pdf, true,  C.cb_otro_no.x, C.cb_otro_no.y)
}

export const F2_INFO: FormularioInfo = {
  id: 'F2',
  nombre: 'Conformidad S&G (detalle)',
  imagen: '/formularios/paz_2.png',
  generarFn: generarF2,
}
