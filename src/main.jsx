import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/store-v2-layout-fix.css'
import './styles/store-v2-final-hero.css'
import './styles/mobile-collection-fix.css'
import './styles/store-search.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
