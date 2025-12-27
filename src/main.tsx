import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register';

import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App.tsx'

// This will automatically update the app when a new version is available
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
