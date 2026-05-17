import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, formatFecha } from './utils'

// ─── COORDENADAS calibradas (mm en A4 210×297) ────────────────────────────────

const C = {
  // Encabezado — "En la Ciudad de ... a los ... del mes de ... de 20..."
  ciudad:   { x: 44.7,  y: 80.8 },
  dia:      { x: 112.9, y: 81.5 },
  mes:      { x: 140.5, y: 80.8 },
  anio:     { x: 182.5, y: 81 },

  // Empresa prestadora
  empresa:  { x: 18.7,  y: 121.4 },

  // BENEFICIARIO (= fallecido)
  ben_apellido_nombre: { x: 58.7,  y: 180.8 },
  ben_dni:             { x: 154.3, y: 180.1 },
  ben_nro_afiliado:    { x: 58.4,  y: 186.4 },
  ben_localidad:       { x: 129.9, y: 190.4 },
  ben_pcia:            { x: 170.2, y: 190.6 },

  // SOLICITANTE (= deudo)
  sol_apellido_nombre: { x: 58.5,  y: 206 },
  sol_dni:             { x: 26.4,  y: 211.1 },
  sol_parentesco:      { x: 94.2,  y: 211.2 },
  sol_tel:             { x: 147.5, y: 210.9 },
  sol_localidad:       { x: 107.1, y: 221.2 },
  sol_provincia:       { x: 162.7, y: 220.7 },

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
  txt(pdf, 'Posadas',                       C.ben_localidad.x,       C.ben_localidad.y)
  txt(pdf, 'Misiones',                      C.ben_pcia.x,            C.ben_pcia.y)

  // Solicitante = deudo
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',                        C.sol_apellido_nombre.x, C.sol_apellido_nombre.y)
    txt(pdf, s.deudo.dni ?? '',                           C.sol_dni.x,             C.sol_dni.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '',            C.sol_parentesco.x,      C.sol_parentesco.y)
    txt(pdf, s.deudo.whatsapp ?? s.deudo.telefono ?? '', C.sol_tel.x,             C.sol_tel.y)
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
