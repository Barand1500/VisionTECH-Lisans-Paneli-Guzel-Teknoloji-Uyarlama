/* ============================================= */
/*  Güzel Teknoloji - Uygulama Giriş Noktası     */
/*  React root oluşturma, ThemeProvider ve        */
/*  MusteriProvider sarmalama işlemleri            */
/* ============================================= */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './baglam/ThemeContext.jsx'
import { AuthProvider } from './baglam/AuthContext.jsx'
import { MusteriProvider } from './baglam/MusteriContext.jsx'
import { AktiviteLogProvider } from './baglam/AktiviteLogContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <MusteriProvider>
          <AktiviteLogProvider>
            <App />
          </AktiviteLogProvider>
        </MusteriProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
