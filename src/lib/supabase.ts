import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type DeudoFichado = {
  id: string
  created_at: string
  nombre: string | null
  dni: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  relacion_fallecido: string | null
  canal_notificacion: string | null
  session_token: string
  estado: 'activo' | 'completo' | 'abandonado'
}

export type DocumentacionRecibida = {
  acta_defuncion: { original: boolean; copia: boolean }
  libreta_matrimonio: { original: boolean; copia: boolean }
  recibo_haberes: { original: boolean; copia: boolean }
  factura: { original: boolean; copia: boolean }
  cenizas_cert: { original: boolean; copia: boolean }
  carnet_obra_social: { original: boolean; copia: boolean }
  otros: string
}

export type Servicio = {
  id: string
  created_at: string
  numero_orden: number
  deudo_id: string | null
  fallecido_nombre: string
  fallecido_dni: string | null
  fallecido_fecha_nacimiento: string | null
  fallecido_fecha_deceso: string | null
  fallecido_lugar_deceso: string | null
  fallecido_nacionalidad: string | null
  fallecido_estado_civil: string | null
  fallecido_religion: string | null
  fallecido_profesion: string | null
  fallecido_obra_social: string | null
  fallecido_beneficio_nro: string | null
  fallecido_talla: string | null
  fallecido_peso_kg: number | null
  fallecido_causa_fallecimiento: string | null
  tipo_servicio: string
  ataud_tipo: string | null
  ataud_medida: number | null
  ataud_ancho: string | null
  sala: string | null
  sala_domicilio: string | null
  capilla_ardiente: string | null
  tipo_entierro: string | null
  preparador: string | null
  vehiculo: string | null
  coche_escolta: boolean
  coche_escolta_cantidad: number
  furgon_sanitario: boolean
  coche_funebre: boolean
  coche_porta_corona: boolean
  coche_acompanamiento: boolean
  refrigerador: boolean
  tanatostetica: boolean
  tanatopraxia: boolean
  destino_final: string | null
  fecha_servicio: string | null
  ataud_urna_id: string | null
  documentacion: DocumentacionRecibida | null
  asesor: string | null
  estado: string
}

export type Usuario = {
  id: string
  nombre: string
  rol: 'Administrador' | 'Operador'
  created_at: string
}

export type ServicioConDeudo = Servicio & {
  deudo: DeudoFichado | null
}
