import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import AuthGuard from './components/AuthGuard'
import LoginPage from './pages/LoginPage'
import CambiarContrasenaPage from './pages/CambiarContrasenaPage'
import FormPage from './pages/FormPage'
import PanelPage from './pages/PanelPage'
import AltaServicioPage from './pages/AltaServicioPage'
import ServicioDetallePage from './pages/ServicioDetallePage'
import CalibradorPage from './pages/CalibradorPage'
import ConfiguracionPage from './pages/ConfiguracionPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<FormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/calibrar" element={<CalibradorPage />} />

        {/* Cambio de contraseña obligatorio — requiere auth pero no passwordChanged */}
        <Route path="/cambiar-contrasena" element={
          <AuthGuard skipPasswordCheck>
            <CambiarContrasenaPage />
          </AuthGuard>
        } />

        {/* Panel y operaciones — requieren auth + passwordChanged */}
        <Route path="/panel" element={<AuthGuard><PanelPage /></AuthGuard>} />
        <Route path="/alta-servicio" element={<AuthGuard><AltaServicioPage /></AuthGuard>} />
        <Route path="/servicio/:id" element={<AuthGuard><ServicioDetallePage /></AuthGuard>} />

        {/* Solo administrador */}
        <Route path="/configuracion" element={
          <AuthGuard allowedRoles={['administrador']}>
            <ConfiguracionPage />
          </AuthGuard>
        } />

        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </AuthProvider>
  )
}
