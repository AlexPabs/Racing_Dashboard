import { useState, useRef, useEffect, FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

const FONT_MONO = "'IBM Plex Mono', monospace"

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const { authenticated, tryLogin } = useAuth()
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authenticated) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [authenticated])

  if (authenticated) return <>{children}</>

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!tryLogin(input)) {
      setError(true)
      setShake(true)
      setInput('')
      setTimeout(() => { setShake(false); setError(false) }, 700)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#06080e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_MONO,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) translateY(-50%); }
          15%       { transform: translateX(-10px) translateY(-50%); }
          30%       { transform: translateX(10px) translateY(-50%); }
          45%       { transform: translateX(-7px) translateY(-50%); }
          60%       { transform: translateX(7px) translateY(-50%); }
          75%       { transform: translateX(-3px) translateY(-50%); }
          90%       { transform: translateX(3px) translateY(-50%); }
        }
        @keyframes shake-centered {
          0%, 100% { transform: translateX(0); }
          15%       { transform: translateX(-10px); }
          30%       { transform: translateX(10px); }
          45%       { transform: translateX(-7px); }
          60%       { transform: translateX(7px); }
          75%       { transform: translateX(-3px); }
          90%       { transform: translateX(3px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-line {
          0%   { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes border-pulse {
          0%, 100% { box-shadow: 0 0 0 0 #00C8FF22; }
          50%       { box-shadow: 0 0 0 8px #00C8FF08; }
        }
        .pw-card-shake {
          animation: shake-centered 0.6s ease-in-out;
        }
      `}</style>

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(#00C8FF 1px, transparent 1px),
          linear-gradient(90deg, #00C8FF 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, #00C8FF06 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent 0%, #00C8FF66 30%, #00C8FFcc 50%, #00C8FF66 70%, transparent 100%)',
        boxShadow: '0 0 40px 6px #00C8FF22',
      }} />

      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent, #00C8FF22, transparent)',
      }} />

      {/* Corner brackets */}
      {[
        { top: 24, left: 24, borderTop: '1px solid #00C8FF44', borderLeft: '1px solid #00C8FF44' },
        { top: 24, right: 24, borderTop: '1px solid #00C8FF44', borderRight: '1px solid #00C8FF44' },
        { bottom: 24, left: 24, borderBottom: '1px solid #00C8FF44', borderLeft: '1px solid #00C8FF44' },
        { bottom: 24, right: 24, borderBottom: '1px solid #00C8FF44', borderRight: '1px solid #00C8FF44' },
      ].map((style, i) => (
        <div key={i} style={{ position: 'absolute', width: 20, height: 20, ...style }} />
      ))}

      {/* Main card */}
      <div
        className={shake ? 'pw-card-shake' : ''}
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 36,
          width: '100%', maxWidth: 360,
          padding: '0 24px',
          animation: 'fade-up 0.7s ease-out',
        }}
      >
        {/* Logo block */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          {/* System label */}
          <div style={{
            fontSize: 9, letterSpacing: 6, color: '#1e2d3d',
            marginBottom: 14, textTransform: 'uppercase',
          }}>
            RACING SYSTEMS / v0.2
          </div>

          {/* Main title */}
          <div style={{
            fontSize: 32, fontWeight: 700, letterSpacing: 5,
            color: '#e2e8f0',
            textShadow: '0 0 40px #00C8FF33, 0 2px 0 #000',
            marginBottom: 8,
          }}>
            DASHBOARD
          </div>

          {/* Sub-title */}
          <div style={{
            fontSize: 9, letterSpacing: 4, color: '#1e2d3d',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            Sensor Interface · Teensy 4.1 Edition
          </div>

          {/* Decorative separator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '0 auto',
          }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #1e2d3d)' }} />
            <div style={{ display: 'flex', gap: 5 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 3, height: 3, borderRadius: '50%',
                  background: '#00C8FF',
                  animation: `pulse-dot ${1.2 + i * 0.35}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #1e2d3d, transparent)' }} />
          </div>
        </div>

        {/* Auth form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            width: '100%',
          }}
        >
          <div style={{
            fontSize: 9, letterSpacing: 3,
            color: error ? '#ff4444' : '#2a3a50',
            textTransform: 'uppercase',
            transition: 'color 0.2s',
            height: 14,
          }}>
            {error ? '— ACCESS DENIED —' : 'ENTER ACCESS CODE'}
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
              background: '#0a0e18',
              border: `1px solid ${error ? '#ff444466' : '#1e2d3d'}`,
              borderRadius: 8,
              color: '#00C8FF',
              fontFamily: FONT_MONO,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 10,
              padding: '13px 28px',
              outline: 'none',
              width: '100%',
              textAlign: 'center',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: error
                ? '0 0 0 3px #ff444422, inset 0 0 20px #ff444408'
                : '0 0 0 0 transparent',
              animation: 'border-pulse 2.5s ease-in-out infinite',
            }}
            onFocus={e => {
              if (!error) e.currentTarget.style.borderColor = '#00C8FF44'
            }}
            onBlur={e => {
              if (!error) e.currentTarget.style.borderColor = '#1e2d3d'
            }}
          />

          <button
            type="submit"
            style={{
              background: 'transparent',
              border: '1px solid #1e2d3d',
              borderRadius: 6,
              color: '#2a3a50',
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 3,
              padding: '9px 32px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              transition: 'all 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget
              t.style.borderColor = '#00C8FF55'
              t.style.color = '#00C8FF'
              t.style.background = '#00C8FF08'
            }}
            onMouseLeave={e => {
              const t = e.currentTarget
              t.style.borderColor = '#1e2d3d'
              t.style.color = '#2a3a50'
              t.style.background = 'transparent'
            }}
          >
            AUTHENTICATE
          </button>
        </form>

        {/* System status */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center',
          color: '#1a2535', fontSize: 9, letterSpacing: 1.5,
        }}>
          <span>SENSOR BOARD v0.2</span>
          <div style={{ width: 1, height: 10, background: '#1e2d3d' }} />
          <span>TEENSY 4.1</span>
          <div style={{ width: 1, height: 10, background: '#1e2d3d' }} />
          <span>ETHERNET</span>
        </div>
      </div>
    </div>
  )
}
