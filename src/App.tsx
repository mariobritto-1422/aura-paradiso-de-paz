import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import PanelPage from './pages/PanelPage'
import AltaServicioPage from './pages/AltaServicioPage'
import ServicioDetallePage from './pages/ServicioDetallePage'
import CalibradorPage from './pages/CalibradorPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/panel" element={<PanelPage />} />
      <Route path="/alta-servicio" element={<AltaServicioPage />} />
      <Route path="/servicio/:id" element={<ServicioDetallePage />} />
      <Route path="/calibrar" element={<CalibradorPage />} />
    </Routes>
  )
}
