import { useState } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#00e5ff', '#ff6b35', '#a8ff3e', '#ff2d55', '#bf5fff', '#ffaa00', '#00ff88', '#ff88cc']

export function LoggerPanel() {
  const { config, logs, setShowPanel } = useDashboard()
  const [selected, setSelected] = useState<Set<string>>(new Set(['rpm', 'speed']))

  const toggleSensor = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedArr = Array.from(selected)
  const chartData = logs.slice(-300).map(l => ({
    t: new Date(l.timestamp).toLocaleTimeString(),
    ...Object.fromEntries(selectedArr.map(id => [id, l.values[id] ?? null]))
  }))

  const panelStyle: React.CSSProperties = {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    height: 360, background: '#0d0d0d', borderTop: '1px solid #222',
    color: '#ccc', zIndex: 1000, display: 'flex', flexDirection: 'column',
    fontFamily: 'system-ui, sans-serif', fontSize: 13,
  }

  return (
    <div style={panelStyle}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>LOGGER — REAL TIME</span>
        <button onClick={() => setShowPanel('none')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sensor selector */}
        <div style={{ width: 180, borderRight: '1px solid #1a1a1a', overflowY: 'auto', padding: '8px 0', flexShrink: 0 }}>
          {config.sensors.map((s, i) => {
            const active = selected.has(s.id)
            const color = COLORS[i % COLORS.length]
            return (
              <div key={s.id} onClick={() => toggleSensor(s.id)}
                style={{
                  padding: '7px 14px', cursor: 'pointer',
                  background: active ? `${color}11` : 'transparent',
                  borderLeft: active ? `3px solid ${color}` : '3px solid transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                <span style={{ color: active ? color : '#555' }}>{s.name}</span>
                <span style={{ color: active ? '#fff' : '#333', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value.toFixed(s.decimals)}
                  <span style={{ color: '#444', fontSize: 10, marginLeft: 2 }}>{s.unit}</span>
                </span>
              </div>
            )
          })}
        </div>

        {/* Chart */}
        <div style={{ flex: 1, padding: '8px 16px', overflow: 'hidden' }}>
          {selectedArr.length === 0 ? (
            <p style={{ color: '#444', paddingTop: 40, textAlign: 'center' }}>Select sensors on the left to plot</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="t" tick={{ fill: '#444', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#444', fontSize: 10 }} width={40} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, fontSize: 12 }}
                  labelStyle={{ color: '#888' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {selectedArr.map((id, i) => {
                  const s = config.sensors.find(x => x.id === id)
                  return (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={id}
                      name={s?.name ?? id}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
