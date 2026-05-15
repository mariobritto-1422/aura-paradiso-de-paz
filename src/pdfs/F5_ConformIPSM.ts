import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────

const C = {
  // "En la Ciudad de ... a los ... del mes de ... de 20..."
  ciudad:  { x: 50,  y: 78 },
  dia:     { x: 105, y: 78 },
  mes:     { x: 130, y: 78 },

  // BENEFICIARIO (= fallecido)
  ben_apellido_nombre: { x: 52,  y: 188 },
  ben_dni:             { x: 175, y: 188 },
  ben_nro_afiliado:    { x: 45,  y: 195 },
  ben_domicilio:       { x: 115, y: 195 },
  ben_localidad:       { x: 58,  y: 202 },
  ben_pcia:            { x: 175, y: 202 },

  // SOLICITANTE (= deudo)
  sol_apellido_nombre: { x: 52,  y: 218 },
  sol_dni:             { x: 18,  y: 225 },
  sol_parentesco:      { x: 68,  y: 225 },
  sol_tel:             { x: 140, y: 225 },
  sol_domicilio:       { x: 35,  y: 232 },
  sol_localidad:       { x: 58,  y: 239 },
  sol_provincia:       { x: 145, y: 239 },

  // LUGAR Y FECHA
  lugar_fecha: { x: 18, y: 270 },
}

function generarF5(pdf: jsPDF, s: ServicioConDeudo) {
  const fechaDoc = s.fecha_servicio ? new Date(s.fecha_servicio) : new Date()

  txt(pdf, 'Posadas', C.ciudad.x, C.ciudad.y)
  txt(pdf, String(fechaDoc.getDate()), C.dia.x, C.dia.y)
  txt(pdf, fechaDoc.toLocaleString('es-AR', { month: 'long' }), C.mes.x, C.mes.y)

  // Beneficiario = fallecido
  txt(pdf, s.fallecido_nombre,              C.ben_apellido_nombre.x, C.ben_apellido_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',           C.ben_dni.x,             C.ben_dni.y)
  txt(pdf, s.fallecido_beneficio_nro ?? '', C.ben_nro_afiliado.x,    C.ben_nro_afiliado.y)
  txt(pdf, 'Posadas',  C.ben_localidad.x, C.ben_localidad.y)
  txt(pdf, 'Misiones', C.ben_pcia.x,      C.ben_pcia.y)

  // Solicitante = deudo
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',              C.sol_apellido_nombre.x, C.sol_apellido_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                 C.sol_dni.x,             C.sol_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',  C.sol_parentesco.x,      C.sol_parentesco.y)
    txt(pdf, s.deudo.whatsapp ?? s.deudo.telefono ?? '', C.sol_tel.x,   C.sol_tel.y)
  }
  txt(pdf, 'Posadas',  C.sol_localidad.x, C.sol_localidad.y)
  txt(pdf, 'Misiones', C.sol_provincia.x, C.sol_provincia.y)

  txt(pdf, `Posadas, ${formatFecha(fechaDoc.toISOString())}`, C.lugar_fecha.x, C.lugar_fecha.y)
}

export const F5_INFO: FormularioInfo = {
  id: 'F5',
  nombre: 'Conformidad Afiliado IPSM',
  imagen: '/formularios/paz_5.jpeg',
  generarFn: generarF5,
}
