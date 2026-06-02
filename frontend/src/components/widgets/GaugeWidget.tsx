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

export function GaugeWidget({ sensor, theme, width, height }: Props) {
  const size = Math.min(width, height)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const strokeW = size * 0.06

  const startAngle = -220
  const endAngle = 40
  const range = endAngle - startAngle
  const pct = Math.max(0, Math.min(1, (sensor.value - sensor.min) / (sensor.max - sensor.min)))
  const valueAngle = startAngle + range * pct

  function arc(start: number, end: number, radius: number) {
    const s = (start * Math.PI) / 180
    const e = (end * Math.PI) / 180
    const x1 = cx + radius * Math.cos(s)
    const y1 = cy + radius * Math.sin(s)
    const x2 = cx + radius * Math.cos(e)
    const y2 = cy + radius * Math.sin(e)
    const large = end - start > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const color = getColor(sensor)
  const isAnalog = theme === 'analog'

  // Needle tip
  const needleAngle = (valueAngle * Math.PI) / 180
  const nx = cx + r * 0.85 * Math.cos(needleAngle)
  const ny = cy + r * 0.85 * Math.sin(needleAngle)

  // Tick marks
  const ticks = []
  const tickCount = 10
  for (let i = 0; i <= tickCount; i++) {
    const a = ((startAngle + (range * i) / tickCount) * Math.PI) / 180
    const inner = r - strokeW * 1.5
    const outer = r - strokeW * 0.2
    ticks.push({
      x1: cx + inner * Math.cos(a), y1: cy + inner * Math.sin(a),
      x2: cx + outer * Math.cos(a), y2: cy + outer * Math.sin(a),
    })
  }

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: 'auto' }}>
      {isAnalog ? (
        // Analog style: cream background, black marks
        <>
          <circle cx={cx} cy={cy} r={size * 0.47} fill="#f5f0e8" stroke="#333" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={r + strokeW} fill="none" stroke="#555" strokeWidth={1} />
          {ticks.map((tk, i) => (
            <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke="#222" strokeWidth={i % 5 === 0 ? 2.5 : 1} />
          ))}
          <path d={arc(startAngle, endAngle, r)} fill="none" stroke="#ccc" strokeWidth={strokeW} strokeLinecap="round" />
          <path d={arc(startAngle, valueAngle, r)} fill="none" stroke="#c00" strokeWidth={strokeW * 0.4} strokeLinecap="round" />
          <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#c00" strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={strokeW * 0.6} fill="#333" />
          <text x={cx} y={cy + r * 0.55} textAnchor="middle" fill="#222" fontSize={size * 0.1} fontWeight="bold">
            {sensor.value.toFixed(sensor.decimals)}
          </text>
          <text x={cx} y={cy + r * 0.72} textAnchor="middle" fill="#555" fontSize={size * 0.065}>
            {sensor.unit}
          </text>
          <text x={cx} y={size * 0.88} textAnchor="middle" fill="#444" fontSize={size * 0.07} fontWeight="600">
            {sensor.name}
          </text>
        </>
      ) : (
        // Modern style: dark, glowing arc
        <>
          <circle cx={cx} cy={cy} r={size * 0.47} fill="#111" />
          <path d={arc(startAngle, endAngle, r)} fill="none" stroke="#1a1a1a" strokeWidth={strokeW} strokeLinecap="round" />
          <path d={arc(startAngle, valueAngle, r)} fill="none" stroke={color} strokeWidth={strokeW}
            strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
          {ticks.map((tk, i) => (
            <line key={i} x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2}
              stroke={i % 5 === 0 ? '#555' : '#333'} strokeWidth={i % 5 === 0 ? 2 : 1} />
          ))}
          <text x={cx} y={cy + size * 0.08} textAnchor="middle" fill="#fff" fontSize={size * 0.18} fontWeight="700"
            style={{ fontVariantNumeric: 'tabular-nums' }}>
            {sensor.value.toFixed(sensor.decimals)}
          </text>
          <text x={cx} y={cy + size * 0.2} textAnchor="middle" fill="#888" fontSize={size * 0.075}>
            {sensor.unit}
          </text>
          <text x={cx} y={size * 0.9} textAnchor="middle" fill={color} fontSize={size * 0.08} letterSpacing="2">
            {sensor.name.toUpperCase()}
          </text>
        </>
      )}
    </svg>
  )
}
