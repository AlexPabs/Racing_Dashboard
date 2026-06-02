import { useDashboard } from '../../contexts/DashboardContext'

export function TPMSPanel({ onClose }: { onClose: () => void }) {
  const { config } = useDashboard()

  const getSensor = (id: string) => config.sensors.find(s => s.id === id)

  const tires = [
    { id: 'tpms_fl', label: 'FORAN VENSTRE', pos: 'fl' },
    { id: 'tpms_fr', label: 'FORAN HØYRE', pos: 'fr' },
    { id: 'tpms_rl', label: 'BAK VENSTRE', pos: 'rl' },
    { id: 'tpms_rr', label: 'BAK HØYRE', pos: 'rr' },
  ]

  function tireColor(s: ReturnType<typeof getSensor>) {
    if (!s) return '#444'
    const v = s.value
    if (s.critMin !== undefined && v <= s.critMin) return '#ff2020'
    if (s.warnMin !== undefined && v <= s.warnMin) return '#ffaa00'
    return '#a8ff3e'
  }

  function TireCard({ id, label }: { id: string; label: string }) {
    const s = getSensor(id)
    const color = tireColor(s)
    const val = s ? s.value.toFixed(2) : '--'
    const warn = s && s.warnMin !== undefined && s.value <= s.warnMin

    return (
      <div style={{
        background: '#0a0f18',
        border: `2px solid ${color}44`,
        borderRadius: 16,
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative',
        boxShadow: warn ? `0 0 20px ${color}33` : 'none',
      }}>
        {/* Dekk-ikon */}
        <svg width={48} height={72} viewBox="0 0 48 72" style={{ marginBottom: 12 }}>
          <rect x={4} y={4} width={40} height={64} rx={12} fill="#1a2030" stroke={color} strokeWidth={3} />
          <rect x={14} y={14} width={20} height={44} rx={6} fill="#0a0f18" stroke={`${color}66`} strokeWidth={1.5} />
          <line x1={24} y1={14} x2={24} y2={58} stroke={`${color}44`} strokeWidth={1} />
        </svg>

        <div style={{ color: '#444', fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>{label}</div>
        <div style={{
          fontSize: 40, fontWeight: 700, color,
          fontFamily: 'IBM Plex Mono, monospace',
          textShadow: `0 0 16px ${color}66`,
          lineHeight: 1,
        }}>{val}</div>
        <div style={{ color: '#555', fontSize: 12, marginTop: 4, fontFamily: 'IBM Plex Mono, monospace' }}>bar</div>

        {warn && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            color: color, fontSize: 16,
            animation: 'blink 1s ease-in-out infinite',
          }}>⚠</div>
        )}
        <style>{`@keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }`}</style>
      </div>
    )
  }

  const avgPressure = tires
    .map(t => getSensor(t.id)?.value ?? 0)
    .reduce((a, b) => a + b, 0) / tires.length

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0D1117',
      zIndex: 5000,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1a2030' }}>
        <div>
          <div style={{ color: '#00C8FF', fontWeight: 700, fontSize: 13, letterSpacing: 3, fontFamily: 'IBM Plex Mono, monospace' }}>TPMS — DEKKTRYKK</div>
          <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>Bluetooth LE · PECHAM sensorer</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid #333', color: '#555', cursor: 'pointer', borderRadius: 6, padding: '4px 12px', fontSize: 11 }}>✕ LUKK</button>
      </div>

      {/* Bil-oversikt med fire dekk */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        {/* Foran */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 500 }}>
          <TireCard id="tpms_fl" label="FORAN VENSTRE" />
          <TireCard id="tpms_fr" label="FORAN HØYRE" />
        </div>

        {/* Bil-kropp */}
        <div style={{ color: '#1a2030', fontSize: 11, letterSpacing: 4, padding: '8px 0', borderTop: '1px solid #1a2030', borderBottom: '1px solid #1a2030', width: '60%', maxWidth: 300, textAlign: 'center' }}>
          VW BOBLE 1956
        </div>

        {/* Bak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 500 }}>
          <TireCard id="tpms_rl" label="BAK VENSTRE" />
          <TireCard id="tpms_rr" label="BAK HØYRE" />
        </div>
      </div>

      {/* Gjennomsnittsinfo */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid #1a2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#555', fontSize: 11, letterSpacing: 1, fontFamily: 'IBM Plex Mono, monospace' }}>SNITT DEKKTRYKK</div>
        <div style={{ color: '#00C8FF', fontSize: 18, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
          {avgPressure.toFixed(2)} <span style={{ fontSize: 12, color: '#555' }}>bar</span>
        </div>
        <div style={{ color: '#444', fontSize: 11 }}>Anbefalt: 2.0–2.5 bar</div>
      </div>
    </div>
  )
}
