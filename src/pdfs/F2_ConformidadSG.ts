import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) — calibrado 2026-05-19 ──────────────────

const C = {
  // Velatorio SI/NO
  cb_vel_si:    { x: 65,    y: 158.2 },
  cb_vel_no:    { x: 90.7,  y: 158 },

  // Alquilado SI/NO — Propio SI/NO
  cb_alq_si:    { x: 65,    y: 162.8 },
  cb_alq_no:    { x: 90.7,  y: 163 },
  cb_prop_si:   { x: 123.7, y: 162.5 },
  cb_prop_no:   { x: 141.2, y: 162.5 },

  // Autos de acompañamiento SI/NO — Marca y tipo
  cb_autos_si:  { x: 86.2,  y: 172 },
  cb_autos_no:  { x: 104.2, y: 171.9 },
  autos_marca:  { x: 138.6, y: 171.2 },

  // Portacoronas alquilado SI/NO — Propio SI/NO
  cb_porta_si:  { x: 59.8,  y: 176.4 },
  cb_porta_no:  { x: 77.4,  y: 176.5 },
  cb_cant_si:   { x: 108.2, y: 176.5 },
  cb_cant_no:   { x: 127.2, y: 176.4 },

  // Cantidades / textos
  cantidad:     { x: 50.2,  y: 181.1 },
  funebre:      { x: 71.7,  y: 181.2 },
  portacoronas: { x: 105.2, y: 181.1 },
  dos_autos:    { x: 156.6, y: 181.1 },
  otros_1:      { x: 172,   y: 180 },
  otros_2:      { x: 35.3,  y: 185.4 },

  // Inhumado
  cementerio:   { x: 83,    y: 194.2 },
  localidad:    { x: 53.1,  y: 199.1 },
  provincia:    { x: 143.7, y: 198.7 },

  // Tipo sepultura
  cb_tierra:    { x: 47,    y: 204.5 },
  cb_nicho:     { x: 80,    y: 204.1 },
  cb_panteon:   { x: 118.1, y: 204.3 },
  cb_boveda:    { x: 149.8, y: 204.1 },

  // Otro beneficio SI/NO — Indicar cuál
  cb_otro_si:   { x: 93.3,  y: 213.3 },
  cb_otro_no:   { x: 110.1, y: 213.1 },
  otro_cual:    { x: 57.3,  y: 217.3 },
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
