# VW Boble 1956 — Custom Race Dashboard System

**Komplett teknisk spesifikasjon, handleliste og systemdokumentasjon**

| | |
|---|---|
| Motor | 2387cc Type 1 |
| Boring × slag | 86mm × 94mm |
| Effekt (mål) | 185–200 hk, naturlig aspirert |
| Bruksområde | Gate + SCC Drag |
| Filosofi | Sleeper |

---

## 1. Prosjektbeskrivelse

Målet er å bygge et komplett, hjemmelaget race dashboard-system for en 1956 VW Boble med 2387cc luftkjølt Type 1-motor. Systemet skal konkurrere funksjonsmessig med kommersielle løsninger som Racepak IQ3 og AiM MXG 1.3, men til en brøkdel av kostnaden — og med funksjoner ingen kommersielle systemer tilbyr.

Bilen er en sleeper — ingen synlige race-detaljer utenfra. Dashboardet sitter på hengsler under originalt dashbord og tippes ned av eier, usynlig for tilskuere.

### 1.1 Filosofi og designprinsipper

| Prinsipp | Beskrivelse |
|---|---|
| Sleeper-first | Ingenting skal synes utenfra. Dashboard skjult på hengsler. Ingen synlige sensorer eller race-utstyr. |
| Skalerbart | Bygges i fire nivåer. Start enkelt, legg til funksjonalitet over tid uten å rive ut noe. |
| Åpen kildekode | All software bygges fra bunnen eller på open source. Ingen locked-in proprietær hardware. |
| Datadrevet | Alt logges. Drag-analyser, motor-helse, dekktrykk — alt tilgjengelig for analyse i Grafana. |
| Design-fokus | UI/UX skal se profesjonelt ut. Mørkt tema, god typografi, tydelige alarmer. Ikke hobbyprosjekt-estetikk. |
| Redundans | Kritiske data logges på to steder — SD-kort i motorrom og RPi. Aldri miste data. |

### 1.2 Systemarkitektur — oversikt

```
MOTORROM:   Alle sensorer → WT32-ETH01 (ESP32 m/ Ethernet+BLE) → CAT6-kabel
DASHBORD:   RPi 5 → 7" touchscreen (hengslet, skjult) → webserver → telefon/tablet
TELEMETRI:  RPi → Grafana → analyse på PC/Mac etter kjøring
TRÅDLØST:   TPMS BLE-sensorer → WT32-ETH01 → RPi
```

### 1.3 Sammenligning med kommersielle systemer

| Funksjon | Ditt system | Racepak IQ3 | AiM MXG 1.3 | Haltech iC-7 |
|---|---|---|---|---|
| Pris | ~3 500 kr | ~10 000 kr | ~12 000 kr | ~20 000 kr |
| Display | 7" touch IPS | 4.3" LCD | 7" TFT | 7" TFT |
| GPS timing | ✅ Innebygd | Tilleggskjøp | Tilleggskjøp | Tilleggskjøp |
| TPMS dekktrykk | ✅ BLE | ❌ | ❌ | ❌ |
| Lys-styring | ✅ 4–16 kanaler | ❌ | ❌ | ❌ |
| Underglow WS2812B | ✅ Full RGB | ❌ | ❌ | ❌ |
| Webdashboard | ✅ Live | ❌ | ❌ | ❌ |
| Grafana analyse | ✅ | ❌ | ❌ | ❌ |
| Telefon-dashboard | ✅ | ❌ | ❌ | ❌ |
| Karb-støtte | ✅ Fullt | ✅ | ✅ | ❌ EFI only |
| Tilpasning | Ubegrenset | Begrenset | Begrenset | Begrenset |

---

## 2. Systemkomponenter og hardware

### 2.1 WT32-ETH01 — motorromsenhet

WT32-ETH01 er en ESP32-basert mikrokontroller med innebygd Ethernet, WiFi og Bluetooth Low Energy. Dette er hjernen i motorrommet og håndterer all sensor-lesing.

| Spesifikasjon | Verdi |
|---|---|
| Prosessor | ESP32 dual-core 240 MHz |
| Ethernet | Innebygd RJ45 — kobles direkte til CAT6 |
| Bluetooth | BLE 4.2 — leser TPMS-sensorer trådløst |
| WiFi | 802.11 b/g/n — backup kommunikasjon |
| Analoge innganger | 6 stk (0–3.3V) — oljetrykk, oljetemp, drivstoff, AFR, TPS, clutch |
| SPI | MAX31855 termokobling-moduler (CHT, EGT) |
| UART | GPS-modul (NEO-6M) |
| I2C | Ekspansjonsmoduler ved behov |
| Strøm | 5V via LM2596 DC-DC buck converter |
| Temperatur | Tåler -40°C til +85°C — egnet for motorrom |

### 2.2 Raspberry Pi 5 — dashbordenhet

RPi 5 kjører all software — dashboard, webserver, datalogger og Grafana. Mottar sensordata fra WT32-ETH01 via CAT6-kabel og presenterer det på 7" touchscreen.

| Spesifikasjon | Verdi |
|---|---|
| Prosessor | BCM2712 quad-core ARM Cortex-A76 2.4 GHz |
| RAM | 4GB LPDDR4X |
| Ethernet | Innebygd Gigabit — kobles til CAT6 |
| WiFi | 802.11ac dual-band — hotspot for telefon-dashboard |
| Bluetooth | 5.0 — backup BLE |
| GPIO | 40-pin header — brytere, relay, lys, sensorer |
| USB | 4x USB (2x USB 3.0) — StreamDeck, kamera, tilbehør |
| Kamera | 2x CSI-porter — inntil 2 kameraer uten USB |
| Strøm | 5V 3A via MP1584EN DC-DC buck converter |

### 2.3 Sensorer

| Sensor | Hardware | Kobles til | Måler |
|---|---|---|---|
| CHT sylinderhode | Hjemmelaget K-type termokobling på kobberring M12 | MAX31855 #1 → WT32 | Sylinderhode-temperatur °C |
| EGT avgass (valgfri) | K-type termokobling M6 i eksos-flens | MAX31855 #2 → WT32 | Avgasstemperatur °C |
| CHT til 1200-motor | Universal motorcykel CHT-sensor M14 | MAX31855 #1 → WT32 | CHT på 1200cc motor |
| Oljetrykk | VDO sender analog | A0 på WT32 | Bar |
| Oljetemperatur | VDO sender analog | A1 på WT32 | °C |
| Drivstofftrykk | Analog trykksender | A2 på WT32 | Bar |
| Wideband O2 (AFR) | Bosch LSU4.9 + Innovate LC-2 controller | A3 på WT32 (0–5V) | Lambda / AFR |
| Gassposisjon (TPS) | Potensiometer 10K på IDA 48-aksel | A4 på WT32 | % åpen |
| Clutchposisjon | Lineært potensiometer 10K på clutch-wire | A5 på WT32 | % trykket inn |
| GPS fart/posisjon | GY-NEO6MV2 + aktiv SMA-antenne | UART på WT32 | km/h, posisjon, tid |
| TPMS ×4 dekk | PECHAM BLE ekstern sensor | BLE på WT32 | Bar + temperatur per dekk |
| G-kraft / IMU | MPU6050 GY-521 | I2C på RPi | Akselerasjon X/Y/Z |
| Bremselys-input | PC817 optokoppler isolasjon | GPIO 17 på RPi | Digital signal |
| Line lock-status | PC817 optokoppler isolasjon | GPIO 18 på RPi | Digital on/off |

---

## 3. Software-arkitektur

Systemet består av tre separate software-lag som kommuniserer med hverandre. Hvert lag har ett ansvar og kan byttes ut uten å påvirke de andre.

### 3.1 Lag 1 — WT32-ETH01 firmware (ESP32 / Arduino C++)

Kjører på WT32-ETH01 i motorrommet. Leser alle sensorer hvert 20ms (50 Hz), konverterer råverdier til engineering-enheter, og sender JSON-pakker over UDP til RPi. Lytter simultant på BLE-kanal for TPMS-sensorer.

| Funksjon | Beskrivelse |
|---|---|
| Sensor-lesing | Alle analoge kanaler, SPI (MAX31855), UART (GPS), BLE (TPMS) leses i loop |
| Kalibrering | Råverdier konverteres: VDO sender ohm→bar, termokobling mV→°C, LC-2 V→AFR |
| UDP-sending | JSON-pakke sendes til RPi hvert 20ms: `{rpm, cht, egt, oilp, oilt, fuel, afr, tps, clutch, gps, tpms}` |
| BLE TPMS | Scanner passivt etter PECHAM BLE-advertisement og parser dekktrykk |
| SD-logging | Skriver rå CSV direkte til SD-kort som backup — uavhengig av RPi |
| Watchdog | Sender heartbeat til RPi hvert sekund — RPi viser alarm om heartbeat stopper |

### 3.2 Lag 2 — RPi backend (Python)

Kjører på RPi 5. Mottar UDP-pakker fra WT32, prosesserer data, lagrer til database, serverer webdashboard og kjører alarmer.

| Modul | Teknologi | Funksjon |
|---|---|---|
| UDP-mottaker | Python asyncio | Mottar sensordata 50 Hz fra WT32-ETH01 |
| Databehandling | Python NumPy | Filtrering, moving average, Kalman-filter på støyete signaler |
| Database | InfluxDB | Tidsseriedatabase optimalisert for sensordata. Gratis, open source. |
| Webserver | Flask + SocketIO | Serverer dashboard-UI og pusher live data via WebSocket |
| Grafana | Grafana OSS | Kobler til InfluxDB og viser profesjonelle analysegrafer |
| Alarm-motor | Python | Overvåker grenseverdier, sender varsler, trigger kill switch GPIO |
| GPS-analyse | Python TinyGPS | Parser NMEA-data, beregner 60-fot, 1/8 mile, 1/4 mile automatisk |
| Logger | Python CSV + InfluxDB | Loggfil per kjøring, automatisk navngitt med tidsstempel |
| Shutdown-handler | Python + GPIO | Lytter på UPS HAT signal og kjører trygg shutdown |

### 3.3 Lag 3 — Frontend (Web UI)

To separate UI-er: ett optimalisert for RPi touchscreen (stort, høy kontrast, touch-vennlig), ett optimalisert for telefon (kompakt, mobilvennlig). Begge oppdateres live via WebSocket.

| UI-element | Teknologi | Beskrivelse |
|---|---|---|
| Gauge-visning | SVG + JavaScript | Analoge og digitale målere for alle sensorer |
| RPM-bar | CSS animation | Stor horisontal RPM-bar med rødlinje ved 6500 RPM |
| AFR-display | SVG sirkel | Stor AFR-visning med fargekoding (rik/ok/mager) |
| TPMS-panel | HTML grid | Fire dekk med trykk og temperatur |
| Alarm-banner | CSS overlay | Rød overlay med tekst ved kritiske alarmer |
| Drag-timer | JavaScript | Live 0–100, 60-fot, 1/4 mile fra GPS-data |
| Logg-visning | Chart.js | Kurver fra siste kjøring — AFR vs RPM, CHT over tid osv |
| Grafana-link | iframe embed | Grafana-dashboard embeds direkte i web-UI |

### 3.4 Design og UI-valg

> **VIKTIG:** Disse reglene MÅ følges for at systemet skal se like bra ut som kommersielle alternativer.

| Element | Valg | Begrunnelse |
|---|---|---|
| Fargetema | Mørkt — nær svart bakgrunn `#0D1117` | Lesbart i sol og skygge. Racing-estetikk. Reduserer øyetretthet. |
| Aksentfarge | Cyan `#00C8FF` som primær | Høy kontrast mot mørk bakgrunn. Moderne racing-look. |
| Alarmfarger | Grønn → Gul → Rød (aldri oransje som primær alarm) | Universalt gjenkjennelig trafikklys-mønster. |
| Typografi | IBM Plex Mono for tall, Space Grotesk for labels | Monospace for tall sikrer stabil layout ved oppdatering. |
| Gauge-stil | Bue-målere (arc gauges) ikke sirkler | Mer avlesbart på rask blikk. Brukt i alle seriøse race-dashboards. |
| Animasjon | Smooth interpolasjon 60 fps — ingen hakkete hopp | Profesjonelt inntrykk. Skjuler sensor-støy visuelt. |
| Touch-targets | Minimum 48×48px alle knapper | Fungerer med hansker og under vibrasjoner. |
| Skjerm-orientering | Landskap (landscape) fast | Maksimal breddeutnyttelse for målere side om side. |
| Varsler | Toast-notifikasjoner + vedvarende banner ved kritisk | Toast for info, rød banner som ikke forsvinner ved kritisk. |
| Nattmodus | Auto-dimming basert på tidspunkt | Ikke blende deg om natten på vei hjem fra drag-strip. |

---

## 4. Systemets fire nivåer

Systemet bygges trinnvis. Hvert nivå legger til funksjonalitet uten å rive ut noe fra forrige nivå.

### Nivå 1 — Street (grunnpakke)

Dashboard med live sensordata · GPS drag-timing · TPMS dekktrykk · Telefon-dashboard · Line lock indikator · Tenningsstrøm-styring · Trygg shutdown

| Funksjon | Status |
|---|---|
| Live dashboard på 7" touchscreen | RPi 5 + web UI |
| Alle motor-sensorer (CHT, AFR, olje, drivstoff) | WT32-ETH01 + MAX31855 + LC-2 |
| GPS fart og drag-timing | GY-NEO6MV2 + aktiv antenne |
| TPMS alle fire dekk | PECHAM BLE via WT32 |
| Telefon-dashboard via WiFi hotspot | Flask + SocketIO |
| Line lock ON/OFF indikator på skjerm | PC817 optokoppler → GPIO |
| Tenning styrer strøm til systemet | 5V relay + UPS HAT |
| Grafana basis-analyse | InfluxDB + Grafana OSS |

### Nivå 2 — Street Plus

Alt i Nivå 1 + kamera · lys-styring · G-kraft · gassposisjon · bremse-input · underglow

| Tillegg | Hardware |
|---|---|
| Frontkamera synkronisert med logg | RPi Camera Module 3 (CSI) |
| Underglow WS2812B full RGB | WS2812B 5V strip + IRLZ44N MOSFET |
| Lys-styring 4 kanaler | 4-kanal 5V relay-modul |
| G-kraft logging til logg | MPU6050 GY-521 I2C |
| Gassposisjon (TPS) | Potensiometer på IDA 48-aksel → WT32 A4 |
| Bremselys-input til logg | PC817 optokoppler → GPIO |
| Shift-lys over ratt | WS2812B LED-strip 8 pixels + RPi GPIO |

### Nivå 3 — Track Day

Alt i Nivå 2 + kill switch · launch-trelykt · clutchposisjon · SD-backup · pit-display

| Tillegg | Hardware |
|---|---|
| Automatisk kill switch ved kritisk oljetrykk/CHT | GPIO output → relé → tenningskurs |
| Launch-trelykt (gult-gult-gult-grønt) | 3x LED + 3x GPIO, synkronisert med RPM |
| Clutchposisjon for nøyaktig launch-analyse | Lineært potensiometer → WT32 A5 |
| SD-kortlogging direkte på WT32 | MicroSD breakout på SPI |
| Pit-display på tablet | Tablet koblet til RPi WiFi hotspot |
| Automatisk 60-fot og 1/4 mile-tid | GPS + clutch-input i Python |

### Nivå 4 — Full Racecar

Alt i Nivå 3 + 16-kanal lys · CAN-bus ved EFI · 4G telemetri · StreamDeck · full sensorpakke

| Tillegg | Hardware |
|---|---|
| 16-kanal lys og relay-styring | Sainsmart 16-kanal relay-kort |
| CAN-bus integrasjon (ved EFI-bytte) | SN65HVD230 CAN-modul → SPI på RPi |
| 4G LTE telemetri og remote dashboard | GL.iNet Mango 4G router + SIM |
| Remote Grafana via Cloudflare Tunnel | Samme oppsett som ha.alexlab.no |
| StreamDeck kontrollpanel | Elgato StreamDeck Mini 6-knapper via USB |
| FreeDeck DIY alternativ | RP2040 + GC9A01 TFT-skjermer, 3D-printet |
| Potensiometer TPS og clutch komplett | Begge kanaler aktive, kalibrert |

---

## 5. Kabling og kontaktsystem

### 5.1 Kabelplan

> Eksisterende RKKB tilhengerkabel (7×1.5mm²) beholdes til strøm og digitale signaler.  
> Ny CAT6 FTP kabel legges parallelt for nettverkskommunikasjon WT32→RPi.  
> K-type termokobling-forlengerkabel (50cm+) brukes til CHT og EGT — **ALDRI vanlig kobberkabel**.

| Kabel/signal | Type | Fra→til | Merknad |
|---|---|---|---|
| Ethernet WT32→RPi | CAT6 FTP | Motorrom→Dashbord | Hoveddatakommunikasjon |
| +12V strøm | RKKB leder 1 | Tenning→relay→DC-DC | Styres av tenningsrelay |
| GND felles | RKKB leder 2 | Batteri minus→alle enheter | Felles jord |
| CHT termokobling | K-type forlengerkabel | Sylinderhode→MAX31855 | Polaritetskritisk! |
| Wideband O2 signal | Skjermet signalkabel | LC-2 output→WT32 A3 | 0–5V analogt |
| GPS antenne | SMA koaks | Frunk→WT32 | Aktiv antenne 3m |
| TPMS | BLE trådløs | Dekk→WT32 | Ingen kabel |
| Bremselys input | RKKB leder 3 | Bremselys→PC817→GPIO | Via optokoppler isolert |
| Line lock input | RKKB leder 4 | Line lock→PC817→GPIO | Via optokoppler isolert |
| Underglow output | 5V fra RPi | GPIO→MOSFET→WS2812B | IRLZ44N MOSFET |
| Relay output | GPIO→relay | GPIO→1-4 relay-kanaler | 12V lys og tilbehør |

### 5.2 Kabelgjennomføringer og boks

WT32-ETH01 monteres i 3D-printet PETG-boks i motorrommet med følgende gjennomføringer:

| Gjennomføring | Størrelse | Antall | Hva |
|---|---|---|---|
| PG7 kabelklemme | Kabel Ø3–6.5mm | 4 | Signalkabler (CHT, AFR, sensorer) |
| PG9 kabelklemme | Kabel Ø4–8mm | 1 | Strøm 12V inn |
| RJ45-utskjæring | 16×13.5mm | 1 | Ethernet til RPi |
| SMA-gjennomføring | 6.5mm hull | 1 | GPS-antenne |

Boksen tettes med foam-tape 2.5mm i pakningsspor. Elektronikk sprayes med konformal coating før lukking. PG-klemmer forsegles rundt kabel med gummipakning.

---

## 6. Installasjon og oppsett

### 6.1 Steg-for-steg installasjon

| Steg | Handling | Verktøy/software |
|---|---|---|
| 1 | Installer Raspberry Pi OS (64-bit) på MicroSD-kort | Raspberry Pi Imager (gratis) |
| 2 | Aktiver SSH, I2C, SPI og kamera i raspi-config | Terminal: `sudo raspi-config` |
| 3 | Installer Python-pakker: Flask, SocketIO, InfluxDB-client, NumPy, asyncio | `pip3 install` |
| 4 | Installer InfluxDB 2.x på RPi | Offisiell ARM64-pakke |
| 5 | Installer Grafana OSS på RPi | Offisiell ARM64-pakke |
| 6 | Konfigurer RPi som WiFi hotspot (SSID: VW_Boble, passord valgfritt) | hostapd + dnsmasq |
| 7 | Programmer WT32-ETH01 via CP2102 USB-TTL adapter | Arduino IDE + ESP32-bibliotek |
| 8 | Kalibrere analoge sensorer: kjør motor, noter min/maks verdier | Python kalibreringsskript |
| 9 | Konfigurer Grafana dashboards og alarmer | Grafana webUI (port 3000) |
| 10 | Test alle inputs og outputs: bremselys, line lock, relay, underglow | Test-script medfølger |
| 11 | Monter skjerm på hengsler under dashbord | 3D-printet brakett i PETG |
| 12 | Legg kabler ryddig med kabelbindere og varmekrympestrømpe | Biltema sortiment |

### 6.2 WiFi-oppsett for telefon-dashboard

RPi 5 er satt opp som WiFi-hotspot. Koble telefon til nettverket **VW_Boble** og åpne nettleser på `192.168.4.1` — dashboardet vises umiddelbart. Ingen app å installere.

### 6.3 Grafana-tilgang

Grafana kjører på RPi og er tilgjengelig på `192.168.4.1:3000` fra telefon koblet til RPi-hotspot. Etter kjøring kobles laptop til samme nettverk for full analyse. Med 4G-router (Nivå 4) er Grafana tilgjengelig fra hele verden via Cloudflare Tunnel.

---

## 7. Bruksanvisning

### 7.1 Normal kjøring

| Situasjon | Hva skjer automatisk |
|---|---|
| Skru på tenning | Relay aktiveres → DC-DC converters slår på → WT32 og RPi starter (ca. 15 sek) |
| RPi ferdig startet | Dashboard vises på touchscreen. Alle sensorer aktive. Logger starter. |
| Kjøring | Alle verdier oppdateres live. Logging skjer kontinuerlig til InfluxDB og CSV. |
| Alarm utløst | Rød banner med tekst vises. Lyd-alarm (om høyttaler montert). Kill switch aktiveres ved kritisk oljetrykk. |
| Skru av tenning | UPS HAT gir RPi 45 sek til å lagre og slå seg av. WT32 mister strøm umiddelbart. |
| Neste gang tenning på | Logger fortsetter i ny fil med tidsstempel. Alt fra forrige kjøring er lagret. |

### 7.2 Drag-strip bruk

| Aksjon | Prosedyre |
|---|---|
| Forberedelse til start | Bytt dashboard til 'Drag-modus' (touch-knapp). Viser RPM stor, launch-indikator og timer. |
| Line lock aktivering | Trykk line lock-knapp → 'LINE LOCK AKTIV 🔒' vises på skjerm med rød indikator |
| Launch | Slipp line lock og clutch simultant. Timer starter automatisk ved GPS-bevegelse. |
| Under kjøring | Shift-lys lyser grønn→gul→rød ved RPM-terskel. Dashboard viser live data. |
| Etter mål | Dashboard viser automatisk: 60-fot, 1/8 mile, 1/4 mile og topphastighet |
| Analyser kjøringen | Koble til RPi-hotspot på telefon → gå til `192.168.4.1` → 'Siste kjøring' |
| Reset for ny kjøring | Trykk Reset-knapp (fysisk eller touch) → logger starter ny fil |

### 7.3 Reset og kalibrering

| Funksjon | Handling |
|---|---|
| Reset drag-timer og topphastighet | Fysisk knapp (GPIO) eller touch på skjerm |
| Reset sesjon/logger | Touch-knapp 'Ny sesjon' — starter ny logg-fil |
| Kalibrere TPS (gassposisjon) | Hold kalibreringsknapp → gi gass til bunn og slipp → ferdig |
| Kalibrere clutch | Hold kalibreringsknapp → trykk clutch helt inn og slipp → ferdig |
| Sjekke sensor-status | Settings-side viser alle sensorverdier og tilkoblings-status |

---

## 8. Komplett handleliste

### 8.1 Allerede bestilt / i handlekurv ✅

| Produkt | Antall | Pris ca. | Status |
|---|---|---|---|
| WT32-ETH01 ESP32 Ethernet+BLE | 1 | ~66 kr | ✅ I handlekurv |
| DIN Rail screw terminal ESP32 30-pin | 1 | ~63 kr | ✅ I handlekurv |
| MAX31855 K-type breakout (TERFACT) | 1 | ~40 kr | ✅ I handlekurv |
| MAX31855 K-type breakout (FAR EAST) | 1 | ~36 kr | ✅ I handlekurv |
| K-type termokobling forlengerkabel 50cm | 1 | ~18 kr | ✅ I handlekurv |
| CHT sensor M14 universal motorcykel | 1 | ~64 kr | ✅ I handlekurv (1200-motor) |
| GY-NEO6MV2 GPS modul blå (med EEPROM) | 1 | ~23 kr | ✅ I handlekurv |
| GPS aktiv antenne SMA 3m kabel | 1 | ~34 kr | ✅ I handlekurv |
| MP1584EN DC-DC 3A 5V (5-pack) | 1 pk | ~33 kr | ✅ I handlekurv |
| LM2596 DC-DC adjustable | 1 | ~32 kr | ✅ I handlekurv |
| Relay 1-kanal 12V | 1 | ~14 kr | ✅ I handlekurv — bytt til 5V versjon! |
| Relay 4-kanal 5V | 1 | ~30 kr | ✅ I handlekurv |
| MPU6050 GY-521 IMU | 1 | ~22 kr | ✅ I handlekurv |
| IRLZ44N MOSFET 10-pack | 1 pk | ~25 kr | ✅ I handlekurv |
| PC817 8-kanal optokoppler board | 1 | ~13 kr | ✅ I handlekurv |
| UPS HAT for Raspberry Pi 5 (18650) | 1 | ~294 kr | ✅ I handlekurv |
| CP2102 USB-TTL adapter | 1 | ~23 kr | ✅ I handlekurv |
| 7" IPS touchscreen 1024×600 5-punkt | 1 | ~314 kr | ✅ I handlekurv |
| Bosch LSU4.9 wideband O2-sonde | 1 | ~239 kr | ✅ I handlekurv |

### 8.2 Kjøpes fra Kjell & Company

| Produkt | Antall | Pris ca. | Art.nr / merknad |
|---|---|---|---|
| Raspberry Pi 5 Model B 4GB | 1 | 949 kr | Art.nr 88382 |
| MicroSD-kort 32GB Class 10 / A1 | 1 | ~100 kr | Sandisk eller Samsung |
| Raspberry Pi aktiv kjøler (offisiell) | 1 | ~120 kr | Viktig for motorrom-temperatur |

### 8.3 Kjøpes fra AliExpress (ikke bestilt ennå)

| Produkt | Antall | Søkeord AliExpress | Pris ca. |
|---|---|---|---|
| Relay 1-kanal 5V (erstatter 12V-versjonen) | 1 | '1 channel relay module 5V' | ~15 kr |
| WS2812B LED-strip 5V 60LED/m (1m) | 1 | 'WS2812B LED strip 5V 60led' | ~50 kr |
| Momentary push button 12mm med LED | 4 | '12mm momentary push button LED' | ~5 kr/stk |
| Kobberskiver/ringer assortert (CHT-sensor) | 1 pk | 'copper washer assortment M12 M14' | ~20 kr |
| Sølvloddetinn 0.8mm (elektronikk) | 1 | 'silver solder 0.8mm rosin' | ~20 kr |
| Flux penn (lodding av termokobling) | 1 | 'flux pen soldering' | ~15 kr |
| MicroSD-kortleser til WT32 (SPI) | 1 | 'SPI SD card module Arduino' | ~15 kr |

### 8.4 Kjøpes fra aircooled.net / Innovate

| Produkt | Antall | Pris ca. | Merknad |
|---|---|---|---|
| Innovate LC-2 wideband controller | 1 | ~$80 | Til Bosch LSU4.9-sonden |
| Innovate O2-bung M18×1.5 (eksos-fitting) | 1 | ~$10 | For montering av LSU4.9 i eksos |

### 8.5 Kjøpes fra Biltema

| Produkt | Antall | Pris ca. | Merknad |
|---|---|---|---|
| Loddetinn 2mm 227°C (art.nr 20-0203) | 1 | ~80 kr | Blyfritt 3% sølv — funker til CHT-sensor |
| Konformal coating spray | 1 | ~120 kr | Fuktsikring av elektronikk i motorrom |
| Korrugert plastslange Ø10mm, 5m | 1 | ~40 kr | Kabelbeskyttelse motorrom |
| Kabelbindere assortert | 1 pk | ~30 kr | — |
| Varmekrympestrømpe assortert | 1 pk | ~40 kr | Til skjøter og termokobling |
| PG7 kabelgjennomføring ×4 | 4 | ~5 kr/stk | Til WT32-boks |
| PG9 kabelgjennomføring ×1 | 1 | ~8 kr | Til WT32-boks strøm |
| Foam-tape 2.5mm (pakning) | 1 rull | ~30 kr | Til 3D-printet case-lokk |

### 8.6 Opsjoner — legg til når du er klar

| Produkt | Nivå | Pris ca. | Kjøp fra |
|---|---|---|---|
| Elgato StreamDeck Mini 6-knapper | 3–4 | ~800 kr | Kjell / Elkjøp |
| RPi Camera Module 3 (CSI) | 2 | ~350 kr | Kjell & Company |
| WS2812B shift-lys 8-pixel ring over ratt | 2 | ~30 kr | AliExpress 'WS2812B ring 8' |
| Potensiometer 10K linear (TPS på IDA 48) | 2 | ~15 kr | AliExpress '10K linear potentiometer' |
| Lineært potensiometer 10K (clutch) | 3 | ~15 kr | AliExpress 'linear slide potentiometer 10K' |
| 4-kanal relay ekstra (8 kanaler totalt) | 3 | ~40 kr | AliExpress '4 channel relay 5V' |
| SN65HVD230 CAN-bus modul (ved EFI) | 4 | ~20 kr | AliExpress 'SN65HVD230 CAN module' |
| GL.iNet Mango 4G router + SIM | 4 | ~400 kr | Kjell / GL.iNet direkte |
| FreeDeck DIY (RP2040 + TFT-skjermer) | 4 | ~400 kr | AliExpress — se egne instruksjoner |
| PECHAM BLE TPMS sensor ×4 | 1 | ~150 kr | AliExpress item 1005004504977890 |

### 8.7 Totalkostnader

| Kategori | Kostnad ca. |
|---|---|
| Allerede bestilt/handlekurv | ~1 370 kr |
| Kjell & Company | ~1 170 kr |
| AliExpress mangler | ~150 kr |
| Biltema | ~390 kr |
| aircooled.net (Innovate LC-2) | ~$90 (~1 000 kr) |
| **TOTAL Nivå 1 komplett** | **~4 100 kr** |
| Opsjoner Nivå 2 (kamera, shift-lys, TPS) | + ~800 kr |
| Opsjoner Nivå 3 (clutch, ekstra relay, SD) | + ~400 kr |
| Opsjoner Nivå 4 (StreamDeck, 4G, CAN) | + ~1 200 kr |

---

## 9. Neste steg for utvikler

| Prioritet | Modul | Teknologi | Beskrivelse |
|---|---|---|---|
| 1 | WT32-ETH01 firmware | Arduino C++ / ESP32 | UDP-sending av alle sensorverdier som JSON, BLE TPMS-lesing, SD-logging |
| 2 | RPi UDP-mottaker | Python asyncio | Mottar pakker, parser JSON, skriver til InfluxDB |
| 3 | Web-dashboard Nivå 1 | Flask + SocketIO + JS | Live gauge-display med mørkt tema, alle sensorer, alarm-banner |
| 4 | GPS drag-analyse | Python TinyGPS++ | Parser NMEA, beregner 60-fot/1/4 mile, eksponerer via API |
| 5 | Grafana-konfigurasjon | Grafana JSON | Dashboard-templates for motor-helse og drag-analyse |
| 6 | Alarm-motor | Python | Overvåker grenseverdier, GPIO kill switch, UPS HAT shutdown |
| 7 | Drag-modus UI | JavaScript | Dedikert stor RPM + timer-visning for drag-strip |
| 8 | Telefon-optimalisert UI | Responsive CSS | Kompakt versjon av dashboardet for mobilskjerm |
| 9 | Logg-analyse UI | Chart.js + Flask | Viser kurver fra lagrede kjøringer |
| 10 | Kalibreringsskript | Python | Interaktiv kalibrering av TPS og clutch-potensiometer |

> **VIKTIG:** All kode skal ha god kommentering på norsk. Design-reglene i seksjon 3.4 MÅ følges — spesielt mørkt tema, IBM Plex Mono for tall og smooth animasjoner. Systemet skal se like bra ut som kommersielle alternativer som koster 10× mer.

### Kodebase-struktur

```
/vw-dashboard/
  firmware/    → Arduino kode for WT32-ETH01
  backend/     → Python Flask server, UDP-mottaker, InfluxDB-klient
  frontend/    → HTML/CSS/JS for web-dashboard
  grafana/     → Dashboard JSON-templates
  scripts/     → Kalibrering, test, installasjon
  docs/        → README og installasjonsveiledning
```
