import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ── Versioning de localStorage ────────────────────────────────────────────────
// Incrementar APP_VERSION en cada deploy que modifique el schema de auth/datos
// locales. El browser limpiará el localStorage automáticamente y redirigirá al
// login, sin intervención manual del usuario.
export const APP_VERSION = '1.0.1'
const STORAGE_VERSION_KEY = 'aura_app_version'

if (localStorage.getItem(STORAGE_VERSION_KEY) !== APP_VERSION) {
  localStorage.clear()
  localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
}
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
