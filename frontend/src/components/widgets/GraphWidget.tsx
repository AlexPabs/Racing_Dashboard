import { useDashboard } from '../../contexts/DashboardContext'
import { Sensor, Theme } from '../../types'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'

interface Props { sensor: Sensor; theme: Theme; width: number; height: number }

const COLORS = ['#00e5ff', '#ff6b35', '#a8ff3e', '#ff2d55', '#bf5fff']

function getColor(sensor: Sensor, idx = 0): string {
  const v = sensor.value
  if (sensor.critMax !== undefined && v >= sensor.critMax) return '#ff2020'
  if (sensor.critMin !== undefined && v <= sensor.critMin) return '#ff2020'
  if (sensor.warnMax !== undefined && v >= sensor.warnMax) return '#ffaa00'
  if (sensor.warnMin !== undefined && v <= sensor.warnMin) return '#ffaa00'
  return COLORS[idx % COLORS.length]
}

export function GraphWidget({ sensor, theme, width, height }: Props) {
  const { logs } = useDashboard()
  const color = getColor(sensor)
  const isAnalog = theme === 'analog'
  const data = logs.slice(-60).map(l => ({ v: l.values[sensor.id] ?? 0 }))

  const labelSize = Math.min(width * 0.07, 11)
  const valueSize = Math.min(width * 0.13, 18)

  return (
    <div style={{
      width, height,
      background: isAnalog ? '#f5f0e8' : '#111',
      border: isAnalog ? '2px solid #555' : `1px solid ${color}22`,
      borderRadius: isAnalog ? 4 : 8,
      padding: '4px 8px',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: labelSize, color: isAnalog ? '#555' : '#555', letterSpacing: 1 }}>
          {sensor.name.toUpperCase()}
        </span>
        <span style={{ fontSize: valueSize, color: isAnalog ? '#111' : color, fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
          {sensor.value.toFixed(sensor.decimals)} <span style={{ fontSize: labelSize, fontWeight: 400 }}>{sensor.unit}</span>
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={[sensor.min, sensor.max]} hide />
            <Line
              type="monotone" dataKey="v" stroke={isAnalog ? '#c00' : color}
              dot={false} strokeWidth={2} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
