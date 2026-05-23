import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initNotificationService } from './lib/notifications'
import { initTheme } from './lib/settings'
import './index.css'
import App from './App.tsx'

initTheme()
void initNotificationService()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
