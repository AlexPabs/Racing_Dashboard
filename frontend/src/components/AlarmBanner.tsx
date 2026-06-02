import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '../contexts/DashboardContext'

interface Alarm {
  id: string
  message: string
  critical: boolean
  ts: number
}

export function AlarmBanner() {
  const { config } = useDashboard()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [toasts, setToasts] = useState<Alarm[]>([])
  const prevStates = useRef<Record<string, 'ok' | 'warn' | 'crit'>>({})
  const [klar, setKlar] = useState(false)

  // Vent 4 sekunder etter oppstart før alarmer aktiveres (sensorer trenger tid til å laste)
  useEffect(() => {
    const t = setTimeout(() => setKlar(true), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!klar) return
    const newAlarms: Alarm[] = []
    const newToasts: Alarm[] = []

    for (const s of config.sensors) {
      const v = s.value
      let state: 'ok' | 'warn' | 'crit' = 'ok'

      if ((s.critMax !== undefined && v >= s.critMax) || (s.critMin !== undefined && v <= s.critMin)) {
        state = 'crit'
      } else if ((s.warnMax !== undefined && v >= s.warnMax) || (s.warnMin !== undefined && v <= s.warnMin)) {
        state = 'warn'
      }

      const prev = prevStates.current[s.id] ?? 'ok'

      if (state === 'crit') {
        let msg = ''
        if (s.critMax !== undefined && v >= s.critMax) msg = `${s.name} KRITISK HØY: ${v.toFixed(s.decimals)} ${s.unit}`
        if (s.critMin !== undefined && v <= s.critMin) msg = `${s.name} KRITISK LAV: ${v.toFixed(s.decimals)} ${s.unit}`
        newAlarms.push({ id: s.id, message: msg, critical: true, ts: Date.now() })
        if (prev !== 'crit') newToasts.push({ id: s.id + '_t', message: msg, critical: true, ts: Date.now() })
      } else if (state === 'warn' && prev === 'ok') {
        let msg = ''
        if (s.warnMax !== undefined && v >= s.warnMax) msg = `${s.name} advarsel: ${v.toFixed(s.decimals)} ${s.unit}`
        if (s.warnMin !== undefined && v <= s.warnMin) msg = `${s.name} advarsel: ${v.toFixed(s.decimals)} ${s.unit}`
        newToasts.push({ id: s.id + '_t', message: msg, critical: false, ts: Date.now() })
      }

      prevStates.current[s.id] = state
    }

    setAlarms(newAlarms)
    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts])
      setTimeout(() => setToasts(prev => prev.filter(t => !newToasts.find(n => n.id === t.id))), 4000)
    }
  }, [config.sensors, klar])

  const hasCritical = alarms.some(a => a.critical)

  return (
    <>
      {/* Vedvarende rød banner ved kritisk alarm */}
      {hasCritical && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          background: 'rgba(255,20,20,0.15)',
          border: '2px solid #ff2020',
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          zIndex: 9000,
          padding: '10px 24px',
          display: 'flex', flexDirection: 'column', gap: 4,
          backdropFilter: 'blur(4px)',
          animation: 'pulse-red 1s ease-in-out infinite',
        }}>
          <style>{`
            @keyframes pulse-red {
              0%, 100% { background: rgba(255,20,20,0.15); }
              50% { background: rgba(255,20,20,0.28); }
            }
          `}</style>
          {alarms.map(a => (
            <div key={a.id} style={{
              color: '#ff4444', fontFamily: 'IBM Plex Mono, monospace',
              fontWeight: 700, fontSize: 14, letterSpacing: 2,
              textTransform: 'uppercase',
              textShadow: '0 0 12px #ff2020',
            }}>
              ⚠ {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Toast-notifikasjoner (advarsel + info) */}
      <div style={{
        position: 'fixed', bottom: 24, right: 20,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 8500, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.critical ? 'rgba(255,20,20,0.9)' : 'rgba(255,170,0,0.9)',
            color: '#fff',
            fontFamily: 'IBM Plex Mono, monospace',
            fontWeight: 600, fontSize: 12,
            padding: '8px 14px', borderRadius: 8,
            boxShadow: `0 4px 16px ${t.critical ? '#ff202088' : '#ffaa0088'}`,
            animation: 'slide-in 0.2s ease-out',
            letterSpacing: 1,
          }}>
            <style>{`@keyframes slide-in { from { opacity:0; transform: translateX(20px) } to { opacity:1; transform: translateX(0) } }`}</style>
            {t.critical ? '⚠ ' : '⚡ '}{t.message}
          </div>
        ))}
      </div>
    </>
  )
}
