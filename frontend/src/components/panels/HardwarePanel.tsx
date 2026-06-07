import { useState } from 'react'

const FONT_MONO = "'IBM Plex Mono', monospace"
const FONT_UI   = "'Space Grotesk', system-ui, sans-serif"

const panel: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: '#08090f',
  color: '#b0bfd0',
  fontFamily: FONT_UI, fontSize: 13,
  overflowY: 'auto', zIndex: 1000,
  padding: '0 0 80px 0',
}

const sectionStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #131c2a',
}

function Chip({ label, color = '#00C8FF' }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      background: color + '18',
      color,
      border: `1px solid ${color}44`,
      borderRadius: 5,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1,
      fontFamily: FONT_MONO,
    }}>{label}</span>
  )
}

function SectionTitle({ children, color = '#00C8FF' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      color,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 3,
      marginBottom: 16,
      fontFamily: FONT_MONO,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{ flex: 1, height: 1, background: `${color}22` }} />
      {children}
      <div style={{ flex: 1, height: 1, background: `${color}22` }} />
    </div>
  )
}

// ── Connector table data ─────────────────────────────────────────────────────

const CONNECTORS = [
  { ref: 'J0–J7',   type: 'Thermocouple T+/T−',     qty: 8,  chip: 'MAX31855',  color: '#ff6b35', desc: 'K-type thermocouple pairs — CHT, EGT, oil, coolant (any combo)' },
  { ref: 'J8–J11',  type: 'NTC Thermistor SIG/GND',  qty: 4,  chip: '10kΩ pull-up', color: '#a8ff3e', desc: '10kΩ NTC thermistors — oil temp, coolant, IAT, cabin temp' },
  { ref: 'J12–J15', type: 'MOSFET Output +12V/LOAD', qty: 4,  chip: 'AO3400A',   color: '#ff2020', desc: 'Logic-level switched 12V — fan, pump, relay coil, solenoid, buzzer' },
  { ref: 'J16–J23', type: 'Analog 0–5V SIG/GND',     qty: 8,  chip: 'ADC divider', color: '#bf5fff', desc: 'Oil pressure, fuel pressure, fuel level, TPS, lambda, IAT, MAP, brake' },
  { ref: 'J24–J29', type: 'Digital Input IN+/IN−',   qty: 6,  chip: 'PC817C',    color: '#ffaa00', desc: 'Galvanic-isolated: RPM, wheel speed, gear switch, brake light' },
  { ref: 'J30',     type: '12V Power IN',             qty: 1,  chip: 'MP2307DN',  color: '#e53935', desc: '12V vehicle supply → 5A fuse → 3A buck converter → 5V rail' },
  { ref: 'J22',     type: '2×10 Header 2mm',          qty: 1,  chip: 'WIZ820io',  color: '#00C8FF', desc: 'WIZnet W5200 Ethernet module socket — SPI1 bus' },
]

// ── BOM data ─────────────────────────────────────────────────────────────────

const BOM = [
  { qty: 1,  ref: 'U1',         value: 'Teensy 4.1',         pkg: '2×24 socket',    lcsc: 'pjrc.com',  nok: 320,  desc: '600 MHz ARM Cortex-M7, 18× ADC, SD card, multiple SPI' },
  { qty: 1,  ref: 'U2',         value: 'WIZ820io',           pkg: '2×10 hdr 2mm',   lcsc: 'wiznet.io', nok: 120,  desc: 'W5200 Ethernet 100 Mbit, RJ45 on module' },
  { qty: 8,  ref: 'U3–U10',     value: 'MAX31855KASA+',      pkg: 'SOIC-8',         lcsc: 'C67561',    nok: 360,  desc: 'SPI K-type thermocouple amplifier, individual CS per chip' },
  { qty: 1,  ref: 'U11',        value: 'LIS3DH',             pkg: '14-LGA',         lcsc: 'C91122',    nok: 15,   desc: '3-axis MEMS accelerometer ±16g, shared SPI bus' },
  { qty: 1,  ref: 'U12',        value: 'MP2307DN',           pkg: 'SOP-8',          lcsc: 'C89312',    nok: 18,   desc: '3A synchronous buck 8–24V → 5.0V, ~90% efficiency' },
  { qty: 4,  ref: 'Q1–Q4',      value: 'AO3400A',            pkg: 'SOT-23',         lcsc: 'C20917',    nok: 8,    desc: 'N-ch MOSFET 30V/5.7A logic-level gate, 100Ω gate resistor' },
  { qty: 6,  ref: 'OK1–OK6',    value: 'PC817C',             pkg: 'DIP-4',          lcsc: 'C6366',     nok: 18,   desc: 'Optocoupler, galvanic isolation, tolerates 400V spikes' },
  { qty: 4,  ref: 'D1–D4',      value: '1N4007',             pkg: 'DO-41',          lcsc: 'C14007',    nok: 4,    desc: 'Flyback protection diode for MOSFET outputs' },
  { qty: 20, ref: 'R1–R20',     value: '10 kΩ',              pkg: '0805',           lcsc: 'C25744',    nok: 5,    desc: 'NTC pull-up + upper ADC voltage divider' },
  { qty: 8,  ref: 'R21–R28',    value: '15 kΩ',              pkg: '0805',           lcsc: 'C25885',    nok: 3,    desc: 'Lower ADC divider: 5V → 3.0V (Teensy ADC max 3.3V)' },
  { qty: 6,  ref: 'R29–R34',    value: '470 Ω',              pkg: '0805',           lcsc: 'C25117',    nok: 2,    desc: 'Optocoupler LED current limiter (12V source)' },
  { qty: 4,  ref: 'R35–R38',    value: '100 Ω',              pkg: '0805',           lcsc: 'C25116',    nok: 1,    desc: 'MOSFET gate resistors' },
  { qty: 1,  ref: 'R39',        value: '330 Ω',              pkg: '0805',           lcsc: 'C25087',    nok: 1,    desc: 'Status LED current limiter' },
  { qty: 20, ref: 'C1–C20',     value: '100 nF',             pkg: '0805 16V',       lcsc: 'C1525',     nok: 4,    desc: 'Decoupling per MAX31855 chip + ADC noise filter' },
  { qty: 3,  ref: 'C21–C23',    value: '10 µF',              pkg: '0805 16V',       lcsc: 'C15850',    nok: 5,    desc: 'Buck output capacitor + Teensy supply decoupling' },
  { qty: 2,  ref: 'C24–C25',    value: '100 µF/25V',         pkg: 'Electrolytic',   lcsc: 'C16780',    nok: 8,    desc: 'Buck converter input/output bulk capacitors' },
  { qty: 1,  ref: 'F1',         value: '5A fuse',            pkg: 'Glass + holder', lcsc: 'C382046',   nok: 15,   desc: 'Input overcurrent protection' },
  { qty: 31, ref: 'J0–J30',     value: 'Screw terminal 2-pin', pkg: '5.0mm THT',   lcsc: 'C8262',     nok: 150,  desc: 'All sensor connectors, generic J-labeling only' },
  { qty: 1,  ref: 'J22',        value: '2×10 header 2mm',    pkg: 'THT',            lcsc: 'C50982',    nok: 15,   desc: 'WIZ820io module socket' },
  { qty: 1,  ref: 'LED1',       value: '3mm / 0805 LED',     pkg: 'THT or SMD',     lcsc: 'C2286',     nok: 2,    desc: 'Status LED on Teensy pin 41' },
  { qty: 1,  ref: 'PCB',        value: '130×110mm 2-layer',  pkg: 'FR4 ENIG green', lcsc: 'PCBWay',    nok: 80,   desc: 'See PCBWay Design Brief for full spec' },
]

const TOTAL_NOK = BOM.reduce((s, r) => s + r.nok, 0)

// ── Teensy 4.1 pin mapping ────────────────────────────────────────────────────

const TEENSY_PINS = [
  { pin: '0',      fn: 'SPI1 CS',     signal: 'WIZ820io',              color: '#00C8FF' },
  { pin: '1',      fn: 'SPI1 MISO',   signal: 'WIZ820io',              color: '#00C8FF' },
  { pin: '2',      fn: 'SPI CS',      signal: 'LIS3DH accelerometer',  color: '#a8ff3e' },
  { pin: '3–10',   fn: 'SPI CS ×8',   signal: 'MAX31855 J0–J7',        color: '#ff6b35' },
  { pin: '11',     fn: 'SPI MOSI',    signal: 'MAX31855 shared bus',   color: '#ff6b35' },
  { pin: '12',     fn: 'SPI MISO',    signal: 'MAX31855 shared bus',   color: '#ff6b35' },
  { pin: '13',     fn: 'SPI SCK',     signal: 'MAX31855 shared bus',   color: '#ff6b35' },
  { pin: '26',     fn: 'SPI1 MOSI',   signal: 'WIZ820io',              color: '#00C8FF' },
  { pin: '27',     fn: 'SPI1 SCK',    signal: 'WIZ820io',              color: '#00C8FF' },
  { pin: '28',     fn: 'INT',         signal: 'WIZ820io interrupt',    color: '#00C8FF' },
  { pin: '29',     fn: 'RST',         signal: 'WIZ820io reset',        color: '#00C8FF' },
  { pin: '30–35',  fn: 'Digital IN ×6', signal: 'Optocouplers J24–J29', color: '#ffaa00' },
  { pin: '36–39',  fn: 'Digital OUT ×4', signal: 'MOSFET gates J12–J15', color: '#ff2020' },
  { pin: 'A0–A7',  fn: 'ADC 0-5V ×8', signal: 'Analog inputs J16–J23', color: '#bf5fff' },
  { pin: 'A8–A11', fn: 'ADC NTC ×4',  signal: 'NTC thermistors J8–J11', color: '#a8ff3e' },
  { pin: '41',     fn: 'Digital OUT', signal: 'Status LED',             color: '#ffffff' },
]

// ── Board spec table ──────────────────────────────────────────────────────────

const BOARD_SPECS = [
  { param: 'Dimensions',      value: '130 × 110 mm' },
  { param: 'Layers',          value: '2 (FR4, 1.6 mm)' },
  { param: 'Copper weight',   value: '1 oz (35 µm)' },
  { param: 'Surface finish',  value: 'ENIG (gold)' },
  { param: 'Solder mask',     value: 'Green both sides' },
  { param: 'Silkscreen',      value: 'White — ref designators + J-numbers only' },
  { param: 'Min trace width', value: '0.2 mm signal / 0.8 mm power' },
  { param: 'Via drill/pad',   value: '0.6 mm / 1.0 mm' },
  { param: 'GND pour',        value: 'Both layers + stitching vias' },
  { param: 'Mounting holes',  value: '4× M3, 3.2 mm dia, each corner' },
  { param: 'Input voltage',   value: '8–24V DC (J30)' },
  { param: 'Buck output',     value: '5.0V @ 3A (~90% efficiency)' },
  { param: 'Estimated cost',  value: '~1 225 NOK incl. PCB' },
]

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'connectors' | 'bom' | 'schematic' | 'firmware'

export function HardwarePanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')

  function TabBtn({ id, label }: { id: Tab; label: string }) {
    const active = tab === id
    return (
      <button
        onClick={() => setTab(id)}
        style={{
          background: active ? '#00C8FF18' : 'transparent',
          border: `1px solid ${active ? '#00C8FF' : '#1a2030'}`,
          color: active ? '#00C8FF' : '#3a4a5a',
          borderRadius: 6,
          padding: '5px 14px',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.5,
          fontFamily: FONT_MONO,
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >{label}</button>
    )
  }

  return (
    <div style={panel}>
      {/* ── Header ── */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid #131c2a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0,
        background: '#08090f',
        zIndex: 10,
      }}>
        <div>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: 2, fontFamily: FONT_MONO }}>
            UNIVERSAL RACING SENSOR BOARD
          </div>
          <div style={{ color: '#2a3a50', fontSize: 10, marginTop: 3, letterSpacing: 1 }}>
            Teensy 4.1 Edition · v0.2 · PCBWay ready
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid #1a2030', color: '#3a4a5a', cursor: 'pointer', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: FONT_MONO }}
        >✕ CLOSE</button>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #131c2a',
        display: 'flex', gap: 6, overflowX: 'auto',
        background: '#08090f',
        position: 'sticky', top: 50, zIndex: 9,
      }}>
        <TabBtn id="overview"    label="OVERVIEW" />
        <TabBtn id="connectors"  label="CONNECTORS" />
        <TabBtn id="bom"         label="BOM" />
        <TabBtn id="schematic"   label="SCHEMATIC" />
        <TabBtn id="firmware"    label="FIRMWARE" />
      </div>

      {/* ════════════════ OVERVIEW TAB ════════════════ */}
      {tab === 'overview' && (
        <>
          {/* Hero stat row */}
          <div style={{
            ...sectionStyle,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
          }}>
            {[
              { v: '8×',    l: 'THERMOCOUPLE',  c: '#ff6b35' },
              { v: '8×',    l: 'ANALOG 0-5V',   c: '#bf5fff' },
              { v: '4×',    l: 'NTC THERMISTOR', c: '#a8ff3e' },
              { v: '6×',    l: 'DIGITAL INPUT',  c: '#ffaa00' },
              { v: '4×',    l: 'MOSFET OUTPUT',  c: '#ff2020' },
              { v: '100Mbit', l: 'ETHERNET',     c: '#00C8FF' },
            ].map(s => (
              <div key={s.l} style={{
                background: '#0d1119',
                border: `1px solid ${s.c}22`,
                borderRadius: 10,
                padding: '14px 12px',
                textAlign: 'center',
              }}>
                <div style={{ color: s.c, fontSize: 22, fontWeight: 700, fontFamily: FONT_MONO }}>{s.v}</div>
                <div style={{ color: '#3a4a5a', fontSize: 9, letterSpacing: 1.5, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Overview text */}
          <div style={sectionStyle}>
            <SectionTitle>DESIGN PHILOSOPHY</SectionTitle>
            <p style={{ color: '#6b7a8d', lineHeight: 1.85, margin: '0 0 14px 0', fontSize: 12 }}>
              A <strong style={{ color: '#e2e8f0' }}>universal, open-hardware sensor interface board</strong> for
              racing vehicles — not vehicle-specific. All connectors are labeled generically
              (<strong style={{ color: '#00C8FF' }}>J0, J1, J2…</strong>) on the PCB silkscreen.
              Sensor assignment happens via the web browser at <code style={{ color: '#a8ff3e', background: '#060a10', padding: '1px 5px', borderRadius: 3 }}>/settings</code>,
              where each connector gets a label (e.g. "J3 → Oil Pressure"). Configuration is saved
              to the Teensy's SD card and a printable wiring sheet can be generated.
            </p>
            <p style={{ color: '#6b7a8d', lineHeight: 1.85, margin: 0, fontSize: 12 }}>
              The brain is a <strong style={{ color: '#e2e8f0' }}>Teensy 4.1</strong> (600 MHz ARM
              Cortex-M7, 18× ADC, multiple SPI buses, built-in SD card). A <strong style={{ color: '#e2e8f0' }}>WIZ820io</strong> Ethernet
              module provides 100 Mbit LAN for this dashboard web UI, served directly from the Teensy.
            </p>
          </div>

          {/* Board specs */}
          <div style={sectionStyle}>
            <SectionTitle>PCB SPECIFICATIONS</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {BOARD_SPECS.map(row => (
                <div key={row.param} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  background: '#0d1119', borderRadius: 6, padding: '7px 12px',
                  border: '1px solid #131c2a',
                  gap: 8,
                }}>
                  <span style={{ color: '#3a4a5a', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>{row.param}</span>
                  <span style={{ color: '#a0b0c0', fontSize: 11, fontFamily: FONT_MONO, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-systems */}
          <div style={sectionStyle}>
            <SectionTitle>SUB-SYSTEMS</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  color: '#ff6b35',
                  label: 'THERMOCOUPLE AMPLIFIERS — 8× MAX31855KASA+',
                  detail: 'K-type, SOIC-8, individual CS pins 3–10 on Teensy. Shared SPI bus (SCK/MISO). 100nF decoupling per chip. Suitable for CHT, EGT, oil temp, coolant — any combination.',
                },
                {
                  color: '#bf5fff',
                  label: 'ANALOG 0–5V INPUTS — 8× channels (J16–J23)',
                  detail: '10kΩ + 15kΩ voltage divider scales 5V → 3.0V (Teensy ADC max 3.3V). 100nF filter cap. Oil pressure, fuel pressure, TPS, lambda/AFR, IAT, MAP, brake pressure.',
                },
                {
                  color: '#a8ff3e',
                  label: 'NTC THERMISTOR INPUTS — 4× channels (J8–J11)',
                  detail: '10kΩ pull-up to 3.3V per channel. 100nF filter cap. For 10kΩ NTC thermistors: oil temp, coolant, IAT, cabin temp.',
                },
                {
                  color: '#ffaa00',
                  label: 'DIGITAL INPUTS — 6× PC817C Optocouplers (J24–J29)',
                  detail: 'Full galvanic isolation. 470Ω series resistor for 12V signals. Tolerates inductive transients up to ~400V. RPM, wheel speed, gear switches, brake light.',
                },
                {
                  color: '#ff2020',
                  label: 'MOSFET SWITCHED OUTPUTS — 4× AO3400A (J12–J15)',
                  detail: 'Logic-level N-ch MOSFET 30V/5.7A. 100Ω gate resistor. 1N4007 flyback diode. Switched 12V at drain. Fan, pump, relay coil, solenoid, buzzer.',
                },
                {
                  color: '#00C8FF',
                  label: 'ETHERNET — WIZ820io Module (J22)',
                  detail: 'W5200 chip, 10/100 Mbit, RJ45 on module. SPI1 bus: MOSI=26, MISO=1, SCK=27, CS=0. Int=28, RST=29. Serves dashboard HTTP + WebSocket from Teensy.',
                },
                {
                  color: '#a0b0c0',
                  label: 'ACCELEROMETER — LIS3DH (on-board)',
                  detail: '3-axis MEMS, ±2/4/8/16g selectable, SPI, CS=pin 2. Lateral G-force, braking, body tilt. 100nF decoupling.',
                },
                {
                  color: '#e53935',
                  label: 'POWER SUPPLY — MP2307DN 3A Buck (J30)',
                  detail: '8–24V input, 5.0V output, ~90% efficiency. 100µF + 10µF output caps. Teensy supplied via VIN; generates its own 3.3V. 12V rail also available for MOSFET loads.',
                },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#0d1119',
                  border: `1px solid ${s.color}22`,
                  borderLeft: `3px solid ${s.color}`,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: 11, fontFamily: FONT_MONO, letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ color: '#5a6a7a', fontSize: 11, lineHeight: 1.7 }}>{s.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ════════════════ CONNECTORS TAB ════════════════ */}
      {tab === 'connectors' && (
        <>
          <div style={sectionStyle}>
            <SectionTitle>CONNECTOR MAP — J0 TO J30</SectionTitle>
            <p style={{ color: '#3a4a5a', fontSize: 11, marginBottom: 16, lineHeight: 1.7 }}>
              All 31 screw terminals are 2-pin, 5.0mm pitch THT, placed at PCB edges for easy wiring.
              Silkscreen shows J-number only — sensor names are set in the /settings web UI.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CONNECTORS.map(c => (
                <div key={c.ref} style={{
                  background: '#0d1119',
                  border: `1px solid ${c.color}22`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <div style={{ flexShrink: 0, minWidth: 80 }}>
                    <div style={{ color: c.color, fontWeight: 700, fontSize: 14, fontFamily: FONT_MONO }}>{c.ref}</div>
                    <Chip label={c.chip} color={c.color} />
                  </div>
                  <div>
                    <div style={{ color: '#d0dae8', fontWeight: 600, fontSize: 12, marginBottom: 3 }}>{c.type}</div>
                    <div style={{ color: '#3a4a5a', fontSize: 11, lineHeight: 1.65 }}>{c.desc}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <div style={{ color: c.color, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 13 }}>{c.qty}×</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teensy pin map */}
          <div style={sectionStyle}>
            <SectionTitle color="#a8ff3e">TEENSY 4.1 PIN ASSIGNMENTS</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {TEENSY_PINS.map(p => (
                <div key={p.pin} style={{
                  background: '#0d1119',
                  border: `1px solid ${p.color}18`,
                  borderRadius: 7,
                  padding: '8px 12px',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ color: p.color, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12, minWidth: 55 }}>PIN {p.pin}</span>
                    <span style={{ color: '#3a4a5a', fontSize: 10, fontFamily: FONT_MONO }}>{p.fn}</span>
                  </div>
                  <div style={{ color: '#5a6a7a', fontSize: 11, marginTop: 2 }}>{p.signal}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SPI bus summary */}
          <div style={sectionStyle}>
            <SectionTitle color="#ce93d8">SPI BUS SUMMARY</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ background: '#0d1119', border: '1px solid #ce93d822', borderRadius: 10, padding: 14 }}>
                <div style={{ color: '#ce93d8', fontWeight: 700, fontFamily: FONT_MONO, fontSize: 11, marginBottom: 8 }}>SPI BUS 0 — SENSORS</div>
                <div style={{ color: '#5a6a7a', fontSize: 11, lineHeight: 2 }}>
                  <div>MOSI = pin 11</div>
                  <div>MISO = pin 12</div>
                  <div>SCK  = pin 13</div>
                  <div>CS   = pins 2–10 (LIS3DH + MAX31855 ×8)</div>
                </div>
              </div>
              <div style={{ background: '#0d1119', border: '1px solid #00C8FF22', borderRadius: 10, padding: 14 }}>
                <div style={{ color: '#00C8FF', fontWeight: 700, fontFamily: FONT_MONO, fontSize: 11, marginBottom: 8 }}>SPI BUS 1 — ETHERNET</div>
                <div style={{ color: '#5a6a7a', fontSize: 11, lineHeight: 2 }}>
                  <div>MOSI = pin 26</div>
                  <div>MISO = pin 1</div>
                  <div>SCK  = pin 27</div>
                  <div>CS   = pin 0 (WIZ820io)</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ════════════════ BOM TAB ════════════════ */}
      {tab === 'bom' && (
        <div style={sectionStyle}>
          <SectionTitle>BILL OF MATERIALS</SectionTitle>

          {/* Total cost banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0d1119, #111a2a)',
            border: '1px solid #00C8FF33',
            borderRadius: 12,
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#3a4a5a', fontSize: 10, letterSpacing: 2 }}>ESTIMATED TOTAL COST</div>
              <div style={{ color: '#00C8FF', fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700 }}>~{TOTAL_NOK} NOK</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#3a4a5a', fontSize: 10 }}>Via LCSC + PCBWay</div>
              <div style={{ color: '#3a4a5a', fontSize: 10 }}>Teensy from pjrc.com</div>
            </div>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 80px 130px 90px 70px 60px 1fr',
            gap: 6,
            padding: '6px 10px',
            color: '#2a3a50',
            fontSize: 9,
            fontFamily: FONT_MONO,
            letterSpacing: 1,
            borderBottom: '1px solid #131c2a',
            marginBottom: 4,
          }}>
            <div>QTY</div>
            <div>REF</div>
            <div>VALUE</div>
            <div>PACKAGE</div>
            <div>LCSC</div>
            <div>NOK</div>
            <div>DESCRIPTION</div>
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {BOM.map((row, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '36px 80px 130px 90px 70px 60px 1fr',
                gap: 6,
                padding: '7px 10px',
                background: i % 2 === 0 ? '#0d1119' : 'transparent',
                borderRadius: 5,
                alignItems: 'start',
              }}>
                <div style={{ color: '#00C8FF', fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11 }}>{row.qty}</div>
                <div style={{ color: '#d0dae8', fontFamily: FONT_MONO, fontSize: 10 }}>{row.ref}</div>
                <div style={{ color: '#a0b8cc', fontWeight: 600, fontSize: 11 }}>{row.value}</div>
                <div style={{ color: '#3a4a5a', fontFamily: FONT_MONO, fontSize: 10 }}>{row.pkg}</div>
                <div style={{ color: '#2a6a9a', fontFamily: FONT_MONO, fontSize: 10 }}>{row.lcsc}</div>
                <div style={{ color: '#a8ff3e', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700 }}>{row.nok}</div>
                <div style={{ color: '#3a4a5a', fontSize: 10, lineHeight: 1.5 }}>{row.desc}</div>
              </div>
            ))}
          </div>

          {/* Total row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '36px 80px 130px 90px 70px 60px 1fr',
            gap: 6,
            padding: '10px 10px',
            borderTop: '2px solid #00C8FF22',
            marginTop: 6,
          }}>
            <div />
            <div />
            <div />
            <div />
            <div style={{ color: '#3a4a5a', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700 }}>TOTAL</div>
            <div style={{ color: '#00C8FF', fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700 }}>{TOTAL_NOK}</div>
            <div style={{ color: '#3a4a5a', fontSize: 10 }}>NOK estimated</div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 20, background: '#0d1119', border: '1px solid #ffaa0033', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#ffaa00', fontWeight: 700, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>ORDERING NOTES</div>
            <div style={{ color: '#3a4a5a', fontSize: 11, lineHeight: 2 }}>
              <div>• Teensy 4.1: order from <strong style={{ color: '#e2e8f0' }}>pjrc.com</strong> — socket-mount only, do NOT solder permanently</div>
              <div>• WIZ820io: order from <strong style={{ color: '#e2e8f0' }}>wiznet.io</strong> or AliExpress (module includes RJ45)</div>
              <div>• All SMD passives (R/C) and MAX31855 / LIS3DH / AO3400A / PC817C: order via <strong style={{ color: '#e2e8f0' }}>LCSC</strong> using part numbers above</div>
              <div>• PCB: order from <strong style={{ color: '#e2e8f0' }}>PCBWay</strong> — see PCBWay Design Brief for full gerber/assembly spec</div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ SCHEMATIC TAB ════════════════ */}
      {tab === 'schematic' && (
        <div style={sectionStyle}>
          <SectionTitle>SCHEMATIC — v0.2</SectionTitle>

          {/* Embedded SVG notice */}
          <div style={{
            background: '#0d1119',
            border: '1px solid #00C8FF22',
            borderRadius: 12,
            padding: 20,
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <div style={{ color: '#3a4a5a', fontSize: 12, marginBottom: 16, lineHeight: 1.8 }}>
              The full KiCad schematic for the Universal Racing Sensor Board v0.2 is available in the
              project repository. It covers all sub-systems including the Teensy 4.1 socket,
              WIZ820io Ethernet module, 8× MAX31855 thermocouple amplifiers, LIS3DH accelerometer,
              MP2307DN buck converter, 8× analog dividers, 4× NTC inputs, 6× PC817C optocouplers
              and 4× AO3400A MOSFET outputs.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/hardware/pcb/schematic_v0.2_full.svg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#00C8FF18',
                  border: '1px solid #00C8FF44',
                  color: '#00C8FF',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontFamily: FONT_MONO,
                  textDecoration: 'none',
                }}
              >VIEW FULL SCHEMATIC SVG</a>
              <a
                href="/hardware/pcb/teensy_sensor_board_schematic.svg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#a8ff3e18',
                  border: '1px solid #a8ff3e44',
                  color: '#a8ff3e',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontFamily: FONT_MONO,
                  textDecoration: 'none',
                }}
              >TEENSY BOARD SCHEMATIC</a>
            </div>
          </div>

          {/* Block diagram */}
          <SectionTitle color="#bf5fff">BLOCK DIAGRAM</SectionTitle>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <svg width={780} height={520} style={{ display: 'block', minWidth: 780, background: '#060a10', borderRadius: 10 }}>
              {/* Power chain */}
              <text x={20} y={20} fill="#e53935" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">POWER</text>
              {/* Battery box */}
              <rect x={20} y={30} width={90} height={34} rx={5} fill="#1a0808" stroke="#e53935" strokeWidth={1.5} />
              <text x={65} y={51} textAnchor="middle" fill="#e53935" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">12V BATTERY</text>
              {/* Fuse */}
              <rect x={130} y={30} width={70} height={34} rx={5} fill="#1a0808" stroke="#e5393577" strokeWidth={1} />
              <text x={165} y={51} textAnchor="middle" fill="#e53935" fontSize={8} fontFamily={FONT_MONO}>FUSE 5A</text>
              <line x1={110} y1={47} x2={130} y2={47} stroke="#e53935" strokeWidth={2} />
              {/* Buck */}
              <rect x={220} y={30} width={90} height={34} rx={5} fill="#1a1008" stroke="#ff7043" strokeWidth={1.5} />
              <text x={265} y={45} textAnchor="middle" fill="#ff7043" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">MP2307DN</text>
              <text x={265} y={57} textAnchor="middle" fill="#ff704377" fontSize={8} fontFamily={FONT_MONO}>12V→5V 3A</text>
              <line x1={200} y1={47} x2={220} y2={47} stroke="#e53935" strokeWidth={2} />

              {/* 5V Rail */}
              <line x1={310} y1={47} x2={390} y2={47} stroke="#ff7043" strokeWidth={2} />
              <line x1={390} y1={47} x2={390} y2={90} stroke="#ff7043" strokeWidth={2} />
              <text x={330} y={42} fill="#ff7043" fontSize={8} fontFamily={FONT_MONO}>5V RAIL</text>

              {/* Teensy box (center) */}
              <rect x={320} y={100} width={140} height={320} rx={8} fill="#0a1020" stroke="#00C8FF" strokeWidth={2} />
              <rect x={320} y={100} width={140} height={22} rx={8} fill="#00C8FF22" />
              <rect x={320} y={113} width={140} height={9} fill="#00C8FF22" />
              <text x={390} y={115} textAnchor="middle" fill="#00C8FF" fontSize={10} fontFamily={FONT_MONO} fontWeight="700">TEENSY 4.1</text>
              <text x={390} y={130} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>600MHz ARM · 18×ADC · SD</text>
              <line x1={390} y1={90} x2={390} y2={100} stroke="#ff7043" strokeWidth={2} />

              {/* WIZ820io */}
              <rect x={570} y={100} width={110} height={50} rx={5} fill="#0a1525" stroke="#00C8FF" strokeWidth={1.5} />
              <text x={625} y={120} textAnchor="middle" fill="#00C8FF" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">WIZ820io</text>
              <text x={625} y={133} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>100Mbit Ethernet</text>
              <text x={625} y={143} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>RJ45 + SPI1</text>
              <line x1={460} y1={125} x2={570} y2={125} stroke="#00C8FF" strokeWidth={1.5} strokeDasharray="8 4" />
              <text x={505} y={120} textAnchor="middle" fill="#00C8FF66" fontSize={8} fontFamily={FONT_MONO}>SPI1</text>

              {/* MAX31855 ×8 */}
              <rect x={570} y={170} width={110} height={50} rx={5} fill="#130d00" stroke="#ff6b35" strokeWidth={1.5} />
              <text x={625} y={190} textAnchor="middle" fill="#ff6b35" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">MAX31855 ×8</text>
              <text x={625} y={203} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>J0–J7 K-type TC</text>
              <text x={625} y={213} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>SPI0 CS=3–10</text>
              <line x1={460} y1={195} x2={570} y2={195} stroke="#ff6b35" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* LIS3DH */}
              <rect x={570} y={240} width={110} height={40} rx={5} fill="#0a1505" stroke="#a8ff3e" strokeWidth={1.5} />
              <text x={625} y={258} textAnchor="middle" fill="#a8ff3e" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">LIS3DH</text>
              <text x={625} y={272} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>3-axis accel, CS=2</text>
              <line x1={460} y1={260} x2={570} y2={260} stroke="#a8ff3e" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* Left side sensors */}
              {/* Analog 0-5V */}
              <rect x={60} y={150} width={110} height={40} rx={5} fill="#100818" stroke="#bf5fff" strokeWidth={1.5} />
              <text x={115} y={167} textAnchor="middle" fill="#bf5fff" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">ANALOG ×8</text>
              <text x={115} y={180} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>J16–J23 0–5V ADC</text>
              <line x1={170} y1={170} x2={320} y2={170} stroke="#bf5fff" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* NTC */}
              <rect x={60} y={210} width={110} height={40} rx={5} fill="#081508" stroke="#a8ff3e" strokeWidth={1.5} />
              <text x={115} y={227} textAnchor="middle" fill="#a8ff3e" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">NTC THERMISTOR ×4</text>
              <text x={115} y={240} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>J8–J11 A8–A11</text>
              <line x1={170} y1={230} x2={320} y2={230} stroke="#a8ff3e" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* Digital in */}
              <rect x={60} y={270} width={110} height={40} rx={5} fill="#151000" stroke="#ffaa00" strokeWidth={1.5} />
              <text x={115} y={287} textAnchor="middle" fill="#ffaa00" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">PC817C ×6</text>
              <text x={115} y={300} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>J24–J29 RPM/speed</text>
              <line x1={170} y1={290} x2={320} y2={290} stroke="#ffaa00" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* MOSFET out */}
              <rect x={60} y={330} width={110} height={40} rx={5} fill="#150000" stroke="#ff2020" strokeWidth={1.5} />
              <text x={115} y={347} textAnchor="middle" fill="#ff2020" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">AO3400A ×4</text>
              <text x={115} y={360} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>J12–J15 12V switched</text>
              <line x1={170} y1={350} x2={320} y2={350} stroke="#ff2020" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* Dashboard UI */}
              <rect x={570} y={300} width={110} height={50} rx={5} fill="#0a0f08" stroke="#a8ff3e88" strokeWidth={1.5} strokeDasharray="6 3" />
              <text x={625} y={320} textAnchor="middle" fill="#a8ff3e" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">WEB DASHBOARD</text>
              <text x={625} y={333} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>HTTP + WebSocket</text>
              <text x={625} y={343} textAnchor="middle" fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>served from Teensy</text>
              <line x1={680} y1={150} x2={680} y2={300} stroke="#00C8FF44" strokeWidth={1} strokeDasharray="4 4" />

              {/* SD card */}
              <rect x={570} y={370} width={110} height={40} rx={5} fill="#0a0f10" stroke="#3a5a7a" strokeWidth={1.5} />
              <text x={625} y={387} textAnchor="middle" fill="#3a5a7a" fontSize={9} fontFamily={FONT_MONO} fontWeight="700">SD CARD</text>
              <text x={625} y={400} textAnchor="middle" fill="#2a3a4a" fontSize={8} fontFamily={FONT_MONO}>settings + logs</text>
              <line x1={460} y1={390} x2={570} y2={390} stroke="#3a5a7a" strokeWidth={1.5} strokeDasharray="8 4" />

              {/* Legend */}
              <rect x={20} y={440} width={400} height={65} rx={5} fill="#0d1119" stroke="#1a2030" strokeWidth={1} />
              <text x={32} y={458} fill="#fff" fontSize={8} fontFamily={FONT_MONO} fontWeight="700">LEGEND</text>
              {[
                { c: '#ff7043', l: 'Power (solid)' },
                { c: '#00C8FF', l: 'SPI bus (dashed)' },
                { c: '#bf5fff', l: 'ADC input (dashed)' },
                { c: '#ffaa00', l: 'Digital input (dashed)' },
                { c: '#ff2020', l: 'Switched output (dashed)' },
              ].map((it, i) => (
                <g key={i}>
                  <line x1={32 + Math.floor(i/3)*160} y1={470 + (i%3)*14} x2={55 + Math.floor(i/3)*160} y2={470 + (i%3)*14}
                    stroke={it.c} strokeWidth={2} strokeDasharray={i === 0 ? undefined : '6 3'} />
                  <text x={60 + Math.floor(i/3)*160} y={474 + (i%3)*14} fill="#3a4a5a" fontSize={8} fontFamily={FONT_MONO}>{it.l}</text>
                </g>
              ))}
            </svg>
          </div>

          {/* Design brief link */}
          <div style={{ marginTop: 20, background: '#0d1119', border: '1px solid #131c2a', borderRadius: 10, padding: 16 }}>
            <div style={{ color: '#00C8FF', fontWeight: 700, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>PCBWay DESIGN BRIEF</div>
            <div style={{ color: '#3a4a5a', fontSize: 11, lineHeight: 1.9 }}>
              <div>• Board: 130×110mm, 2-layer FR4, 1.6mm, ENIG surface finish</div>
              <div>• Min trace: 0.2mm signal / 0.8mm power, 0.2mm clearance</div>
              <div>• Vias: 0.6mm drill / 1.0mm pad, GND pour both layers + stitching</div>
              <div>• Mounting: 4× M3 holes (3.2mm dia) at each corner, 3mm from edge</div>
              <div>• Silkscreen: J-numbers only on connectors — no sensor names</div>
              <div>• Contact: <strong style={{ color: '#e2e8f0' }}>alexanderpabsdorff@gmail.com</strong></div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ FIRMWARE TAB ════════════════ */}
      {tab === 'firmware' && (
        <div style={sectionStyle}>
          <SectionTitle>TEENSY 4.1 FIRMWARE OVERVIEW</SectionTitle>
          <div style={{ color: '#3a4a5a', fontSize: 11, lineHeight: 1.85, marginBottom: 20 }}>
            <p style={{ margin: '0 0 10px 0' }}>
              Firmware runs on <strong style={{ color: '#e2e8f0' }}>Teensyduino (Arduino C++)</strong>.
              The Teensy serves the web dashboard directly over Ethernet using
              <strong style={{ color: '#e2e8f0' }}> QNEthernet</strong> — no separate server needed.
              Sensor readings are pushed via WebSocket at 50 Hz.
            </p>
            <p style={{ margin: '0 0 10px 0' }}>
              All connector assignments are stored as JSON on the SD card. The
              <code style={{ color: '#a8ff3e', background: '#060a10', padding: '1px 5px', borderRadius: 3 }}>/settings</code> page
              lets you label each J-connector (e.g. "J3 → Oil Pressure"). Changes are saved immediately
              and a printable wiring sheet is available at <code style={{ color: '#a8ff3e', background: '#060a10', padding: '1px 5px', borderRadius: 3 }}>/print</code>.
            </p>
          </div>

          <SectionTitle color="#a8ff3e">LIBRARIES REQUIRED</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {[
              { lib: 'QNEthernet',      desc: 'Teensy-native Ethernet / HTTP / WebSocket' },
              { lib: 'MAX31855',        desc: 'SPI thermocouple amplifier driver' },
              { lib: 'LIS3DH',          desc: 'SPI 3-axis accelerometer driver' },
              { lib: 'ArduinoJSON',     desc: 'Settings JSON serialization' },
              { lib: 'SD (built-in)',   desc: 'Settings + log storage on Teensy SD' },
              { lib: 'Teensyduino',     desc: 'Core Arduino library for Teensy 4.1' },
            ].map(r => (
              <div key={r.lib} style={{ background: '#0d1119', borderRadius: 7, padding: '9px 12px', border: '1px solid #1a2030' }}>
                <div style={{ color: '#a8ff3e', fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700 }}>{r.lib}</div>
                <div style={{ color: '#3a4a5a', fontSize: 10, marginTop: 2 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          <SectionTitle color="#ce93d8">FIRMWARE SKELETON</SectionTitle>
          <pre style={{
            color: '#a8ff3e', fontSize: 10, lineHeight: 1.75,
            background: '#050810', padding: 18, borderRadius: 10,
            overflowX: 'auto', border: '1px solid #131c2a',
            fontFamily: FONT_MONO,
          }}>{`// Universal Racing Sensor Board — Teensy 4.1 Firmware
// Libraries: QNEthernet · MAX31855 · LIS3DH · ArduinoJSON
// Board: Teensy 4.1 (Teensyduino)

#include <QNEthernet.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <LIS3DH.h>
#include <SD.h>
#include <ArduinoJson.h>

using namespace qindesign::network;

// ── MAX31855 — 8 thermocouple channels, CS pins 3–10 ──
const int TC_CS[] = {3,4,5,6,7,8,9,10};
Adafruit_MAX31855 tc[8] = {
  {TC_CS[0]},{TC_CS[1]},{TC_CS[2]},{TC_CS[3]},
  {TC_CS[4]},{TC_CS[5]},{TC_CS[6]},{TC_CS[7]}
};

// ── ADC — analog 0-5V on A0–A7, NTC on A8–A11 ──
float readVoltage5V(int pin) {
  // 10kΩ + 15kΩ divider: scale back to original 0–5V
  return analogRead(pin) * (3.3f / 1023.0f) * (25.0f / 15.0f);
}
float readNTC(int pin, float rPull = 10000.0f) {
  float v = analogRead(pin) * (3.3f / 1023.0f);
  float r = rPull * v / (3.3f - v);
  // Steinhart–Hart: B=3950, R25=10kΩ
  return (1.0f / (1.0f/298.15f + log(r/10000.0f)/3950.0f)) - 273.15f;
}

// ── Settings from SD card ──
struct ConnectorLabel { int j; char label[32]; char sensorType[24]; };
ConnectorLabel labels[31];
void loadSettings() {
  File f = SD.open("/settings.json");
  if (!f) return;
  StaticJsonDocument<4096> doc;
  deserializeJson(doc, f); f.close();
  int i = 0;
  for (JsonObject c : doc["connectors"].as<JsonArray>()) {
    labels[i].j = c["j"];
    strlcpy(labels[i].label,      c["label"],      32);
    strlcpy(labels[i].sensorType, c["sensorType"], 24);
    i++;
  }
}

EthernetServer server(80);

void setup() {
  Serial.begin(115200);
  Ethernet.begin();         // DHCP
  SD.begin(BUILTIN_SDCARD);
  loadSettings();
  for (auto& t : tc) t.begin();
  server.begin();
  pinMode(41, OUTPUT);      // Status LED
}

void loop() {
  digitalWrite(41, HIGH);   // LED heartbeat
  // Serve HTTP requests (dashboard + /settings + /print)
  EthernetClient client = server.accept();
  if (client) handleRequest(client);
  // Push sensor data via WebSocket at 50 Hz
  pushSensorData();
  delay(20);
  digitalWrite(41, LOW);
}`}</pre>

          {/* SPI wiring reminder */}
          <div style={{ marginTop: 20, background: '#0d1119', border: '1px solid #ffaa0033', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#ffaa00', fontWeight: 700, fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>PROGRAMMING NOTES</div>
            <div style={{ color: '#3a4a5a', fontSize: 11, lineHeight: 2 }}>
              <div>1. <strong style={{ color: '#e2e8f0' }}>Board:</strong> Select "Teensy 4.1" in Teensyduino Arduino IDE</div>
              <div>2. <strong style={{ color: '#e2e8f0' }}>Program via USB:</strong> USB cable to Teensy's micro-USB — no boot mode needed</div>
              <div>3. <strong style={{ color: '#e2e8f0' }}>Ethernet:</strong> Connect RJ45 to LAN switch, Teensy uses DHCP</div>
              <div>4. <strong style={{ color: '#e2e8f0' }}>Settings:</strong> Browse to <code style={{ color: '#a8ff3e' }}>http://&lt;teensy-ip&gt;/settings</code> to assign connectors</div>
              <div>5. <strong style={{ color: '#e2e8f0' }}>Dashboard:</strong> Browse to <code style={{ color: '#a8ff3e' }}>http://&lt;teensy-ip&gt;/</code> — or use racing.alexlab.no</div>
              <div>6. <strong style={{ color: '#e2e8f0' }}>SD card:</strong> Format as FAT32 before first use; settings.json is created automatically</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
