import { useState, useEffect, useRef, useCallback } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'

const MONO = "'IBM Plex Mono', monospace"
const C = { cyan: '#00C8FF', green: '#a8ff3e', orange: '#ffaa00', red: '#ff4444', purple: '#bf5fff', dim: '#1e2d3d', bg: '#060810' }

// ── PCB Board SVG ─────────────────────────────────────────────────────────────
interface ConnectorDot {
  id: string; x: number; y: number; label: string
  net: string; type: 'tc' | 'ana' | 'ntc' | 'dig' | 'mos' | 'eth' | 'gps' | 'neo' | 'pwr'
}

const DOTS: ConnectorDot[] = [
  ...[0,1,2,3,4,5,6,7].map((i) => ({ id:`J${i}`,    x: 60+i*43, y: 28,       label:`TC${i}`,  net:`TC${i}`,   type:'tc'  as const })),
  ...[0,1,2,3,4,5,6,7].map((i) => ({ id:`J${16+i}`, x: 22,      y: 115+i*30, label:`A${i}`,   net:`ANA${i}`,  type:'ana' as const })),
  ...[0,1,2,3].map((i)          => ({ id:`J${8+i}`,  x: 518,     y: 120+i*30, label:`NT${i}`,  net:`NTC${i}`,  type:'ntc' as const })),
  ...[0,1,2,3].map((i)          => ({ id:`J${24+i}`, x: 518,     y: 260+i*30, label:`D${i}`,   net:`DIG${i}`,  type:'dig' as const })),
  ...[0,1,2,3,4,5].map((i)      => ({ id:i<4?`J${12+i}`:`J${31+i-4}`, x: 165+i*52, y: 392, label:`M${i}`, net:`MOS${i}`, type:'mos' as const })),
  { id:'J33', x: 432, y: 392, label:'GPS',  net:'GPS',     type:'gps' as const },
  { id:'J34', x: 476, y: 392, label:'NEO',  net:'NEOPIXEL',type:'neo' as const },
  { id:'J30', x: 88,  y: 392, label:'12V',  net:'+12V',    type:'pwr' as const },
  { id:'WIZ', x: 422, y: 26,  label:'ETH',  net:'WIZ820io',type:'eth' as const },
]

const TYPE_COLOR: Record<string, string> = {
  tc:'#ff6b35', ana:'#00C8FF', ntc:'#bf5fff', dig:'#a8ff3e',
  mos:'#ffaa00', eth:'#00C8FF', gps:'#a8ff3e', neo:'#ff44ff', pwr:'#ff4444',
}

function connectorActivity(engineOn: boolean, throttle: number, dig: boolean[], mosfetOn: boolean[], gpsActive: boolean, neoActive: boolean) {
  const act: Record<string, number> = {}
  act['J30'] = engineOn ? 1.0 : 0.5
  act['WIZ'] = engineOn ? 0.85 : 0.2
  if (!engineOn) return act
  for (let i=0; i<8; i++) act[`J${i}`] = 0.35 + throttle/100 * 0.65
  act['J16'] = throttle/100
  for (let i=1; i<8; i++) act[`J${16+i}`] = 0.15 + throttle/100 * 0.1
  for (let i=0; i<4; i++) act[`J${8+i}`] = 0.25 + throttle/100 * 0.35
  for (let i=0; i<4; i++) act[`J${24+i}`] = dig[i] ? 1.0 : 0.08
  ;[12,13,14,15,31,32].forEach((j,i) => { act[`J${j}`] = mosfetOn[i] ? 1.0 : 0.05 })
  act['J33'] = gpsActive ? 0.9 : 0.12
  act['J34'] = neoActive ? 1.0 : 0.12
  return act
}

function PCBBoard({ engineOn, throttle, dig, mosfetOn, gpsActive, neoActive, neoColor }:
  { engineOn:boolean; throttle:number; dig:boolean[]; mosfetOn:boolean[]; gpsActive:boolean; neoActive:boolean; neoColor:string }) {

  const act = connectorActivity(engineOn, throttle, dig, mosfetOn, gpsActive, neoActive)

  // Helper: text position for connector label
  const lblPos = (dot: ConnectorDot) => {
    if (dot.type === 'tc' || dot.type === 'eth')
      return { x: dot.x, y: dot.y - 9, anchor: 'middle' as const }
    if (dot.type === 'mos' || dot.type === 'gps' || dot.type === 'neo' || dot.type === 'pwr')
      return { x: dot.x, y: dot.y + 13, anchor: 'middle' as const }
    if (dot.x < 270) // left side (ANA)
      return { x: dot.x - 6, y: dot.y + 4, anchor: 'end' as const }
    // right side (NTC, DIG)
    return { x: dot.x + 6, y: dot.y + 4, anchor: 'start' as const }
  }

  return (
    <svg viewBox="0 0 540 414" style={{ width:'100%', height:'100%' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow2" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* PCB body */}
      <rect x="6" y="6" width="528" height="402" rx="12" fill="#0a1e0e" stroke="#162e18" strokeWidth="2.5"/>
      <rect x="12" y="12" width="516" height="390" rx="10" fill="#0c2010" stroke="#1a3c1e" strokeWidth="1"/>

      {/* Mounting holes */}
      {[[22,22],[518,22],[22,392],[518,392]].map(([cx,cy],i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill="none" stroke="#1e3a22" strokeWidth="1.5"/>
          <circle cx={cx} cy={cy} r="2" fill="#0a1e0e"/>
        </g>
      ))}

      {/* Traces */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`tct-${i}`} x1={60+i*43} y1={36} x2={165+i*11} y2={66} stroke="#c8a44822" strokeWidth="1.5"/>
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`ant-${i}`} x1={30} y1={115+i*30} x2={158} y2={172+i*8} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {[0,1,2,3].map(i => (
        <line key={`ntct-${i}`} x1={510} y1={120+i*30} x2={315} y2={182+i*12} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {[0,1,2,3].map(i => (
        <line key={`digt-${i}`} x1={510} y1={260+i*30} x2={315} y2={188+i*10} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {[0,1,2,3,4,5].map(i => (
        <line key={`most-${i}`} x1={165+i*52} y1={382} x2={232+i*12} y2={258} stroke="#c8a44820" strokeWidth="1.5"/>
      ))}
      {/* Power rail */}
      <line x1={88} y1={382} x2={88} y2={310} stroke="#ff444428" strokeWidth="2"/>
      <line x1={88} y1={310} x2={36} y2={310} stroke="#ff444428" strokeWidth="2"/>

      {/* ── MAX31855 ×8 ─────────────────────────────── */}
      <rect x="28" y="40" width="122" height="68" rx="4" fill="#091808" stroke="#1a3820" strokeWidth="1"/>
      <text x="38" y="54" fill="#1e5a22" fontSize="7" fontFamily={MONO} fontWeight="bold">MAX31855 ×8</text>
      {[0,1,2,3].map(i => <rect key={`mxa-${i}`} x={34+i*28} y={60} width={22} height={10} rx="2" fill="#112211" stroke="#1e4422" strokeWidth="1"/>)}
      {[0,1,2,3].map(i => <rect key={`mxb-${i}`} x={34+i*28} y={76} width={22} height={10} rx="2" fill="#112211" stroke="#1e4422" strokeWidth="1"/>)}

      {/* ── WIZ820io ──────────────────────────────── */}
      <rect x="336" y="32" width="102" height="52" rx="4" fill="#08101e" stroke="#182440" strokeWidth="1"/>
      <text x="350" y="46" fill="#1a3a6e" fontSize="7" fontFamily={MONO} fontWeight="bold">WIZ820io</text>
      <rect x="346" y="52" width="44" height="22" rx="2" fill="#101828" stroke="#1a3050" strokeWidth="1"/>
      <text x="360" y="67" fill="#1a5a8e" fontSize="6" fontFamily={MONO}>RJ45</text>
      {[0,1,2,3].map(i => <rect key={`wiz-${i}`} x={400+i*8} y={54} width={5} height={5} rx="1" fill="#152838"/>)}

      {/* ── Teensy 4.1 ──────────────────────────── */}
      <rect x="152" y="116" width="156" height="158" rx="7" fill="#10101c" stroke="#28284a" strokeWidth="2"/>
      <text x="218" y="140" fill="#28286a" fontSize="9" fontFamily={MONO} fontWeight="bold" textAnchor="middle">TEENSY</text>
      <text x="218" y="153" fill="#1e1e58" fontSize="8" fontFamily={MONO} textAnchor="middle">4.1</text>
      {Array.from({length:12},(_,i) => (
        <rect key={`tl-${i}`} x={155} y={128+i*11} width={5} height={8} rx="1" fill={engineOn?"#c8a44850":"#181830"}/>
      ))}
      {Array.from({length:12},(_,i) => (
        <rect key={`tr-${i}`} x={300} y={128+i*11} width={5} height={8} rx="1" fill={engineOn?"#c8a44850":"#181830"}/>
      ))}
      <rect x="196" y="262" width="44" height="10" rx="2" fill="#101c2e" stroke="#1a3050" strokeWidth="1"/>
      <text x="218" y="270" fill="#1a4060" fontSize="5" fontFamily={MONO} textAnchor="middle">USB</text>
      {engineOn && <>
        <circle cx="286" cy="152" r="5" fill={throttle>80?'#ff4444':throttle>40?'#ffaa00':'#00C8FF'} filter="url(#glow2)" opacity="0.8"/>
        <circle cx="286" cy="152" r="2" fill="#fff"/>
      </>}

      {/* ── LIS3DH ───────────────────────────────── */}
      <rect x="322" y="148" width="36" height="36" rx="3" fill="#18180c" stroke="#38381a" strokeWidth="1"/>
      <text x="340" y="162" fill="#48481a" fontSize="6" fontFamily={MONO} textAnchor="middle">LIS3DH</text>
      <text x="340" y="173" fill="#38381a" fontSize="5" fontFamily={MONO} textAnchor="middle">3-axis</text>

      {/* ── MP2307DN ─────────────────────────────── */}
      <rect x="28" y="288" width="72" height="44" rx="3" fill="#1a0808" stroke="#381010" strokeWidth="1"/>
      <text x="64" y="304" fill="#501a1a" fontSize="6" fontFamily={MONO} textAnchor="middle">MP2307DN</text>
      <text x="64" y="316" fill="#381010" fontSize="6" fontFamily={MONO} textAnchor="middle">12V→5V</text>
      {/* Inductor */}
      <circle cx="64" cy="326" r="5" fill="none" stroke="#402020" strokeWidth="1.5"/>

      {/* ── Optocouplers PC817×4 ─────────────────── */}
      <text x="108" y="260" fill="#1a3a1a" fontSize="6" fontFamily={MONO}>PC817×4</text>
      {[0,1,2,3].map(i => (
        <rect key={`ok-${i}`} x={108} y={264+i*27} width={26} height={20} rx="2"
          fill={dig[i]?'#0c2208':'#08080c'} stroke={dig[i]?'#2a5a1e':'#181818'} strokeWidth="1"/>
      ))}

      {/* ── AO3400A MOSFETs ×6 ───────────────────── */}
      <text x="200" y="334" fill="#2a2a10" fontSize="6" fontFamily={MONO} textAnchor="middle">AO3400A ×6</text>
      {[0,1,2,3,4,5].map(i => (
        <rect key={`q-${i}`} x={152+i*50} y={340} width={34} height={24} rx="2"
          fill={mosfetOn[i]?'#201008':'#080808'} stroke={mosfetOn[i]?'#604008':'#1a1a1a'} strokeWidth="1">
          {mosfetOn[i] && <animate attributeName="fill" values="#201008;#301810;#201008" dur="0.8s" repeatCount="indefinite"/>}
        </rect>
      ))}

      {/* ── Connector dots ───────────────────────── */}
      {DOTS.map(dot => {
        const a = act[dot.id] ?? 0
        const col = TYPE_COLOR[dot.type]
        const lp = lblPos(dot)
        return (
          <g key={dot.id}>
            {a > 0.05 && <circle cx={dot.x} cy={dot.y} r={9} fill={col} opacity={a*0.22} filter="url(#glow)"/>}
            <circle cx={dot.x} cy={dot.y} r={4.5}
              fill={a>0.05?col:'#142214'} stroke={a>0.05?col:'#1e3a1e'}
              strokeWidth="1.5" opacity={0.35+a*0.65}/>
            <text x={lp.x} y={lp.y} textAnchor={lp.anchor}
              fill={a>0.25?col:'#244224'} fontSize="5.5" fontFamily={MONO}>
              {dot.label}
            </text>
          </g>
        )
      })}

      {/* NeoPixel glow */}
      {neoActive && (
        <>
          <rect x="464" y="357" width="20" height="20" rx="4" fill={neoColor} filter="url(#glow2)" opacity="0.85"/>
          <rect x="466" y="359" width="16" height="16" rx="3" fill={neoColor} opacity="0.9"/>
        </>
      )}

      {/* Board label */}
      <text x="270" y="407" textAnchor="middle" fill="#163016" fontSize="6.5" fontFamily={MONO}>
        UNIVERSAL RACING SENSOR BOARD v0.4b — AlexPabs Racing
      </text>
    </svg>
  )
}

// ── Throttle Pedal ────────────────────────────────────────────────────────────
function ThrottlePedal({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startVal = useRef(0)

  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  const setFromY = useCallback((clientY: number) => {
    if (!trackRef.current || disabled) return
    const rect = trackRef.current.getBoundingClientRect()
    // top = 0%, bottom = 100% (push pedal down = more throttle)
    const pct = (clientY - rect.top) / rect.height
    onChange(clamp(pct * 100))
  }, [onChange, disabled])

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    dragging.current = true
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY
    startY.current = y
    startVal.current = value
    setFromY(y)
    e.preventDefault()
  }, [value, disabled, setFromY])

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || disabled) return
      const y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      const delta = (y - startY.current) / 1.8
      onChange(clamp(startVal.current + delta))
    }
    const up = () => { dragging.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [onChange, disabled])

  // Scroll wheel control
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (disabled) return
    e.preventDefault()
    onChange(clamp(value + (e.deltaY > 0 ? 5 : -5)))
  }, [value, onChange, disabled])

  const col = disabled ? C.dim : value > 80 ? C.red : value > 50 ? C.orange : value > 20 ? C.green : C.cyan
  const pct = value / 100

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, opacity: disabled ? 0.4 : 1 }}>
      <div style={{ color: col, fontFamily: MONO, fontSize: 26, fontWeight: 700, letterSpacing: 2, minWidth: 56, textAlign:'center',
        textShadow: disabled ? 'none' : `0 0 20px ${col}88`, transition:'color 0.1s' }}>
        {Math.round(value)}<span style={{ fontSize:12, opacity:0.7 }}>%</span>
      </div>

      {/* Track */}
      <div ref={trackRef} onMouseDown={onDown} onTouchStart={onDown} onWheel={onWheel}
        style={{ position:'relative', width:64, height:190, cursor: disabled ? 'default' : 'ns-resize', userSelect:'none', touchAction:'none' }}>

        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:8, transform:'translateX(-50%)',
          background:'#0a1520', borderRadius:4, border:`1px solid ${C.dim}` }}/>

        {/* Fill bar */}
        <div style={{ position:'absolute', left:'50%', top:0, width:8, transform:'translateX(-50%)',
          height:`${pct*100}%`, background:`linear-gradient(180deg, ${col}, ${col}88)`,
          borderRadius:4, boxShadow:`0 0 10px ${col}88`, transition:'background 0.15s' }}/>

        {/* Pedal pad */}
        <div style={{
          position:'absolute', left:'50%', width:54, height:26,
          transform:`translateX(-50%) translateY(${pct * 164}px)`,
          background:`linear-gradient(180deg, #1a2a3a 0%, #0c1620 100%)`,
          border:`2px solid ${col}`,
          borderRadius:5,
          boxShadow:`0 0 14px ${col}55, inset 0 1px 0 #ffffff12`,
          transition:'border-color 0.1s',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor: disabled ? 'default' : 'ns-resize',
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ position:'absolute', width:'75%', height:2, background:`${col}50`, top:6+i*7, borderRadius:1 }}/>
          ))}
        </div>
      </div>

      <div style={{ color:'#2a3a4a', fontSize:7, fontFamily:MONO, letterSpacing:2 }}>GAS PEDAL</div>
      {!disabled && <div style={{ color:'#1a2a3a', fontSize:6, fontFamily:MONO, letterSpacing:1 }}>drag · scroll · W/S</div>}
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Switch({ label, active, onToggle, color = C.green, disabled }: { label:string; active:boolean; onToggle:()=>void; color?:string; disabled?: boolean }) {
  return (
    <button onClick={disabled ? undefined : onToggle} style={{
      background: active ? `${color}18` : '#08101c',
      border: `1px solid ${active ? color : C.dim}`,
      borderRadius:6, padding:'7px 12px', cursor: disabled ? 'default' : 'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      transition:'all 0.15s', minWidth:72, opacity: disabled ? 0.4 : 1,
    }}>
      <div style={{ width:28, height:14, borderRadius:7, background: active ? color : '#141e2e',
        border:`1px solid ${active?color:C.dim}`, position:'relative', transition:'all 0.2s' }}>
        <div style={{ position:'absolute', top:2, width:10, height:10, borderRadius:'50%', background:'#fff',
          transition:'all 0.2s', left: active?14:2, boxShadow: active?`0 0 6px ${color}`:undefined }}/>
      </div>
      <span style={{ color: active?color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:1.5, fontWeight:700 }}>{label}</span>
    </button>
  )
}

// ── RPM Arc Gauge ─────────────────────────────────────────────────────────────
function RpmGauge({ rpm, maxRpm = 9000 }: { rpm: number; maxRpm?: number }) {
  const pct = Math.min(1, rpm / maxRpm)
  const col = pct > 0.83 ? C.red : pct > 0.65 ? C.orange : pct > 0.4 ? C.green : C.cyan
  // Arc from 210° to -30° (240° span)
  const R = 44, cx = 50, cy = 52
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const startDeg = 210, span = 240
  const endDeg = startDeg - pct * span
  const sx = cx + R * Math.cos(toRad(startDeg)), sy = cy - R * Math.sin(toRad(startDeg))
  const ex = cx + R * Math.cos(toRad(endDeg)),   ey = cy - R * Math.sin(toRad(endDeg))
  const large = pct * span > 180 ? 1 : 0

  return (
    <svg viewBox="0 0 100 70" style={{ width: 110, height: 77, flexShrink:0 }}>
      {/* Background arc */}
      <path d={`M ${cx+R*Math.cos(toRad(210))} ${cy-R*Math.sin(toRad(210))} A ${R} ${R} 0 1 1 ${cx+R*Math.cos(toRad(-30))} ${cy-R*Math.sin(toRad(-30))}`}
        fill="none" stroke="#0d1a28" strokeWidth="7" strokeLinecap="round"/>
      {/* Value arc */}
      {pct > 0.01 && (
        <path d={`M ${sx} ${sy} A ${R} ${R} 0 ${large} 0 ${ex} ${ey}`}
          fill="none" stroke={col} strokeWidth="7" strokeLinecap="round"
          style={{ filter:`drop-shadow(0 0 4px ${col})` }}/>
      )}
      {/* Redline ticks */}
      {[7500, 8000, 8500, 9000].map(v => {
        const deg = 210 - (v/maxRpm)*240
        const r1=38, r2=46
        return <line key={v}
          x1={cx+r1*Math.cos(toRad(deg))} y1={cy-r1*Math.sin(toRad(deg))}
          x2={cx+r2*Math.cos(toRad(deg))} y2={cy-r2*Math.sin(toRad(deg))}
          stroke="#ff444460" strokeWidth="2"/>
      })}
      <text x={cx} y={cy-4} textAnchor="middle" fill={col} fontSize="13" fontFamily={MONO} fontWeight="bold"
        style={{ filter:`drop-shadow(0 0 6px ${col})` }}>
        {Math.round(rpm/100)*100}
      </text>
      <text x={cx} y={cy+8} textAnchor="middle" fill="#3a5068" fontSize="6" fontFamily={MONO}>RPM</text>
    </svg>
  )
}

// ── Live Value Row ─────────────────────────────────────────────────────────────
function Val({ label, value, unit, warn, crit }: { label:string; value:number; unit:string; warn?:number; crit?:number }) {
  const col = crit && value > crit ? C.red : warn && value > warn ? C.orange : C.cyan
  const decimals = unit === '°C' || unit === 'rpm' || unit === 'km/h' || unit === '°' ? 0 : 2
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline',
      padding:'3px 0', borderBottom:`1px solid #0a1218` }}>
      <span style={{ color:'#2a4058', fontFamily:MONO, fontSize:8.5, letterSpacing:0.5 }}>{label}</span>
      <span style={{ color:col, fontFamily:MONO, fontSize:10.5, fontWeight:700, textShadow:`0 0 6px ${col}55` }}>
        {value.toFixed(decimals)}<span style={{ fontSize:7.5, opacity:0.55, marginLeft:2 }}>{unit}</span>
      </span>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function SimulatorPanel({ onClose }: { onClose: () => void }) {
  const { updateSensorValue } = useDashboard()

  const [throttle, setThrottle]   = useState(0)
  const [engineOn, setEngineOn]   = useState(false)
  const [gear, setGear]           = useState(0)
  const [brake, setBrake]         = useState(false)
  const [lineLock, setLineLock]   = useState(false)
  const [launch, setLaunch]       = useState(false)
  const [gpsActive, setGpsActive] = useState(true)
  const [neoActive, setNeoActive] = useState(false)

  const phys = useRef({ rpm: 0, speed: 0, cht: [140,140,140,140], oil: 80 })
  const liveRef = useRef({ rpm:0, speed:0, manifold:0, lambda:1, cht:[140,140,140,140], oil:80, oilPress:0, battery:12.4, ign:0 })
  const [live, setLive] = useState(liveRef.current)

  const ctrl = useRef({ throttle, engineOn, gear, brake, lineLock, launch })
  useEffect(() => { ctrl.current = { throttle, engineOn, gear, brake, lineLock, launch } }, [throttle, engineOn, gear, brake, lineLock, launch])

  // Keyboard controls: W/↑=throttle, S/↓=brake, Space=start, 1-4=gear, Escape=close
  useEffect(() => {
    const held = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== 'DIV') return
      held.add(e.key.toLowerCase())
      if (e.key === ' ') { e.preventDefault(); setEngineOn(v => !v) }
      if (e.key === 'Escape') { onClose() }
      if (['1','2','3','4'].includes(e.key)) setGear(Number(e.key))
      if (e.key.toLowerCase() === 'n') setGear(0)
      if (e.key.toLowerCase() === 'b') setBrake(v => !v)
    }
    const onKeyUp = (e: KeyboardEvent) => { held.delete(e.key.toLowerCase()) }

    // Throttle ramp loop
    const id = setInterval(() => {
      if (held.has('w') || held.has('arrowup'))
        setThrottle(v => Math.min(100, v + 4))
      if (held.has('s') || held.has('arrowdown'))
        setThrottle(v => Math.max(0, v - 6))
    }, 50)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      clearInterval(id)
    }
  }, [onClose])

  // MOSFET auto-logic
  const mosfetOn = [
    live.cht[0] > 200,       // MOS0 — vifte (fan)
    live.oil > 110,           // MOS1 — oljepumpe
    throttle > 90 && engineOn,// MOS2 — shift light (WOT)
    launch,                   // MOS3 — launch control
    lineLock,                 // MOS4 — line lock
    false,                    // MOS5 — spare
  ]

  const neoColor = (() => {
    const r = live.rpm
    if (!engineOn) return '#1a001a'
    if (r > 7000) return '#ff0000'
    if (r > 5500) return '#ff6600'
    if (r > 3500) return '#00ff88'
    return '#0044ff'
  })()

  // Physics simulation — 50Hz
  useEffect(() => {
    const id = setInterval(() => {
      const c = ctrl.current
      const p = phys.current
      const dt = 0.05  // 50ms step

      if (!c.engineOn) {
        p.rpm   = Math.max(0, p.rpm - 200 * dt * 20)
        // Coasting decel
        const drag = 0.018 * p.speed * p.speed * dt
        p.speed = Math.max(0, p.speed - drag - 0.5)
        for (let i=0;i<4;i++) p.cht[i] = Math.max(25, p.cht[i] - 0.6)
        p.oil   = Math.max(25, p.oil - 0.2)
      } else {
        // RPM: lazy approach to target
        const idleRpm = 800
        const tgtRpm  = idleRpm + (c.throttle/100) * 7700
        p.rpm  += (tgtRpm - p.rpm) * 0.15
        p.rpm   = Math.max(idleRpm * 0.9, Math.min(9200, p.rpm))

        // Speed from gear ratio + drag + brake
        if (c.gear > 0) {
          const ratio    = [0, 0.34, 0.58, 0.80, 1.0][c.gear]
          const propelled = p.rpm * ratio * 0.0108
          const drag      = 0.0008 * p.speed * p.speed
          const engBrake  = c.throttle < 5 ? 0.04 * p.rpm/1000 : 0
          const brakeFrc  = c.brake ? 14 : 0
          const lineLockFrc = c.lineLock ? 30 : 0
          p.speed += (propelled - p.speed) * 0.08 - drag - engBrake - brakeFrc * dt * 20 - lineLockFrc * dt * 20
        } else {
          // Neutral: natural decel
          const drag = 0.005 * p.speed + (c.brake ? 14 : 0)
          p.speed = Math.max(0, p.speed - drag * dt * 20)
        }
        p.speed = Math.max(0, Math.min(280, p.speed))

        // CHT rises with RPM and throttle
        const tgtCHT = 135 + (c.throttle/100)*165 + p.rpm/70
        for (let i=0;i<4;i++) {
          const noise = (Math.random()-0.5) * 8
          p.cht[i] += (tgtCHT + noise - p.cht[i]) * 0.016
          p.cht[i]  = Math.max(25, Math.min(400, p.cht[i]))
        }
        p.oil += ((65 + p.rpm/110) - p.oil) * 0.003
      }

      const manifold  = c.engineOn ? -0.65 + (c.throttle/100)*0.67 : 0
      const lambda    = c.engineOn ? Math.max(0.80, 1.02 - (c.throttle/100)*0.18) : 1.0
      const oilPress  = c.engineOn ? Math.max(0, 1.0 + (p.rpm/8500)*3.8 + (Math.random()-0.5)*0.12) : 0
      const ign       = c.engineOn ? Math.max(0, 10 + (p.rpm/8500)*28 - (c.throttle/100)*4) : 0
      const batt      = c.engineOn ? 14.1 + (Math.random()-0.5)*0.18 : 12.35 + (Math.random()-0.5)*0.04

      liveRef.current = { rpm:p.rpm, speed:p.speed, manifold, lambda, cht:[...p.cht], oil:p.oil, oilPress, battery:batt, ign }

      // Always safe to update
      updateSensorValue('speed',   p.speed)
      updateSensorValue('battery', batt)
      updateSensorValue('fuel',    Math.max(0, 30 - p.speed * 0.0004))

      // Only push engine-specific sensors when running — avoids oil_press 0.0 and
      // lambda 1.0 triggering alarms when engine is off (mock data handles them instead)
      if (c.engineOn) {
        updateSensorValue('rpm',            p.rpm + (Math.random()-0.5)*12)
        updateSensorValue('manifold_press', manifold)
        updateSensorValue('lambda',         lambda * 14.7)  // sensor expects AFR (10-20), not λ (0.8-1.0)
        updateSensorValue('cht1',           p.cht[0])
        updateSensorValue('cht2',           p.cht[1])
        updateSensorValue('cht3',           p.cht[2])
        updateSensorValue('cht4',           p.cht[3])
        updateSensorValue('oil_temp',       p.oil)
        updateSensorValue('oil_press',      oilPress)
        updateSensorValue('ignition_adv',   ign)
      }

      setLive({ ...liveRef.current })
    }, 50)
    return () => clearInterval(id)
  }, [updateSensorValue])

  const digState = [engineOn, brake, lineLock, launch]

  const startEngine = () => {
    setEngineOn(v => {
      if (v) setThrottle(0)
      return !v
    })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#03050b', zIndex:1500, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 18px',
        borderBottom:`1px solid ${C.dim}`, flexShrink:0, background:'#050810' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ color:'#ff6b35', fontFamily:MONO, fontSize:11, fontWeight:700, letterSpacing:3 }}>PCB SIMULATOR</span>
          <span style={{ color:C.dim, fontFamily:MONO, fontSize:8.5, letterSpacing:1 }}>v0.4b</span>
          <div style={{ width:6, height:6, borderRadius:'50%', background: engineOn ? C.green : '#1a1a1a',
            boxShadow: engineOn ? `0 0 8px ${C.green}` : 'none', transition:'all 0.3s' }}/>
          <span style={{ color: engineOn ? C.green : C.dim, fontFamily:MONO, fontSize:9, letterSpacing:1, transition:'color 0.3s' }}>
            {engineOn ? 'RUNNING' : 'ENGINE OFF'}
          </span>
          <span style={{ color:'#1a2a3a', fontFamily:MONO, fontSize:8, letterSpacing:0.5 }}>
            Space=start · W/S=gass/brems · 1-4=gir · B=brems
          </span>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${C.dim}`, color:'#3a5068',
          borderRadius:5, padding:'4px 14px', cursor:'pointer', fontFamily:MONO, fontSize:10, letterSpacing:1,
          transition:'all 0.15s' }}>✕ CLOSE</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* PCB */}
        <div style={{ flex:'1 1 55%', padding:14, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <div style={{ flex:1, minHeight:0 }}>
            <PCBBoard engineOn={engineOn} throttle={throttle} dig={digState} mosfetOn={mosfetOn} gpsActive={gpsActive} neoActive={neoActive} neoColor={neoColor}/>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:6, flexShrink:0 }}>
            {[['TC','#ff6b35','8× TC'],['ANA','#00C8FF','8× Analog'],['NTC','#bf5fff','4× NTC'],['DIG','#a8ff3e','4× DIG inn'],['MOS','#ffaa00','6× MOSFET'],['GPS','#a8ff3e','GPS'],['NEO','#ff44ff','NeoPixel']].map(([lbl,col,desc]) => (
              <div key={lbl} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:col as string, boxShadow:`0 0 4px ${col}` }}/>
                <span style={{ fontFamily:MONO, fontSize:7.5, color:'#2a3a4a' }}>{desc as string}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex:'0 0 310px', borderLeft:`1px solid ${C.dim}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:14 }}>

            {/* Engine + RPM gauge */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:2, marginBottom:8 }}>ENGINE</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <RpmGauge rpm={live.rpm}/>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <button onClick={startEngine} style={{
                    background: engineOn ? '#1a0808' : '#081a08',
                    border:`1.5px solid ${engineOn ? C.red : C.green}`,
                    borderRadius:6, padding:'9px 16px', cursor:'pointer',
                    color: engineOn ? C.red : C.green, fontFamily:MONO, fontSize:10, fontWeight:700, letterSpacing:2,
                    boxShadow: engineOn ? `0 0 14px ${C.red}44` : `0 0 14px ${C.green}44`,
                    transition:'all 0.2s',
                  }}>
                    {engineOn ? '⏹ STOP' : '▶ START'}
                  </button>
                  <div style={{ display:'flex', gap:5 }}>
                    {['N','1','2','3','4'].map((g,i) => (
                      <button key={g} onClick={() => setGear(i)} style={{
                        background: gear===i ? '#00C8FF14' : 'transparent',
                        border:`1px solid ${gear===i ? C.cyan : C.dim}`,
                        borderRadius:4, padding:'5px 8px', cursor:'pointer',
                        color: gear===i ? C.cyan : C.dim, fontFamily:MONO, fontSize:10, fontWeight:700, transition:'all 0.1s',
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Speed + Throttle */}
            <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
              <ThrottlePedal value={throttle} onChange={v => { if (engineOn) setThrottle(v) }} disabled={!engineOn}/>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, paddingTop:30 }}>
                <div>
                  <div style={{ color:'#1a3040', fontFamily:MONO, fontSize:7, letterSpacing:1, marginBottom:2 }}>SPEED</div>
                  <div style={{ color: live.speed > 180 ? C.red : live.speed > 120 ? C.orange : C.cyan,
                    fontFamily:MONO, fontSize:28, fontWeight:700, letterSpacing:1, lineHeight:1 }}>
                    {Math.round(live.speed)}
                    <span style={{ fontSize:10, opacity:0.5, marginLeft:3 }}>km/h</span>
                  </div>
                </div>
                <Val label="CHT avg" value={(live.cht[0]+live.cht[1]+live.cht[2]+live.cht[3])/4} unit="°C" warn={220} crit={300}/>
                <Val label="OIL"     value={live.oil}       unit="°C"  warn={130} crit={155}/>
                <Val label="PRESS"   value={live.oilPress}  unit="bar"/>
                <Val label="BATT"    value={live.battery}   unit="V"   warn={14.8} crit={15.2}/>
              </div>
            </div>

            {/* Digital switches */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:2, marginBottom:7 }}>DIGITALE INNGANGER (DIG1-3)</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <Switch label="BRAKE"    active={brake}    onToggle={() => setBrake(!brake)}       color={C.red}/>
                <Switch label="LINELOCK" active={lineLock} onToggle={() => setLineLock(!lineLock)} color={C.orange}/>
                <Switch label="LAUNCH"   active={launch}   onToggle={() => setLaunch(!launch)}     color={C.green}/>
              </div>
            </div>

            {/* MOSFET outputs */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:2, marginBottom:7 }}>MOSFET UTGANGER</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:5 }}>
                {(['VIFTE','PUMPE','SHIFT-LYS','LAUNCH','LINELOCK','SPARE'] as const).map((lbl,i) => {
                  const col = [C.orange, C.cyan, C.green, C.green, C.orange, C.dim][i]
                  return (
                    <div key={i} style={{
                      padding:'5px 6px', borderRadius:4,
                      border:`1px solid ${mosfetOn[i] ? col : C.dim}`,
                      background: mosfetOn[i] ? `${col}14` : 'transparent',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                      transition:'all 0.2s',
                    }}>
                      <div style={{ width:7, height:7, borderRadius:'50%',
                        background: mosfetOn[i] ? col : '#0a1420',
                        boxShadow: mosfetOn[i] ? `0 0 8px ${col}` : 'none',
                        transition:'all 0.2s' }}/>
                      <span style={{ color: mosfetOn[i] ? col : C.dim, fontFamily:MONO, fontSize:6.5, fontWeight:700 }}>MOS{i}</span>
                      <span style={{ color:'#162028', fontFamily:MONO, fontSize:5.5 }}>{lbl}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Modules */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:2, marginBottom:7 }}>MODULER</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <Switch label="GPS"      active={gpsActive} onToggle={() => setGpsActive(!gpsActive)} color={C.green}/>
                <Switch label="NEOPIXEL" active={neoActive} onToggle={() => setNeoActive(!neoActive)} color="#ff44ff"/>
                {neoActive && (
                  <div style={{ width:26, height:26, borderRadius:5, background:neoColor,
                    boxShadow:`0 0 18px ${neoColor}, 0 0 6px ${neoColor}`, transition:'all 0.3s' }}/>
                )}
              </div>
            </div>

            {/* Lambda + misc */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:7.5, letterSpacing:2, marginBottom:4 }}>MOTOR</div>
              <Val label="LAMBDA"  value={live.lambda}   unit="λ"/>
              <Val label="MAP"     value={live.manifold}  unit="bar"/>
              <Val label="TENNING" value={live.ign}       unit="°"/>
              <Val label="CHT 1"   value={live.cht[0]}    unit="°C" warn={220} crit={300}/>
              <Val label="CHT 2"   value={live.cht[1]}    unit="°C" warn={220} crit={300}/>
              <Val label="CHT 3"   value={live.cht[2]}    unit="°C" warn={220} crit={300}/>
              <Val label="CHT 4"   value={live.cht[3]}    unit="°C" warn={220} crit={300}/>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
