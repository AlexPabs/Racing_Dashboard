import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { PasswordGate } from './components/PasswordGate'
import { Dashboard } from './components/Dashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <PasswordGate>
        <DashboardProvider>
          <Dashboard />
        </DashboardProvider>
      </PasswordGate>
    </AuthProvider>
  </StrictMode>
)
