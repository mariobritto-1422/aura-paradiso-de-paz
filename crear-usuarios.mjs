/**
 * crear-usuarios.mjs — AURA Paraíso de Paz
 * Uso: node crear-usuarios.mjs
 *
 * Crea dos usuarios nuevos en Supabase Auth + tabla usuarios_sistema.
 * Ejecutar UNA sola vez. Si los usuarios ya existen, el script falla con error descriptivo.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://goyakolgaqkaxoqmyewn.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdveWFrb2xnYXFrYXhvcW15ZXduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY5NDU5MSwiZXhwIjoyMDk0MjcwNTkxfQ.wvWxqai1QO0EMqcNxbz7qKehe1KDuvhUlk3hvkkZNl0'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const USUARIOS = [
  {
    email: 'jesica.garcete@paraisodepaz.ar',
    password: 'garcete2026',
    nombre: 'Jesica Garcete',
    rol: 'operador',
    whatsapp: '5493764693755',
  },
  {
    email: 'operario@paraisodepaz.ar',
    password: 'operario2026',
    nombre: 'Operario Guardia',
    rol: 'operador',
    whatsapp: null,
  },
]

async function crearUsuario(u) {
  console.log(`\n→ Creando: ${u.nombre} (${u.email})`)

  // 1. Crear en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  })

  if (authError) {
    console.error(`  ✗ Auth error: ${authError.message}`)
    return false
  }
  console.log(`  ✓ Auth creado: ${authData.user.id}`)

  // 2. Insertar en usuarios_sistema
  const registro = {
    id: authData.user.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    password_changed: false,
    activo: true,
  }

  // Incluir whatsapp solo si existe la columna (falla silenciosamente si no)
  if (u.whatsapp) registro.whatsapp = u.whatsapp

  const { error: dbError } = await supabase
    .from('usuarios_sistema')
    .insert(registro)

  if (dbError) {
    // Si falla por columna whatsapp inexistente, reintentar sin ella
    if (dbError.message.includes('whatsapp') && u.whatsapp) {
      console.warn(`  ⚠ Columna whatsapp no existe, insertando sin ella`)
      delete registro.whatsapp
      const { error: retryError } = await supabase
        .from('usuarios_sistema')
        .insert(registro)
      if (retryError) {
        console.error(`  ✗ DB error: ${retryError.message}`)
        return false
      }
    } else {
      console.error(`  ✗ DB error: ${dbError.message}`)
      return false
    }
  }

  console.log(`  ✓ usuarios_sistema insertado`)
  return true
}

async function main() {
  console.log('=== AURA — Crear usuarios nuevos ===')
  let ok = 0
  for (const u of USUARIOS) {
    const resultado = await crearUsuario(u)
    if (resultado) ok++
  }
  console.log(`\n=== Resultado: ${ok}/${USUARIOS.length} usuarios creados ===`)
  if (ok < USUARIOS.length) {
    console.log('Revisá los errores arriba. Los usuarios con error NO fueron creados.')
    process.exit(1)
  }
}

main()
