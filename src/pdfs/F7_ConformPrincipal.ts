import jsPDF from 'jspdf'
import type { ServicioConDeudo } from '../lib/supabase'
import type { FormularioInfo } from './utils'
import { txt, checkbox, formatFecha } from './utils'

// ─── COORDENADAS (mm en A4 210×297) ─────────────────────────────────────────
// Ajustar con /calibrar si algún campo no cae exacto.

const C = {
  numero_orden: { x: 103, y: 22 },

  fall_nombre:       { x: 52,  y: 50 },
  fall_dni:          { x: 171, y: 50 },
  fall_fecha_nac:    { x: 52,  y: 56 },
  fall_domicilio:    { x: 108, y: 56 },
  fall_ciudad:       { x: 22,  y: 62 },
  fall_nacionalidad: { x: 83,  y: 62 },
  fall_estado_civil: { x: 158, y: 62 },
  fall_religion:     { x: 24,  y: 68 },
  fall_profesion:    { x: 99,  y: 68 },
  fall_afiliado:     { x: 27,  y: 74 },
  fall_beneficio:    { x: 155, y: 74 },
  fall_deceso_lugar: { x: 47,  y: 80 },
  fall_deceso_fecha: { x: 142, y: 80 },
  fall_deceso_hora:  { x: 181, y: 80 },

  // Detalle servicio
  cb_tierra:    { x: 94,  y: 91 },
  cb_nicho:     { x: 117, y: 91 },
  cb_cremacion: { x: 143, y: 91 },

  cb_sala_descanso: { x: 52,  y: 97 },
  cb_sala_paraiso:  { x: 93,  y: 97 },
  cb_sala_fenix:    { x: 132, y: 97 },

  hora_inicio: { x: 108, y: 103 },

  cb_tanatostetica: { x: 45, y: 109 },
  cb_tanatopraxia:  { x: 88, y: 109 },

  cb_furgon:    { x: 47,  y: 121 },
  cb_carroza_a: { x: 90,  y: 121 },
  cb_carroza_e: { x: 103, y: 121 },
  cb_escolta:   { x: 118, y: 121 },

  destino_final: { x: 35,  y: 127 },
  fecha_dest:    { x: 148, y: 127 },
  hora_dest:     { x: 183, y: 127 },

  // Posadas / fecha del doc (columna derecha del cuadro de docs)
  posadas_dia: { x: 148, y: 173 },
  posadas_mes: { x: 175, y: 173 },

  // Solicitante resumido (cuadro derecho, frente a docs)
  sol_resumido_nombre: { x: 155, y: 183 },
  sol_resumido_cel:    { x: 155, y: 191 },

  // Asesor
  asesor: { x: 52, y: 225 },

  // Datos solicitante completo
  sol_nombre:    { x: 52,  y: 239 },
  sol_dni:       { x: 22,  y: 245 },
  sol_fecha_nac: { x: 75,  y: 245 },
  sol_cel:       { x: 155, y: 245 },
  sol_domicilio: { x: 32,  y: 251 },

  // Datos garante
  gar_nombre:    { x: 52,  y: 272 },
  gar_dni:       { x: 22,  y: 278 },
  gar_cel:       { x: 155, y: 278 },
  gar_domicilio: { x: 32,  y: 284 },
}

function generarF7(pdf: jsPDF, s: ServicioConDeudo) {
  txt(pdf, String(s.numero_orden), C.numero_orden.x, C.numero_orden.y, { bold: true, size: 10 })

  // Datos del fallecido
  txt(pdf, s.fallecido_nombre,          C.fall_nombre.x,       C.fall_nombre.y)
  txt(pdf, s.fallecido_dni,             C.fall_dni.x,          C.fall_dni.y)
  txt(pdf, formatFecha(s.fallecido_fecha_nacimiento), C.fall_fecha_nac.x, C.fall_fecha_nac.y)
  txt(pdf, s.fallecido_lugar_deceso,    C.fall_domicilio.x,    C.fall_domicilio.y)
  txt(pdf, s.fallecido_nacionalidad,    C.fall_nacionalidad.x, C.fall_nacionalidad.y)
  txt(pdf, s.fallecido_estado_civil,    C.fall_estado_civil.x, C.fall_estado_civil.y)
  txt(pdf, s.fallecido_religion,        C.fall_religion.x,     C.fall_religion.y)
  txt(pdf, s.fallecido_profesion,       C.fall_profesion.x,    C.fall_profesion.y)
  txt(pdf, s.fallecido_obra_social,     C.fall_afiliado.x,     C.fall_afiliado.y)
  txt(pdf, s.fallecido_beneficio_nro,   C.fall_beneficio.x,    C.fall_beneficio.y)

  if (s.fallecido_fecha_deceso) {
    const d = new Date(s.fallecido_fecha_deceso)
    txt(pdf, formatFecha(s.fallecido_fecha_deceso), C.fall_deceso_fecha.x, C.fall_deceso_fecha.y)
    txt(pdf, d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), C.fall_deceso_hora.x, C.fall_deceso_hora.y)
  }

  // Tipo de destino
  const dest = s.destino_final ?? ''
  checkbox(pdf, dest.includes('Piedad'),  C.cb_tierra.x,    C.cb_tierra.y)
  checkbox(pdf, dest.includes('Nicho'),   C.cb_nicho.x,     C.cb_nicho.y)
  checkbox(pdf, s.tipo_servicio === 'Cremación', C.cb_cremacion.x, C.cb_cremacion.y)

  // Sala
  checkbox(pdf, s.sala === 'Descanso Eterno', C.cb_sala_descanso.x, C.cb_sala_descanso.y)
  checkbox(pdf, s.sala === 'El Paraíso',      C.cb_sala_paraiso.x,  C.cb_sala_paraiso.y)
  checkbox(pdf, s.sala === 'Fénix',           C.cb_sala_fenix.x,    C.cb_sala_fenix.y)

  // Hora de inicio
  if (s.fecha_servicio) {
    const d = new Date(s.fecha_servicio)
    txt(pdf, d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), C.hora_inicio.x, C.hora_inicio.y)
  }

  // Tanato
  checkbox(pdf, s.tanatostetica, C.cb_tanatostetica.x, C.cb_tanatostetica.y)
  checkbox(pdf, s.tanatopraxia,  C.cb_tanatopraxia.x,  C.cb_tanatopraxia.y)

  // Vehículo
  checkbox(pdf, s.vehiculo === 'Carroza Americana', C.cb_carroza_a.x, C.cb_carroza_a.y)
  checkbox(pdf, s.vehiculo === 'Carroza Europea',   C.cb_carroza_e.x, C.cb_carroza_e.y)
  checkbox(pdf, s.vehiculo === 'Ambulancia',        C.cb_furgon.x,    C.cb_furgon.y)
  checkbox(pdf, s.coche_escolta,                    C.cb_escolta.x,   C.cb_escolta.y)

  // Destino y fecha
  txt(pdf, dest,                       C.destino_final.x, C.destino_final.y)
  txt(pdf, formatFecha(s.fecha_servicio), C.fecha_dest.x, C.fecha_dest.y)

  // Posadas - fecha doc
  const docFecha = s.fecha_servicio ? new Date(s.fecha_servicio) : new Date()
  txt(pdf, String(docFecha.getDate()).padStart(2, '0'), C.posadas_dia.x, C.posadas_dia.y)
  txt(pdf, docFecha.toLocaleString('es-AR', { month: 'long' }),          C.posadas_mes.x, C.posadas_mes.y)

  // Solicitante resumido (cuadro derecho)
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '', C.sol_resumido_nombre.x, C.sol_resumido_nombre.y)
    txt(pdf, s.deudo.whatsapp ?? s.deudo.telefono ?? '', C.sol_resumido_cel.x, C.sol_resumido_cel.y)
  }

  // Asesor
  txt(pdf, s.asesor, C.asesor.x, C.asesor.y)

  // Datos solicitante completo
  if (s.deudo) {
    txt(pdf, s.deudo.nombre ?? '',    C.sol_nombre.x,    C.sol_nombre.y)
    txt(pdf, s.deudo.dni ?? '',       C.sol_dni.x,       C.sol_dni.y)
    txt(pdf, s.deudo.whatsapp ?? s.deudo.telefono ?? '', C.sol_cel.x, C.sol_cel.y)
    txt(pdf, s.deudo.relacion_fallecido ?? '', C.sol_domicilio.x, C.sol_domicilio.y)
  }
}

export const F7_INFO: FormularioInfo = {
  id: 'F7',
  nombre: 'Conformidad del Servicio Principal',
  imagen: '/formularios/paz_7.jpeg',
  generarFn: generarF7,
}
