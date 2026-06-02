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

export function NumberWidget({ sensor, theme, width, height }: Props) {
  const color = getColor(sensor)
  const isAnalog = theme === 'analog'
  const fontSize = Math.min(width * 0.35, height * 0.5)
  const unitSize = fontSize * 0.35
  const labelSize = Math.min(width * 0.1, 13)

  if (isAnalog) {
    return (
      <div style={{
        width, height, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5f0e8', border: '2px solid #555', borderRadius: 4,
        color: '#111', fontFamily: 'Georgia, serif'
      }}>
        <div style={{ fontSize: labelSize, color: '#666', letterSpacing: 1, marginBottom: 2 }}>
          {sensor.name.toUpperCase()}
        </div>
        <div style={{ fontSize, fontWeight: 'bold', lineHeight: 1 }}>
          {sensor.value.toFixed(sensor.decimals)}
        </div>
        <div style={{ fontSize: unitSize, color: '#555', marginTop: 2 }}>{sensor.unit}</div>
      </div>
    )
  }

  return (
    <div style={{
      width, height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#111', borderRadius: 8, border: `1px solid ${color}22`,
    }}>
      <div style={{ fontSize: labelSize, color: '#555', letterSpacing: 2, marginBottom: 2 }}>
        {sensor.name.toUpperCase()}
      </div>
      <div style={{
        fontSize, fontWeight: '700', color,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        textShadow: `0 0 20px ${color}88`
      }}>
        {sensor.value.toFixed(sensor.decimals)}
      </div>
      <div style={{ fontSize: unitSize, color: '#555', marginTop: 2 }}>{sensor.unit}</div>
    </div>
  )
}
