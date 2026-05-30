import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) — calibrado 2026-05-19 ────────

const C = {
  // Encabezado — "En la Ciudad de ... a los ... del mes de ... de 20..."
  ciudad:   { x: 47.2,  y: 82.4 },
  dia:      { x: 113.9, y: 81.9 },
  mes:      { x: 142.1, y: 81.9 },
  anio:     { x: 183.2, y: 82.2 },

  // Empresa prestadora
  empresa:  { x: 18.7,  y: 121.4 },

  // Monto del servicio
  monto:    { x: 163.1, y: 136.9 },

  // BENEFICIARIO (= fallecido)
  ben_apellido_nombre: { x: 60.6,  y: 182.4 },
  ben_dni:             { x: 157.1, y: 182 },
  ben_nro_afiliado:    { x: 60.6,  y: 187.3 },
  ben_domicilio:       { x: 131.8, y: 187.1 },
  ben_domicilio2:      { x: 19.2,  y: 192.5 },
  ben_localidad:       { x: 131.4, y: 192 },
  ben_pcia:            { x: 172,   y: 191.8 },

  // SOLICITANTE (= deudo)
  sol_apellido_nombre: { x: 59.2,  y: 207.4 },
  sol_dni:             { x: 28.7,  y: 212.6 },
  sol_parentesco:      { x: 97,    y: 212.1 },
  sol_tel:             { x: 149.8, y: 211.9 },
  sol_domicilio:       { x: 39.8,  y: 217.2 },
  sol_localidad:       { x: 108.4, y: 222.4 },
  sol_provincia:       { x: 165.3, y: 221.9 },

  // Lugar, fecha y aclaración de firma
  lugar_fecha:         { x: 30.9,  y: 243 },
  aclaracion:          { x: 139.1, y: 242.5 },
}

function generarF5(pdf: jsPDF, s: ServicioConDeudo) {
  const fechaDoc = s.fecha_servicio ? new Date(s.fecha_servicio) : new Date()
  const dia  = String(fechaDoc.getDate())
  const mes  = fechaDoc.toLocaleString('es-AR', { month: 'long' })
  const anio = String(fechaDoc.getFullYear()).slice(2)

  // Encabezado de fecha
  txt(pdf, 'Posadas', C.ciudad.x, C.ciudad.y)
  txt(pdf, dia,       C.dia.x,    C.dia.y)
  txt(pdf, mes,       C.mes.x,    C.mes.y)
  txt(pdf, anio,      C.anio.x,   C.anio.y)

  // Empresa
  txt(pdf, 'Paraíso de Paz', C.empresa.x, C.empresa.y)

  // Beneficiario = fallecido
  txt(pdf, s.fallecido_nombre,              C.ben_apellido_nombre.x, C.ben_apellido_nombre.y)
  txt(pdf, s.fallecido_dni ?? '',           C.ben_dni.x,             C.ben_dni.y)
  txt(pdf, s.fallecido_beneficio_nro ?? '', C.ben_nro_afiliado.x,    C.ben_nro_afiliado.y)
  txt(pdf, s.deudo?.domicilio ?? '',        C.ben_domicilio.x,       C.ben_domicilio.y)
  txt(pdf, 'Posadas',                       C.ben_localidad.x,       C.ben_localidad.y)
  txt(pdf, 'Misiones',                      C.ben_pcia.x,            C.ben_pcia.y)

  // Monto
  if (s.importe_servicio) txt(pdf, String(s.importe_servicio), C.monto.x, C.monto.y)

  // Solicitante = deudo
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',                        C.sol_apellido_nombre.x, C.sol_apellido_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                           C.sol_dni.x,             C.sol_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',            C.sol_parentesco.x,      C.sol_parentesco.y)
    txt(pdf, s.deudo.whatsapp ?? s.deudo.telefono ?? '', C.sol_tel.x,             C.sol_tel.y)
    txt(pdf, s.deudo.domicilio ?? '',                     C.sol_domicilio.x,       C.sol_domicilio.y)
  }
  txt(pdf, 'Posadas',  C.sol_localidad.x, C.sol_localidad.y)
  txt(pdf, 'Misiones', C.sol_provincia.x, C.sol_provincia.y)

  // Lugar, fecha y aclaración
  txt(pdf, `Posadas, ${formatFecha(fechaDoc.toISOString())}`, C.lugar_fecha.x, C.lugar_fecha.y)
  txt(pdf, s.deudo?.nombre ?? '', C.aclaracion.x, C.aclaracion.y)
}

export const F5_INFO: FormularioInfo = {
  id: 'F5',
  nombre: 'Conformidad Afiliado IPSM',
  imagen: '/formularios/paz_5.png',
  generarFn: generarF5,
}
