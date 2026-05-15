import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────
// F2 — El cuerpo del formulario es texto fijo hasta la sección "INDICAR CON X"
// Solo marcamos los campos interactivos en la parte inferior

const C = {
  // "Velatorio: SI [x] NO [ ]"
  cb_vel_si: { x: 38, y: 195 },
  cb_vel_no: { x: 50, y: 195 },
  // "Alquilado SI [ ] NO [ ]  Propio SI [x] NO [ ]"
  cb_propio_si: { x: 65, y: 200 },

  // "Autos de acompañamiento SI [x] NO [ ]  Marca y tipo:..."
  cb_autos_si:  { x: 47, y: 208 },
  cb_autos_no:  { x: 58, y: 208 },
  autos_marca:  { x: 115, y: 208 },
  autos_cant:   { x: 115, y: 213 },

  // "Inhumado en el Cementerio:..."
  cementerio: { x: 55, y: 233 },
  localidad:  { x: 28, y: 240 },
  provincia:  { x: 115, y: 240 },

  // Tipo sepultura
  cb_tierra:  { x: 15, y: 248 },
  cb_nicho:   { x: 42, y: 248 },
  cb_panteon: { x: 65, y: 248 },
  cb_boveda:  { x: 95, y: 248 },

  // Otro beneficio
  cb_otro_si: { x: 68, y: 255 },
  cb_otro_no: { x: 80, y: 255 },
}

function generarF2(pdf: jsPDF, s: ServicioConDeudo) {
  const tieneVelatorio = !!s.sala
  checkbox(pdf, tieneVelatorio,  C.cb_vel_si.x, C.cb_vel_si.y)
  checkbox(pdf, !tieneVelatorio, C.cb_vel_no.x, C.cb_vel_no.y)
  checkbox(pdf, true, C.cb_propio_si.x, C.cb_propio_si.y)

  checkbox(pdf, s.coche_escolta,  C.cb_autos_si.x, C.cb_autos_si.y)
  checkbox(pdf, !s.coche_escolta, C.cb_autos_no.x, C.cb_autos_no.y)
  if (s.vehiculo) txt(pdf, s.vehiculo, C.autos_marca.x, C.autos_marca.y)
  if (s.coche_escolta) txt(pdf, String(s.coche_escolta_cantidad), C.autos_cant.x, C.autos_cant.y)

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
  imagen: '/formularios/paz_2.jpeg',
  generarFn: generarF2,
}
