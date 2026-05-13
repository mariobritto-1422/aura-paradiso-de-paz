import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import PanelPage from './pages/PanelPage'
import AltaServicioPage from './pages/AltaServicioPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/panel" element={<PanelPage />} />
      <Route path="/alta-servicio" element={<AltaServicioPage />} />
    </Routes>
  )
}
