import { useEffect, useRef, useState } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'

interface DragTimes {
  sixtyFt: number | null
  eighthMile: number | null
  quarterMile: number | null
  topSpeed: number
}

export function DragPanel({ onClose }: { onClose: () => void }) {
  const { config } = useDashboard()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [times, setTimes] = useState<DragTimes>({ sixtyFt: null, eighthMile: null, quarterMile: null, topSpeed: 0 })
  const [lineLock, setLineLock] = useState(false)
  const startRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const peakSpeed = useRef(0)
  const distRef = useRef(0)
  const lastSpeedRef = useRef(0)
  const lastTsRef = useRef<number | null>(null)

  const rpm = config.sensors.find(s => s.id === 'rpm')?.value ?? 0
  const speed = config.sensors.find(s => s.id === 'speed')?.value ?? 0

  const rpmPct = Math.max(0, Math.min(1, rpm / 6500))
  const redline = 5800
  const shiftColor = rpm >= 6200 ? '#ff2020' : rpm >= redline ? '#ffaa00' : rpm >= 5000 ? '#a8ff3e' : '#00C8FF'

  // Automatisk start ved bevegelse
  useEffect(() => {
    if (!running && speed > 3 && lineLock === false) {
      handleStart()
    }
  }, [speed, lineLock])

  // Oppdater distance og split-tider
  useEffect(() => {
    if (!running) return
    const now = Date.now()
    if (lastTsRef.current !== null) {
      const dt = (now - lastTsRef.current) / 1000
      const avgSpeed = (speed + lastSpeedRef.current) / 2
      distRef.current += (avgSpeed / 3.6) * dt

      const dist = distRef.current
      const t = elapsed

      if (times.sixtyFt === null && dist >= 18.29) {
        setTimes(prev => ({ ...prev, sixtyFt: t }))
      }
      if (times.eighthMile === null && dist >= 201.17) {
        setTimes(prev => ({ ...prev, eighthMile: t }))
      }
      if (times.quarterMile === null && dist >= 402.34) {
        setTimes(prev => ({ ...prev, quarterMile: t }))
        handleStop()
      }
    }
    if (speed > peakSpeed.current) {
      peakSpeed.current = speed
      setTimes(prev => ({ ...prev, topSpeed: speed }))
    }
    lastSpeedRef.current = speed
    lastTsRef.current = now
  }, [speed, running])

  function handleStart() {
    if (running) return
    setRunning(true)
    setElapsed(0)
    setTimes({ sixtyFt: null, eighthMile: null, quarterMile: null, topSpeed: 0 })
    distRef.current = 0
    peakSpeed.current = 0
    lastTsRef.current = Date.now()
    lastSpeedRef.current = speed
    startRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      setElapsed(((Date.now() - startRef.current!) / 1000))
    }, 50)
  }

  function handleStop() {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  function handleReset() {
    handleStop()
    setElapsed(0)
    setTimes({ sixtyFt: null, eighthMile: null, quarterMile: null, topSpeed: 0 })
    distRef.current = 0
    peakSpeed.current = 0
    lastTsRef.current = null
  }

  const fmt = (t: number | null) => t === null ? '--.-—' : t.toFixed(3)

  const shiftDots = Array.from({ length: 8 }, (_, i) => {
    const threshold = 4200 + i * 300
    const active = rpm >= threshold
    const dotColor = threshold >= 6200 ? '#ff2020' : threshold >= 5800 ? '#ffaa00' : '#a8ff3e'
    return { active, dotColor }
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0D1117',
      zIndex: 5000,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid #1a2030' }}>
        <span style={{ color: '#00C8FF', fontWeight: 700, fontSize: 13, letterSpacing: 3 }}>DRAG MODUS</span>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #333', color: '#555', cursor: 'pointer', borderRadius: 6, padding: '4px 12px', fontSize: 11 }}>✕ LUKK</button>
      </div>

      {/* Shift-lys */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '14px 0 8px' }}>
        {shiftDots.map((d, i) => (
          <div key={i} style={{
            width: 22, height: 22, borderRadius: '50%',
            background: d.active ? d.dotColor : '#1a2030',
            boxShadow: d.active ? `0 0 12px ${d.dotColor}` : 'none',
            transition: 'all 0.05s',
            border: `1px solid ${d.active ? d.dotColor : '#2a3040'}`,
          }} />
        ))}
      </div>

      {/* Stor RPM */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <div style={{ color: '#444', fontSize: 11, letterSpacing: 3 }}>TURTALL</div>
        <div style={{
          fontSize: 'clamp(72px, 15vw, 140px)',
          fontWeight: 700, color: shiftColor,
          textShadow: `0 0 40px ${shiftColor}66`,
          lineHeight: 1, letterSpacing: -2,
          transition: 'color 0.1s, text-shadow 0.1s',
        }}>
          {Math.round(rpm).toLocaleString('no-NO')}
        </div>
        <div style={{ color: '#444', fontSize: 13, letterSpacing: 4 }}>RPM</div>

        {/* RPM bar */}
        <div style={{ width: '80%', maxWidth: 600, height: 8, background: '#1a2030', borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
          <div style={{
            width: `${rpmPct * 100}%`, height: '100%',
            background: `linear-gradient(90deg, #00C8FF, ${shiftColor})`,
            boxShadow: `0 0 8px ${shiftColor}`,
            transition: 'width 0.05s ease',
            borderRadius: 4,
          }} />
        </div>
        <div style={{ color: '#333', fontSize: 10, letterSpacing: 2 }}>RØDLINJE 6500</div>
      </div>

      {/* Timer + splits */}
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'TID', value: elapsed.toFixed(2) + 's', active: running },
          { label: '60 FOT', value: fmt(times.sixtyFt) + 's', active: times.sixtyFt !== null },
          { label: '1/8 MILE', value: fmt(times.eighthMile) + 's', active: times.eighthMile !== null },
          { label: '1/4 MILE', value: fmt(times.quarterMile) + 's', active: times.quarterMile !== null },
        ].map(cell => (
          <div key={cell.label} style={{
            background: '#0a0f18', borderRadius: 10,
            border: `1px solid ${cell.active ? '#00C8FF33' : '#1a2030'}`,
            padding: '12px 16px', textAlign: 'center',
          }}>
            <div style={{ color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{cell.label}</div>
            <div style={{ color: cell.active ? '#00C8FF' : '#333', fontSize: 22, fontWeight: 700 }}>{cell.value}</div>
          </div>
        ))}
      </div>

      {/* Topphastighet + hastighet */}
      <div style={{ padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#0a0f18', borderRadius: 10, border: '1px solid #1a2030', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: 2 }}>HASTIGHET</div>
          <div style={{ color: '#00C8FF', fontSize: 28, fontWeight: 700 }}>{speed.toFixed(0)} <span style={{ fontSize: 12, color: '#444' }}>km/h</span></div>
        </div>
        <div style={{ background: '#0a0f18', borderRadius: 10, border: '1px solid #1a2030', padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ color: '#444', fontSize: 10, letterSpacing: 2 }}>TOPPHASTIGHET</div>
          <div style={{ color: '#a8ff3e', fontSize: 28, fontWeight: 700 }}>{times.topSpeed.toFixed(0)} <span style={{ fontSize: 12, color: '#444' }}>km/h</span></div>
        </div>
      </div>

      {/* Line lock + knapper */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <button
          onClick={() => setLineLock(p => !p)}
          style={{
            flex: 1, padding: '14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
            fontSize: 13, letterSpacing: 2, fontFamily: 'IBM Plex Mono, monospace',
            background: lineLock ? '#ff202022' : '#1a2030',
            border: `2px solid ${lineLock ? '#ff2020' : '#333'}`,
            color: lineLock ? '#ff4444' : '#555',
            boxShadow: lineLock ? '0 0 16px #ff202044' : 'none',
          }}>
          {lineLock ? '🔒 LINE LOCK AKTIV' : 'LINE LOCK'}
        </button>
        <button onClick={handleReset} style={{
          padding: '14px 20px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: 12, letterSpacing: 2, fontFamily: 'IBM Plex Mono, monospace',
          background: '#1a2030', border: '1px solid #333', color: '#666',
        }}>RESET</button>
        <button onClick={running ? handleStop : handleStart} style={{
          padding: '14px 20px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: 12, letterSpacing: 2, fontFamily: 'IBM Plex Mono, monospace',
          background: running ? '#ff202022' : '#00C8FF22',
          border: `1px solid ${running ? '#ff2020' : '#00C8FF'}`,
          color: running ? '#ff4444' : '#00C8FF',
        }}>{running ? 'STOPP' : 'START'}</button>
      </div>
    </div>
  )
}
