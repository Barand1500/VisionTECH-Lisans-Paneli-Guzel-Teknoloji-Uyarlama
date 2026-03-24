/* ============================================= */
/*  Güzel Teknoloji - Uygulama Giriş Noktası     */
/*  React root oluşturma, ThemeProvider ve        */
/*  MusteriProvider sarmalama işlemleri            */
/* ============================================= */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { MusteriProvider } from './context/MusteriContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <MusteriProvider>
        <App />
      </MusteriProvider>
    </ThemeProvider>
  </StrictMode>,
)
