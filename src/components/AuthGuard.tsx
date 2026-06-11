import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

type Props = {
  children: ReactNode
  allowedRoles?: ('administrador' | 'operador')[]
}

export default function AuthGuard({ children, allowedRoles }: Props) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Cargando...</div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/panel" replace />
  }

  return <>{children}</>
}
