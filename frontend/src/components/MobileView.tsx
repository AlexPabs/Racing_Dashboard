import { useDashboard } from '../contexts/DashboardContext'

// Kompakt mobilvisning — vises automatisk på skjerm < 600px bredde
// Navigeres med swipe eller tabs

import { useState } from 'react'

type Tab = 'motor' | 'cht' | 'tpms' | 'drag'

export function MobileView() {
  const { config, setForceDesktop } = useDashboard()
  const [tab, setTab] = useState<Tab>('motor')

  const S = (id: string) => config.sensors.find(s => s.id === id)

  function fargeFor(id: string): string {
    const s = S(id)
    if (!s) return '#555'
    const v = s.value
    if ((s.critMax && v >= s.critMax) || (s.critMin && v <= s.critMin)) return '#ff2020'
    if ((s.warnMax && v >= s.warnMax) || (s.warnMin && v <= s.warnMin)) return '#ffaa00'
    return '#00C8FF'
  }

  function Tall({ id, stor }: { id: string; stor?: boolean }) {
    const s = S(id)
    if (!s) return null
    const c = fargeFor(id)
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#555', fontSize: 10, letterSpacing: 2, fontFamily: 'IBM Plex Mono, monospace' }}>
          {s.name.toUpperCase()}
        </div>
        <div style={{
          color: c, fontFamily: 'IBM Plex Mono, monospace',
          fontSize: stor ? 48 : 28, fontWeight: 700, lineHeight: 1.1,
          textShadow: `0 0 12px ${c}66`,
        }}>
          {s.value.toFixed(s.decimals)}
        </div>
        <div style={{ color: '#444', fontSize: 11 }}>{s.unit}</div>
      </div>
    )
  }

  function Bar({ id }: { id: string }) {
    const s = S(id)
    if (!s) return null
    const c = fargeFor(id)
    const pct = Math.max(0, Math.min(1, (s.value - s.min) / (s.max - s.min)))
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#555', fontSize: 11, letterSpacing: 1, fontFamily: 'IBM Plex Mono, monospace' }}>{s.name.toUpperCase()}</span>
          <span style={{ color: c, fontSize: 13, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
            {s.value.toFixed(s.decimals)} <span style={{ color: '#444', fontSize: 10 }}>{s.unit}</span>
          </span>
        </div>
        <div style={{ height: 6, background: '#1a2030', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            width: `${pct * 100}%`, height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg, ${c}88, ${c})`,
            boxShadow: `0 0 6px ${c}66`,
            transition: 'width 0.1s',
          }} />
        </div>
      </div>
    )
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
    background: tab === t ? '#0a0f18' : 'transparent',
    borderTop: `2px solid ${tab === t ? '#00C8FF' : 'transparent'}`,
    color: tab === t ? '#00C8FF' : '#444',
    fontSize: 11, fontWeight: 700, letterSpacing: 1,
    fontFamily: 'IBM Plex Mono, monospace',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#0D1117',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Space Grotesk, sans-serif',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#2a3040', fontSize: 11, letterSpacing: 3, fontFamily: 'IBM Plex Mono, monospace' }}>VW BOBLE 1956</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setForceDesktop(true)}
            style={{
              background: 'transparent', border: '1px solid #2a3040', color: '#4a5568',
              borderRadius: 5, padding: '3px 8px', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >PC</button>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C8FF', boxShadow: '0 0 6px #00C8FF', display: 'inline-block' }} />
        </div>
      </div>

      {/* Innhold */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {tab === 'motor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stor RPM */}
            <div style={{ background: '#0a0f18', borderRadius: 16, padding: 20, border: '1px solid #1a2030' }}>
              <Tall id="rpm" stor />
            </div>

            {/* To kolonner — hastighet og lambda */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: '1px solid #1a2030' }}>
                <Tall id="speed" />
              </div>
              <div style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: '1px solid #1a2030' }}>
                <Tall id="lambda" />
              </div>
            </div>

            {/* Bar-widgets */}
            <div style={{ background: '#0a0f18', borderRadius: 12, padding: '12px 16px', border: '1px solid #1a2030' }}>
              <Bar id="oil_temp" />
              <Bar id="oil_press" />
              <Bar id="fuel" />
              <Bar id="battery" />
            </div>

            {/* Tenningsvinkel */}
            <div style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: '1px solid #1a2030', textAlign: 'center' }}>
              <Tall id="ignition_adv" />
            </div>
          </div>
        )}

        {tab === 'cht' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#444', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>SYLINDERHODE-TEMPERATUR (°C)</div>
            {['cht1', 'cht2', 'cht3', 'cht4'].map((id, i) => {
              const s = S(id)
              const c = fargeFor(id)
              const pct = s ? Math.max(0, Math.min(1, (s.value - s.min) / (s.max - s.min))) : 0
              return (
                <div key={id} style={{ background: '#0a0f18', borderRadius: 12, padding: '14px 16px', border: `1px solid ${c}33` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#555', fontSize: 12, letterSpacing: 1, fontFamily: 'IBM Plex Mono, monospace' }}>SYLINDER {i + 1}</span>
                    <span style={{ color: c, fontSize: 22, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
                      {s?.value.toFixed(0) ?? '--'} °C
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#1a2030', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct * 100}%`, height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, #00C8FF88, ${c})`,
                      boxShadow: `0 0 8px ${c}66`, transition: 'width 0.15s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ color: '#2a3040', fontSize: 10 }}>0°C</span>
                    <span style={{ color: '#ffaa0088', fontSize: 10 }}>⚠ 220°C</span>
                    <span style={{ color: '#ff202088', fontSize: 10 }}>🛑 260°C</span>
                  </div>
                </div>
              )
            })}
            <div style={{ background: '#0a0f18', borderRadius: 12, padding: '12px 16px', border: '1px solid #1a2030', marginTop: 4 }}>
              <Bar id="iat" />
            </div>
          </div>
        )}

        {tab === 'tpms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#444', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>DEKKTRYKK (bar)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { id: 'tpms_fl', label: 'FORAN V' },
                { id: 'tpms_fr', label: 'FORAN H' },
                { id: 'tpms_rl', label: 'BAK V' },
                { id: 'tpms_rr', label: 'BAK H' },
              ].map(({ id, label }) => {
                const s = S(id)
                const c = fargeFor(id)
                return (
                  <div key={id} style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: `1px solid ${c}44`, textAlign: 'center' }}>
                    <div style={{ color: '#444', fontSize: 10, letterSpacing: 1, marginBottom: 6, fontFamily: 'IBM Plex Mono, monospace' }}>{label}</div>
                    <div style={{ color: c, fontSize: 32, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', textShadow: `0 0 12px ${c}66` }}>
                      {s?.value.toFixed(2) ?? '--'}
                    </div>
                    <div style={{ color: '#444', fontSize: 11 }}>bar</div>
                  </div>
                )
              })}
            </div>
            <div style={{ background: '#0a0f18', borderRadius: 12, padding: '12px 16px', border: '1px solid #1a2030', textAlign: 'center' }}>
              <div style={{ color: '#555', fontSize: 10, letterSpacing: 2, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>SNITT DEKKTRYKK</div>
              <div style={{ color: '#00C8FF', fontSize: 24, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
                {(['tpms_fl', 'tpms_fr', 'tpms_rl', 'tpms_rr']
                  .map(id => S(id)?.value ?? 0)
                  .reduce((a, b) => a + b, 0) / 4).toFixed(2)} bar
              </div>
              <div style={{ color: '#333', fontSize: 11, marginTop: 4 }}>Anbefalt: 2.0–2.5 bar</div>
            </div>
          </div>
        )}

        {tab === 'drag' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ color: '#555', fontSize: 11, letterSpacing: 2, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }}>
              Åpne drag-modus i fullskjerm fra PC/nettbrett for full funksjonalitet.
            </div>
            <div style={{ background: '#0a0f18', borderRadius: 16, padding: 20, border: '1px solid #1a2030' }}>
              <Tall id="rpm" stor />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: '1px solid #1a2030' }}>
                <Tall id="speed" />
              </div>
              <div style={{ background: '#0a0f18', borderRadius: 12, padding: 16, border: '1px solid #1a2030' }}>
                <Tall id="lambda" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab-bar */}
      <div style={{ display: 'flex', borderTop: '1px solid #1a2030', background: '#060a10' }}>
        <button style={tabStyle('motor')} onClick={() => setTab('motor')}>MOTOR</button>
        <button style={tabStyle('cht')} onClick={() => setTab('cht')}>CHT</button>
        <button style={tabStyle('tpms')} onClick={() => setTab('tpms')}>TPMS</button>
        <button style={tabStyle('drag')} onClick={() => setTab('drag')}>DRAG</button>
      </div>
    </div>
  )
}
