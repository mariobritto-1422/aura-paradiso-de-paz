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

function clearBadTokens() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sb-'))
    .forEach(k => localStorage.removeItem(k))
}

async function fetchPerfil(email: string) {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('usuarios_sistema')
        .select('nombre, rol')
        .eq('email', email)
        .eq('activo', true)
        .single(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('profile-timeout')), 5000)
      ),
    ])
    if (error || !data) return null
    return { nombre: data.nombre, rol: data.rol as Rol }
  } catch {
    return null
  }
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
    let mounted = true

    async function init() {
      try {
        // getSession() reads localStorage. If the access token is expired and
        // autoRefreshToken=true, the SDK makes a network call to refresh.
        // We enforce a 4s hard limit to prevent an infinite hang on slow networks.
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('session-timeout')), 4000)
          ),
        ])

        const session = result.data.session

        if (!session?.user?.email) {
          if (mounted) { setUser(null); setLoading(false) }
          return
        }

        const u = await buildUser(session.user.id, session.user.email)
        if (mounted) { setUser(u); setLoading(false) }

      } catch {
        // Covers: 4s timeout, network error, corrupted session, RLS block.
        // Do NOT await signOut here — it's a network call that can itself hang.
        clearBadTokens()
        supabase.auth.signOut({ scope: 'local' }).catch(() => {})
        if (mounted) { setUser(null); setLoading(false) }
      }
    }

    init()

    // Handle auth changes that happen AFTER init() resolves (login, logout, token refresh).
    // INITIAL_SESSION is intentionally ignored here — init() handles the initial state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null)
      } else if (event === 'SIGNED_IN') {
        if (session?.user?.email) {
          const u = await buildUser(session.user.id, session.user.email)
          if (mounted && u) setUser(u)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    try {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return 'Email o contraseña incorrectos'
      if (data.user?.email) {
        const u = await buildUser(data.user.id, data.user.email)
        if (!u) {
          supabase.auth.signOut({ scope: 'local' }).catch(() => {})
          return 'Sin acceso al sistema. Contactar al administrador.'
        }
        setUser(u)
      }
      return null
    } catch {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {})
      return 'Error al verificar el acceso. Intentá de nuevo.'
    }
  }

  async function logout() {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
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
