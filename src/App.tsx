import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import PanelPage from './pages/PanelPage'
import AltaServicioPage from './pages/AltaServicioPage'
import ServicioDetallePage from './pages/ServicioDetallePage'
import CalibradorPage from './pages/CalibradorPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import PasswordGate from './components/PasswordGate'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/panel" element={<PasswordGate><PanelPage /></PasswordGate>} />
      <Route path="/alta-servicio" element={<PasswordGate><AltaServicioPage /></PasswordGate>} />
      <Route path="/servicio/:id" element={<PasswordGate><ServicioDetallePage /></PasswordGate>} />
      <Route path="/configuracion" element={<PasswordGate><ConfiguracionPage /></PasswordGate>} />
      <Route path="/calibrar" element={<CalibradorPage />} />
    </Routes>
  )
}
