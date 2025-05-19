import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import './theme.css'
import App from './View.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
