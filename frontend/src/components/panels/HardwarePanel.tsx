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

interface ShopItem {
  id: string
  name: string
  qty: string
  where: string
  note: string
  price?: string
  link?: string
}

interface ShopCategory {
  emoji: string
  title: string
  items: ShopItem[]
}

const CATEGORIES: ShopCategory[] = [
  {
    emoji: '🔧', title: 'MOTORROM',
    items: [
      { id: 'wt32', name: 'WT32-ETH01', qty: '1 stk', where: 'AliExpress — søk "WT32-ETH01"', note: 'ESP32 med innebygd Ethernet (LAN8720A). Mer stabil enn WiFi i bilmiljø. Programmeres via Arduino IDE akkurat som ESP32', price: '80–150 kr' },
      { id: 'max31855', name: 'MAX31855 breakout board', qty: '2 stk', where: 'AliExpress — søk "MAX31855 breakout"', note: 'SPI termopar-forsterker. Ett per K-type termokobling. Adafruit #269 eller AliExpress-klon fungerer fint', price: '50–120 kr' },
      { id: 'cht', name: 'K-type termokobling M6', qty: '2 stk', where: 'AliExpress — søk "K-type thermocouple M6"', note: 'Skrues inn i sylinderhodet eller bruker ring-terminal under plugg. Mål 0–300°C. Velg M6 gewinde for enkel montering', price: '60–150 kr' },
      { id: 'buck_motor', name: '12V → 5V DC-DC buck converter (min 2A)', qty: '1 stk', where: 'AliExpress — søk "LM2596 12V 5V"', note: 'Forsyner WT32-ETH01 og sensorer fra bilens 12V. Velg en med 2A+ kapasitet og innebygd kondensatorer for støyfiltrering', price: '30–80 kr' },
      { id: 'box_motor', name: 'IP65 prosjektboks', qty: '1 stk', where: 'Biltema / AliExpress', note: 'Vanntett boks til WT32-ETH01 og elektronikk. IP65 holder mot sprut og støv. Ca. 150×100mm er passe størrelse', price: '80–200 kr' },
      { id: 'deutsch', name: 'Deutsch DT 12-pin connector kit', qty: '1 stk', where: 'AliExpress — søk "Deutsch DT 12 pin connector kit"', note: 'Automotive-kontakter som tåler varme, vibrasjon og olje. Brukes for alle sensorledninger inn i boksen. Langt mer pålitelig enn vanlige skjøteklemmer', price: '150–300 kr' },
    ]
  },
  {
    emoji: '📺', title: 'DASHBORD',
    items: [
      { id: 'rpi', name: 'Raspberry Pi 4 (2GB eller 4GB)', qty: '1 stk', where: 'Kjell & Company', note: 'Kjører Node.js backend, WebSocket-server og nettleser i fullskjerm. 2GB er nok, 4GB gir litt mer spillerom', price: '700–950 kr' },
      { id: 'screen', name: 'Raspberry Pi offisiell 7" touchskjerm', qty: '1 stk', where: 'Kjell & Company', note: 'Offisiell DSI-skjerm, kobles direkte til RPI uten ekstra kabel. 800×480px, berøringsstøtte. Perfekt dashbord-størrelse', price: '700–900 kr' },
      { id: 'sd', name: 'MicroSD-kort 32GB Class 10', qty: '1 stk', where: 'Kjell & Company / Clas Ohlson', note: 'Til Raspberry Pi OS. Class 10 / A1-rated for god ytelse. SanDisk Endurance-serien anbefales for lang levetid i bil', price: '100–200 kr' },
      { id: 'buck_dash', name: '12V → 5V DC-DC buck converter (min 3A)', qty: '1 stk', where: 'AliExpress — søk "LM2596 12V 5V 3A"', note: 'RPI 4 + skjerm trekker opptil 3A. Bruk en 3A+ buck-omformer for trygg drift. Unngå billige 2A-versjoner her', price: '40–100 kr' },
      { id: 'box_dash', name: 'Prosjektboks til RPI', qty: '1 stk', where: 'Biltema / AliExpress', note: 'Holder RPI og buck-converter. Kan 3D-printes eller kjøpes ferdig. Monter bak dashbordet med god lufting', price: '50–150 kr' },
    ]
  },
  {
    emoji: '📡', title: 'GPS — FART OG TIMING',
    items: [
      { id: 'gps_module', name: 'NEO-6M GPS-modul med antenne', qty: '1 stk', where: 'AliExpress — søk "NEO-6M GPS module"', note: 'Kobles direkte til WT32-ETH01 via UART (GPIO26). 3.3V logikk, 9600 baud. Gir hastighet, retning og posisjon. Erstatter kabel-speedometeret', price: '60–150 kr' },
      { id: 'gps_ant', name: 'GPS antenne med lang kabel (aktiv)', qty: '1 stk', where: 'AliExpress — søk "GPS active antenna SMA"', note: 'Aktiv antenne gir bedre mottak enn den lille antennen som følger med NEO-6M. Legg antennen under frontruten eller på frunk for godt signal', price: '60–150 kr' },
    ]
  },
  {
    emoji: '🛞', title: 'DEKK — TPMS',
    items: [
      { id: 'tpms', name: 'PECHAM BLE TPMS ekstern sensor', qty: '4 stk', where: 'AliExpress — item 1005004504977890', note: 'Bluetooth LE ventilkapsler — ingen montering hos dekkverksted. Skrus rett på ventilstammene. RPI leser trykk + temperatur via BLE. Batteridrevet, holder 1–2 år', price: '300–500 kr' },
    ]
  },
  {
    emoji: '🔌', title: 'KABLING OG PROGRAMMERING',
    items: [
      { id: 'cat6', name: 'CAT6 FTP kabel, 5 meter', qty: '1 stk', where: 'Clas Ohlson / Elkjøp', note: 'Ethernet-kabel mellom WT32-ETH01 og RPI. FTP-skjermet kabel gir bedre støyimmunitet i bilmiljø. 5m er nok for de fleste installasjoner', price: '80–150 kr' },
      { id: 'slange', name: 'Korrugert plastslange, 5 meter', qty: '1 stk', where: 'Biltema', note: 'Beskytter sensorledninger mot varme, skav og olje i motorrommmet. Fåes i ulike dimensjoner — 10mm passer for de fleste ledningsbunter', price: '60–120 kr' },
      { id: 'rj45', name: 'RJ45 plugger + crimpe-verktøy', qty: '1 sett', where: 'Biltema / Clas Ohlson', note: 'For å lage tilpassede Ethernet-kabler i riktig lengde. Kjøp gjerne et sett med plugger + crimpeverktøy samlet', price: '150–300 kr' },
      { id: 'cp2102', name: 'CP2102 USB-til-TTL adapter', qty: '1 stk', where: 'AliExpress — søk "CP2102 USB TTL"', note: 'For å programmere WT32-ETH01 fra PC via USB. Nødvendig siden WT32-ETH01 ikke har innebygd USB-til-serial. Kobles til TX/RX/GND/3.3V', price: '30–80 kr' },
    ]
  },
]

const MISC: { name: string; qty: string; price: string }[] = [
  { name: 'Motstander sortiment (1kΩ–100kΩ)', qty: '1 sett', price: '~80 kr' },
  { name: '100µF/16V kondensatorer (støyfilter ADC)', qty: '5 stk', price: '~30 kr' },
  { name: 'Automotive Superseal 2-pin kontakter', qty: '10 sett', price: '~150 kr' },
  { name: 'Tilhengerkabel 2.5mm² (strøm + GND)', qty: '3m rød + 3m sort', price: '~80 kr' },
  { name: 'Auto-sikring 5A + sikringsholder', qty: '1 stk', price: '~50 kr' },
  { name: 'Stripe-board / Veroboard (kondisjonering)', qty: '1 stk', price: '~40 kr' },
]

interface CheckState { [key: string]: boolean }

export function HardwarePanel({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<CheckState>({})
  const [tab, setTab] = useState<'shopping' | 'wiring' | 'arduino'>('shopping')

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))

  const allItems = CATEGORIES.flatMap(c => c.items)
  const boughtCount = allItems.filter(i => checked[i.id]).length

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
          <div style={{ color: '#555', fontSize: 11 }}>Sensor-oppsett for klassisk bil — WT32-ETH01 + RPI</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 22 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a1a1a' }}>
        {tabBtn('shopping', 'Handleliste')}
        {tabBtn('wiring', 'Koblingsskjema')}
        {tabBtn('arduino', 'Firmware-kode')}
      </div>

      {/* SHOPPING LIST */}
      {tab === 'shopping' && (
        <>
          <div style={{ ...section, paddingBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ color: '#fff', fontWeight: 700 }}>{boughtCount}/{allItems.length}</span>
                <span style={{ color: '#555', marginLeft: 8 }}>komponenter i handlekurven</span>
              </div>
            </div>
          </div>

          {CATEGORIES.map(cat => (
            <div key={cat.title} style={section}>
              <div style={h2}>{cat.emoji} {cat.title}</div>
              {cat.items.map(item => (
                <div key={item.id} onClick={() => toggle(item.id)}
                  style={{ display: 'flex', gap: 12, marginBottom: 16, cursor: 'pointer', opacity: checked[item.id] ? 1 : 0.75 }}>
                  <div style={{ width: 20, height: 20, border: `2px solid ${checked[item.id] ? '#00e5ff' : '#444'}`, borderRadius: 4, flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked[item.id] ? '#00e5ff22' : 'transparent' }}>
                    {checked[item.id] && <span style={{ color: '#00e5ff', fontSize: 13 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: '#555', fontSize: 11, marginLeft: 8, flexShrink: 0 }}>{item.qty}</span>
                    </div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 1 }}>{item.where}</div>
                    {item.price && (
                      <div style={{ marginTop: 3 }}>
                        <span style={tag('#555')}>{item.price}</span>
                      </div>
                    )}
                    <div style={{ color: '#555', fontSize: 11, marginTop: 5, borderLeft: '2px solid #222', paddingLeft: 8, lineHeight: 1.6 }}>{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Misc */}
          <div style={section}>
            <div style={h2}>🔩 DIVERSE / ELEKTRONIKK</div>
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
              <div>• <strong style={{ color: '#ccc' }}>AliExpress</strong> — sensorer, WT32-ETH01, MAX31855, TPMS (3–4 ukers leveringstid)</div>
              <div>• <strong style={{ color: '#ccc' }}>Kjell & Company</strong> — Raspberry Pi + skjerm + SD-kort (rask levering)</div>
              <div>• <strong style={{ color: '#ccc' }}>Clas Ohlson / Elkjøp</strong> — CAT6-kabel, SD-kort, verktøy</div>
              <div>• <strong style={{ color: '#ccc' }}>Biltema</strong> — prosjektbokser, korrugert slange, crimpe-verktøy</div>
              <div>• <strong style={{ color: '#ccc' }}>Amazon.de</strong> — raskere enn Ali for enkeltkomponenter</div>
            </div>
          </div>
        </>
      )}

      {/* WIRING */}
      {tab === 'wiring' && (
        <div style={{ padding: '16px 24px' }}>
          <div style={h2}>KOBLINGSSKJEMA — WT32-ETH01 + RPI</div>
          <WiringDiagram />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { pin: 'SPI + CS1-2',  sensor: 'CHT Syl. 1-2 (MAX31855)', note: 'MISO=19, CLK=18, MOSI=23, CS: 5/17' },
              { pin: 'GPIO34',       sensor: 'Olje Temp (ADC)',           note: 'NTC 4.7kΩ pull-up til 5V' },
              { pin: 'GPIO35',       sensor: 'Olje Trykk (ADC)',          note: 'Spenningsdeler 10k+3.3kΩ (4.5V→3.3V)' },
              { pin: 'GPIO32',       sensor: 'Lambda / AFR (ADC)',        note: 'Spenningsdeler 10k+6.8kΩ (5V→3.3V)' },
              { pin: 'GPIO33',       sensor: 'IAT Inntaksluft (ADC)',     note: 'NTC 4.7kΩ pull-up til 5V' },
              { pin: 'GPIO36',       sensor: 'Batteri (ADC)',             note: '100k/27kΩ spenningsdeler (15V→3.3V)' },
              { pin: 'GPIO39',       sensor: 'Drivstoff (ADC)',           note: '120Ω i serie + tank-sender + 5V' },
              { pin: 'GPIO25',       sensor: 'RPM (interrupt)',           note: 'Via 4N35 optokoppler, tenningsspole NEG' },
              { pin: 'GPIO26 (RX2)', sensor: 'GPS NEO-6M (UART)',         note: '3.3V direkte, 9600 baud NMEA' },
              { pin: 'Ethernet',     sensor: 'Data → RPI bulk',           note: 'HTTP POST til :4000/api/sensors/bulk via CAT6' },
              { pin: 'RPI BLE',      sensor: 'TPMS PECHAM ×4',           note: 'Bluetooth LE ventilkapsler → RPI' },
              { pin: 'RPI BLE',      sensor: '123\\ignition TUNE+',       note: 'Valgfritt: BLE → RPM + °BTDC via RPI' },
            ].map(r => (
              <div key={r.pin + r.sensor} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '8px 12px' }}>
                <span style={{ color: '#00e5ff', fontWeight: 700, fontSize: 12 }}>{r.pin}</span>
                <span style={{ color: '#fff', marginLeft: 8, fontSize: 12 }}>{r.sensor}</span>
                <div style={{ color: '#555', fontSize: 11, marginTop: 2 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIRMWARE CODE */}
      {tab === 'arduino' && (
        <div style={section}>
          <div style={h2}>WT32-ETH01 FIRMWARE (Arduino IDE)</div>
          <pre style={{ color: '#a8ff3e', fontSize: 11, lineHeight: 1.7, background: '#0a0a0a', padding: 16, borderRadius: 8, overflowX: 'auto', border: '1px solid #1a1a1a' }}>{`// Krever Arduino-biblioteker:
//   Adafruit MAX31855  (Biblioteksbehandler → søk "MAX31855")
//   TinyGPSPlus        (Biblioteksbehandler → søk "TinyGPSPlus")
//   ArduinoJson        (Biblioteksbehandler → søk "ArduinoJson")
//
// Board: "ESP32 Dev Module" i Arduino IDE
// WT32-ETH01 spesifikk: bruk ETH.h (innebygd Ethernet)

#include <ETH.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

// ── Konfigurasjon ─────────────────────────────────
const char* RPI_HOST = "http://192.168.1.xxx:4000/api/sensors/bulk";

// ── Ethernet-hendelse ─────────────────────────────
static bool ethConnected = false;
void WiFiEvent(WiFiEvent_t event) {
  if (event == ARDUINO_EVENT_ETH_GOT_IP) {
    ethConnected = true;
    Serial.println("Ethernet OK: " + ETH.localIP().toString());
  } else if (event == ARDUINO_EVENT_ETH_DISCONNECTED) {
    ethConnected = false;
  }
}

// ── MAX31855 — CHT syl. 1-2 (delt SPI-buss) ──────
// SPI: MISO=19, CLK=18, MOSI=23 (standard ESP32 SPI)
Adafruit_MAX31855 cht1(5), cht2(17);

// ── GPS NEO-6M — UART2 på GPIO26 (RX) ────────────
HardwareSerial gpsUART(2);
TinyGPSPlus    gps;

// ── ADC-pinner (alle ADC1 — virker med Ethernet) ──
#define PIN_OIL_TEMP   34   // NTC → 4.7kΩ pull-up 5V
#define PIN_OIL_PRESS  35   // 0-10bar → spenningsdeler 10k+3.3kΩ
#define PIN_LAMBDA     32   // Wideband 0-5V → spenningsdeler 10k+6.8kΩ
#define PIN_IAT        33   // NTC inntaksluft → 4.7kΩ pull-up 5V
#define PIN_BATTERY    36   // 12V → spenningsdeler 100k+27kΩ
#define PIN_FUEL       39   // Tank-sender → 120Ω serie + 5V

// ── RPM via 4N35 optokoppler (tenningsspole NEG) ──
#define PIN_RPM 25
volatile uint32_t rpmPulses = 0;
void IRAM_ATTR rpmISR() { rpmPulses++; }
unsigned long lastCalc = 0;
float rpm = 0;
#define RPM_PPR 2  // 4-sylindret 4-takt: 2 pulser per omdr.

// ── Steinhart-Hart NTC konvertering ───────────────
float ntcToC(int raw, float rPull = 4700, float r25 = 120, float b = 3977) {
  float v = raw * 3.3f / 4095.0f;
  if (v < 0.05f || v > 3.25f) return -99;
  float r = rPull * v / (3.3f - v);
  return 1.0f / (1.0f / 298.15f + log(r / r25) / b) - 273.15f;
}

float oilPressBar(int raw) {
  float v = raw * 3.3f / 4095.0f * (4.5f / 3.3f);
  return constrain((v - 0.5f) * 2.5f, 0, 10);
}

float lambdaVal(int raw) {
  float v5 = raw * 5.0f / 4095.0f;
  float afr = 7.35f + v5 * (22.4f - 7.35f) / 5.0f;
  return afr / 14.7f;
}

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

void pushBulk(float oilT, float oilP, float c1, float c2,
              float lam, float iat, float batt, float fuel, float spd) {
  if (!ethConnected) return;
  char json[400];
  snprintf(json, sizeof(json),
    "{"
      "\\"rpm\\":%.0f,\\"speed\\":%.1f,"
      "\\"oil_temp\\":%.1f,\\"oil_press\\":%.2f,"
      "\\"cht1\\":%.0f,\\"cht2\\":%.0f,"
      "\\"lambda\\":%.3f,\\"iat\\":%.1f,"
      "\\"battery\\":%.2f,\\"fuel\\":%.1f"
    "}",
    rpm, spd, oilT, oilP, c1, c2, lam, iat, batt, fuel);
  HTTPClient http;
  http.begin(RPI_HOST);
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.onEvent(WiFiEvent);
  ETH.begin();  // Start innebygd Ethernet på WT32-ETH01
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  cht1.begin(); cht2.begin();
  gpsUART.begin(9600, SERIAL_8N1, 26, 27);
  attachInterrupt(digitalPinToInterrupt(PIN_RPM), rpmISR, FALLING);
  Serial.println("Venter på Ethernet...");
}

unsigned long lastPush = 0;

void loop() {
  while (gpsUART.available()) gps.encode(gpsUART.read());
  calcRpm();

  if (millis() - lastPush < 200) return;  // 5 Hz

  double c1 = cht1.readCelsius(), c2 = cht2.readCelsius();

  pushBulk(
    ntcToC(analogRead(PIN_OIL_TEMP)),
    oilPressBar(analogRead(PIN_OIL_PRESS)),
    isnan(c1) ? -1 : c1,
    isnan(c2) ? -1 : c2,
    lambdaVal(analogRead(PIN_LAMBDA)),
    ntcToC(analogRead(PIN_IAT), 4700, 10000, 3950),
    batteryV(analogRead(PIN_BATTERY)),
    analogRead(PIN_FUEL) * 40.0f / 4095.0f,
    gps.speed.isValid() ? gps.speed.kmph() : 0
  );
  lastPush = millis();
}`}</pre>
          <div style={{ marginTop: 16, background: '#111', border: '1px solid #ffaa0033', borderRadius: 8, padding: 14 }}>
            <div style={{ color: '#ffaa00', fontWeight: 700, marginBottom: 6 }}>⚠ Programmering av WT32-ETH01</div>
            <div style={{ color: '#888', fontSize: 12, lineHeight: 1.8 }}>
              <div>• <strong style={{ color: '#ccc' }}>Koble CP2102</strong>: CP2102 TX → WT32 RX0, CP2102 RX → WT32 TX0, felles GND</div>
              <div>• <strong style={{ color: '#ccc' }}>Boot-modus</strong>: hold IO0 til GND mens du kobler til strøm, slipp så etter 1 sek</div>
              <div>• <strong style={{ color: '#ccc' }}>Board i Arduino IDE</strong>: "ESP32 Dev Module", Flash Mode: "DIO", Flash Size: "4MB"</div>
              <div>• <strong style={{ color: '#ccc' }}>NTC r25 + B-verdi</strong>: les fra datasheetet (oljetemperatur: vanligvis 120Ω @ 25°C, B≈3977)</div>
              <div>• <strong style={{ color: '#ccc' }}>RPM_PPR</strong>: 4-sylindret 4-takt = 2 pulser per omdreiing. Juster ved behov</div>
              <div>• <strong style={{ color: '#ccc' }}>TPMS (PECHAM BLE)</strong>: leses av RPI via Bluetooth — ingen kode nødvendig på WT32</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
