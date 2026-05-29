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

type PerfilDB = { nombre: string; rol: Rol; password_changed: boolean }

async function fetchPerfil(email: string): Promise<PerfilDB | null> {
  const { data } = await supabase
    .from('usuarios_sistema')
    .select('nombre, rol, password_changed')
    .eq('email', email)
    .eq('activo', true)
    .single()
  return data ? { nombre: data.nombre, rol: data.rol as Rol, password_changed: data.password_changed } : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function buildUser(id: string, email: string): Promise<AuthUser | null> {
    const perfil = await fetchPerfil(email)
    if (!perfil) return null
    return { id, email, nombre: perfil.nombre, rol: perfil.rol, passwordChanged: perfil.password_changed }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email) {
        const u = await buildUser(session.user.id, session.user.email)
        setUser(u)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        const u = await buildUser(session.user.id, session.user.email)
        setUser(u)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return 'Email o contraseña incorrectos'
    if (data.user?.email) {
      const u = await buildUser(data.user.id, data.user.email)
      if (!u) {
        await supabase.auth.signOut()
        return 'Usuario sin acceso al sistema'
      }
      setUser(u)
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
