import { useState } from 'react'

const FONT = "'Segoe UI', system-ui, sans-serif"

// ── Wire types ──────────────────────────────────────────────────────────────
// THICK SOLID  = strøm / tilhenger-kabel (automotive)
// LONG DASH    = signal / nettverkskabel (CAT5/6)  — 12 6
// SHORT DASH   = WiFi / ingen kabel                — 4 5

type WireType = 'power12' | 'power5' | 'gnd' | 'signal' | 'wifi' | 'ethernet'

interface WireDef {
  id: string
  label: string
  type: WireType
  color: string
  pts: [number, number][]
  cableType: string       // display name for cable type
  gauge: string           // cable thickness recommendation
  resistor: boolean
  resistorNote: string
  notes: string
}

interface Component {
  id: string; x: number; y: number; w: number; h: number
  title: string; sub: string; color: string
}

// ── Colors ──────────────────────────────────────────────────────────────────
const C = {
  pwr12: '#e53935', pwr5: '#ff7043', gnd: '#78909c',
  ntc:   '#66bb6a', press: '#ab47bc', rpm: '#ffa726',
  lambda:'#ff6b6b', gps: '#42a5f5', batt: '#fdd835',
  fuel:  '#26c6da', spi: '#ce93d8', wifi: '#29b6f6',
  sig:   '#00e5ff', tpms: '#fb923c', eth: '#10b981',
}

// ── Layout ──────────────────────────────────────────────────────────────────
const SW = 1200, SH = 840
const PWR_Y = 28
const RAIL_Y = 55            // 5V horizontal bus
const ESP_X = 540, ESP_Y = 90, ESP_W = 175
const PIN0 = ESP_Y + 52, STEP = 52
const RPI_X = 870, RPI_Y = 110, RPI_W = 145
const SEN_X = 20, SEN_W = 140
const COND_X = 200, COND_W = 78

function py(n: number) { return PIN0 + n * STEP }

// ── Components (boxes) ──────────────────────────────────────────────────────
const COMPS: Component[] = [
  { id:'bat',  x:20,  y:PWR_Y, w:100, h:48, title:'BATTERI 12V',   sub:'Kjøretøybatteri',       color:C.pwr12 },
  { id:'fuse', x:168, y:PWR_Y, w:88,  h:48, title:'SIKRING 5A',    sub:'Overbelastningsvern',    color:C.pwr12 },
  { id:'reg',  x:300, y:PWR_Y, w:100, h:48, title:'7805  12V→5V',  sub:'1A spenningsregulator',  color:C.pwr5  },
  { id:'esp',  x:ESP_X, y:ESP_Y, w:ESP_W, h:py(10)-ESP_Y+24, title:'WT32-ETH01', sub:'Ethernet · 240MHz · 3.3V ADC', color:C.sig },
  { id:'rpi',  x:RPI_X, y:RPI_Y, w:RPI_W, h:115, title:'RPi 5', sub:'racing1.alexlab.no', color:C.eth },
  { id:'spi_block', x:COND_X+10, y:py(2)-20, w:COND_W-10, h:88, title:'MAX31855 ×4', sub:'SPI termopar-amp', color:C.spi },
]

// ── Sensor rows ─────────────────────────────────────────────────────────────
interface SensorRow { label:string; sub:string; color:string; pinIdx:number; condLabel?:string; condSub?:string }
const SENSORS: SensorRow[] = [
  { label:'CHT CYL 1-4',   sub:'Type K termopar',      color:C.spi,   pinIdx:2, condLabel:'MAX31855', condSub:'SPI ×4' },
  { label:'OLJE TEMP',     sub:'NTC sender 1/8" NPT',  color:C.ntc,   pinIdx:3, condLabel:'4.7kΩ',    condSub:'pull-up 5V' },
  { label:'OLJE TRYKK',    sub:'0-10 bar 0.5-4.5V',    color:C.press, pinIdx:4, condLabel:'10k+3.3kΩ',condSub:'4.5V→3.3V' },
  { label:'LAMBDA / AFR',  sub:'Wideband 0-5V output', color:C.lambda,pinIdx:5, condLabel:'10k+6.8kΩ',condSub:'5V→3.3V' },
  { label:'IAT',           sub:'Intake luft NTC',      color:C.ntc,   pinIdx:6, condLabel:'4.7kΩ',    condSub:'pull-up 5V' },
  { label:'BATTERI +',     sub:'12-15V',               color:C.batt,  pinIdx:7, condLabel:'100k/27kΩ',condSub:'15V→3.3V' },
  { label:'TANK SENDER',   sub:'Resistiv 0-90Ω',       color:C.fuel,  pinIdx:8, condLabel:'120Ω',     condSub:'i serie 5V' },
]

const RPM_ROW: SensorRow = { label:'TENNING NEG', sub:'⚠ Høyspenning!',    color:C.rpm, pinIdx:9,  condLabel:'4N35', condSub:'Optokoppler' }
const GPS_ROW: SensorRow = { label:'GPS MODUL',   sub:'NEO-6M UART 3.3V', color:C.gps, pinIdx:10, condLabel:'UART', condSub:'RX direct' }
const ALL_ROWS = [...SENSORS, RPM_ROW, GPS_ROW]

const ESP_PINS = [
  { label:'VIN (5V)',       color:C.pwr5  },
  { label:'GND',            color:C.gnd   },
  { label:'SPI + 4×CS      CHT',   color:C.spi   },
  { label:'GPIO34          Olje Temp', color:C.ntc },
  { label:'GPIO35          Olje Trykk',color:C.press },
  { label:'GPIO32          Lambda AFR',color:C.lambda },
  { label:'GPIO33          IAT',  color:C.ntc   },
  { label:'GPIO36          Batteri',   color:C.batt  },
  { label:'GPIO39          Fuel',      color:C.fuel  },
  { label:'GPIO25          RPM',       color:C.rpm   },
  { label:'GPIO26 (RX)    GPS',       color:C.gps   },
  { label:'ETH (RJ45) →', color:C.eth },
]

// ── Wire definitions ─────────────────────────────────────────────────────────
function buildWires(): WireDef[] {
  const H = (sensorIdx: number) => py(ALL_ROWS[sensorIdx].pinIdx)
  const SEN_R = SEN_X + SEN_W
  const COND_R = COND_X + COND_W

  return [
    // Power chain
    {
      id:'bat_fuse', label:'Batteri → Sikring', type:'power12', color:C.pwr12,
      pts:[[120,PWR_Y+16],[168,PWR_Y+16]],
      cableType:'Tilhengerkabel / automotive wire',
      gauge:'2.5 mm² rød',
      resistor:false, resistorNote:'',
      notes:'Korteste mulige løype fra batteri til sikringsholderen.',
    },
    {
      id:'fuse_reg', label:'Sikring → 7805', type:'power12', color:C.pwr12,
      pts:[[256,PWR_Y+16],[300,PWR_Y+16]],
      cableType:'Tilhengerkabel / automotive wire',
      gauge:'2.5 mm² rød',
      resistor:false, resistorNote:'',
      notes:'12V etter sikring inn til 7805-regulatoren.',
    },
    {
      id:'rail_5v', label:'5V Forsyningsrail', type:'power5', color:C.pwr5,
      pts:[[400,PWR_Y+16],[400,RAIL_Y],[ESP_X,RAIL_Y],[ESP_X,py(0)]],
      cableType:'Tilhengerkabel / automotive wire',
      gauge:'1.0 mm² oransje',
      resistor:false, resistorNote:'',
      notes:'5V til ESP32 VIN og sensorer som trenger 5V forsyning.',
    },
    {
      id:'reg_gnd', label:'7805 GND', type:'gnd', color:C.gnd,
      pts:[[400,PWR_Y+34],[400,PWR_Y+68]],
      cableType:'Tilhengerkabel / automotive wire',
      gauge:'2.5 mm² sort',
      resistor:false, resistorNote:'',
      notes:'Kobles til chassis-GND (bilens ramme). 7805 GND må kobles til sirkelen.',
    },
    {
      id:'esp_gnd', label:'ESP32 GND', type:'gnd', color:C.gnd,
      pts:[[ESP_X,py(1)],[ESP_X-30,py(1)],[ESP_X-30,py(1)+22]],
      cableType:'Nettverkskabel / CAT5',
      gauge:'Sort leder',
      resistor:false, resistorNote:'',
      notes:'Felles GND med chassisjord. ALLE GND i systemet kobles til ett punkt.',
    },
    // CHT SPI
    {
      id:'cht_spi', label:'CHT 1-4 → MAX31855 SPI', type:'signal', color:C.spi,
      pts:[[SEN_R, H(0)],[COND_X, H(0)]],
      cableType:'Nettverkskabel CAT5/6 (twisted pair)',
      gauge:'Utwistet par per sensor',
      resistor:false, resistorNote:'MAX31855-chipen har innebygget forsterkning. Ingen ekstern resistor.',
      notes:'Type K termopar kobles direkte til MAX31855. Bruk shieldet kabel for høytemperatur-sensorer. SPI-bussen deles (MOSI/MISO/CLK) og bruker 4 separate CS-pinner.',
    },
    {
      id:'spi_esp', label:'SPI Bus → ESP32', type:'signal', color:C.spi,
      pts:[[COND_R, H(0)],[ESP_X, H(0)]],
      cableType:'Nettverkskabel CAT5/6',
      gauge:'4 ledere (MISO/MOSI/CLK/CS)',
      resistor:false, resistorNote:'Ingen resistor — direkte 3.3V SPI logikk.',
      notes:'Delt SPI-buss til alle 4 MAX31855-chiper. Maks 4 MHz klokke for MAX31855.',
    },
    // Oil temp
    {
      id:'oil_t_sig', label:'Oljetemperatur signal', type:'signal', color:C.ntc,
      pts:[[SEN_R, H(1)],[COND_X, H(1)]],
      cableType:'Nettverkskabel CAT5/6',
      gauge:'Enkeltleder + felles GND',
      resistor:true, resistorNote:'4.7kΩ pull-up til 5V. NTC er variabel motstand — trenger referansespenning.',
      notes:'NTC-senderens motstand synker med temp. Kombinert med pull-up danner den en spenningsdeler som ESP32 leser.',
    },
    {
      id:'oil_t_esp', label:'Oljetemperatur → GPIO34', type:'signal', color:C.ntc,
      pts:[[COND_R, H(1)],[ESP_X, H(1)]],
      cableType:'Nettverkskabel CAT5/6',
      gauge:'Enkeltleder',
      resistor:false, resistorNote:'Kondisjonering allerede gjort via pull-up.',
      notes:'Ferdigkondisjonert signal 0-3.3V til ESP32 ADC.',
    },
    // Oil pressure
    {
      id:'oil_p_sig', label:'Oljetrykk signal', type:'signal', color:C.press,
      pts:[[SEN_R, H(2)],[COND_X, H(2)]],
      cableType:'Nettverkskabel CAT5/6',
      gauge:'Enkeltleder',
      resistor:true, resistorNote:'Spenningsdeler 10kΩ + 3.3kΩ: sender gir 0.5-4.5V, deles ned til 0-3.3V.',
      notes:'0-10 bar transducer, 3-leder (GND, +5V, signal). Trenger 5V forsyning og spenningsdeler.',
    },
    {
      id:'oil_p_esp', label:'Oljetrykk → GPIO35', type:'signal', color:C.press,
      pts:[[COND_R, H(2)],[ESP_X, H(2)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'', notes:'Delt ned til 0-3.3V.',
    },
    // Lambda
    {
      id:'lambda_sig', label:'Lambda/AFR signal', type:'signal', color:C.lambda,
      pts:[[SEN_R, H(3)],[COND_X, H(3)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:true, resistorNote:'Spenningsdeler 10kΩ + 6.8kΩ: Innovate LC-2 gir 0-5V, deles ned til 0-3.3V.',
      notes:'Innovate LC-2 wideband-controller gir 0-5V analogt ut. Trenger 12V strøm og GND direkte fra bilen. O2-bung sveises inn i eksosrøret.',
    },
    {
      id:'lambda_esp', label:'Lambda → GPIO32', type:'signal', color:C.lambda,
      pts:[[COND_R, H(3)],[ESP_X, H(3)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'', notes:'0-3.3V AFR-signal til ESP32 ADC.',
    },
    // IAT
    {
      id:'iat_sig', label:'Lufttemperatur (IAT)', type:'signal', color:C.ntc,
      pts:[[SEN_R, H(4)],[COND_X, H(4)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:true, resistorNote:'4.7kΩ pull-up, samme oppsett som oljetemperatur.',
      notes:'Mål lufttemperatur inn i karburatoren. Vanlig NTC, f.eks. Bosch-type.',
    },
    {
      id:'iat_esp', label:'IAT → GPIO33', type:'signal', color:C.ntc,
      pts:[[COND_R, H(4)],[ESP_X, H(4)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'', notes:'0-3.3V til ESP32.',
    },
    // Battery
    {
      id:'batt_sig', label:'Batterispenning', type:'signal', color:C.batt,
      pts:[[SEN_R, H(5)],[COND_X, H(5)]],
      cableType:'Tilhengerkabel (strøm)',
      gauge:'0.5 mm² gul, direkte fra batteri+',
      resistor:true, resistorNote:'Spenningsdeler 100kΩ + 27kΩ: 15V maks → 3.3V til ESP32.',
      notes:'Tap direkte fra batteri (ikke via sikring) for nøyaktig spenningsavlesning.',
    },
    {
      id:'batt_esp', label:'Batteri → GPIO36', type:'signal', color:C.batt,
      pts:[[COND_R, H(5)],[ESP_X, H(5)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'', notes:'0-3.3V skalert batterispenning.',
    },
    // Fuel
    {
      id:'fuel_sig', label:'Drivstoffnivå', type:'signal', color:C.fuel,
      pts:[[SEN_R, H(6)],[COND_X, H(6)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:true, resistorNote:'120Ω serie-motstand mellom 5V og sender. Sender (0-90Ω) + 120Ω danner spenningsdeler.',
      notes:'Tank-sender er vanligvis allerede montert. Bruk eksisterende kabel til dashbordet.',
    },
    {
      id:'fuel_esp', label:'Fuel → GPIO39', type:'signal', color:C.fuel,
      pts:[[COND_R, H(6)],[ESP_X, H(6)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'', notes:'0-3.3V nivåsignal til ESP32.',
    },
    // RPM
    {
      id:'rpm_sig', label:'RPM fra tenningsspole', type:'signal', color:C.rpm,
      pts:[[SEN_R, H(7)],[COND_X, H(7)]],
      cableType:'Tilhengerkabel (signalkabel)',
      gauge:'0.5 mm², ⚠ høyspenning',
      resistor:true, resistorNote:'4N35 optokoppler + 10kΩ strømbegrenser. Tenningsspolen lager pulser opp til 400V — ALDRI direkte til ESP32.',
      notes:'Kobles til NEGATIV (-) terminal på tenningsspolen, ikke plussiden.',
    },
    {
      id:'rpm_esp', label:'RPM → GPIO25', type:'signal', color:C.rpm,
      pts:[[COND_R, H(7)],[ESP_X, H(7)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'Isolert av optokoppleren.',
      notes:'GPIO25 som interrupt (FALLING edge) for høy nøyaktighet.',
    },
    // GPS
    {
      id:'gps_sig', label:'GPS UART', type:'signal', color:C.gps,
      pts:[[SEN_R, H(8)],[COND_X, H(8)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'2 ledere (TX/RX)',
      resistor:false, resistorNote:'NEO-6M bruker 3.3V logikk — direkte til ESP32. Ingen resistor.',
      notes:'GPS-modul (NEO-6M) sender NMEA-data via UART 9600 baud. Gir hastighet, retning og posisjon. Erstatter kabel-speedometer.',
    },
    {
      id:'gps_esp', label:'GPS TX → GPIO26', type:'signal', color:C.gps,
      pts:[[COND_R, H(8)],[ESP_X, H(8)]],
      cableType:'Nettverkskabel CAT5/6', gauge:'Enkeltleder',
      resistor:false, resistorNote:'3.3V TTL direkte.', notes:'ESP32 UART2 RX.',
    },
    // Ethernet WT32-ETH01 → RPi 5
    {
      id:'eth_link', label:'Ethernet WT32-ETH01 → RPi 5', type:'ethernet', color:C.eth,
      pts:[[ESP_X+ESP_W, py(10)],[RPI_X, py(10)]],
      cableType:'CAT6 FTP nettverkskabel (skjermet)',
      gauge:'CAT6 FTP, maks 100m, RJ45 crimpe',
      resistor:false, resistorNote:'',
      notes:'WT32-ETH01 sender UDP-pakker til RPi 5 hvert 20ms (50Hz). RPi kjører Python asyncio-mottaker på port 8888. Bruk skjermet CAT6 i motorrom for støyreduksjon. WT32 bruker ETH.h (ikke WiFi.h).',
    },
    // TPMS dekktrykk → RPi via BLE
    {
      id:'tpms_ble', label:'TPMS Dekktrykk → RPi (BLE)', type:'wifi', color:'#fb923c',
      pts:[[RPI_X+RPI_W/2, RPI_Y+320],[RPI_X+RPI_W/2, RPI_Y+225]],
      cableType:'Bluetooth LE — ingen fysisk kabel',
      gauge:'BLE 4.0+ (innebygget i RPi 5)',
      resistor:false, resistorNote:'',
      notes:'PECHAM BLE TPMS-sensorer (ventilkapsler) sender trykk + temperatur via Bluetooth LE. RPi 5 har innebygget BT5.0. Sensor-ID programmeres ved første montering. Batterilevetid ~1 år.',
    },
    // 123ignition TUNE+ → RPI via Bluetooth LE
    {
      id:'tune_ble', label:'123\\ignition TUNE+ → RPI BLE', type:'wifi', color:'#a78bfa',
      pts:[[RPI_X+60, RPI_Y+115],[RPI_X+60, RPI_Y+95]],
      cableType:'Bluetooth LE — ingen fysisk kabel',
      gauge:'BLE 4.0+ (innebygget i RPI)',
      resistor:false, resistorNote:'',
      notes:'123\\TUNE+ broadcaster RPM og tenningsfremskyvning (°BTDC) via Bluetooth LE. RPI leser BLE-strømmen med @abandonware/noble og sender data til backend via intern socket. Se server.js for aktivering.',
    },
  ]
}

// ── Detail card ──────────────────────────────────────────────────────────────
function DetailCard({ wire, x, y }: { wire: WireDef; x: number; y: number }) {
  const cw = 280, ch = 160
  const clampX = Math.min(x, SW - cw - 10)
  const clampY = Math.min(y, SH - ch - 10)
  return (
    <g>
      <rect x={clampX} y={clampY} width={cw} height={ch} rx={7}
        fill="#161616" stroke={wire.color} strokeWidth={1.5}
        style={{ filter: `drop-shadow(0 4px 16px #000c)` }} />
      {/* Header */}
      <rect x={clampX} y={clampY} width={cw} height={22} rx={7} fill={wire.color+'28'} />
      <rect x={clampX} y={clampY+16} width={cw} height={6} fill={wire.color+'28'} />
      <text x={clampX+10} y={clampY+15} fill={wire.color} fontSize={10} fontWeight="700" fontFamily={FONT}>{wire.label}</text>

      {/* Cable type badge */}
      <rect x={clampX+8} y={clampY+28} width={cw-16} height={16} rx={3}
        fill={wire.type === 'wifi' ? '#0d2035' : wire.type === 'ethernet' ? '#0a1f18' : wire.type.startsWith('power') || wire.type === 'gnd' ? '#1a0f00' : '#001a0f'} />
      <text x={clampX+14} y={clampY+39} fill={wire.type === 'wifi' ? C.wifi : wire.type === 'ethernet' ? C.eth : wire.type.startsWith('power') || wire.type === 'gnd' ? C.pwr5 : C.ntc}
        fontSize={8.5} fontFamily={FONT}>
        {wire.type === 'wifi' ? '~ BLE/WiFi' : wire.type === 'ethernet' ? '── ETHERNET CAT6 FTP' : wire.type.startsWith('power') || wire.type === 'gnd' ? '▐ TILHENGER-KABEL' : '── NETTVERKSKABEL (CAT5/6)'}
        {'  '}{wire.gauge}
      </text>

      {/* Resistor */}
      <text x={clampX+10} y={clampY+58} fill={wire.resistor ? '#ffa726' : '#555'} fontSize={9} fontFamily={FONT} fontWeight="700">
        {wire.resistor ? '⚡ Kondisjonering nødvendig' : '✓ Ingen kondisjonering'}
      </text>
      {wire.resistorNote && (
        <foreignObject x={clampX+10} y={clampY+64} width={cw-20} height={38}>
          <div style={{ fontSize: 8, color: '#888', fontFamily: FONT, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {wire.resistorNote}
          </div>
        </foreignObject>
      )}

      {/* Notes */}
      <foreignObject x={clampX+10} y={clampY+104} width={cw-20} height={50}>
        <div style={{ fontSize: 8, color: '#666', fontFamily: FONT, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {wire.notes}
        </div>
      </foreignObject>
    </g>
  )
}

// ── GND symbol ───────────────────────────────────────────────────────────────
function Gnd({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y+8} stroke={C.gnd} strokeWidth={2} />
      <line x1={x-8} y1={y+8} x2={x+8} y2={y+8} stroke={C.gnd} strokeWidth={2} />
      <line x1={x-5} y1={y+12} x2={x+5} y2={y+12} stroke={C.gnd} strokeWidth={2} />
      <line x1={x-2} y1={y+16} x2={x+2} y2={y+16} stroke={C.gnd} strokeWidth={2} />
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function WiringDiagram() {
  const [sel, setSel] = useState<string | null>(null)
  const [cardPos, setCardPos] = useState<[number, number]>([0, 0])

  const wires = buildWires()
  const selWire = wires.find(w => w.id === sel)

  const wireStroke = (w: WireDef, active: boolean) => {
    const base = w.type === 'power12' ? 4 : w.type === 'power5' ? 3.5 : w.type === 'gnd' ? 3 : w.type === 'ethernet' ? 2.5 : 2
    return active ? base + 2 : base
  }

  const sensorBoxH = 44

  return (
    <div style={{ overflowX: 'auto', background: '#0a0a0a', borderRadius: 8, cursor: 'default' }}
      onClick={() => setSel(null)}>
      <svg width={SW} height={SH} style={{ display: 'block', minWidth: SW }}>

        {/* ── Title ── */}
        <text x={20} y={20} fill="#fff" fontSize={13} fontWeight="700" fontFamily={FONT}>
          KOBLINGSSKJEMA — VW Boble 1956 · WT32-ETH01 + RPi 5
        </text>
        <text x={20} y={35} fill="#444" fontSize={9} fontFamily={FONT}>
          WT32-ETH01 + RPi 5 · VW Boble/luftkjølt ·
          {'  '}── Tilhengerkabel (strøm){'  '}╌ ╌ Nettverkskabel (signal){'  '}· · WiFi (ingen kabel){'  '}
          Klikk en linje for detaljer
        </text>

        {/* ── Component boxes ── */}
        {COMPS.map(c => (
          <g key={c.id}>
            <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={5}
              fill="#161616" stroke={c.color} strokeWidth={c.id === 'esp' ? 2 : 1.5} />
            <rect x={c.x} y={c.y} width={c.w} height={18} rx={5} fill={c.color+'28'} />
            <rect x={c.x} y={c.y+13} width={c.w} height={5} fill={c.color+'28'} />
            <text x={c.x+c.w/2} y={c.y+13} textAnchor="middle" fill={c.color}
              fontSize={c.id === 'esp' ? 11 : 9.5} fontWeight="700" fontFamily={FONT}>{c.title}</text>
            <text x={c.x+c.w/2} y={c.y+30} textAnchor="middle" fill="#555" fontSize={8.5} fontFamily={FONT}>{c.sub}</text>
          </g>
        ))}

        {/* ── ESP32 pin labels ── */}
        {ESP_PINS.map((p, i) => (
          <g key={i}>
            <circle cx={ESP_X} cy={py(i)} r={3.5} fill={p.color}
              style={{ filter: `drop-shadow(0 0 3px ${p.color})` }} />
            <text x={ESP_X+9} y={py(i)+4} fill="#aaa" fontSize={8.5} fontFamily={FONT}>{p.label}</text>
          </g>
        ))}
        {/* Ethernet out pin */}
        <circle cx={ESP_X+ESP_W} cy={py(10)} r={3.5} fill={C.eth}
          style={{ filter: `drop-shadow(0 0 3px ${C.eth})` }} />
        <text x={ESP_X+ESP_W-8} y={py(10)+4} textAnchor="end" fill="#aaa" fontSize={8.5} fontFamily={FONT}>ETH →</text>

        {/* ── Sensor boxes + cond boxes ── */}
        {ALL_ROWS.map((s, i) => {
          const espPy = py(s.pinIdx)
          const boxY = espPy - sensorBoxH / 2
          const condY = espPy - 18
          const SEN_R2 = SEN_X + SEN_W
          const COND_R2 = COND_X + COND_W

          // Skip SPI block (rendered separately in COMPS)
          const skipCond = s.label === 'CHT CYL 1-4'

          return (
            <g key={s.label}>
              {/* Sensor box */}
              <rect x={SEN_X} y={boxY} width={SEN_W} height={sensorBoxH} rx={5}
                fill="#161616" stroke={s.color} strokeWidth={1.5} />
              <rect x={SEN_X} y={boxY} width={SEN_W} height={18} rx={5} fill={s.color+'28'} />
              <rect x={SEN_X} y={boxY+13} width={SEN_W} height={5} fill={s.color+'28'} />
              <text x={SEN_X+SEN_W/2} y={boxY+13} textAnchor="middle" fill={s.color}
                fontSize={9} fontWeight="700" fontFamily={FONT}>{s.label}</text>
              <text x={SEN_X+SEN_W/2} y={boxY+30} textAnchor="middle" fill="#555" fontSize={8} fontFamily={FONT}>{s.sub}</text>
              <circle cx={SEN_R2} cy={espPy} r={3} fill={s.color} />

              {/* Conditioning box */}
              {!skipCond && s.condLabel && (
                <g>
                  <rect x={COND_X} y={condY} width={COND_W} height={36} rx={4}
                    fill="#111" stroke="#333" strokeWidth={1} />
                  <text x={COND_X+COND_W/2} y={condY+14} textAnchor="middle"
                    fill="#aaa" fontSize={9} fontWeight="700" fontFamily={FONT}>{s.condLabel}</text>
                  <text x={COND_X+COND_W/2} y={condY+26} textAnchor="middle"
                    fill="#555" fontSize={8} fontFamily={FONT}>{s.condSub}</text>
                </g>
              )}

              {/* GND drop under sensor */}
              <line x1={SEN_X+SEN_W/2} y1={boxY+sensorBoxH} x2={SEN_X+SEN_W/2} y2={boxY+sensorBoxH+16}
                stroke={C.gnd} strokeWidth={1.5} />
              <Gnd x={SEN_X+SEN_W/2} y={boxY+sensorBoxH+16} />
            </g>
          )
        })}

        {/* ── Battery GND ── */}
        <line x1={120} y1={PWR_Y+34} x2={120} y2={PWR_Y+68} stroke={C.gnd} strokeWidth={2.5} />
        <Gnd x={120} y={PWR_Y+68} />

        {/* ── Wires (clickable) ── */}
        {wires.map(w => {
          const active = sel === w.id
          const sw = wireStroke(w, active)
          const d = w.pts.map((p,i) => (i===0?'M':'L')+p[0]+' '+p[1]).join(' ')
          const isDash = w.type === 'wifi' || w.type === 'signal' || w.type === 'ethernet'
          const dashArr = (w.type === 'signal' || w.type === 'ethernet') ? '12 6' : '4 5'
          const isPower = w.type === 'power12' || w.type === 'power5' || w.type === 'gnd'
          const glowColor = active ? w.color : (isPower ? w.color+'44' : 'none')

          return (
            <g key={w.id}>
              {/* Invisible thick hit area for easier clicking */}
              <path d={d} stroke="transparent" strokeWidth={14} fill="none" style={{ cursor: 'pointer' }}
                onClick={e => {
                  e.stopPropagation()
                  const svg = (e.target as SVGElement).closest('svg')!.getBoundingClientRect()
                  const mx = e.clientX - svg.left + 10
                  const my = e.clientY - svg.top + 10
                  setSel(w.id)
                  setCardPos([mx, my])
                }} />
              {/* Visible wire */}
              <path d={d} stroke={active ? w.color : w.color + (isPower ? 'ff' : 'cc')}
                strokeWidth={sw} fill="none"
                strokeDasharray={isDash ? dashArr : undefined}
                strokeLinecap="round" strokeLinejoin="round"
                pointerEvents="none"
                style={{ filter: active ? `drop-shadow(0 0 6px ${w.color})` : isPower ? `drop-shadow(0 0 2px ${glowColor})` : 'none' }} />
            </g>
          )
        })}

        {/* RPi 5 box wires */}
        <circle cx={RPI_X} cy={py(10)} r={3.5} fill={C.eth}
          style={{ filter: `drop-shadow(0 0 3px ${C.eth})` }} />
        <text x={RPI_X+8} y={py(10)+4} fill="#aaa" fontSize={8.5} fontFamily={FONT}>ETH IN</text>
        <text x={RPI_X+8} y={RPI_Y+70} fill="#555" fontSize={8.5} fontFamily={FONT}>Web :4000 / Skjerm</text>
        <text x={RPI_X+8} y={RPI_Y+88} fill="#a78bfa99" fontSize={8} fontFamily={FONT}>BLE5: 123\ignition TUNE+</text>
        <text x={RPI_X+8} y={RPI_Y+100} fill={C.tpms+'88'} fontSize={8} fontFamily={FONT}>BLE: PECHAM TPMS ×4</text>

        {/* 123ignition TUNE+ box */}
        <rect x={RPI_X-5} y={RPI_Y+130} width={RPI_W+10} height={62} rx={5}
          fill="#160d2a" stroke="#a78bfa66" strokeWidth={1.5} />
        <rect x={RPI_X-5} y={RPI_Y+130} width={RPI_W+10} height={18} rx={5} fill="#a78bfa22" />
        <rect x={RPI_X-5} y={RPI_Y+143} width={RPI_W+10} height={5} fill="#a78bfa22" />
        <text x={RPI_X+RPI_W/2} y={RPI_Y+143} textAnchor="middle" fill="#a78bfa"
          fontSize={9} fontWeight="700" fontFamily={FONT}>123\ignition TUNE+</text>
        <text x={RPI_X+RPI_W/2} y={RPI_Y+160} textAnchor="middle" fill="#666" fontSize={8} fontFamily={FONT}>Digital fordeler</text>
        <text x={RPI_X+RPI_W/2} y={RPI_Y+172} textAnchor="middle" fill="#666" fontSize={8} fontFamily={FONT}>BLE → RPM + °BTDC</text>
        <text x={RPI_X+RPI_W/2} y={RPI_Y+184} textAnchor="middle" fill="#555" fontSize={7.5} fontFamily={FONT}>Klikk BLE-linjen for info</text>

        {/* TPMS — 4 dekksensorer */}
        {(() => {
          const TX = RPI_X - 5, TY = RPI_Y + 210, TW = RPI_W + 10
          const tw = (TW - 10) / 2, th = 30, gap = 6
          const tires = [
            { label:'FL', sub:'Venstre front' },
            { label:'FR', sub:'Høyre front'   },
            { label:'RL', sub:'Venstre bak'   },
            { label:'RR', sub:'Høyre bak'     },
          ]
          return (
            <g>
              {/* BLE TPMS badge on RPi */}
              <text x={RPI_X+8} y={RPI_Y+115} fill={C.tpms+'99'} fontSize={8} fontFamily={FONT}>BLE 5.0 innebygd (RPi 5)</text>
              {/* Tire boxes 2×2 */}
              {tires.map((t, i) => {
                const col = i % 2, row = Math.floor(i / 2)
                const bx = TX + col * (tw + gap) + 2
                const by = TY + row * (th + gap)
                return (
                  <g key={t.label}>
                    <rect x={bx} y={by} width={tw} height={th} rx={4}
                      fill="#0f1a0a" stroke={C.tpms+'88'} strokeWidth={1} />
                    <text x={bx + tw/2} y={by + 12} textAnchor="middle"
                      fill={C.tpms} fontSize={9} fontWeight="700" fontFamily={FONT}>DEKK {t.label}</text>
                    <text x={bx + tw/2} y={by + 23} textAnchor="middle"
                      fill="#555" fontSize={7.5} fontFamily={FONT}>{t.sub}</text>
                  </g>
                )
              })}
              {/* Label */}
              <text x={TX + TW/2} y={TY + 2*(th+gap) + 12} textAnchor="middle"
                fill={C.tpms+'66'} fontSize={7.5} fontFamily={FONT}>PECHAM BLE TPMS — batteri-drevet, ventilkapsler</text>
            </g>
          )
        })()}

        {/* ── Warning boxes ── */}
        <rect x={ESP_X+ESP_W+18} y={py(9)-28} width={180} height={65} rx={5}
          fill="#1a0d00" stroke={C.rpm+'66'} strokeWidth={1} />
        <text x={ESP_X+ESP_W+28} y={py(9)-12} fill={C.rpm} fontSize={9} fontWeight="700" fontFamily={FONT}>⚠ RPM — HØYSPENNING</text>
        <text x={ESP_X+ESP_W+28} y={py(9)+4}  fill="#888" fontSize={8.5} fontFamily={FONT}>Tenningsspole: opp til 400V+</text>
        <text x={ESP_X+ESP_W+28} y={py(9)+18} fill="#888" fontSize={8.5} fontFamily={FONT}>ALLTID via 4N35 optokoppler!</text>
        <text x={ESP_X+ESP_W+28} y={py(9)+32} fill="#555" fontSize={8} fontFamily={FONT}>10kΩ i serie på anode-siden</text>

        <rect x={ESP_X+ESP_W+18} y={py(2)-28} width={180} height={55} rx={5}
          fill="#0d001a" stroke={C.spi+'66'} strokeWidth={1} />
        <text x={ESP_X+ESP_W+28} y={py(2)-12} fill={C.spi} fontSize={9} fontWeight="700" fontFamily={FONT}>CHT — 4× MAX31855</text>
        <text x={ESP_X+ESP_W+28} y={py(2)+4}  fill="#888" fontSize={8.5} fontFamily={FONT}>Delt SPI-buss (MISO/MOSI/CLK)</text>
        <text x={ESP_X+ESP_W+28} y={py(2)+18} fill="#888" fontSize={8.5} fontFamily={FONT}>+ 4× individuelle CS-pinner</text>

        {/* ── Legend ── */}
        <rect x={20} y={SH-115} width={240} height={105} rx={5} fill="#111" stroke="#222" />
        <text x={32} y={SH-99} fill="#fff" fontSize={9} fontWeight="700" fontFamily={FONT}>TEGNFORKLARING</text>
        {[
          { c:C.pwr12, l:'12V strøm',         thick:true,  dash:undefined },
          { c:C.pwr5,  l:'5V strøm',           thick:true,  dash:undefined },
          { c:C.gnd,   l:'Jord / GND',         thick:true,  dash:undefined },
          { c:C.ntc,   l:'Signal — nettverkskabel',       thick:false, dash:'12 6' },
          { c:C.eth,   l:'Ethernet CAT6 — WT32→RPi',    thick:false, dash:'12 6' },
          { c:C.wifi,  l:'BLE / WiFi — ingen kabel',    thick:false, dash:'4 5'  },
          { c:C.tpms,  l:'BLE TPMS — trådløs (RPi 5)',  thick:false, dash:'4 5'  },
        ].map((it, i) => (
          <g key={i}>
            <line x1={32} y1={SH-84+i*17} x2={72} y2={SH-84+i*17}
              stroke={it.c} strokeWidth={it.thick ? 3.5 : 2}
              strokeDasharray={it.dash || undefined}
              style={{ filter: `drop-shadow(0 0 2px ${it.c}55)` }} />
            <text x={80} y={SH-80+i*17} fill="#888" fontSize={8.5} fontFamily={FONT}>{it.l}</text>
          </g>
        ))}
        <text x={32} y={SH-5} fill="#2a2a2a" fontSize={8} fontFamily={FONT}>Klikk en linje for detaljer</text>

        {/* ── Selected wire detail card ── */}
        {selWire && <DetailCard wire={selWire} x={cardPos[0]} y={cardPos[1]} />}

      </svg>
    </div>
  )
}
