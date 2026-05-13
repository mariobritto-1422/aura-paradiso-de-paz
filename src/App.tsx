import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import PanelPage from './pages/PanelPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FormPage />} />
      <Route path="/panel" element={<PanelPage />} />
    </Routes>
  )
}
