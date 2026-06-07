import { useState, useRef, useEffect, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const { authenticated, tryLogin } = useAuth()
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authenticated) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [authenticated])

  if (authenticated) return <>{children}</>

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!tryLogin(input)) {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => { setShake(false); setError(false) }, 600)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#060a10',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(#00C8FF 1px, transparent 1px),
          linear-gradient(90deg, #00C8FF 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow effect top */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 2,
        background: 'linear-gradient(90deg, transparent, #00C8FF88, transparent)',
        boxShadow: '0 0 60px 20px #00C8FF22',
      }} />

      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 32,
        animation: shake ? 'shake 0.5s ease-in-out' : 'none',
      }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            15%       { transform: translateX(-8px); }
            30%       { transform: translateX(8px); }
            45%       { transform: translateX(-6px); }
            60%       { transform: translateX(6px); }
            75%       { transform: translateX(-3px); }
            90%       { transform: translateX(3px); }
          }
          @keyframes pulse-border {
            0%, 100% { box-shadow: 0 0 0 0 #00C8FF33; }
            50% { box-shadow: 0 0 0 6px #00C8FF11; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Logo / title */}
        <div style={{ textAlign: 'center', animation: 'fade-in 0.6s ease-out' }}>
          <div style={{
            fontSize: 11, letterSpacing: 6, color: '#2a3040',
            marginBottom: 10, textTransform: 'uppercase',
          }}>
            RACING SYSTEMS
          </div>
          <div style={{
            fontSize: 28, fontWeight: 700, letterSpacing: 4,
            color: '#e2e8f0',
            textShadow: '0 0 30px #00C8FF44',
          }}>
            DASHBOARD
          </div>
          <div style={{
            marginTop: 6, fontSize: 11, letterSpacing: 3,
            color: '#2a3040', textTransform: 'uppercase',
          }}>
            Sensor Interface v0.2
          </div>
          {/* Decorative line */}
          <div style={{
            marginTop: 16,
            height: 1, width: 200,
            background: 'linear-gradient(90deg, transparent, #00C8FF44, transparent)',
            margin: '16px auto 0',
          }} />
        </div>

        {/* Auth form */}
        <form onSubmit={handleSubmit}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            animation: 'fade-in 0.8s ease-out',
          }}>
          <div style={{
            fontSize: 10, letterSpacing: 3, color: error ? '#ff4444' : '#4a5568',
            textTransform: 'uppercase', transition: 'color 0.2s',
          }}>
            {error ? 'ACCESS DENIED' : 'ENTER ACCESS CODE'}
          </div>

          <input
            ref={inputRef}
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="• • • •"
            maxLength={16}
            autoComplete="current-password"
            style={{
              background: '#0a0f18',
              border: `1px solid ${error ? '#ff444466' : '#1a2030'}`,
              borderRadius: 8,
              color: '#00C8FF',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 8,
              padding: '12px 24px',
              outline: 'none',
              width: 200,
              textAlign: 'center',
              animation: 'pulse-border 2s ease-in-out infinite',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: error ? '0 0 0 3px #ff444422' : '0 0 0 0 transparent',
            }}
          />

          <button type="submit" style={{
            background: 'transparent',
            border: '1px solid #1a2030',
            borderRadius: 6,
            color: '#4a5568',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            padding: '8px 24px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.borderColor = '#00C8FF44'
              t.style.color = '#00C8FF'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.borderColor = '#1a2030'
              t.style.color = '#4a5568'
            }}
          >
            AUTHENTICATE
          </button>
        </form>

        {/* Status dots */}
        <div style={{
          display: 'flex', gap: 6, alignItems: 'center',
          animation: 'fade-in 1s ease-out',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 4, height: 4, borderRadius: '50%',
              background: '#1a2030',
              animation: `pulse-border ${1.2 + i * 0.4}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
