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
