import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────

const C = {
  // Difunto
  dif_apellido: { x: 33, y: 43 },
  dif_nombres:  { x: 94, y: 43 },
  dif_edad:     { x: 18, y: 50 },
  dif_dni:      { x: 36, y: 50 },

  // Responsable (deudo)
  resp_apellido:  { x: 33, y: 65 },
  resp_nombres:   { x: 94, y: 65 },
  resp_dni:       { x: 18, y: 72 },
  resp_relacion:  { x: 79, y: 72 },
  resp_domicilio: { x: 82, y: 79 },
  resp_tel:       { x: 35, y: 86 },
  resp_celular:   { x: 110, y: 86 },
  resp_email:     { x: 47, y: 93 },
}

function calcularEdad(fechaNac: string | null, fechaDec: string | null): string {
  if (!fechaNac) return ''
  const nac = new Date(fechaNac)
  const ref = fechaDec ? new Date(fechaDec) : new Date()
  return String(ref.getFullYear() - nac.getFullYear())
}

function generarF6(pdf: jsPDF, s: ServicioConDeudo) {
  const partes = s.fallecido_nombre.split(',')
  const apellido = partes[0]?.trim() ?? s.fallecido_nombre
  const nombres  = partes[1]?.trim() ?? ''

  txt(pdf, apellido, C.dif_apellido.x, C.dif_apellido.y)
  txt(pdf, nombres,  C.dif_nombres.x,  C.dif_nombres.y)
  txt(pdf, calcularEdad(s.fallecido_fecha_nacimiento, s.fallecido_fecha_deceso), C.dif_edad.x, C.dif_edad.y)
  txt(pdf, s.fallecido_dni ?? '', C.dif_dni.x, C.dif_dni.y)

  if (s.deudo) {
    const dp = (s.deudo.nombre ?? '').split(' ')
    const dApellido = dp.length > 1 ? dp.slice(-1)[0] : dp[0] ?? ''
    const dNombres  = dp.length > 1 ? dp.slice(0, -1).join(' ') : ''

    txt(pdf, dApellido,                     C.resp_apellido.x,  C.resp_apellido.y)
    txt(pdf, dNombres,                      C.resp_nombres.x,   C.resp_nombres.y)
    txt(pdf, s.deudo.dni ?? '',             C.resp_dni.x,       C.resp_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '', C.resp_relacion.x, C.resp_relacion.y)
    txt(pdf, s.deudo.telefono ?? '',        C.resp_tel.x,       C.resp_tel.y)
    txt(pdf, s.deudo.whatsapp ?? '',        C.resp_celular.x,   C.resp_celular.y)
    txt(pdf, s.deudo.email ?? '',           C.resp_email.x,     C.resp_email.y)
  }
}

export const F6_INFO: FormularioInfo = {
  id: 'F6',
  nombre: 'Ficha Ingreso Cementerio La Piedad',
  imagen: '/formularios/paz_6.jpeg',
  generarFn: generarF6,
}
