import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "./App.css";
import App from './App.jsx'

// point d'entrée de l'app : monte le composant racine dans la div #root d'index.html
createRoot(document.getElementById('root')).render(
  // StrictMode aide à détecter les effets de bord en dev (double-render volontaire)
  <StrictMode>
    <App />
  </StrictMode>,
)
