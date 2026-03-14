import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { MedicationsProvider } from './hooks/useMedications'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MedicationsProvider>
          <App />
        </MedicationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
