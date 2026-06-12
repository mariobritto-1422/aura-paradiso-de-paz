import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// APP_VERSION is managed in index.html (inline script runs before SDK init).
// Incrementar allí en cada deploy que modifique el schema de auth/localStorage.
export const APP_VERSION = '1.0.2'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
