import { createContext, useContext, useState, ReactNode } from 'react'

const PASSWORD = '1337'
const COOKIE_KEY = 'racing_auth'
const COOKIE_DAYS = 30

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const match = document.cookie.split('; ').find(row => row.startsWith(name + '='))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

interface AuthCtx {
  authenticated: boolean
  tryLogin: (pw: string) => boolean
}

const AuthContext = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return getCookie(COOKIE_KEY) === 'ok'
  })

  const tryLogin = (pw: string): boolean => {
    if (pw === PASSWORD) {
      setCookie(COOKIE_KEY, 'ok', COOKIE_DAYS)
      setAuthenticated(true)
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider value={{ authenticated, tryLogin }}>
      {children}
    </AuthContext.Provider>
  )
}
