import { Sensor, Theme } from '../../types'

interface Props { sensor: Sensor; theme: Theme; width: number; height: number }

function getColor(sensor: Sensor): string {
  const v = sensor.value
  if (sensor.critMax !== undefined && v >= sensor.critMax) return '#ff2020'
  if (sensor.critMin !== undefined && v <= sensor.critMin) return '#ff2020'
  if (sensor.warnMax !== undefined && v >= sensor.warnMax) return '#ffaa00'
  if (sensor.warnMin !== undefined && v <= sensor.warnMin) return '#ffaa00'
  return '#00e5ff'
}

export function BarWidget({ sensor, theme, width, height }: Props) {
  const pct = Math.max(0, Math.min(1, (sensor.value - sensor.min) / (sensor.max - sensor.min)))
  const color = getColor(sensor)
  const isAnalog = theme === 'analog'
  const labelSize = Math.min(width * 0.08, 12)
  const valueSize = Math.min(width * 0.12, 18)
  const barHeight = height * 0.28

  if (isAnalog) {
    return (
      <div style={{
        width, height, padding: '6px 10px',
        background: '#f5f0e8', border: '2px solid #555', borderRadius: 4,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        fontFamily: 'Georgia, serif', color: '#111'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: labelSize, fontWeight: 'bold' }}>{sensor.name}</span>
          <span style={{ fontSize: valueSize, fontWeight: 'bold' }}>
            {sensor.value.toFixed(sensor.decimals)} {sensor.unit}
          </span>
        </div>
        <div style={{ background: '#ccc', borderRadius: 2, height: barHeight, overflow: 'hidden' }}>
          <div style={{ width: `${pct * 100}%`, height: '100%', background: '#333', transition: 'width 0.1s' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width, height, padding: '6px 10px',
      background: '#111', borderRadius: 8, border: `1px solid ${color}22`,
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: labelSize, color: '#555', letterSpacing: 1 }}>{sensor.name.toUpperCase()}</span>
        <span style={{ fontSize: valueSize, color, fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>
          {sensor.value.toFixed(sensor.decimals)} <span style={{ fontSize: labelSize, color: '#555' }}>{sensor.unit}</span>
        </span>
      </div>
      <div style={{ background: '#222', borderRadius: 4, height: barHeight, overflow: 'hidden' }}>
        <div style={{
          width: `${pct * 100}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}66`,
          transition: 'width 0.1s ease',
          borderRadius: 4
        }} />
      </div>
    </div>
  )
}
