/**
 * crear-usuarios.mjs — AURA Paraíso de Paz
 *
 * Uso:
 *   SUPABASE_SERVICE_KEY=<tu-service-role-key> node crear-usuarios.mjs
 *
 * Solo crea los 2 usuarios nuevos. No toca los usuarios ya existentes.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://goyakolgaqkaxoqmyewn.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: falta la variable de entorno SUPABASE_SERVICE_KEY')
  console.error('Uso: SUPABASE_SERVICE_KEY=<key> node crear-usuarios.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const USUARIOS_NUEVOS = [
  {
    email: 'jesica.garcete@paraisodepaz.ar',
    password: 'garcete2026',
    nombre: 'Jesica Garcete',
    rol: 'operador',
  },
  {
    email: 'operario@paraisodepaz.ar',
    password: 'operario2026',
    nombre: 'Operario Guardia',
    rol: 'operador',
  },
]

async function crearUsuario(u) {
  console.log(`\n→ Creando: ${u.nombre} (${u.email})`)

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  })

  if (authError) {
    console.error(`  ✗ Auth: ${authError.message}`)
    return false
  }
  console.log(`  ✓ Auth creado: ${authData.user.id}`)

  const { error: dbError } = await supabase
    .from('usuarios_sistema')
    .insert({
      id: authData.user.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      password_changed: false,
      activo: true,
    })

  if (dbError) {
    console.error(`  ✗ DB: ${dbError.message}`)
    return false
  }

  console.log(`  ✓ usuarios_sistema insertado`)
  return true
}

async function main() {
  console.log('=== AURA — Crear usuarios nuevos ===')
  let ok = 0
  for (const u of USUARIOS_NUEVOS) {
    if (await crearUsuario(u)) ok++
  }
  console.log(`\n=== ${ok}/${USUARIOS_NUEVOS.length} usuarios creados ===`)
  if (ok < USUARIOS_NUEVOS.length) process.exit(1)
}

main()
