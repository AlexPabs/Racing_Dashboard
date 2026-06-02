import { useState } from 'react'
import { WiringDiagram } from './WiringDiagram'

const panel: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: '#0D1117', color: '#ccc',
  fontFamily: 'Space Grotesk, system-ui, sans-serif', fontSize: 13,
  overflowY: 'auto', zIndex: 1000,
  padding: '0 0 60px 0',
}
const h1: React.CSSProperties = { color: '#fff', fontSize: 15, fontWeight: 700, letterSpacing: 2, marginBottom: 4, fontFamily: 'IBM Plex Mono, monospace' }
const h2: React.CSSProperties = { color: '#00C8FF', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12, marginTop: 0, fontFamily: 'IBM Plex Mono, monospace' }
const sec: React.CSSProperties = { padding: '20px 24px', borderBottom: '1px solid #1a2030' }

type Status = 'handlekurv' | 'kjell' | 'ali' | 'biltema' | 'aircooled' | 'opsjon'
type Nivå = 1 | 2 | 3 | 4

interface ShopItem {
  id: string
  name: string
  qty: string
  price: string
  note: string
  status: Status
  nivå?: Nivå
  aliSearch?: string
}

interface Gruppe {
  emoji: string
  title: string
  subtitle: string
  statusColor: string
  items: ShopItem[]
}

const GRUPPER: Gruppe[] = [
  {
    emoji: '✅', title: 'ALLEREDE BESTILT — I HANDLEKURV',
    subtitle: 'Disse er kjøpt / i bestillingsprosess',
    statusColor: '#a8ff3e',
    items: [
      { id: 'wt32',       name: 'WT32-ETH01 ESP32 Ethernet+BLE',        qty: '1 stk',  price: '~66 kr',  status: 'handlekurv', note: 'Hjernen i motorrommet. ESP32 dual-core 240MHz med innebygd Ethernet (LAN8720A) og BLE 4.2. Programmeres via Arduino IDE.' },
      { id: 'din_term',   name: 'DIN Rail screw terminal ESP32 30-pin',  qty: '1 stk',  price: '~63 kr',  status: 'handlekurv', note: 'Terminal-blokk for ryddig tilkobling av alle sensorledninger til WT32. Mye bedre enn direkte lodding.' },
      { id: 'max1',       name: 'MAX31855 K-type breakout (TERFACT)',     qty: '1 stk',  price: '~40 kr',  status: 'handlekurv', note: 'SPI termopar-forsterker for CHT sylinder 1. Adafruit-kompatibel, maks 1024°C.' },
      { id: 'max2',       name: 'MAX31855 K-type breakout (FAR EAST)',    qty: '1 stk',  price: '~36 kr',  status: 'handlekurv', note: 'SPI termopar-forsterker for CHT sylinder 2. Klon-variant — fungerer identisk med Adafruit-versjonen.' },
      { id: 'ktype_kabel',name: 'K-type termokobling forlengerkabel 50cm', qty: '1 stk', price: '~18 kr', status: 'handlekurv', note: 'Polaritetskritisk! Bruk ALLTID K-type forlengerkabel, aldri vanlig kobberkabel — gir feil temperaturlesing.' },
      { id: 'cht_m14',    name: 'CHT sensor M14 universal motorcykel',   qty: '1 stk',  price: '~64 kr',  status: 'handlekurv', note: 'Til 1200cc-motoren. Universal motorcykel CHT-sensor med M14 gewinde. Kobles til MAX31855 #1.' },
      { id: 'gps_modul',  name: 'GY-NEO6MV2 GPS modul blå (med EEPROM)', qty: '1 stk',  price: '~23 kr',  status: 'handlekurv', note: 'Blå versjon med EEPROM husker innstillinger. UART på GPIO26 (RX), 3.3V logikk, 9600 baud NMEA.' },
      { id: 'gps_ant',    name: 'GPS aktiv antenne SMA 3m kabel',         qty: '1 stk',  price: '~34 kr',  status: 'handlekurv', note: 'Aktiv antenne gir bedre mottak. Legg under frontruten eller på frunk. 3m er nok for de fleste installasjoner.' },
      { id: 'mp1584',     name: 'MP1584EN DC-DC 3A 5V (5-pack)',          qty: '1 pk',   price: '~33 kr',  status: 'handlekurv', note: 'Forsyner RPi 5 + skjerm (opptil 3A). Mer stabil enn LM2596 ved høy belastning.' },
      { id: 'lm2596',     name: 'LM2596 DC-DC adjustable',                qty: '1 stk',  price: '~32 kr',  status: 'handlekurv', note: 'Forsyner WT32-ETH01 og sensorer fra 12V. Justerbar utgang — still inn 5V med multimeter.' },
      { id: 'relay1_12v', name: 'Relay 1-kanal 12V',                      qty: '1 stk',  price: '~14 kr',  status: 'handlekurv', note: '⚠ Bytt til 5V-versjon! 12V-relay trigges ikke direkte fra RPi GPIO. Se Ali-listen.' },
      { id: 'relay4_5v',  name: 'Relay 4-kanal 5V',                       qty: '1 stk',  price: '~30 kr',  status: 'handlekurv', note: 'Styrer 4 kanaler lys og tilbehør fra RPi GPIO. Active-LOW triggering er vanlig på disse modulene.' },
      { id: 'mpu6050',    name: 'MPU6050 GY-521 IMU',                     qty: '1 stk',  price: '~22 kr',  status: 'handlekurv', note: 'G-kraft og gyroskop. I2C på RPi. Logging av akselerasjon X/Y/Z under drag-kjøring.' },
      { id: 'mosfet',     name: 'IRLZ44N MOSFET 10-pack',                 qty: '1 pk',   price: '~25 kr',  status: 'handlekurv', note: 'Logikknivå MOSFET for WS2812B underglow-styring fra RPi 3.3V GPIO. Tåler 55V/47A.' },
      { id: 'optokop',    name: 'PC817 8-kanal optokoppler board',         qty: '1 stk',  price: '~13 kr',  status: 'handlekurv', note: 'Isolerer bremselys-input og line lock-signal fra bilens 12V-krets til RPi 3.3V GPIO. Unngår skade på RPi.' },
      { id: 'ups_hat',    name: 'UPS HAT for Raspberry Pi 5 (18650)',      qty: '1 stk',  price: '~294 kr', status: 'handlekurv', note: 'Gir RPi 5 ca. 45 sekunder strøm etter tenning slås av. Sender GPIO-signal for trygg shutdown.' },
      { id: 'cp2102',     name: 'CP2102 USB-TTL adapter',                  qty: '1 stk',  price: '~23 kr',  status: 'handlekurv', note: 'Programmeringsadapter for WT32-ETH01. TX→RX0, RX→TX0, felles GND. Bruk boot-modus: hold IO0 ved strøm.' },
      { id: 'skjerm',     name: '7" IPS touchscreen 1024×600 5-punkt',     qty: '1 stk',  price: '~314 kr', status: 'handlekurv', note: 'Bred visningsvinkel, høy kontrast. Koblet til RPi via HDMI + USB for touch. Sitter på hengsler under dashbordet.' },
      { id: 'lsu49',      name: 'Bosch LSU4.9 wideband O2-sonde',          qty: '1 stk',  price: '~239 kr', status: 'handlekurv', note: 'Industristandard bredbånds O2-sensor. Brukes med Innovate LC-2 controller. Monteres i eksos via M18×1.5 bung.' },
    ]
  },
  {
    emoji: '🏪', title: 'KJELL & COMPANY — BESTILLES HER',
    subtitle: 'Rask levering — kjøp i butikk eller kjell.no',
    statusColor: '#00C8FF',
    items: [
      { id: 'rpi5',       name: 'Raspberry Pi 5 Model B 4GB',             qty: '1 stk',  price: '949 kr',  status: 'kjell', note: 'Art.nr 88382. Kjører backend, WebSocket-server, Grafana og dashboard i fullskjerm. 4GB er anbefalt.' },
      { id: 'microsd',    name: 'MicroSD-kort 32GB Class 10 / A1',        qty: '1 stk',  price: '~100 kr', status: 'kjell', note: 'SanDisk eller Samsung. Class 10 / A1-rated for god ytelse. SanDisk Endurance anbefales for lang levetid i bil.' },
      { id: 'rpi_kjøler', name: 'Raspberry Pi aktiv kjøler (offisiell)',  qty: '1 stk',  price: '~120 kr', status: 'kjell', note: 'Viktig for motorrom-temperatur og kontinuerlig drift. Den offisielle aktive kjøleren passer direkte på RPi 5.' },
    ]
  },
  {
    emoji: '🛒', title: 'ALIEXPRESS — IKKE BESTILT ENNÅ',
    subtitle: '3–4 ukers leveringstid — bestill tidlig',
    statusColor: '#ffaa00',
    items: [
      { id: 'relay1_5v',  name: 'Relay 1-kanal 5V',                       qty: '1 stk',  price: '~15 kr',  status: 'ali', nivå: 1, aliSearch: '1 channel relay module 5V',          note: 'Erstatter 12V-relay i handlekurv. Trigges direkte fra RPi 5V GPIO. Active-LOW.' },
      { id: 'ws2812b',    name: 'WS2812B LED-strip 5V 60LED/m (1m)',       qty: '1 stk',  price: '~50 kr',  status: 'ali', nivå: 2, aliSearch: 'WS2812B LED strip 5V 60led',         note: 'Underglow fullfarget RGB. Styres via IRLZ44N MOSFET fra RPi GPIO. Nivå 2.' },
      { id: 'pushbutton', name: 'Momentary push button 12mm med LED',     qty: '4 stk',  price: '~5 kr/stk',status: 'ali', nivå: 1, aliSearch: '12mm momentary push button LED',    note: 'Fysiske knapper: reset drag-timer, ny sesjon, line lock, TPS-kalibrering.' },
      { id: 'kobberring', name: 'Kobberskiver/ringer assortert (CHT)',     qty: '1 pk',   price: '~20 kr',  status: 'ali', nivå: 1, aliSearch: 'copper washer assortment M12 M14',   note: 'For hjemmelaget K-type CHT-sensor — termokobling loddes til ring under tennpluggen.' },
      { id: 'loddetinn',  name: 'Sølvloddetinn 0.8mm (elektronikk)',      qty: '1 stk',  price: '~20 kr',  status: 'ali', aliSearch: 'silver solder 0.8mm rosin',              note: 'Fin 0.8mm loddetinn for elektronikk-lodding. Sølvholdig gir bedre termisk ledning.' },
      { id: 'flux',       name: 'Flux penn (lodding av termokobling)',     qty: '1 stk',  price: '~15 kr',  status: 'ali', aliSearch: 'flux pen soldering',                     note: 'Nødvendig for godt resultat ved lodding av K-type termokobling til kobberring.' },
      { id: 'sd_wt32',    name: 'MicroSD-kortleser til WT32 (SPI)',        qty: '1 stk',  price: '~15 kr',  status: 'ali', nivå: 3, aliSearch: 'SPI SD card module Arduino',         note: 'SD-kortlogging direkte på WT32 — backup uavhengig av RPi. Nivå 3.' },
      { id: 'tpms_sen',   name: 'PECHAM BLE TPMS sensor ×4',              qty: '4 stk',  price: '~150 kr', status: 'ali', nivå: 1, aliSearch: 'item 1005004504977890',               note: 'BLE ventilkapsler — ingen dekkverksted nødvendig. RPi leser trykk + temperatur via BLE.' },
    ]
  },
  {
    emoji: '🔬', title: 'AIRCOOLED.NET / INNOVATE — AFR',
    subtitle: 'Wideband O2-controller — bestill fra USA',
    statusColor: '#bf5fff',
    items: [
      { id: 'lc2',        name: 'Innovate LC-2 wideband controller',       qty: '1 stk',  price: '~$80 (~900 kr)', status: 'aircooled', note: 'Controller for Bosch LSU4.9-sonden. Gir 0–5V analog utgang til WT32 A3. Kalibrer med medfølgende programvare.' },
      { id: 'o2_bung',    name: 'Innovate O2-bung M18×1.5 (eksos)',        qty: '1 stk',  price: '~$10 (~110 kr)', status: 'aircooled', note: 'Sveiset inn i eksosrøret for montering av LSU4.9-sonden. M18×1.5 standard gevind.' },
    ]
  },
  {
    emoji: '🏬', title: 'BILTEMA — KABLING OG MONTERING',
    subtitle: 'Finn i nærmeste Biltema',
    statusColor: '#ff6b35',
    items: [
      { id: 'lodde2mm',   name: 'Loddetinn 2mm 227°C (art.nr 20-0203)',   qty: '1 stk',  price: '~80 kr',  status: 'biltema', note: 'Blyfritt 3% sølv. Tykk 2mm passe for CHT-sensor-lodding. 227°C smeltepunkt.' },
      { id: 'konformal',  name: 'Konformal coating spray',                 qty: '1 stk',  price: '~120 kr', status: 'biltema', note: 'Fuktsikring av all elektronikk i motorrommet. Spray på WT32 og MAX31855 før lukking av boks.' },
      { id: 'kabel_slange',name: 'Korrugert plastslange Ø10mm, 5m',       qty: '1 stk',  price: '~40 kr',  status: 'biltema', note: 'Kabelbeskyttelse i motorrom mot varme, olje og skav. 10mm passer de fleste ledningsbunter.' },
      { id: 'kabelbind',  name: 'Kabelbindere assortert',                  qty: '1 pk',   price: '~30 kr',  status: 'biltema', note: 'Ryddig kabellegging. Bruk kabelbindere hvert 15–20cm og ved alle bøyninger.' },
      { id: 'krympe',     name: 'Varmekrympestrømpe assortert',            qty: '1 pk',   price: '~40 kr',  status: 'biltema', note: 'Til alle skjøter og termokobling-tilkoblinger. Dobbeltvegget med lim gir best resultat i motorstig.' },
      { id: 'pg7',        name: 'PG7 kabelgjennomføring ×4',               qty: '4 stk',  price: '~5 kr/stk', status: 'biltema', note: 'Kabel Ø3–6.5mm. Fire stk til WT32-boksen for signalkabler (CHT, AFR, sensorer).' },
      { id: 'pg9',        name: 'PG9 kabelgjennomføring ×1',               qty: '1 stk',  price: '~8 kr',   status: 'biltema', note: 'Kabel Ø4–8mm. Til 12V strøm inn i WT32-boksen.' },
      { id: 'foam_tape',  name: 'Foam-tape 2.5mm (pakning)',                qty: '1 rull', price: '~30 kr',  status: 'biltema', note: 'Forseglingsliste i pakningsspor på 3D-printet WT32-boks-lokk. Tetter mot fukt.' },
      { id: 'cat6',       name: 'CAT6 FTP kabel 5m',                       qty: '1 stk',  price: '~80 kr',  status: 'biltema', note: 'FTP-skjermet Ethernet mellom WT32 og RPi. 5m rekker fra motorrom til dashbord.' },
    ]
  },
  {
    emoji: '🔮', title: 'OPSJONER — NIVÅ 2–4 (LEGG TIL NÅR DU ER KLAR)',
    subtitle: 'Ikke nødvendig for Nivå 1 — planlegg anskaffelse etter hvert',
    statusColor: '#555',
    items: [
      { id: 'streamdeck',  name: 'Elgato StreamDeck Mini 6-knapper',       qty: '1 stk',  price: '~800 kr',  status: 'opsjon', nivå: 4, note: 'Nivå 4: Kontrollpanel med LCD-knapper for raske funksjoner. USB til RPi. Alternativ: FreeDeck DIY (~400 kr).' },
      { id: 'kamera',      name: 'RPi Camera Module 3 (CSI)',               qty: '1 stk',  price: '~350 kr',  status: 'opsjon', nivå: 2, note: 'Nivå 2: Frontkamera synkronisert med kjørelogg. Kobles direkte til RPi 5 CSI-port.' },
      { id: 'shift_lys',   name: 'WS2812B shift-lys 8-pixel ring over ratt',qty: '1 stk', price: '~30 kr',   status: 'opsjon', nivå: 2, aliSearch: 'WS2812B ring 8', note: 'Nivå 2: RPM-indikator montert over rattnavet. Grønn→gul→rød ved RPM-terskel.' },
      { id: 'tps_pot',     name: 'Potensiometer 10K linear (TPS på IDA 48)',qty: '1 stk',  price: '~15 kr',   status: 'opsjon', nivå: 2, aliSearch: '10K linear potentiometer', note: 'Nivå 2: Gassposisjonssensor på IDA 48-karburator. Monteres på aksel med 3D-printet brakett → A4 på WT32.' },
      { id: 'clutch_pot',  name: 'Lineært potensiometer 10K (clutch)',      qty: '1 stk',  price: '~15 kr',   status: 'opsjon', nivå: 3, aliSearch: 'linear slide potentiometer 10K', note: 'Nivå 3: Nøyaktig launch-analyse. Monteres på clutch-wire. Kalibrering via calibration.py.' },
      { id: 'relay4_extra',name: '4-kanal relay ekstra (8 kanaler totalt)', qty: '1 stk',  price: '~40 kr',   status: 'opsjon', nivå: 3, aliSearch: '4 channel relay 5V', note: 'Nivå 3: Utvider til 8 relay-kanaler for full lys-styring.' },
      { id: 'can_modul',   name: 'SN65HVD230 CAN-bus modul',               qty: '1 stk',  price: '~20 kr',   status: 'opsjon', nivå: 4, aliSearch: 'SN65HVD230 CAN module', note: 'Nivå 4: CAN-bus integrasjon ved eventuelt EFI-bytte. SPI på RPi.' },
      { id: '4g_router',   name: 'GL.iNet Mango 4G router + SIM',           qty: '1 stk',  price: '~400 kr',  status: 'opsjon', nivå: 4, note: 'Nivå 4: Remote Grafana via Cloudflare Tunnel. Tilgjengelig fra hele verden etter kjøring.' },
      { id: 'relay16',     name: 'Sainsmart 16-kanal relay-kort',           qty: '1 stk',  price: '~200 kr',  status: 'opsjon', nivå: 4, note: 'Nivå 4: Full lys- og relay-styring for alle 16 kanaler.' },
    ]
  },
]

const DIVERSE: { name: string; qty: string; price: string }[] = [
  { name: 'Motstander sortiment (1kΩ–100kΩ)',         qty: '1 sett',          price: '~80 kr' },
  { name: '100µF/16V kondensatorer (støyfilter ADC)',  qty: '5 stk',           price: '~30 kr' },
  { name: 'Automotive Superseal 2-pin kontakter',      qty: '10 sett',         price: '~150 kr' },
  { name: 'RKKB tilhengerkabel 7×1.5mm² (eksisterende)', qty: 'gjenbruk',     price: '—' },
  { name: 'K-type termokobling forlengerkabel 1m ×2 ekstra', qty: '2 stk',    price: '~40 kr' },
  { name: 'Auto-sikring 5A + sikringsholder',          qty: '1 stk',           price: '~50 kr' },
  { name: 'RJ45 plugger + crimpeverktøy',              qty: '1 sett',          price: '~150 kr' },
  { name: '3D-print PETG boks til WT32 (motorrom)',    qty: '1 stk',           price: '~50 kr filament' },
  { name: '3D-print PETG brakett til skjerm (hengslet)', qty: '1 stk',         price: '~30 kr filament' },
]

const KOSTNADER = [
  { label: 'Allerede bestilt / i handlekurv', sum: '~1 370 kr', color: '#a8ff3e' },
  { label: 'Kjell & Company',                  sum: '~1 170 kr', color: '#00C8FF' },
  { label: 'AliExpress (mangler)',              sum: '~150 kr',   color: '#ffaa00' },
  { label: 'Biltema',                           sum: '~390 kr',   color: '#ff6b35' },
  { label: 'aircooled.net (Innovate LC-2)',     sum: '~1 000 kr', color: '#bf5fff' },
  { label: 'TOTAL Nivå 1 komplett',             sum: '~4 100 kr', color: '#fff',   bold: true },
  { label: 'Tillegg Nivå 2 (kamera, shift-lys, TPS)', sum: '+ ~800 kr', color: '#555' },
  { label: 'Tillegg Nivå 3 (clutch, relay, SD)', sum: '+ ~400 kr', color: '#555' },
  { label: 'Tillegg Nivå 4 (StreamDeck, 4G, CAN)', sum: '+ ~1 200 kr', color: '#555' },
]

const statusInfo: Record<Status, { label: string; color: string }> = {
  handlekurv: { label: '✅ I HANDLEKURV', color: '#a8ff3e' },
  kjell:      { label: '🏪 KJELL',         color: '#00C8FF' },
  ali:        { label: '🛒 ALIEXPRESS',    color: '#ffaa00' },
  biltema:    { label: '🔧 BILTEMA',       color: '#ff6b35' },
  aircooled:  { label: '🔬 AIRCOOLED.NET', color: '#bf5fff' },
  opsjon:     { label: '🔮 OPSJON',         color: '#555'    },
}

type Tab = 'shopping' | 'wiring' | 'arduino'
interface CheckState { [key: string]: boolean }

export function HardwarePanel({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<CheckState>({})
  const [tab, setTab] = useState<Tab>('shopping')
  const [visOpsjoner, setVisOpsjoner] = useState(false)

  const toggle = (id: string) => setChecked(p => ({ ...p, [id]: !p[id] }))

  const alleItems = GRUPPER.flatMap(g => g.items).filter(i => i.status !== 'opsjon')
  const kjøptCount = alleItems.filter(i => checked[i.id]).length

  const tabBtn = (t: Tab, label: string) => (
    <button onClick={() => setTab(t)} style={{
      background: tab === t ? '#00C8FF22' : 'transparent',
      border: `1px solid ${tab === t ? '#00C8FF' : '#2a3040'}`,
      color: tab === t ? '#00C8FF' : '#4a5568',
      borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
      fontSize: 11, fontWeight: 700, letterSpacing: 1, marginRight: 6,
      fontFamily: 'IBM Plex Mono, monospace',
    }}>{label}</button>
  )

  function ItemRad({ item }: { item: ShopItem }) {
    const aktiv = checked[item.id]
    const si = statusInfo[item.status]
    return (
      <div onClick={() => toggle(item.id)}
        style={{ display: 'flex', gap: 12, marginBottom: 16, cursor: 'pointer', opacity: aktiv ? 1 : 0.78, transition: 'opacity 0.15s' }}>
        <div style={{
          width: 20, height: 20, flexShrink: 0, marginTop: 2, borderRadius: 4,
          border: `2px solid ${aktiv ? si.color : '#2a3040'}`,
          background: aktiv ? `${si.color}22` : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {aktiv && <span style={{ color: si.color, fontSize: 13, lineHeight: 1 }}>✓</span>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.name}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              {item.nivå && item.status === 'opsjon' && (
                <span style={{ fontSize: 10, fontWeight: 700, background: '#1a2030', color: '#555', border: '1px solid #2a3040', borderRadius: 4, padding: '1px 5px', fontFamily: 'IBM Plex Mono, monospace' }}>
                  NIVÅ {item.nivå}
                </span>
              )}
              <span style={{ fontSize: 10, color: '#666' }}>{item.qty}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace',
              background: `${si.color}18`, color: si.color,
              border: `1px solid ${si.color}44`, borderRadius: 4, padding: '1px 6px',
            }}>{si.label}</span>
            <span style={{ fontSize: 12, color: si.color, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>{item.price}</span>
            {item.aliSearch && (
              <span style={{ fontSize: 10, color: '#3a4a60', fontFamily: 'IBM Plex Mono, monospace' }}>søk: "{item.aliSearch}"</span>
            )}
          </div>
          <div style={{ color: '#4a5568', fontSize: 11, marginTop: 6, borderLeft: '2px solid #1a2030', paddingLeft: 8, lineHeight: 1.65 }}>
            {item.note}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1a2030', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0D1117', zIndex: 10 }}>
        <div>
          <div style={h1}>HARDWARE GUIDE — VW BOBLE 1956</div>
          <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>WT32-ETH01 + Raspberry Pi 5 · Alle nivåer</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5568', cursor: 'pointer', fontSize: 22 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #1a2030' }}>
        {tabBtn('shopping', 'Handleliste')}
        {tabBtn('wiring', 'Koblingsskjema')}
        {tabBtn('arduino', 'Firmware')}
      </div>

      {/* ── HANDLELISTE ── */}
      {tab === 'shopping' && (
        <>
          {/* Fremgang */}
          <div style={{ ...sec, paddingBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 16, fontFamily: 'IBM Plex Mono, monospace' }}>{kjøptCount}</span>
                <span style={{ color: '#4a5568', fontSize: 13 }}> / {alleItems.length} komponenter anskaffet</span>
              </div>
              <span style={{ color: '#4a5568', fontSize: 11 }}>{Math.round(kjøptCount / alleItems.length * 100)}%</span>
            </div>
            <div style={{ height: 6, background: '#1a2030', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${kjøptCount / alleItems.length * 100}%`, height: '100%', background: 'linear-gradient(90deg, #00C8FF, #a8ff3e)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Grupper */}
          {GRUPPER.filter(g => g.items[0].status !== 'opsjon' || visOpsjoner).map(g => (
            <div key={g.title} style={sec}>
              <div style={{ ...h2, color: g.statusColor }}>{g.emoji} {g.title}</div>
              <div style={{ color: '#3a4a60', fontSize: 11, marginBottom: 14, marginTop: -8 }}>{g.subtitle}</div>
              {g.items.map(item => <ItemRad key={item.id} item={item} />)}
            </div>
          ))}

          {/* Knapp for opsjoner */}
          {!visOpsjoner && (
            <div style={{ ...sec }}>
              <button onClick={() => setVisOpsjoner(true)} style={{
                background: 'transparent', border: '1px dashed #2a3040', color: '#4a5568',
                borderRadius: 8, padding: '10px 20px', cursor: 'pointer', width: '100%',
                fontSize: 12, fontWeight: 700, letterSpacing: 1, fontFamily: 'IBM Plex Mono, monospace',
              }}>
                🔮 VIS OPSJONER — NIVÅ 2–4 ({GRUPPER.find(g => g.items[0].status === 'opsjon')?.items.length} komponenter)
              </button>
            </div>
          )}

          {/* Diverse */}
          <div style={sec}>
            <div style={h2}>🔩 DIVERSE OG FORBRUKSMATERIELL</div>
            {DIVERSE.map(d => (
              <div key={d.name} onClick={() => toggle('div_' + d.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer' }}>
                <div style={{ width: 18, height: 18, border: `2px solid ${checked['div_' + d.name] ? '#a8ff3e' : '#2a3040'}`, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: checked['div_' + d.name] ? '#a8ff3e22' : 'transparent' }}>
                  {checked['div_' + d.name] && <span style={{ color: '#a8ff3e', fontSize: 11 }}>✓</span>}
                </div>
                <span style={{ flex: 1, color: '#8892a4' }}>{d.name}</span>
                <span style={{ color: '#4a5568', fontSize: 11, width: 60, textAlign: 'right' }}>{d.qty}</span>
                <span style={{ color: '#4a5568', fontSize: 11, width: 90, textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{d.price}</span>
              </div>
            ))}
          </div>

          {/* Totalkostnader */}
          <div style={{ ...sec }}>
            <div style={h2}>💰 TOTALKOSTNADER</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {KOSTNADER.map((k, i) => (
                <div key={k.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 14px',
                  background: (k as any).bold ? '#1a2030' : '#0a0f18',
                  border: `1px solid ${(k as any).bold ? '#2a3040' : '#12181f'}`,
                  borderRadius: 8,
                  borderTop: i === 5 ? '2px solid #00C8FF33' : undefined,
                }}>
                  <span style={{ color: (k as any).bold ? '#e2e8f0' : '#6b7a8d', fontSize: 12, fontWeight: (k as any).bold ? 700 : 400 }}>{k.label}</span>
                  <span style={{ color: k.color, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', fontSize: (k as any).bold ? 16 : 13 }}>{k.sum}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hvor kjøpe */}
          <div style={{ ...sec, background: '#0a0f18', margin: '0 16px 16px', borderRadius: 12, border: '1px solid #1a2030' }}>
            <div style={{ color: '#00C8FF', fontWeight: 700, marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: 2 }}>KJØPSSTEDER</div>
            <div style={{ color: '#6b7a8d', lineHeight: 2.0, fontSize: 12 }}>
              <div>• <strong style={{ color: '#00C8FF' }}>AliExpress</strong> — sensorer, WT32-ETH01, MAX31855, TPMS, LED (3–4 uker)</div>
              <div>• <strong style={{ color: '#00C8FF' }}>Kjell & Company</strong> — Raspberry Pi 5, skjerm, SD-kort (rask levering)</div>
              <div>• <strong style={{ color: '#ff6b35' }}>Biltema</strong> — kabling, korrugert slange, loddetinn, konformal coating</div>
              <div>• <strong style={{ color: '#bf5fff' }}>aircooled.net</strong> — Innovate LC-2 wideband controller</div>
              <div>• <strong style={{ color: '#a8ff3e' }}>Amazon.de</strong> — raskere enn Ali for enkeltkomponenter</div>
            </div>
          </div>
        </>
      )}

      {/* ── KOBLINGSSKJEMA ── */}
      {tab === 'wiring' && (
        <div style={{ padding: '16px 24px' }}>
          <div style={h2}>KOBLINGSSKJEMA — WT32-ETH01 + RPi 5</div>
          <WiringDiagram />
          <div style={{ marginTop: 20 }}>
            <div style={{ color: '#00C8FF', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 10, fontFamily: 'IBM Plex Mono, monospace' }}>WT32-ETH01 PINNER</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { pin: 'SPI CS pin 5',    sensor: 'MAX31855 #1 — CHT Syl. 1',   note: 'MISO=19, CLK=18, MOSI=23' },
                { pin: 'SPI CS pin 17',   sensor: 'MAX31855 #2 — CHT Syl. 2',   note: 'Delt SPI-buss med #1' },
                { pin: 'SPI CS pin 16',   sensor: 'MAX31855 #3 — CHT Syl. 3',   note: 'Nivå 2: fjerde sylinder' },
                { pin: 'SPI CS pin 4',    sensor: 'MAX31855 #4 — CHT Syl. 4',   note: 'Nivå 2: fjerde sylinder' },
                { pin: 'A0 (GPIO34)',      sensor: 'VDO Oljetrykk sender',       note: 'Spenningsdeler 10k+3.3kΩ' },
                { pin: 'A1 (GPIO35)',      sensor: 'VDO Oljetemperatur sender',  note: 'NTC 4.7kΩ pull-up' },
                { pin: 'A2 (GPIO32)',      sensor: 'Drivstofftrykk sender',      note: '0–5V analogt' },
                { pin: 'A3 (GPIO33)',      sensor: 'Innovate LC-2 (AFR/Lambda)', note: 'Spenningsdeler 10k+6.8kΩ (5V→3.3V)' },
                { pin: 'A4 (GPIO36)',      sensor: 'TPS Potensiometer (gass)',   note: 'Nivå 2: IDA 48-karburator' },
                { pin: 'A5 (GPIO39)',      sensor: 'Clutch potensiometer',       note: 'Nivå 3: lineært 10kΩ' },
                { pin: 'GPIO26 (RX2)',     sensor: 'GPS GY-NEO6MV2 (UART)',     note: '3.3V direkte, 9600 baud NMEA' },
                { pin: 'GPIO25 (INT)',     sensor: 'RPM — 4N35 optokoppler',    note: 'Tenningsspole NEG' },
                { pin: 'BLE (innebygd)',   sensor: 'PECHAM TPMS ×4 dekk',       note: 'Passiv BLE-skanning' },
                { pin: 'Ethernet RJ45',   sensor: 'UDP → RPi 5 (CAT6)',         note: '50 Hz JSON-pakker' },
                { pin: 'MicroSD SPI',     sensor: 'SD-kortlogging (backup)',    note: 'Nivå 3: MicroSD breakout' },
              ].map(r => (
                <div key={r.pin} style={{ background: '#0a0f18', border: '1px solid #1a2030', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: '#00C8FF', fontWeight: 700, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{r.pin}</span>
                  <div style={{ color: '#e2e8f0', fontSize: 12, marginTop: 2 }}>{r.sensor}</div>
                  <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>{r.note}</div>
                </div>
              ))}
            </div>

            <div style={{ color: '#00C8FF', fontSize: 11, fontWeight: 700, letterSpacing: 2, margin: '20px 0 10px', fontFamily: 'IBM Plex Mono, monospace' }}>RASPBERRY Pi 5 PINNER</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { pin: 'Ethernet (innebygd)', sensor: 'Mottar UDP fra WT32',        note: 'CAT6 FTP kabel' },
                { pin: 'GPIO 17',             sensor: 'Bremselys-input',            note: 'Via PC817 optokoppler' },
                { pin: 'GPIO 18',             sensor: 'Line lock-input',            note: 'Via PC817 optokoppler' },
                { pin: 'GPIO 12 (PWM)',        sensor: 'WS2812B underglow data',    note: 'Via IRLZ44N MOSFET' },
                { pin: 'GPIO 13 (PWM)',        sensor: 'WS2812B shift-lys over ratt', note: 'Nivå 2: 8-pixel ring' },
                { pin: 'GPIO 20',             sensor: 'Kill switch output (relay)', note: 'Nivå 3: relé → tenningskurs' },
                { pin: 'GPIO 21',             sensor: 'Launch-trelykt LED 1',       note: 'Nivå 3: gult' },
                { pin: 'GPIO 22',             sensor: 'Launch-trelykt LED 2',       note: 'Nivå 3: gult' },
                { pin: 'GPIO 23',             sensor: 'Launch-trelykt LED 3 (grønt)', note: 'Nivå 3: synkronisert RPM' },
                { pin: 'I2C SDA/SCL',         sensor: 'MPU6050 GY-521 IMU',        note: 'G-kraft X/Y/Z' },
                { pin: 'BLE 5.0 (innebygd)',  sensor: 'PECHAM TPMS backup',        note: 'Hvis WT32 BLE er opptatt' },
                { pin: 'USB-A',               sensor: 'StreamDeck Mini',            note: 'Nivå 4: 6-knapper kontrollpanel' },
                { pin: 'CSI port 1',          sensor: 'RPi Camera Module 3',       note: 'Nivå 2: frontkamera' },
                { pin: 'UPS HAT GPIO',        sensor: 'UPS HAT shutdown-signal',   note: 'Gir 45 sek ved tenning av' },
              ].map(r => (
                <div key={r.pin} style={{ background: '#0a0f18', border: '1px solid #1a2030', borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ color: '#a8ff3e', fontWeight: 700, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{r.pin}</span>
                  <div style={{ color: '#e2e8f0', fontSize: 12, marginTop: 2 }}>{r.sensor}</div>
                  <div style={{ color: '#4a5568', fontSize: 11, marginTop: 2 }}>{r.note}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, background: '#0a0f18', border: '1px solid #ffaa0033', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#ffaa00', fontWeight: 700, marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: 2 }}>⚠ VIKTIG — KABELTYPE</div>
              <div style={{ color: '#6b7a8d', fontSize: 12, lineHeight: 1.9 }}>
                <div>• <strong style={{ color: '#e2e8f0' }}>K-type termokobling:</strong> Bruk ALLTID K-type forlengerkabel — aldri vanlig kobberkabel. Feil kabeltype gir opp til 50°C avvik.</div>
                <div>• <strong style={{ color: '#e2e8f0' }}>Wideband AFR signal:</strong> Skjermet signalkabel fra LC-2 output til WT32 A3. Unngå å legge parallelt med tenningsledninger.</div>
                <div>• <strong style={{ color: '#e2e8f0' }}>Ethernet CAT6 FTP:</strong> Skjermet kabel gir bedre støyimmunitet i bilmiljø enn UTP.</div>
                <div>• <strong style={{ color: '#e2e8f0' }}>Optokoppler isolasjon:</strong> PC817 på bremselys og line lock beskytter RPi GPIO mot bilens 12V.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FIRMWARE ── */}
      {tab === 'arduino' && (
        <div style={sec}>
          <div style={h2}>WT32-ETH01 FIRMWARE (Arduino C++ / ESP32)</div>
          <pre style={{ color: '#a8ff3e', fontSize: 11, lineHeight: 1.7, background: '#060a10', padding: 16, borderRadius: 10, overflowX: 'auto', border: '1px solid #1a2030' }}>{`// WT32-ETH01 — VW Boble 1956 Race Dashboard firmware
// Krever Arduino-biblioteker:
//   Adafruit MAX31855  →  søk "MAX31855" i Biblioteksbehandler
//   TinyGPSPlus        →  søk "TinyGPSPlus"
//   ArduinoJson        →  søk "ArduinoJson"
// Board: "ESP32 Dev Module" · Flash: DIO · 4MB

#include <ETH.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <Adafruit_MAX31855.h>
#include <TinyGPSPlus.h>
#include <HardwareSerial.h>

const char* RPI_HOST = "http://192.168.1.XXX:4000/api/sensors/bulk";

// ── Ethernet ──────────────────────────────────
static bool ethConnected = false;
void WiFiEvent(WiFiEvent_t event) {
  if (event == ARDUINO_EVENT_ETH_GOT_IP)         ethConnected = true;
  else if (event == ARDUINO_EVENT_ETH_DISCONNECTED) ethConnected = false;
}

// ── MAX31855 — CHT alle fire sylindre ─────────
// SPI: MISO=19, CLK=18, MOSI=23
Adafruit_MAX31855 cht1(5), cht2(17), cht3(16), cht4(4);

// ── GPS — UART2 på GPIO26 ─────────────────────
HardwareSerial gpsUART(2);
TinyGPSPlus    gps;

// ── ADC-pinner (ADC1 — fungerer med Ethernet) ─
#define PIN_OIL_TEMP   34  // VDO sender
#define PIN_OIL_PRESS  35  // VDO sender
#define PIN_FUEL       32  // Tank-sender
#define PIN_LAMBDA     33  // Innovate LC-2 (0–5V → spenningsdeler)
#define PIN_TPS        36  // Potensiometer IDA 48 (Nivå 2)
#define PIN_CLUTCH     39  // Lineært potensiometer (Nivå 3)

// ── RPM via optokoppler på tenningsspole NEG ──
#define PIN_RPM 25
#define RPM_PPR 2  // 4-sylindret 4-takt
volatile uint32_t rpmPulses = 0;
void IRAM_ATTR rpmISR() { rpmPulses++; }
unsigned long lastRpmCalc = 0;
float rpm = 0;

// ── Konverteringsfunksjoner ───────────────────
float ntcToC(int raw, float rPull=4700, float r25=120, float b=3977) {
  float v = raw * 3.3f / 4095.0f;
  if (v < 0.05f || v > 3.25f) return -99;
  float r = rPull * v / (3.3f - v);
  return 1.0f / (1.0f/298.15f + log(r/r25)/b) - 273.15f;
}
float oilPressBar(int raw) {
  float v = raw * 3.3f / 4095.0f * (4.5f/3.3f);
  return constrain((v - 0.5f) * 2.5f, 0, 10);
}
float lambdaVal(int raw) {
  float v5 = raw * 5.0f / 4095.0f;
  return (7.35f + v5 * (22.4f - 7.35f) / 5.0f) / 14.7f;
}
float batteryV(int raw)  { return raw * 3.3f/4095.0f * (127000.0f/27000.0f); }
float tpsPct(int raw)    { return constrain(raw * 100.0f / 4095.0f, 0, 100); }
float clutchPct(int raw) { return constrain(raw * 100.0f / 4095.0f, 0, 100); }

void calcRpm() {
  unsigned long now = millis(), dt = now - lastRpmCalc;
  if (dt < 500) return;
  noInterrupts(); uint32_t p = rpmPulses; rpmPulses = 0; interrupts();
  rpm = (p / (float)RPM_PPR) * (60000.0f / dt);
  lastRpmCalc = now;
}

void pushBulk(float oT, float oP, float c1, float c2, float c3, float c4,
              float lam, float tps, float clutch, float batt, float fuel, float spd) {
  if (!ethConnected) return;
  char json[512];
  snprintf(json, sizeof(json),
    "{"
      "\\"rpm\\":%.0f,\\"speed\\":%.1f,"
      "\\"oil_temp\\":%.1f,\\"oil_press\\":%.2f,"
      "\\"cht1\\":%.0f,\\"cht2\\":%.0f,\\"cht3\\":%.0f,\\"cht4\\":%.0f,"
      "\\"lambda\\":%.3f,\\"tps\\":%.1f,\\"clutch\\":%.1f,"
      "\\"battery\\":%.2f,\\"fuel\\":%.1f"
    "}",
    rpm, spd, oT, oP, c1, c2, c3, c4, lam, tps, clutch, batt, fuel);
  HTTPClient http;
  http.begin(RPI_HOST);
  http.addHeader("Content-Type", "application/json");
  http.POST(json);
  http.end();
}

void setup() {
  Serial.begin(115200);
  WiFi.onEvent(WiFiEvent);
  ETH.begin();
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  cht1.begin(); cht2.begin(); cht3.begin(); cht4.begin();
  gpsUART.begin(9600, SERIAL_8N1, 26, 27);
  attachInterrupt(digitalPinToInterrupt(PIN_RPM), rpmISR, FALLING);
}

unsigned long lastPush = 0;

void loop() {
  while (gpsUART.available()) gps.encode(gpsUART.read());
  calcRpm();
  if (millis() - lastPush < 20) return;  // 50 Hz
  double c1=cht1.readCelsius(), c2=cht2.readCelsius(),
         c3=cht3.readCelsius(), c4=cht4.readCelsius();
  pushBulk(
    ntcToC(analogRead(PIN_OIL_TEMP)),
    oilPressBar(analogRead(PIN_OIL_PRESS)),
    isnan(c1)?-1:c1, isnan(c2)?-1:c2,
    isnan(c3)?-1:c3, isnan(c4)?-1:c4,
    lambdaVal(analogRead(PIN_LAMBDA)),
    tpsPct(analogRead(PIN_TPS)),
    clutchPct(analogRead(PIN_CLUTCH)),
    batteryV(analogRead(36)),  // GPIO36 = VP
    analogRead(PIN_FUEL) * 40.0f / 4095.0f,
    gps.speed.isValid() ? gps.speed.kmph() : 0
  );
  lastPush = millis();
}`}</pre>
          <div style={{ marginTop: 16, background: '#0a0f18', border: '1px solid #ffaa0033', borderRadius: 10, padding: 14 }}>
            <div style={{ color: '#ffaa00', fontWeight: 700, marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: 2 }}>⚠ PROGRAMMERING — STEG FOR STEG</div>
            <div style={{ color: '#6b7a8d', fontSize: 12, lineHeight: 2.0 }}>
              <div>1. <strong style={{ color: '#e2e8f0' }}>Koble CP2102:</strong> TX→WT32 RX0 · RX→WT32 TX0 · GND→GND</div>
              <div>2. <strong style={{ color: '#e2e8f0' }}>Boot-modus:</strong> Hold IO0 til GND mens strøm kobles til → slipp etter 1 sek</div>
              <div>3. <strong style={{ color: '#e2e8f0' }}>Arduino IDE:</strong> Board "ESP32 Dev Module" · Flash Mode DIO · Flash 4MB (No OTA)</div>
              <div>4. <strong style={{ color: '#e2e8f0' }}>RPI_HOST:</strong> Sett IP-adressen til din RPi 5 (sjekk med <code style={{ color: '#a8ff3e' }}>hostname -I</code>)</div>
              <div>5. <strong style={{ color: '#e2e8f0' }}>NTC-verdier:</strong> Les r25 og B-faktor fra datablad på din VDO-sender</div>
              <div>6. <strong style={{ color: '#e2e8f0' }}>TPMS:</strong> Leses av RPi via BLE — ingen kode nødvendig på WT32</div>
              <div>7. <strong style={{ color: '#e2e8f0' }}>Kalibrering:</strong> Kjør <code style={{ color: '#a8ff3e' }}>python calibration.py</code> på RPi etter installasjon</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
