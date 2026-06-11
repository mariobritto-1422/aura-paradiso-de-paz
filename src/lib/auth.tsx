import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from './supabase'

type Rol = 'administrador' | 'operador'

export type AuthUser = {
  id: string
  email: string
  nombre: string
  rol: Rol
}

type AuthCtx = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function fetchPerfil(email: string) {
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('nombre, rol')
    .eq('email', email)
    .eq('activo', true)
    .single()
  if (error || !data) return null
  return { nombre: data.nombre, rol: data.rol as Rol }
}

async function buildUser(id: string, email: string): Promise<AuthUser | null> {
  const perfil = await fetchPerfil(email)
  if (!perfil) return null
  return { id, email, nombre: perfil.nombre, rol: perfil.rol }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let resolved = false
    let timeoutId: ReturnType<typeof setTimeout>

    // Llamar una sola vez: la primera llamada resuelve el estado de auth.
    // Las posteriores (ej: timeout que llega tarde) se ignoran.
    function forceResolve(u: AuthUser | null) {
      if (resolved) return
      resolved = true
      clearTimeout(timeoutId)
      setUser(u)
      setLoading(false)
    }

    // Timeout de seguridad: si INITIAL_SESSION no dispara en 5s (SDK colgado,
    // token corrupto, red sin respuesta) → limpiar tokens y redirigir al login.
    timeoutId = setTimeout(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k))
      forceResolve(null)
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        try {
          if (session?.user?.email) {
            const u = await buildUser(session.user.id, session.user.email)
            forceResolve(u)
          } else {
            forceResolve(null)
          }
        } catch {
          try { await supabase.auth.signOut() } catch {}
          forceResolve(null)
        }

      } else if (event === 'SIGNED_IN') {
        if (session?.user?.email) {
          try {
            const u = await buildUser(session.user.id, session.user.email)
            if (u) setUser(u)
          } catch {
            try { await supabase.auth.signOut() } catch {}
            setUser(null)
          }
        }

      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    try {
      // Limpiar sesión previa para evitar que el SDK quede esperando un refresh
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>(resolve => setTimeout(resolve, 2000)),
      ]).catch(() => {})

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return 'Email o contraseña incorrectos'
      if (data.user?.email) {
        const u = await buildUser(data.user.id, data.user.email)
        if (!u) {
          supabase.auth.signOut().catch(() => {})
          return 'Sin acceso al sistema. Contactar al administrador.'
        }
        setUser(u)
      }
      return null
    } catch {
      supabase.auth.signOut().catch(() => {})
      return 'Error al verificar el acceso. Intentá de nuevo.'
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
