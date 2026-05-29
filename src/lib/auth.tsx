import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from './supabase'

type Rol = 'administrador' | 'operador'

export type AuthUser = {
  id: string
  email: string
  nombre: string
  rol: Rol
  passwordChanged: boolean
}

type AuthCtx = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  markPasswordChanged: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

async function fetchPerfil(email: string) {
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .select('nombre, rol, password_changed')
    .eq('email', email)
    .eq('activo', true)
    .single()
  if (error || !data) return null
  return { nombre: data.nombre, rol: data.rol as Rol, password_changed: data.password_changed }
}

async function buildUser(id: string, email: string): Promise<AuthUser | null> {
  const perfil = await fetchPerfil(email)
  if (!perfil) return null
  return { id, email, nombre: perfil.nombre, rol: perfil.rol, passwordChanged: perfil.password_changed }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Solo onAuthStateChange — no getSession() por separado.
    // INITIAL_SESSION es el evento que reemplaza getSession() en Supabase v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        try {
          if (session?.user?.email) {
            const u = await buildUser(session.user.id, session.user.email)
            setUser(u)
          } else {
            setUser(null)
          }
        } catch {
          // Sesión corrupta o token inválido → limpiar y forzar login
          await supabase.auth.signOut()
          setUser(null)
        } finally {
          setLoading(false) // Siempre resuelve, sin importar qué
        }

      } else if (event === 'SIGNED_IN') {
        if (session?.user?.email) {
          try {
            const u = await buildUser(session.user.id, session.user.email)
            if (u) setUser(u)
          } catch {
            await supabase.auth.signOut()
            setUser(null)
          }
        }

      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      // TOKEN_REFRESHED y otros eventos: ignorar, no llamar buildUser
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'Email o contraseña incorrectos'
    if (data.user?.email) {
      try {
        const u = await buildUser(data.user.id, data.user.email)
        if (!u) {
          await supabase.auth.signOut()
          return 'Usuario sin acceso al sistema'
        }
        setUser(u)
      } catch {
        await supabase.auth.signOut()
        return 'Error al cargar el perfil. Intentá de nuevo.'
      }
    }
    return null
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function markPasswordChanged() {
    if (!user) return
    await supabase
      .from('usuarios_sistema')
      .update({ password_changed: true })
      .eq('email', user.email)
    setUser(prev => prev ? { ...prev, passwordChanged: true } : null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, markPasswordChanged }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}
