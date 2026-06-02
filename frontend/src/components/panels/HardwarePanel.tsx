import { useState } from 'react'
import { WiringDiagram } from './WiringDiagram'

const panel: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: '#0d0d0d', color: '#ccc',
  fontFamily: 'system-ui, sans-serif', fontSize: 13,
  overflowY: 'auto', zIndex: 1000,
  padding: '0 0 60px 0',
}

const h1: React.CSSProperties = { color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }
const h2: React.CSSProperties = { color: '#00e5ff', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12, marginTop: 0 }
const section: React.CSSProperties = { padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }
const tag = (color: string): React.CSSProperties => ({
  display: 'inline-block', fontSize: 10, fontWeight: 700,
  background: `${color}22`, color, border: `1px solid ${color}44`,
  borderRadius: 4, padding: '1px 6px', marginLeft: 6, verticalAlign: 'middle'
})

interface Item {
  id: string; sensor: string; desc: string; unit: string
  type: string; connector: string; price: string; note: string; required: boolean
}

const SHOPPING: Item[] = [
  // Olje
  { id: 'oil_temp_sender',  sensor: 'Olje Temp',         desc: 'NTC sender 1/8" NPT, 0-150°C',                   unit: '°C',  type: 'Analog (NTC)',       connector: '1/8" NPT',    price: '150–300 kr',  note: 'Passer i oljefilter-blokk, oljepanne eller tilpasset adapter i olje-sump', required: true },
  { id: 'oil_press_sender', sensor: 'Olje Trykk',        desc: '0-10 bar transducer 1/8" NPT (0.5-4.5V)',        unit: 'bar', type: 'Analog (0.5-4.5V)',  connector: '1/8" NPT',    price: '300–500 kr',  note: 'Ikke vanlig pressostat — trenger 0-10V/0.5-4.5V ratiometrisk sender', required: true },
  // CHT — sylinderhode-temperatur
  { id: 'cht_thermocouple', sensor: 'CHT ×4 Termoparer', desc: 'Type K termopar, 1/8" NPT ring-terminal, 0-300°C', unit: '°C', type: 'Termopar (SPI)',     connector: '1/8" NPT',    price: '200–500 kr',  note: '4 stk — ett per sylinder. Skrues inn i sylinderhodebolten eller bruker ring-terminal under plugg', required: true },
  { id: 'max31855',         sensor: 'MAX31855 ×4',       desc: 'SPI termopar-amplifier breakout-board',           unit: '°C',  type: 'SPI (3.3V)',         connector: 'SPI-buss',    price: '100–300 kr',  note: '4 stk — ett per termopar. Adafruit #269 eller AliExpress-klon. Del SPI-buss, bruk 4 separate CS-pinner', required: true },
  // Lambda
  { id: 'lambda_sensor',    sensor: 'Lambda / AFR',      desc: 'Wideband lambda-kontroller (AEM 30-0300 o.l.)',   unit: 'λ',   type: 'Analog (0-5V)',      connector: '18mm bung',   price: '1200–2500 kr', note: 'Inkluderer Bosch LSU 4.9 breidbånds-sonde + kontroller. 0V=7.35 AFR (rik), 5V=22.4 AFR (mager)', required: true },
  // Luftkjøling
  { id: 'iat_sender',       sensor: 'IAT (Inntaksluft)', desc: 'NTC temp-sensor, 1/8" NPT eller inline-type',     unit: '°C',  type: 'Analog (NTC)',       connector: '1/8" NPT',    price: '80–200 kr',   note: 'Monteres i luftfilter-hus eller innsugnings-kanal. Samme type som olje-NTC', required: false },
  // GPS
  { id: 'gps_module',       sensor: 'Hastighet (GPS)',   desc: 'NEO-6M GPS-modul, UART 3.3V, 1-10 Hz',           unit: 'km/h',type: 'UART (3.3V)',        connector: '4-pin header', price: '80–200 kr',  note: 'Erstatter kabel-speedometeret. Gir hastighet, retning og posisjon. Bruker GPIO26 (RX) direkte — ingen resistor', required: true },
  // 123ignition
  { id: 'ignition_123',     sensor: 'RPM + Tenning',     desc: '123\\ignition TUNE+ digital fordeler',            unit: 'rpm', type: 'Bluetooth LE',       connector: 'Fordelersokkel', price: '3500–5000 kr', note: 'Erstatter mekanisk fordeler + kontaktpunkter. Sender RPM og tenningsfremskyvning (°BTDC) via BLE til RPI. Alternativt: bruk tenningsspole NEG + 4N35 for kun RPM', required: false },
  // Elektrisk / drivstoff
  { id: 'voltage_div',      sensor: 'Batteri',           desc: 'Spenningsdeler 100kΩ + 27kΩ (DIY)',              unit: 'V',   type: 'Analog',             connector: 'Batteri +',   price: '10–30 kr',    note: 'Skalerer 0-15V til 0-3.3V. 100kΩ fra batteri+, 27kΩ til GND, midtpunkt til GPIO36', required: true },
  { id: 'fuel_sender',      sensor: 'Drivstoff',         desc: 'Eksisterende tank-sender (resistiv, 0-90Ω)',      unit: 'L',   type: 'Analog (resistiv)',  connector: 'Tank-sender', price: '0 kr',        note: 'Sitter allerede i tanken. Lag spenningsdeler: 5V → 120Ω → sender → GND, midtpunkt til GPIO39', required: false },
  // MAP / innsugning
  { id: 'map_sensor',       sensor: 'Innsugning (MAP)',  desc: 'Absolutt trykk-sensor 0-1 bar (MPX4115 o.l.)',   unit: 'bar', type: 'Analog (0-5V)',      connector: '4mm slange',  price: '150–400 kr',  note: 'For naturlig aspirert motor: vakuummåling 0-1 bar absolutt. Gir motorbelastning og tomgangskvalitet', required: false },
  // TPMS — dekktrykk trådløst
  { id: 'tpms_sensors',     sensor: 'TPMS Dekktrykk ×4', desc: '433MHz interne TPMS-sensorer (ventil-montert)',  unit: 'bar', type: '433MHz RF',          connector: 'Ventilstamme', price: '400–800 kr',  note: 'Sender batteri-drevet trykk + temp trådløst. Monteres av dekkverksted. Alternativt: ventilkappe-TPMS (utvendige) for enklere montering', required: false },
  { id: 'rtlsdr',           sensor: 'RTL-SDR USB-mottaker', desc: 'RTL2832U USB-dongle (RTL-SDR Blog V4 o.l.)', unit: '—',   type: '433MHz mottaker',    connector: 'USB-A',        price: '150–400 kr',  note: 'Plugges i RPI. rtl_433-programvare dekoderer TPMS-pakkene automatisk. Støtter også andre 433MHz-enheter', required: false },
]

const ARDUINO: { name: string; desc: string; price: string; rec: boolean; why: string }[] = [
  { name: 'ESP32 DevKit', desc: 'WiFi + Bluetooth, 12x ADC, rask, 3.3V', price: '100–180 kr', rec: true, why: 'Sender data trådløst til RPI over WiFi – ingen kabel i bilen nødvendig' },
  { name: 'Arduino Nano', desc: '8x ADC, USB, 5V, enkel', price: '80–150 kr', rec: false, why: 'Bra for nybegynnere, trenger USB-kabel til RPI eller HC-05 Bluetooth' },
  { name: 'Arduino Mega', desc: '16x ADC, mange pins', price: '200–350 kr', rec: false, why: 'Om du har mange sensorer og trenger alle pinnene' },
]

const MISC: { name: string; qty: string; price: string }[] = [
  { name: '4N35 optokoppler (RPM via tenningsspole)', qty: '2 stk', price: '~30 kr' },
  { name: 'Motstander sortiment (1kΩ–100kΩ)', qty: '1 sett', price: '~80 kr' },
  { name: '100µF/16V kondensatorer (støyfilter ADC)', qty: '5 stk', price: '~30 kr' },
  { name: '7805 eller L7805 5V regulator', qty: '1 stk', price: '~40 kr' },
  { name: 'Automotive Superseal 2-pin kontakter', qty: '10 sett', price: '~150 kr' },
  { name: 'Tilhengerkabel 2.5mm² (strøm + GND)', qty: '3m rød + 3m sort', price: '~80 kr' },
  { name: 'Nettverkskabel CAT5/6 (signalkabler)', qty: '5m', price: '~50 kr' },
  { name: 'Vanntett boks til ESP32 (IP65)', qty: '1 stk', price: '~120 kr' },
  { name: 'Auto-sikring 5A + sikringsholder', qty: '1 stk', price: '~50 kr' },
  { name: 'Stripe-board / Veroboard (kondisjonering)', qty: '1 stk', price: '~40 kr' },
]

interface CheckState { [key: string]: boolean }

export function HardwarePanel({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<CheckState>({})
  const [tab, setTab] = useState<'shopping' | 'wiring' | 'arduino'>('shopping')

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))

  const boughtCount = SHOPPING.filter(i => checked[i.id]).length
  const total = SHOPPING.filter(i => checked[i.id])
    .map(i => parseInt(i.price.split('–')[0].replace(/\D/g, '')) || 0)
    .reduce((a, b) => a + b, 0)

  const tabBtn = (t: typeof tab, label: string) => (
    <button onClick={() => setTab(t)} style={{
      background: tab === t ? '#00e5ff22' : 'transparent',
      border: `1px solid ${tab === t ? '#00e5ff' : '#333'}`,
      color: tab === t ? '#00e5ff' : '#666',
      borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
      fontSize: 11, fontWeight: 700, letterSpacing: 1, marginRight: 6
    }}>{label}</button>
  )

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0d0d0d', zIndex: 10 }}>
        <div>
          <div style={h1}>HARDWARE GUIDE</div>
          <div style={{ color: '#555', fontSize: 11 }}>Sensor-oppsett for gammel bobilmotor</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 22 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a1a1a' }}>
        {tabBtn('shopping', 'Handleliste')}
        {tabBtn('wiring', 'Koblingsskjema')}
        {tabBtn('arduino', 'Arduino-kode')}
      </div>

      {/* SHOPPING LIST */}
      {tab === 'shopping' && (
        <>
          <div style={{ ...section, paddingBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ color: '#fff', fontWeight: 700 }}>{boughtCount}/{SHOPPING.length}</span>
                <span style={{ color: '#555', marginLeft: 8 }}>komponenter i handlekurven</span>
              </div>
              {boughtCount > 0 && <span style={{ color: '#00e5ff' }}>≈ {total}+ kr</span>}
            </div>
          </div>

          {/* MCU */}
          <div style={section}>
            <div style={h2}>MIKROKONTROLLER (velg 1)</div>
            {ARDUINO.map(a => (
              <div key={a.name} onClick={() => toggle('mcu_' + a.name)}
                style={{ display: 'flex', gap: 12, marginBottom: 14, cursor: 'pointer', opacity: checked['mcu_' + a.name] ? 1 : 0.7 }}>
                <div style={{ width: 20, height: 20, border: `2px solid ${checked['mcu_' + a.name] ? '#00e5ff' : '#444'}`, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked['mcu_' + a.name] ? '#00e5ff22' : 'transparent' }}>
                  {checked['mcu_' + a.name] && <span style={{ color: '#00e5ff', fontSize: 13 }}>✓</span>}
                </div>
                <div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{a.name}</span>
                  {a.rec && <span style={tag('#a8ff3e')}>ANBEFALT</span>}
                  <span style={{ color: '#00e5ff', float: 'right', fontSize: 12 }}>{a.price}</span>
                  <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{a.desc}</div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>{a.why}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sensors */}
          <div style={section}>
            <div style={h2}>SENSORER</div>
            {SHOPPING.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ display: 'flex', gap: 12, marginBottom: 16, cursor: 'pointer', opacity: checked[item.id] ? 1 : 0.75 }}>
                <div style={{ width: 20, height: 20, border: `2px solid ${checked[item.id] ? '#00e5ff' : '#444'}`, borderRadius: 4, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked[item.id] ? '#00e5ff22' : 'transparent' }}>
                  {checked[item.id] && <span style={{ color: '#00e5ff', fontSize: 13 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{item.sensor}</span>
                    <span style={{ color: checked[item.id] ? '#00e5ff' : '#555', fontSize: 12 }}>{item.price}</span>
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 1 }}>{item.desc}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={tag('#555')}>{item.type}</span>
                    <span style={tag('#555')}>{item.connector}</span>
                    {item.required && <span style={tag('#ffaa00')}>NØDVENDIG</span>}
                  </div>
                  <div style={{ color: '#555', fontSize: 11, marginTop: 4, borderLeft: '2px solid #222', paddingLeft: 8 }}>{item.note}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Misc */}
          <div style={section}>
            <div style={h2}>DIVERSE / ELEKTRONIKK</div>
            {MISC.map(m => (
              <div key={m.name} onClick={() => toggle('misc_' + m.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${checked['misc_' + m.name] ? '#00e5ff' : '#444'}`, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked['misc_' + m.name] ? '#00e5ff22' : 'transparent' }}>
                  {checked['misc_' + m.name] && <span style={{ color: '#00e5ff', fontSize: 11 }}>✓</span>}
                </div>
                <span style={{ flex: 1, color: '#ccc' }}>{m.name}</span>
                <span style={{ color: '#555', fontSize: 11 }}>{m.qty}</span>
                <span style={{ color: '#555', fontSize: 11, width: 70, textAlign: 'right' }}>{m.price}</span>
              </div>
            ))}
          </div>

          <div style={{ ...section, background: '#111', margin: '0 16px 16px', borderRadius: 8, border: '1px solid #222' }}>
            <div style={{ color: '#00e5ff', fontWeight: 700, marginBottom: 6 }}>Hvor kjøpe?</div>
            <div style={{ color: '#888', lineHeight: 1.8, fontSize: 12 }}>
              <div>• <strong style={{ color: '#ccc' }}>Elfadistrelec.no / TME.eu</strong> — elektronikk, motstander, kondensatorer</div>
              <div>• <strong style={{ color: '#ccc' }}>AliExpress</strong> — sensorer, ESP32, Arduino (3-4 ukers leveringstid)</div>
              <div>• <strong style={{ color: '#ccc' }}>Autodoc.no / Biltema</strong> — temp-sendere, oljetrykk-sendere</div>
              <div>• <strong style={{ color: '#ccc' }}>Amazon.de</strong> — raskere enn Ali, litt dyrere</div>
              <div>• <strong style={{ color: '#ccc' }}>Kjell & Company</strong> — akutthandel, dyrere men raskt</div>
            </div>
          </div>
        </>
      )}

      {/* WIRING */}
      {tab === 'wiring' && (
        <div style={{ padding: '16px 24px' }}>
          <div style={h2}>KOBLINGSSKJEMA — ESP32 + SENSORER</div>
          <WiringDiagram />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { pin: 'SPI + CS1-4',  sensor: 'CHT Syl. 1-4 (MAX31855)', note: 'MISO=19, CLK=18, MOSI=23, CS: 5/17/16/4' },
              { pin: 'GPIO34',       sensor: 'Olje Temp (ADC)',           note: 'NTC 4.7kΩ pull-up til 5V' },
              { pin: 'GPIO35',       sensor: 'Olje Trykk (ADC)',          note: 'Spenningsdeler 10k+3.3kΩ (4.5V→3.3V)' },
              { pin: 'GPIO32',       sensor: 'Lambda / AFR (ADC)',        note: 'Spenningsdeler 10k+6.8kΩ (5V→3.3V)' },
              { pin: 'GPIO33',       sensor: 'IAT Inntaksluft (ADC)',     note: 'NTC 4.7kΩ pull-up til 5V' },
              { pin: 'GPIO36',       sensor: 'Batteri (ADC)',             note: '100k/27kΩ spenningsdeler (15V→3.3V)' },
              { pin: 'GPIO39',       sensor: 'Drivstoff (ADC)',           note: '120Ω i serie + tank-sender + 5V' },
              { pin: 'GPIO37',       sensor: 'Termostatflap (ADC)',       note: 'Pot 10kΩ, spenningsdeler 10k+6.8kΩ' },
              { pin: 'GPIO25',       sensor: 'RPM (interrupt)',           note: 'Via 4N35 optokoppler, tenningsspole NEG' },
              { pin: 'GPIO26 (RX2)', sensor: 'GPS NEO-6M (UART)',         note: '3.3V direkte, 9600 baud NMEA' },
              { pin: 'WiFi',         sensor: 'Data → RPI bulk',           note: 'HTTP POST til :4000/api/sensors/bulk' },
              { pin: 'RPI BLE',      sensor: '123\\ignition TUNE+',       note: 'Bluetooth LE → RPM + °BTDC' },
            ].map(r => (
              <div key={r.pin} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: 12 }}>{r.pin}</span>
                <span style={{ color: '#fff', marginLeft: 8, fontSize: 12 }}>{r.sensor}</span>
                <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARDUINO CODE */}
      {tab === 'arduino' && (
        <div style={section}>
          <div style={h2}>ESP32 FIRMWARE (Arduino IDE)</div>
          <pre style={{ color: '#a8ff3e', fontSize: 11, lineHeight: 1.7, background: '#0a0a0a', padding: 16, borderRadius: 8, overflowX: 'auto', border: '1px solid #1a1a1a' }}>{`// Krever Arduino-biblioteker:
//   Adafruit MAX31855  (Biblioteksbehandler → søk "MAX31855")
//   TinyGPSPlus        (Biblioteksbehandler → søk "TinyGPSPlus")
//   ArduinoJson        (Biblioteksbehandler → søk "ArduinoJson")

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ── Konfigurasjon ─────────────────────────────────
const char* SSID     = "ditt-wifi";
const char* PASS     = "passord";
const char* RPI_HOST = "http://192.168.1.xxx:4000/api/sensors/bulk";

// ── MAX31855 — CHT sylinder 1-4 (delt SPI-buss) ──
// SPI: MISO=19, CLK=18, MOSI=23 (standard)
Adafruit_MAX31855 cht1(5),  cht2(17), cht3(16), cht4(4);

// ── GPS NEO-6M — UART2 på GPIO26 (RX) ────────────
HardwareSerial gpsUART(2);
TinyGPSPlus    gps;

// ── ADC-pinner (alle ADC1 — virker med WiFi) ──────
#define PIN_OIL_TEMP   34   // NTC → 4.7kΩ pull-up 5V
#define PIN_OIL_PRESS  35   // 0-10bar → spenningsdeler 10k+3.3kΩ
#define PIN_LAMBDA     32   // Wideband 0-5V → spenningsdeler 10k+6.8kΩ
#define PIN_IAT        33   // NTC inntaksluft → 4.7kΩ pull-up 5V
#define PIN_BATTERY    36   // 12V → spenningsdeler 100k+27kΩ
#define PIN_FUEL       39   // Tank-sender → 120Ω serie + 5V
#define PIN_AIR_FLAP   37   // Pot 10kΩ → spenningsdeler 10k+6.8kΩ

// ── RPM via 4N35 optokoppler (tenningsspole NEG) ──
#define PIN_RPM 25
volatile uint32_t rpmPulses = 0;
void IRAM_ATTR rpmISR() { rpmPulses++; }
unsigned long lastCalc = 0;
float rpm = 0;
// 4-sylindret 4-takt fordeler: 2 pulser per motoromdreiing
#define RPM_PPR 2

// ── Steinhart-Hart NTC konvertering ───────────────
float ntcToC(int raw, float rPull = 4700, float r25 = 120, float b = 3977) {
  float v = raw * 3.3f / 4095.0f;
  if (v < 0.05f || v > 3.25f) return -99;
  float r = rPull * v / (3.3f - v);
  return 1.0f / (1.0f / 298.15f + log(r / r25) / b) - 273.15f;
}

// ── Oljetrykk (0.5V=0bar, 4.5V=10bar) ─────────────
float oilPressBar(int raw) {
  float v = raw * 3.3f / 4095.0f * (4.5f / 3.3f);
  return constrain((v - 0.5f) * 2.5f, 0, 10);
}

// ── Lambda (AEM 30-0300: 0V=7.35AFR, 5V=22.4AFR) ──
float lambdaVal(int raw) {
  float v5 = raw * 5.0f / 4095.0f;
  float afr = 7.35f + v5 * (22.4f - 7.35f) / 5.0f;
  return afr / 14.7f;  // → lambda (1.0 = stoikiometrisk)
}

// ── Batteri (100kΩ + 27kΩ) ────────────────────────
float batteryV(int raw) {
  return raw * 3.3f / 4095.0f * (127000.0f / 27000.0f);
}

void calcRpm() {
  unsigned long now = millis(), dt = now - lastCalc;
  if (dt < 500) return;
  noInterrupts(); uint32_t p = rpmPulses; rpmPulses = 0; interrupts();
  rpm = (p / (float)RPM_PPR) * (60000.0f / dt);
  lastCalc = now;
}

// ── Bulk JSON POST til RPI ─────────────────────────
void pushBulk(float oilT, float oilP, float c1, float c2, float c3, float c4,
              float lam, float iat, float flap, float batt, float fuel, float spd) {
  if (WiFi.status() != WL_CONNECTED) return;
  char json[512];
  snprintf(json, sizeof(json),
    "{"
      "\\"rpm\\":%.0f,\\"speed\\":%.1f,"
      "\\"oil_temp\\":%.1f,\\"oil_press\\":%.2f,"
      "\\"cht1\\":%.0f,\\"cht2\\":%.0f,\\"cht3\\":%.0f,\\"cht4\\":%.0f,"
      "\\"lambda\\":%.3f,\\"iat\\":%.1f,\\"air_flap\\":%.0f,"
      "\\"battery\\":%.2f,\\"fuel\\":%.1f"
    "}",
    rpm, spd, oilT, oilP, c1, c2, c3, c4, lam, iat, flap, batt, fuel);
  HTTPClient http;
  http.begin(RPI_HOST);
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  cht1.begin(); cht2.begin(); cht3.begin(); cht4.begin();
  // GPS: RX=GPIO26, TX=GPIO27 (vi leser kun RX)
  gpsUART.begin(9600, SERIAL_8N1, 26, 27);
  attachInterrupt(digitalPinToInterrupt(PIN_RPM), rpmISR, FALLING);
  WiFi.begin(SSID, PASS);
  Serial.print("WiFi...");
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println(" OK " + WiFi.localIP().toString());
}

unsigned long lastPush = 0;

void loop() {
  while (gpsUART.available()) gps.encode(gpsUART.read());
  calcRpm();

  if (millis() - lastPush < 200) return;  // 5 Hz

  double c1 = cht1.readCelsius(), c2 = cht2.readCelsius();
  double c3 = cht3.readCelsius(), c4 = cht4.readCelsius();

  pushBulk(
    ntcToC(analogRead(PIN_OIL_TEMP)),
    oilPressBar(analogRead(PIN_OIL_PRESS)),
    isnan(c1)?-1:c1, isnan(c2)?-1:c2,
    isnan(c3)?-1:c3, isnan(c4)?-1:c4,
    lambdaVal(analogRead(PIN_LAMBDA)),
    ntcToC(analogRead(PIN_IAT), 4700, 10000, 3950),
    analogRead(PIN_AIR_FLAP) * 100.0f / 4095.0f,
    batteryV(analogRead(PIN_BATTERY)),
    analogRead(PIN_FUEL) * 40.0f / 4095.0f,  // kalibreres!
    gps.speed.isValid() ? gps.speed.kmph() : 0
  );
  lastPush = millis();
}
`}</pre>
          <div style={{ marginTop: 16, background: '#111', border: '1px solid #ffaa0033', borderRadius: 8, padding: 14 }}>
            <div style={{ color: '#ffaa00', fontWeight: 700, marginBottom: 6 }}>⚠ Kalibrering</div>
            <div style={{ color: '#888', fontSize: 12, lineHeight: 1.8 }}>
              <div>• <strong style={{ color: '#ccc' }}>NTC r25 + B-verdi</strong>: les fra datasheetet til senderen du kjøper (oljetemperatur-sendre er vanligvis 120Ω @ 25°C, B≈3977)</div>
              <div>• <strong style={{ color: '#ccc' }}>IAT</strong>: IAT NTC er typisk 10kΩ @ 25°C, B≈3950 — endre r25=10000 i ntcToC-kallet</div>
              <div>• <strong style={{ color: '#ccc' }}>Oljetrykk-sender</strong>: sjekk om den er 0.5-4.5V (ratiometrisk) eller 4-20mA (da trenger du 250Ω shunt)</div>
              <div>• <strong style={{ color: '#ccc' }}>RPM_PPR</strong>: 4-sylindret 4-takt fordeler = 2 pulser per omdr. Sjekk ved tomgang mot turteller</div>
              <div>• <strong style={{ color: '#ccc' }}>Drivstoff</strong>: mål sender-motstand tom/full med multimeter, tilpass formelen</div>
              <div>• <strong style={{ color: '#ccc' }}>Lambda</strong>: AEM 30-0300 brukes her. Sjekk hvilken AFR-range din kontroller sender</div>
              <div>• <strong style={{ color: '#ccc' }}>123ignition TUNE+</strong>: sender RPM via BLE til RPI (ikke ESP32). Se server.js for BLE-bridge</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
