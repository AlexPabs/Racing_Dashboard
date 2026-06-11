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
  // TC row top (J0-J7)
  ...[0,1,2,3,4,5,6,7].map((i) => ({ id:`J${i}`,  x: 60+i*43, y: 28,  label:`J${i}`, net:`TC${i}`, type:'tc' as const })),
  // Analog left (J16-J23)
  ...[0,1,2,3,4,5,6,7].map((i) => ({ id:`J${16+i}`, x: 22, y: 115+i*30, label:`J${i+16}`, net:`ANA${i}`, type:'ana' as const })),
  // NTC right (J8-J11)
  ...[0,1,2,3].map((i) => ({ id:`J${8+i}`, x: 518, y: 120+i*30, label:`J${8+i}`, net:`NTC${i}`, type:'ntc' as const })),
  // Digital right (J24-J27)
  ...[0,1,2,3].map((i) => ({ id:`J${24+i}`, x: 518, y: 260+i*30, label:`J${24+i}`, net:`DIG${i}`, type:'dig' as const })),
  // MOSFET bottom (J12-J15, J31-J32)
  ...[0,1,2,3,4,5].map((i) => ({ id:i<4?`J${12+i}`:`J${31+i-4}`, x: 170+i*50, y: 388, label:i<4?`J${12+i}`:`J${31+i-4}`, net:`MOS${i}`, type:'mos' as const })),
  // GPS bottom-right
  { id:'J33', x: 430, y: 388, label:'J33', net:'GPS', type:'gps' as const },
  // NeoPixel bottom-right
  { id:'J34', x: 475, y: 388, label:'J34', net:'NEOPIXEL', type:'neo' as const },
  // Power J30
  { id:'J30', x: 90, y: 388, label:'J30', net:'+12V', type:'pwr' as const },
  // Ethernet
  { id:'WIZ', x: 425, y: 28, label:'ETH', net:'WIZ820io', type:'eth' as const },
]

const TYPE_COLOR: Record<string, string> = {
  tc: '#ff6b35', ana: '#00C8FF', ntc: '#bf5fff', dig: '#a8ff3e',
  mos: '#ffaa00', eth: '#00C8FF', gps: '#a8ff3e', neo: '#ff44ff', pwr: '#ff4444',
}

// which connectors to light up and at what intensity (0-1)
function connectorActivity(engineOn: boolean, throttle: number, brake: boolean, dig: boolean[], mosfetOn: boolean[], gpsActive: boolean, neoActive: boolean) {
  const act: Record<string, number> = {}
  if (engineOn) {
    // TC — cht level
    for (let i=0; i<8; i++) act[`J${i}`] = 0.4 + throttle/100 * 0.6
    // Analog — TPS on J16, others dim
    act['J16'] = throttle/100
    for (let i=1; i<8; i++) act[`J${16+i}`] = 0.2
    // NTC
    for (let i=0; i<4; i++) act[`J${8+i}`] = 0.3 + throttle/100 * 0.3
    // Ethernet always on
    act['WIZ'] = 0.8
    // Digital inputs
    for (let i=0; i<4; i++) act[`J${24+i}`] = dig[i] ? 1.0 : 0.1
    // MOSFET outputs
    ;[12,13,14,15,31,32].forEach((j,i) => { act[`J${j}`] = mosfetOn[i] ? 1.0 : 0.0 })
    // GPS
    act['J33'] = gpsActive ? 0.9 : 0.15
    // NeoPixel
    act['J34'] = neoActive ? 1.0 : 0.15
    // Power always
    act['J30'] = 1.0
  } else {
    // Engine off: power still
    act['J30'] = 0.5
    act['WIZ'] = 0.2
  }
  return act
}

function PCBBoard({ engineOn, throttle, brake, dig, mosfetOn, gpsActive, neoActive, neoColor }:
  { engineOn:boolean; throttle:number; brake:boolean; dig:boolean[]; mosfetOn:boolean[]; gpsActive:boolean; neoActive:boolean; neoColor:string }) {

  const act = connectorActivity(engineOn, throttle, brake, dig, mosfetOn, gpsActive, neoActive)

  return (
    <svg viewBox="0 0 540 410" style={{ width:'100%', height:'100%' }}>
      {/* Glow filter */}
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="glow2"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Board */}
      <rect x="8" y="8" width="524" height="394" rx="12" fill="#0b1e0f" stroke="#1a3a1e" strokeWidth="2"/>
      <rect x="14" y="14" width="512" height="382" rx="10" fill="#0e2212" stroke="#1e4422" strokeWidth="1"/>

      {/* Mounting holes */}
      {[[24,24],[516,24],[24,386],[516,386]].map(([cx,cy],i)=>(
        <circle key={i} cx={cx} cy={cy} r="4" fill="none" stroke="#2a4a2e" strokeWidth="1.5"/>
      ))}

      {/* ── Traces (faint gold lines) ─────────────────── */}
      {/* TC traces */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`tc-trace-${i}`} x1={60+i*43} y1={38} x2={180+i*12} y2={68} stroke="#c8a44820" strokeWidth="1"/>
      ))}
      {/* Analog traces */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <line key={`ana-trace-${i}`} x1={32} y1={115+i*30} x2={160} y2={170+i*8} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {/* NTC traces */}
      {[0,1,2,3].map(i => (
        <line key={`ntc-trace-${i}`} x1={508} y1={120+i*30} x2={320} y2={185+i*10} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {/* Digital traces */}
      {[0,1,2,3].map(i => (
        <line key={`dig-trace-${i}`} x1={508} y1={260+i*30} x2={320} y2={190+i*8} stroke="#c8a44818" strokeWidth="1"/>
      ))}
      {/* MOSFET traces */}
      {[0,1,2,3,4,5].map(i => (
        <line key={`mos-trace-${i}`} x1={170+i*50} y1={378} x2={240+i*10} y2={260} stroke="#c8a44818" strokeWidth="1"/>
      ))}

      {/* ── Components ───────────────────────────────── */}
      {/* MAX31855 group */}
      <rect x="30" y="42" width="120" height="64" rx="4" fill="#0a1a0a" stroke="#1e3a22" strokeWidth="1"/>
      <text x="40" y="56" fill="#2a6a2e" fontSize="7" fontFamily={MONO} fontWeight="bold">MAX31855 ×8</text>
      {[0,1,2,3].map(i => <rect key={`mx-a-${i}`} x={36+i*28} y={62} width={22} height={10} rx="2" fill="#1a2e1a" stroke="#2a4a2e" strokeWidth="1"/>)}
      {[0,1,2,3].map(i => <rect key={`mx-b-${i}`} x={36+i*28} y={78} width={22} height={10} rx="2" fill="#1a2e1a" stroke="#2a4a2e" strokeWidth="1"/>)}

      {/* WIZ820io */}
      <rect x="345" y="30" width="100" height="52" rx="4" fill="#0a1a2a" stroke="#1e2e4a" strokeWidth="1"/>
      <text x="360" y="44" fill="#1a4a6e" fontSize="7" fontFamily={MONO} fontWeight="bold">WIZ820io</text>
      <rect x="355" y="50" width="42" height="22" rx="2" fill="#142030" stroke="#1e3a5a" strokeWidth="1"/>
      <text x="369" y="65" fill="#1a6a8e" fontSize="6" fontFamily={MONO}>RJ45</text>
      {[0,1,2,3].map(i => <rect key={`wiz-${i}`} x={406+i*8} y={52} width={5} height={5} rx="1" fill="#1a3a5a"/>)}

      {/* Teensy 4.1 socket */}
      <rect x="155" y="120" width="150" height="150" rx="6" fill="#12121e" stroke="#2a2a4a" strokeWidth="2"/>
      <text x="218" y="145" fill="#2a2a6a" fontSize="9" fontFamily={MONO} fontWeight="bold">TEENSY</text>
      <text x="222" y="157" fill="#1e1e5a" fontSize="8" fontFamily={MONO}>4.1</text>
      {/* Pin headers left */}
      {Array.from({length:12},(_,i) => <rect key={`tl-${i}`} x={158} y={130+i*11} width={4} height={8} rx="1" fill={engineOn?"#c8a44840":"#1a1a2e"}/>)}
      {/* Pin headers right */}
      {Array.from({length:12},(_,i) => <rect key={`tr-${i}`} x={298} y={130+i*11} width={4} height={8} rx="1" fill={engineOn?"#c8a44840":"#1a1a2e"}/>)}
      {/* USB indicator */}
      <rect x="208" y="263" width="44" height="8" rx="2" fill="#1a2a3a" stroke="#2a4a6a" strokeWidth="1"/>
      <text x="215" y="270" fill="#1a4a6a" fontSize="5" fontFamily={MONO}>USB</text>
      {/* Status LED glow */}
      {engineOn && <circle cx="285" cy="155" r="4" fill={throttle>80?"#ff4444":throttle>40?"#ffaa00":"#00C8FF"} filter="url(#glow2)" opacity="0.9"/>}
      {engineOn && <circle cx="285" cy="155" r="2" fill="#ffffff"/>}

      {/* MP2307DN (buck converter) */}
      <rect x="30" y="290" width="70" height="40" rx="3" fill="#1a0a0a" stroke="#3a1a1a" strokeWidth="1"/>
      <text x="35" y="306" fill="#4a1a1a" fontSize="6" fontFamily={MONO}>MP2307DN</text>
      <text x="40" y="318" fill="#3a1a1a" fontSize="6" fontFamily={MONO}>12V→5V</text>

      {/* LIS3DH accelerometer */}
      <rect x="326" y="150" width="34" height="34" rx="3" fill="#1a1a0a" stroke="#3a3a1a" strokeWidth="1"/>
      <text x="330" y="164" fill="#4a4a1a" fontSize="6" fontFamily={MONO}>LIS3DH</text>
      <text x="333" y="175" fill="#3a3a1a" fontSize="5" fontFamily={MONO}>3-axis</text>

      {/* Optocouplers (4×) */}
      {[0,1,2,3].map(i=>(
        <rect key={`ok-${i}`} x={108} y={265+i*25} width={24} height={18} rx="2"
          fill={dig[i]?"#0a200a":"#0a0a0a"} stroke={dig[i]?"#2a5a2a":"#1a1a1a"} strokeWidth="1"/>
      ))}
      <text x="110" y="260" fill="#1a3a1a" fontSize="6" fontFamily={MONO}>PC817×4</text>

      {/* MOSFETs (6×) */}
      {[0,1,2,3,4,5].map(i=>(
        <rect key={`q-${i}`} x={168+i*45} y={340} width={32} height={22} rx="2"
          fill={mosfetOn[i]?"#201000":"#0a0a0a"} stroke={mosfetOn[i]?"#604000":"#1e1e1e"} strokeWidth="1"/>
      ))}
      <text x="195" y="336" fill="#2a2a1a" fontSize="6" fontFamily={MONO}>AO3400A ×6</text>

      {/* ── Connector dots ───────────────────────────── */}
      {DOTS.map(dot => {
        const a = act[dot.id] ?? 0
        const col = TYPE_COLOR[dot.type]
        return (
          <g key={dot.id}>
            {a > 0.05 && <circle cx={dot.x} cy={dot.y} r={8} fill={col} opacity={a*0.25} filter="url(#glow)"/>}
            <circle cx={dot.x} cy={dot.y} r={4} fill={a>0.05?col:'#1a2e1a'} stroke={a>0.05?col:'#2a4a2e'} strokeWidth="1.5" opacity={0.4+a*0.6}/>
            <text x={dot.x} y={dot.type==='tc'||dot.type==='eth'?dot.y-8:dot.type==='mos'||dot.type==='gps'||dot.type==='neo'||dot.type==='pwr'?dot.y+14:dot.x<270?dot.x-14:dot.x+14}
              textAnchor="middle" fill={a>0.3?col:'#2a4a2e'} fontSize="5.5" fontFamily={MONO}>
              {dot.label}
            </text>
          </g>
        )
      })}

      {/* NeoPixel color preview */}
      {neoActive && (
        <rect x="466" y="355" width="18" height="18" rx="3" fill={neoColor} filter="url(#glow2)" opacity="0.9"/>
      )}

      {/* Board label */}
      <text x="270" y="400" textAnchor="middle" fill="#1e3a22" fontSize="7" fontFamily={MONO}>UNIVERSAL RACING SENSOR BOARD v0.4b — AlexPabs Racing</text>
    </svg>
  )
}

// ── Gas Pedal Component ───────────────────────────────────────────────────────
function ThrottlePedal({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pedRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startVal = useRef(0)

  const clamp = (v: number) => Math.max(0, Math.min(100, v))

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY
    startY.current = y
    startVal.current = value
    e.preventDefault()
  }, [value])

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const y = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY
      const delta = (y - startY.current) / 2  // px → %
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
  }, [onChange])

  const col = value > 80 ? C.red : value > 50 ? C.orange : value > 20 ? C.green : C.cyan
  const pct = value / 100

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ color: col, fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: 2, textShadow: `0 0 20px ${col}` }}>
        {Math.round(value)}%
      </div>
      <div style={{ fontSize: 9, color: '#3a5068', fontFamily: MONO, letterSpacing: 1 }}>THROTTLE</div>

      {/* Pedal track */}
      <div ref={pedRef} style={{ position:'relative', width:80, height:200, cursor:'ns-resize', userSelect:'none' }}
        onMouseDown={onDown} onTouchStart={onDown}>

        {/* Track */}
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:6, transform:'translateX(-50%)', background:'#0d1a28', borderRadius:3, border:`1px solid ${C.dim}` }}/>

        {/* Fill */}
        <div style={{ position:'absolute', left:'50%', bottom:0, width:6, transform:'translateX(-50%)', height:`${pct*100}%`, background:col, borderRadius:3, boxShadow:`0 0 12px ${col}`, transition:'background 0.2s' }}/>

        {/* Pedal pad */}
        <div style={{
          position:'absolute', left:'50%', width:56, height:28,
          transform:`translateX(-50%) translateY(${pct*172}px)`,
          background: `linear-gradient(180deg, #1a2a3a, #0d1a28)`,
          border:`2px solid ${col}`,
          borderRadius:4,
          boxShadow: `0 0 16px ${col}66, inset 0 1px 0 #ffffff10`,
          transition:'border-color 0.1s, box-shadow 0.1s',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'ns-resize',
        }}>
          {/* Pedal ridges */}
          {[0,1,2].map(i=>(
            <div key={i} style={{ position:'absolute', width:'80%', height:2, background:`${col}40`, top: 8+i*7, borderRadius:1 }}/>
          ))}
        </div>

        {/* GAS label */}
        <div style={{ position:'absolute', bottom:-22, left:'50%', transform:'translateX(-50%)', color:C.dim, fontSize:8, fontFamily:MONO, letterSpacing:2, whiteSpace:'nowrap' }}>GAS PEDAL</div>
      </div>
    </div>
  )
}

// ── Toggle Switch ─────────────────────────────────────────────────────────────
function Switch({ label, active, onToggle, color = C.green }: { label:string; active:boolean; onToggle:()=>void; color?:string }) {
  return (
    <button onClick={onToggle} style={{
      background: active ? `${color}18` : '#0a1020',
      border: `1px solid ${active ? color : C.dim}`,
      borderRadius: 6, padding:'8px 14px', cursor:'pointer',
      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
      transition:'all 0.15s', minWidth:80,
    }}>
      <div style={{ width:28, height:14, borderRadius:7, background: active ? color : '#1a2a3a', border:`1px solid ${active?color:C.dim}`, position:'relative', transition:'all 0.2s' }}>
        <div style={{ position:'absolute', top:2, width:10, height:10, borderRadius:'50%', background:'#fff', transition:'all 0.2s', left: active?14:2, boxShadow: active?`0 0 6px ${color}`:undefined }}/>
      </div>
      <span style={{ color: active?color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:1.5, fontWeight:700 }}>{label}</span>
    </button>
  )
}

// ── Live Value Row ─────────────────────────────────────────────────────────────
function Val({ label, value, unit, warn, crit, color }: { label:string; value:number; unit:string; warn?:number; crit?:number; color?:string }) {
  const col = color ?? (crit && value > crit ? C.red : warn && value > warn ? C.orange : C.cyan)
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'3px 0', borderBottom:`1px solid #0d1520` }}>
      <span style={{ color:'#3a5068', fontFamily:MONO, fontSize:9, letterSpacing:1 }}>{label}</span>
      <span style={{ color:col, fontFamily:MONO, fontSize:11, fontWeight:700, textShadow:`0 0 8px ${col}66` }}>
        {value.toFixed(unit==='°C'?0:unit==='rpm'?0:unit==='km/h'?0:1)} <span style={{ fontSize:8, opacity:0.6 }}>{unit}</span>
      </span>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function SimulatorPanel({ onClose }: { onClose: () => void }) {
  const { updateSensorValue } = useDashboard()

  const [throttle, setThrottle] = useState(0)
  const [engineOn, setEngineOn] = useState(false)
  const [gear, setGear] = useState(0)      // 0=N
  const [brake, setBrake] = useState(false)
  const [lineLock, setLineLock] = useState(false)
  const [launch, setLaunch] = useState(false)
  const [gpsActive, setGpsActive] = useState(true)
  const [neoActive, setNeoActive] = useState(false)

  // Physics state (via refs, not triggering re-renders)
  const phys = useRef({ rpm: 0, speed: 0, cht: [140,140,140,140], oil: 80 })
  const liveRef = useRef({ rpm:0, speed:0, manifold:0, lambda:1, cht:[140,140,140,140], oil:80, oilPress:0, battery:12.5, ign:0 })

  // Expose live values for display
  const [live, setLive] = useState(liveRef.current)

  // control snapshot for physics loop (avoids stale closures)
  const ctrl = useRef({ throttle, engineOn, gear, brake, lineLock, launch })
  useEffect(() => { ctrl.current = { throttle, engineOn, gear, brake, lineLock, launch } }, [throttle, engineOn, gear, brake, lineLock, launch])

  // MOSFET logic: fan on when CHT > 200, pump on when oil > 110, shift light at WOT
  const mosfetOn = [
    liveRef.current.cht[0] > 200,
    liveRef.current.oil > 110,
    throttle > 90 && engineOn,
    launch,
    lineLock,
    false,
  ]

  // NeoPixel color based on RPM
  const neoColor = (() => {
    const r = liveRef.current.rpm
    if (!engineOn) return '#220022'
    if (r > 7000) return '#ff0000'
    if (r > 5500) return '#ff6600'
    if (r > 3500) return '#00ff88'
    return '#0044ff'
  })()

  // Physics simulation loop
  useEffect(() => {
    const id = setInterval(() => {
      const c = ctrl.current
      const p = phys.current

      if (!c.engineOn) {
        p.rpm    = Math.max(0, p.rpm - 150)
        p.speed  = Math.max(0, p.speed - 3)
        for (let i=0;i<4;i++) p.cht[i] = Math.max(25, p.cht[i]-0.8)
        p.oil    = Math.max(25, p.oil - 0.3)
      } else {
        const tgt = 800 + (c.throttle/100)*7700
        p.rpm   += (tgt - p.rpm) * 0.18
        p.rpm    = Math.max(0, Math.min(9000, p.rpm))

        if (c.gear > 0 && !c.lineLock) {
          const ratio = [0, 0.36, 0.6, 0.82, 1.0][c.gear]
          const tgtSpd = p.rpm * ratio * 0.011
          p.speed += c.brake ? -10 : (tgtSpd - p.speed) * 0.12
        } else if (c.brake) {
          p.speed = Math.max(0, p.speed - 10)
        }
        p.speed = Math.max(0, Math.min(260, p.speed))

        const tgtCHT = 140 + (c.throttle/100)*160 + p.rpm/80
        for (let i=0;i<4;i++) {
          p.cht[i] += (tgtCHT + (Math.random()-0.5)*30 - p.cht[i]) * 0.018
          p.cht[i]  = Math.max(25, Math.min(380, p.cht[i]))
        }
        p.oil += ((70 + p.rpm/120) - p.oil) * 0.004
      }

      const manifold = c.engineOn ? -0.6+(c.throttle/100)*0.62 : 0
      const lambda   = c.engineOn ? Math.max(0.82, 1.0-(c.throttle/100)*0.16) : 1.0
      const oilPress = c.engineOn ? Math.max(0, 1.2+(p.rpm/8500)*3.5+(Math.random()-0.5)*0.15) : 0
      const ign      = c.engineOn ? 8+(p.rpm/8500)*30 : 0
      const batt     = c.engineOn ? 14.2+(Math.random()-0.5)*0.15 : 12.4+(Math.random()-0.5)*0.05

      liveRef.current = { rpm:p.rpm, speed:p.speed, manifold, lambda, cht:[...p.cht], oil:p.oil, oilPress, battery:batt, ign }

      // Push to dashboard
      updateSensorValue('rpm',            p.rpm + (Math.random()-0.5)*15)
      updateSensorValue('speed',          p.speed)
      updateSensorValue('manifold_press', manifold)
      updateSensorValue('lambda',         lambda)
      updateSensorValue('cht1',           p.cht[0])
      updateSensorValue('cht2',           p.cht[1])
      updateSensorValue('cht3',           p.cht[2])
      updateSensorValue('cht4',           p.cht[3])
      updateSensorValue('oil_temp',       p.oil)
      updateSensorValue('oil_press',      oilPress)
      updateSensorValue('ignition_adv',   ign)
      updateSensorValue('battery',        batt)
      updateSensorValue('fuel',           Math.max(0, 30 - (p.speed*0.0003)))

      setLive({ ...liveRef.current })
    }, 50)
    return () => clearInterval(id)
  }, [updateSensorValue])

  // DIG states as array
  const digState = [true, brake, lineLock, launch]  // DIG0 always on when engine running

  return (
    <div style={{
      position:'fixed', inset:0, background:'#04060c', zIndex:1500,
      display:'flex', flexDirection:'column', overflow:'hidden',
    }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 20px', borderBottom:`1px solid ${C.dim}`, flexShrink:0, background:'#060810' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ color:'#ff6b35', fontFamily:MONO, fontSize:11, fontWeight:700, letterSpacing:3 }}>PCB SIMULATOR</span>
          <span style={{ color:C.dim, fontFamily:MONO, fontSize:9, letterSpacing:1 }}>Universal Racing Sensor Board v0.4b</span>
          <div style={{ width:6, height:6, borderRadius:'50%', background: engineOn?C.green:C.dim, boxShadow: engineOn?`0 0 8px ${C.green}`:undefined }}/>
          <span style={{ color: engineOn?C.green:C.dim, fontFamily:MONO, fontSize:9, letterSpacing:1 }}>{engineOn?'ENGINE RUNNING':'ENGINE OFF'}</span>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:`1px solid ${C.dim}`, color:'#3a5068', borderRadius:5, padding:'4px 12px', cursor:'pointer', fontFamily:MONO, fontSize:10, letterSpacing:1 }}>✕ CLOSE</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

        {/* LEFT: PCB Board */}
        <div style={{ flex:'1 1 55%', padding:16, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, minHeight:0 }}>
            <PCBBoard engineOn={engineOn} throttle={throttle} brake={brake} dig={digState} mosfetOn={mosfetOn} gpsActive={gpsActive} neoActive={neoActive} neoColor={neoColor}/>
          </div>

          {/* Connector legend */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8, flexShrink:0 }}>
            {[['TC J0-7','#ff6b35','8× Termokobler'],['ANA J16-23','#00C8FF','8× Analog 0-5V'],['NTC J8-11','#bf5fff','4× Termistor'],['DIG J24-27','#a8ff3e','4× Digital inn'],['MOS J12-15,31-32','#ffaa00','6× MOSFET ut'],['GPS J33','#a8ff3e','GPS UART'],['NEO J34','#ff44ff','NeoPixel']].map(([label,color,desc])=>(
              <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:color as string, boxShadow:`0 0 4px ${color}` }}/>
                <span style={{ fontFamily:MONO, fontSize:8, color:'#3a5068' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div style={{ flex:'0 0 320px', borderLeft:`1px solid ${C.dim}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Scrollable controls */}
          <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Engine control */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:8 }}>ENGINE</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <button onClick={() => { setEngineOn(!engineOn); if (!engineOn) setThrottle(0) }} style={{
                  background: engineOn?'#1a0a0a':'#0a1a0a', border:`1px solid ${engineOn?C.red:C.green}`,
                  borderRadius:6, padding:'10px 20px', cursor:'pointer', color: engineOn?C.red:C.green,
                  fontFamily:MONO, fontSize:10, fontWeight:700, letterSpacing:2,
                  boxShadow: engineOn?`0 0 16px ${C.red}44`:`0 0 16px ${C.green}44`,
                }}>
                  {engineOn ? '⏹ STOP' : '▶ START'}
                </button>
                {/* Gear selector */}
                {['N','1','2','3','4'].map((g,i) => (
                  <button key={g} onClick={() => setGear(i)} style={{
                    background: gear===i?'#00C8FF18':'transparent', border:`1px solid ${gear===i?C.cyan:C.dim}`,
                    borderRadius:4, padding:'6px 10px', cursor:'pointer', color: gear===i?C.cyan:C.dim,
                    fontFamily:MONO, fontSize:10, fontWeight:700,
                  }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Throttle pedal */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:12 }}>GASSPEDAL — dra ned for å akselerere</div>
              <div style={{ display:'flex', justifyContent:'center' }}>
                <ThrottlePedal value={throttle} onChange={v => { if (engineOn) setThrottle(v) }}/>
              </div>
            </div>

            {/* Digital switches */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:8 }}>DIGITALE INNGANGER</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <Switch label="BRAKE" active={brake}    onToggle={() => setBrake(!brake)}    color={C.red}/>
                <Switch label="LINELOCK" active={lineLock} onToggle={() => setLineLock(!lineLock)} color={C.orange}/>
                <Switch label="LAUNCH" active={launch}  onToggle={() => setLaunch(!launch)}  color={C.green}/>
              </div>
            </div>

            {/* Modules */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:8 }}>MODULER</div>
              <div style={{ display:'flex', gap:8 }}>
                <Switch label="GPS" active={gpsActive}  onToggle={() => setGpsActive(!gpsActive)} color={C.green}/>
                <Switch label="NEOPIXEL" active={neoActive} onToggle={() => setNeoActive(!neoActive)} color="#ff44ff"/>
                {neoActive && <div style={{ width:28, height:28, borderRadius:4, background:neoColor, boxShadow:`0 0 16px ${neoColor}`, alignSelf:'center' }}/>}
              </div>
            </div>

            {/* MOSFET outputs */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:8 }}>MOSFET UTGANGER</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['MOS0','VIFTE',C.orange],['MOS1','PUMPE',C.cyan],['MOS2','SHIFT-LYS',C.green],['MOS3','SPARE',C.dim],['MOS4','SPARE',C.dim],['MOS5','SPARE',C.dim]].map(([id,lbl,col],i)=>(
                  <div key={id} style={{
                    padding:'4px 8px', borderRadius:4, border:`1px solid ${mosfetOn[i]?col:C.dim}`,
                    background: mosfetOn[i]?`${col}18`:'transparent',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:mosfetOn[i]?col as string:'#1a2a3a', boxShadow:mosfetOn[i]?`0 0 6px ${col}`:undefined }}/>
                    <span style={{ color:mosfetOn[i]?col:C.dim, fontFamily:MONO, fontSize:7 }}>{id}</span>
                    <span style={{ color:'#1e2d3d', fontFamily:MONO, fontSize:6 }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live readings */}
            <div>
              <div style={{ color:C.dim, fontFamily:MONO, fontSize:8, letterSpacing:2, marginBottom:6 }}>LIVE SENSORVERDIER</div>
              <Val label="RPM"          value={live.rpm}      unit="rpm"  warn={5800} crit={7500}/>
              <Val label="HASTIGHET"    value={live.speed}    unit="km/h" warn={120}  crit={200}/>
              <Val label="CHT 1"        value={live.cht[0]}   unit="°C"   warn={220}  crit={280}/>
              <Val label="CHT 2"        value={live.cht[1]}   unit="°C"   warn={220}  crit={280}/>
              <Val label="OLJETEMPERATUR" value={live.oil}    unit="°C"   warn={130}  crit={150}/>
              <Val label="OLJETRYKK"    value={live.oilPress} unit="bar"  />
              <Val label="LAMBDA"       value={live.lambda}   unit="λ"    />
              <Val label="MAP"          value={live.manifold} unit="bar"  />
              <Val label="TENNING"      value={live.ign}      unit="°"    />
              <Val label="BATTERI"      value={live.battery}  unit="V"    warn={14.8} crit={15.2}/>
            </div>

          </div>{/* end scroll */}
        </div>{/* end right */}
      </div>{/* end body */}
    </div>
  )
}
