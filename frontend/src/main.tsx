import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { Dashboard } from './components/Dashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DashboardProvider>
        <Dashboard />
      </DashboardProvider>
    </AuthProvider>
  </StrictMode>
)
