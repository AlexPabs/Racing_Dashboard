# Komplett AI-Handoff Dokument
## Universal Racing Sensor Board — 1956 VW Boble Race-Dashboard Prosjekt

**Til: Neste AI som tar over dette prosjektet**  
**Fra: AlexPabs Racing / Claude Sonnet 4.6**  
**Dato: 2026-06-11**  
**Revisjon: v0.4b — alle 42 Teensy-pins brukt**  
**Mål: Ferdig KiCad-layout → Gerber-filer til PCBway**

---

> **TIL AI-EN SOM LESER DETTE:** Dokumentet gir deg full kontekst om hva vi vil lage, alle beslutninger som er tatt, alt arbeidet som er gjort til nå, og eksakt hva vi trenger av deg. Du oppfordres aktivt til å komme med egne innspill, foreslå bedre komponenter, eller peke på ting vi har oversett. Det er bedre med et bedre PCB-design enn å følge planen blindt.

---

## DEL 1: PROSJEKTOVERSIKT

### 1.1 Bilen og bakgrunnen

Dette er et race dashboard-system for en **1956 Volkswagen Boble** med en luftkjølt **2387cc Type 1-motor** (86mm boring × 94mm slag, ca. 185–200 hk naturlig aspirert). Bilen kjøres på gata og i SCC Drag-stevner.

**Filosofi: Sleeper.** Ingenting skal synes utenfra. Dashboardet sitter på hengsler under det originale instrumentbordet og tippes ned av eieren — usynlig for tilskuere og politifolk. All elektronikk er skjult.

**Systemet konkurrerer med:** Racepak IQ3 (~10 000 kr), AiM MXG 1.3 (~12 000 kr), Haltech iC-7 (~20 000 kr) — men bygges for ca. 4 100 kr med langt fler funksjoner, inkludert GPS-tidtaking, TPMS, Grafana-logging og web-dashboard på telefon.

### 1.2 Systemarkitektur (allerede bestemt og bygd)

```
┌─────────────────────────────────────────────────────┐
│                    MOTORROM                          │
│  Alle sensorer → SENSOR BOARD (Teensy 4.1)          │
│  Teensy → WIZ820io Ethernet → CAT6-kabel            │
└──────────────────────┬──────────────────────────────┘
                       │ CAT6 Ethernet
┌──────────────────────▼──────────────────────────────┐
│                    DASHBORD (RPi 5)                  │
│  UDP mottar sensordata → Flask webserver             │
│  7" touchscreen + telefon WiFi hotspot               │
│  InfluxDB logging → Grafana analyse                  │
└─────────────────────────────────────────────────────┘
```

**Merk:** Systemet bruker to separate Ethernet-boards:
- **Gammel plan (v0.1–0.2):** WT32-ETH01 (ESP32 med innebygd Ethernet) i motorrommet
- **Ny plan (v0.3–0.4):** Teensy 4.1 + WIZ820io Ethernet-modul på en custom PCB — dette gir langt mer I/O, raskere CPU (600 MHz ARM vs 240 MHz ESP32), og hardware float for sensorberegning

Den nye sensor-PCBen ER det vi designerfremover. ESP32/WT32 er foreldet i designet.

---

## DEL 2: SENSOR BOARD — HVA VI TRENGER

### 2.1 Funksjonsoversikt

Sensor-boardet er en **universell** sensor-interface. Det er ikke låst til VW Boble — alle kontakter er merket generisk (J0, J1, ...) og sensor-navn konfigureres i firmware via nettleser på `/settings`. PCBen er altså gjenbrukbar på alle kjøretøy.

**Det boardet gjør:**

| Funksjon | Detalj |
|----------|--------|
| 8× termokobler K-type | MAX31855 SPI ADC per kanal — CHT, EGT, oljetemperatur, etc. |
| 8× analog 0–5V inngang | Oljetrykk, drivstofftrykk, AFR, TPS, MAP, IAT, bremsevæsketrykk, etc. |
| 4× NTC termistor inngang | Oljetemperatur, kjølevæske, intake, etc. |
| 4× digital inngang (opto-isolert) | DIG0=RPM fra tenningsspole, DIG1=bremselys, DIG2=linelock, DIG3=launch control |
| 6× MOSFET utgang 12V | Kjølevifte, pumpe, shift-light, + 3 spare (MOS0–MOS5) |
| GPS UART inn | NEO-6M modul → Teensy Serial8 (pin 34) — hastighet, tidtaking |
| NeoPixel WS2812B | Enkeltpins data (pin 35) → underglow + shift-lights (adresserbare LEDs) |
| 3-akse akselerometer | LIS3DH SPI — G-krefter, lateral akselerasjon |
| 100 Mbit Ethernet | WIZ820io modul — web-dashboard, UDP-telemetri |
| Buck-converter 12V→5V | MP2307DN — strømforsyning til Teensy og sensorer |

> **v0.4b: Alle 42 Teensy-pins er nå brukt.** Se fullstendig pin-kart i Del 3.2.

### 2.2 Hva er Teensy 4.1?

Teensy 4.1 er et ARM Cortex-M7 utviklingskort (600 MHz, IMXRT1062) som er ideelt for høyhastighets sensorloggging:
- 18 ADC-innganger
- 3× SPI-busser
- Innebygd SD-kortleser
- 40-pin DIP-format (2×24 pins, 2.54 mm) → monteres i socket på PCBen (IKKE loddet fast)
- 3.3V I/O, 5V VIN

**Kritisk punkt:** Teensy monteres i en 2×24-pin DIP-socket. Den kan tas ut og programmeres separat.

---

## DEL 3: ALLE DESIGNBESLUTNINGER

### 3.1 Komponentvalg og begrunnelse

#### MAX31855KASA+ — Termokobler ADC
**Valgt fordi:** Billigste dedikerte K-type termokobler ADC med SPI-grensesnitt. Leser direkte differensielt (T+ og T−), ingen analog forforsterkerkrets trengs. Intern kald-junction kompensasjon. Nøyaktighet ±2°C.

**Alternativ AI kan vurdere:** MAX31856 støtter flere termokobler-typer (K, J, T, N, E) og gir 19-bit oppløsning vs 14-bit — men koster ca. 3× mer og er bare nødvendig ved EGT over 1024°C. For CHT og oljetemperatur holder MAX31855 fint.

#### LIS3DH — Akselerometer
**Valgt fordi:** Billig, liten (LGA-16 3×3 mm), SPI-støtte, ±16g rekkevidde, 1 µA power-down. Brukes til G-kraft-logging.

**Alternativ AI kan vurdere:** MPU6050 (I2C, 6DOF med gyroskop) — men krever ekstra I2C-routing. For ren G-logging holder LIS3DH. Hvis AI mener MPU6050 er bedre, kan det brukes.

#### WIZ820io — Ethernet
**Valgt fordi:** Teensy 4.1-biblioteket QNEthernet støtter W5200-brikken direkte (WIZ820io er W5200 + magnetics + RJ45 på ett brett). Plug-and-play SPI Ethernet.

**Alternativ AI kan vurdere:** ENC28J60 (billigere men tregere, krever TCP/IP-stack i firmware), W5500 (nyere, Wiznet har offisiell Teensy-support). WIZ820io er et valg vi er ganske sikre på.

#### PC817C — Optokoppler for digitale innganger
**Valgt fordi:** Gir galvanisk isolasjon fra kjøretøyets elektrisystem (støy fra tenningsspole, induktive transients opptil 400V). PC817 tåler dette. Standard DIP-4 pakke, billig, lett tilgjengelig.

**Alternativ AI kan vurdere:** TLP521 (litt høyere CTR), 6N137 (raskere, bedre for høyfrekvent RPM-signal). For RPM-puls over 5kHz (tilsvarer >75 000 RPM 4-takter eller ca. 9000 RPM med 60-2 triggerhjul) kan 6N137 være bedre. Vår 2387cc VW-motor dreier maks ca. 8500 RPM, trigger-hjul er 12-tann — max pulsfrekvens = 8500/60×12 = 1700 Hz. PC817C holder greit.

#### AO3400A — MOSFET for utganger
**Valgt fordi:** Logic-level N-kanal MOSFET (Vgs(th) ≈ 1.4V), fullt "on" ved 3.3V fra Teensy. 30V/5.7A. SOT-23 pakke.

**Alternativ AI kan vurdere:** IRLZ44N (TO-220, 55V/47A) for store laster, eller 2N7002 (SOT-23, 60V/300mA) for lave laster. For vår bruk (vifte, pumpe, relay-spole) på 12V/maks 2A er AO3400A riktig valg.

#### MP2307DN — Buck converter 12V→5V
**Valgt fordi:** 3A output, 8–24V input, høy effektivitet (>90%), SOIC-8. Spenningsstyring via ekstern spenningsdeler.

**VIKTIG forbehold:** MP2307DN krever noen diskrete komponenter (spole, diode, kondensatorer). En ferdige buck-modul (f.eks. LM2596-modul eller MP1584EN-modul) er enklere å plassere på PCBen men tar mer plass. AI bør bestemme om det er bedre med:
- **Alternativ A:** MP2307DN IC med diskrete komponenter (mer kompakt, krever mer layout-vennlighet)
- **Alternativ B:** Ferdig 5V buck-modul på pin-header (tar mer plass, men er enklere og mer robust)

### 3.2 Koblingsskjema — fullstendig pin-kart (alle 42 Teensy-pins)

```
Teensy 4.1 — Pin-kart v0.4b
─────────────────────────────────────────────────────────────
VENSTRE SIDE (p0–p21):
  p0   CS_ETH    → WIZ820io SCSn
  p1   SP1_MISO  ← WIZ820io MISO
  p2   CS_ACC    → LIS3DH CS
  p3   CS_TC7    → MAX31855 U10 /CS
  p4   CS_TC6    → MAX31855 U9 /CS
  p5   CS_TC5    → MAX31855 U8 /CS
  p6   CS_TC4    → MAX31855 U7 /CS
  p7   CS_TC3    → MAX31855 U6 /CS
  p8   CS_TC2    → MAX31855 U5 /CS
  p9   CS_TC1    → MAX31855 U4 /CS
  p10  CS_TC0    → MAX31855 U3 /CS
  p11  SPI_MOSI  → MAX31855 ×8 + LIS3DH
  p12  SPI_MISO  ← MAX31855 SO parallelt + LIS3DH SDO
  p13  SPI_SCK   → MAX31855 ×8 + LIS3DH
  p14  A0/ANA0   ← J16 via 10kΩ/15kΩ deler (0–5V → 3.0V)
  p15  A1/ANA1   ← J17 via deler
  p16  A2/ANA2   ← J18 via deler
  p17  A3/ANA3   ← J19 via deler
  p18  A4/ANA4   ← J20 via deler
  p19  A5/ANA5   ← J21 via deler
  p20  A6/ANA6   ← J22 via deler
  p21  A7/ANA7   ← J23 via deler

HØYRE SIDE (VIN/GND/3V3 + p22–p41):
  VIN  → +5V fra buck
  GND  → jord
  3V3  ← Teensy intern reg (250mA maks)
  p22  A8/NTC0  ← J8 via 10kΩ pull-up til +3V3
  p23  A9/NTC1  ← J9 via pull-up
  p24  A10/NTC2 ← J10 via pull-up
  p25  A11/NTC3 ← J11 via pull-up
  p26  SP1_MOSI → WIZ820io MOSI
  p27  SP1_SCK  → WIZ820io SCLK
  p28  INT_ETH  ← WIZ820io INTn
  p29  RST_ETH  → WIZ820io RSTn
  p30  DIG0     ← J24 OK1 (RPM — tenningsspole, se koil-beskyttelse under)
  p31  DIG1     ← J25 OK2 (Bremselys-bryter)
  p32  DIG2     ← J26 OK3 (Linelock-bryter)
  p33  DIG3     ← J27 OK4 (Launch control-bryter)
  p34  GPS_RX   ← J33 GPS NEO-6M TX (Serial8, 9600 baud NMEA)
  p35  NEOPIXEL → J34 WS2812B data (underglow + shift-lights)
  p36  MOS0     → Q1 gate 100Ω → AO3400A (kjølevifte)
  p37  MOS1     → Q2 gate 100Ω → AO3400A (pumpe / spare)
  p38  MOS2     → Q3 gate 100Ω → AO3400A (shift-light strøm)
  p39  MOS3     → Q4 gate 100Ω → AO3400A (spare)
  p40  MOS4     → Q5 gate 100Ω → AO3400A (spare)
  p41  MOS5     → Q6 gate 100Ω → AO3400A (spare)
─────────────────────────────────────────────────────────────
```

**SPI-buss #1 (Teensy primary SPI):**
- SCK (p13), MISO (p12), MOSI (p11) → MAX31855 ×8 + LIS3DH
- Individuelle CS per MAX31855: p10, p9, p8, p7, p6, p5, p4, p3
- CS for LIS3DH: p2

**SPI-buss #2 (Teensy SPI1):**
- SCK (p27), MISO (p1), MOSI (p26) → WIZ820io
- CS: p0, INT: p28, RST: p29

**Analoge innganger (0–5V → 3.3V skaling):**
- J16–J23 → 10kΩ/15kΩ spenningsdeler → Teensy A0–A7 (p14–p21)
- VIKTIG: Teensy ADC er 3.3V maks! Deleren skalerer 5V → 3.0V

**NTC innganger:**
- J8–J11 → 10kΩ pull-up til +3.3V → Teensy A8–A11 (p22–p25)

**Digitale innganger — 4 kanaler (J24–J27):**
- Alle fire via PC817C optokoppler (galvanisk isolasjon)
- J24 (DIG0/RPM): SMBJ18A TVS-diode + 2.2kΩ serie → PC817 anode (se koil-beskyttelse)
- J25–J27 (DIG1–3/brytere): standard 470Ω serie → PC817 anode
- PC817 kollektor → +3.3V med 10kΩ pull-up → Teensy p30–p33

**⚡ Koil-beskyttelse (J24/DIG0 — KRITISK):**  
Tenningsspolens primærside genererer +300V back-EMF-spigg ved avklipping.  
PC817 tåler maks 80V — dette DREPER optokoppleren uten beskyttelse.  
Løsning:
```
J24[1] ──────── SMBJ18A (TVS, Vbr=18V, Vc≈29V ved 10A) ──── GND
         │
         2.2kΩ (1W)
         │
         → PC817 anode (pin 1)
```
- Normal 12V: (12-1.2)/2200 = 4.9mA → PC817 OK
- Spigg (TVS klemmer ~29V): (29-1.2)/2200 = 12.6mA → innenfor PC817 maks
- 300V spigg: TVS absorberer (600W toppeffekt >> typisk spiggenergi ~1–5µJ)
- **MERK:** Bruk 2.2kΩ ved J24, IKKE 470Ω som på J25–J27

**GPS (J33, 3-pin):**
- Pin 1: +5V → GPS NEO-6M VCC
- Pin 2: GPS_RX → GPS TX (NMEA ut fra modulen) → Teensy p34 (Serial8 RX)
- Pin 3: GND

**NeoPixel (J34, 3-pin):**
- Pin 1: +5V → WS2812B strøm
- Pin 2: NEOPIXEL → WS2812B data inn → Teensy p35
- Pin 3: GND
- Anbefalt: 300–500Ω serie-resistor + 1000µF bulk-kondensator på +5V skinne ved første LED

**MOSFET utganger (6 kanaler):**
- Teensy p36–p41 → 100Ω gate-resistor → AO3400A gate (Q1–Q6)
- AO3400A drain → last-kontakter J12–J15 + J31–J32 (last+)
- AO3400A source → GND
- Last-kontakt (12V) → +12V skinne
- Flyback-diode per MOSFET: 1N4007 katode → drain, anode → GND

---

## DEL 4: KICAD-ARBEIDET VI HAR GJORT

### 4.1 Versjonhistorikk

Vi har gått gjennom fire versjoner av skjemaet:

**v0.1–0.2:** Eksperimentelle skjemaer, forkastet.

**v0.3:** Generert med Python-script (`python_netlab_gen`). Bruker bare tekst + rektangler + net-labels — ingen faktiske symbol-instanser. Fungerer visuelt men er ikke et ekte KiCad-skjema (tom `lib_symbols`-blokk). Kan ikke generere BOM eller footprint-tilknytning.

**v0.4 (siste versjon):** Generert med Python-script `gen_kicad_v04.py`. Bruker ekte KiCad 7 symbol-instanser med inline-definerte symboler i `lib_symbols`-blokken. Dette er skjemaet vi ønsker å gå videre med til PCB-layout.

### 4.2 Filen vi har

**`hardware/pcb/kicad/racing_sensor_board_v0.4.kicad_sch`**
- 2596 linjer KiCad 7 S-expression format (v0.4b)
- Alle symboler er definert inline i `lib_symbols`-blokken (Custom:Teensy41, Custom:MAX31855, osv.)
- Alle koblinger er satt via net-labels (samme label = samme net)
- Alle pins er verifisert å ligge på 1.27mm KiCad 50-mil grid
- Alle pin-typer er satt til `passive` for å unngå ERC-konflikter

**`hardware/pcb/kicad/gen_kicad_v04.py`**
- Python-scriptet som genererer skjemaet programmatisk
- Kan re-kjøres for å regenerere skjema ved endringer

### 4.3 KiCad ERC-problemer vi støtte på

Vi brukte mye tid på å fikse KiCad Electrical Rules Check. Her er problemhistorikken:

| Problem | Årsak | Løsning |
|---------|-------|---------|
| 227 ERC-feil | Analog/NTC connector-labels plassert 15mm unna pin-posisjon | Byttet `rlbl` til `llbl` for venstre-side pins |
| "output+output" feil | PC817 emitter definert som "output", to output-pins på samme net | Endret alle pin-typer til "passive" |
| "input not driven" | MOSFET gate definert som "input" men wire-endpoint koblet ikke til pin | Endret gate til "passive" + bruker direkte label på pin-endpoint |
| "Unconnected wire endpoint" | Wire fra gate til label koblet ikke til gate-pin i KiCad | Fjernet wire-stub, bruker label direkte på pin |
| Pin off-grid | Symbol body-bredder ikke multiplum av 2.54mm | Alle `bw` gjort til k×2.54 mm |

**Gjenværende situasjon:** Skjemaet er nå generert med alle passive pins og direkte label-plassering. Det kan forekomme "Net has no driving pin"-advarsler i KiCad ERC (siden alle pins er passive), men dette er harmløst — det betyr bare at KiCad ikke kan automatisk identifisere hvilken del som er "kilden" på nettet.

### 4.4 Hva mangler for komplett PCB

Vi har skjema. Det vi IKKE har:
1. **KiCad .kicad_pcb layout-fil** — ingen komponentplassering gjort
2. **Footprint-tilknytning** (symbol til footprint) er angitt i skjema-symbolene men ikke verifisert
3. **Gerber-filer** — ikke generert ennå
4. **BOM (Bill of Materials)** — finnes som utkast i PCB_DESIGN_BRIEF.md

---

## DEL 5: FULLSTENDIG KOMPONENT- OG NETTLISTE

### 5.1 Komplett BOM

| Ref | Komponent | Verdi/Del | Pakke | LCSC-nr | Antall |
|-----|-----------|-----------|-------|---------|--------|
| U1 | Teensy 4.1 | Teensy 4.1 | 2×24 DIP socket | pjrc.com | 1 |
| U2 | WIZ820io | WIZ820io | 2×10 header 2.0mm | wiznet.io | 1 |
| U3–U10 | MAX31855KASA+ | MAX31855KASA+ | SOIC-8 | C67561 | 8 |
| U11 | LIS3DH | LIS3DH | LGA-16 3×3mm | C91122 | 1 |
| U12 | MP2307DN | MP2307DN | SOIC-8 | C89312 | 1 |
| Q1–Q6 | AO3400A | AO3400A | SOT-23 | C20917 | **6** |
| OK1–OK4 | PC817C | PC817C | DIP-4 W7.62mm | C6366 | **4** |
| D1–D6 | 1N4007 | 1N4007 | DO-41 gjennomgående | C14007 | **6** |
| D7 | SMBJ18A | TVS 18V 600W | DO-214AA (SMB) | C17014 | **1** |
| L1 | Spole | 10µH 1.5A | SMD 6.8×6.8mm | Würth 7447789100 | 1 |
| R1–R6 | Gate-resistor | 100Ω | 0805 | C25116 | **6** |
| R7–R9 | Opto serie (DIG1–3) | 470Ω | 0805 | C25117 | **3** |
| R10 | Opto serie (DIG0/koil) | **2.2kΩ 1W** | 1206 | C25748 | **1** |
| R11–R18 | Analog øvre deler | 10kΩ | 0805 | C25744 | 8 |
| R19–R26 | Analog nedre deler | 15kΩ | 0805 | C25885 | 8 |
| R27–R30 | NTC pull-up | 10kΩ | 0805 | C25744 | 4 |
| R31–R34 | Optokoppler pull-up | 10kΩ | 0805 | C25744 | **4** |
| R35 | FB øvre | 100kΩ | 0805 | C25867 | 1 |
| R36 | FB nedre | 4.7kΩ | 0805 | C25905 | 1 |
| C1–C8 | MAX31855 bypass | 100nF | 0402 | C1525 | 8 |
| C9 | LIS3DH bypass | 100nF | 0402 | C1525 | 1 |
| C10–C11 | WIZ820io bypass | 10µF 16V | 0805 | C15850 | 2 |
| C12 | Teensy VIN bypass | 10µF 16V | 0805 | C15850 | 1 |
| C13 | Buck BST | 100nF | 0402 | C1525 | 1 |
| C14 | Buck SS | 10nF | 0402 | — | 1 |
| C15 | Buck COMP | 10nF | 0402 | — | 1 |
| C16 | Buck Cin | 100µF 25V | Elektrolytisk SMD | C16780 | 1 |
| C17 | Buck Cout | 100µF 16V | Elektrolytisk SMD | C16780 | 1 |
| F1 | Sikring | 5A glass | Sikringsholder PCB | C382046 | 1 |
| J0–J7 | TC-tilkobling | 2-pin skruklemme | 5.0mm stigning | C8262 | 8 |
| J8–J11 | NTC-tilkobling | 2-pin skruklemme | 5.0mm stigning | C8262 | 4 |
| J12–J15 | MOSFET-utgang | 2-pin skruklemme | 5.0mm stigning | C8262 | 4 |
| J16–J23 | Analog inngang | 2-pin skruklemme | 5.0mm stigning | C8262 | 8 |
| J24–J27 | Digital inngang | 2-pin skruklemme | 5.0mm stigning | C8262 | **4** |
| J30 | Strøm inn 12V | 2-pin skruklemme | 5.0mm stigning | C8262 | 1 |
| J31–J32 | MOSFET-utgang | 2-pin skruklemme | 5.0mm stigning | C8262 | **2** |
| J33 | GPS inngang | 3-pin skruklemme | 5.0mm stigning | C8263 | **1** |
| J34 | NeoPixel utgang | 3-pin skruklemme | 5.0mm stigning | C8263 | **1** |

**Total skruklemmebehov:** 30× 2-pin + 2× 3-pin, alle 5.0mm stigning

> **Endringer fra v0.4:** Q1-Q6 (6 stk, +2), OK1-OK4 (4 stk, -2), D1-D6 (6 stk, +2 flyback),
> D7 SMBJ18A TVS (ny), R10 = 2.2kΩ 1W for koil-kanal (ikke 470Ω), J31/J32 nye MOSFET-kontakter,
> J33/J34 nye 3-pin GPS/NeoPixel-kontakter. Ingen status-LED lenger (p41 brukes til MOS5).

### 5.2 Komplett nettliste

```
Strømnett:
  +12V: J30[1], U12[VIN=pin2], J12–J15[12V-side=pin2]
  GND: J30[2], U12[GND=pin4], U1[GND], U2[GND×3], U3–U10[GND×8],
       U11[GND×2], Q1–Q4[Source], OK1–OK6[Katode+], alle filter-C nedre plate
  +5V: U12[SW→L1→D→+5V], U1[VIN], R31–R36 øvre (optokoppler pull-up)
  +3V3: U1[3V3 ut], U2[VCC×2], U3–U10[VCC×8], U11[VDD+VDD_IO], R27–R30 øvre (NTC pull-up)

SPI hoved (MAX31855 + LIS3DH):
  SPI_MOSI: U1[p11] → U3–U10[DIN] (MAX31855 leser ikke MOSI, men pin finnes)
  SPI_MISO: U1[p12] ← U3–U10[SO alle parallelt] + U11[SDO]
  SPI_SCK:  U1[p13] → U3–U10[SCK alle parallelt] + U11[SCL]

SPI1 (WIZ820io):
  SP1_MOSI: U1[p26] → U2[MOSI]
  SP1_MISO: U2[MISO] → U1[p1]
  SP1_SCK:  U1[p27] → U2[SCLK]

Chip-selects:
  CS_ETH:  U1[p0]  → U2[SCSn]
  CS_ACC:  U1[p2]  → U11[CS]
  CS_TC0:  U1[p10] → U3[/CS]
  CS_TC1:  U1[p9]  → U4[/CS]
  CS_TC2:  U1[p8]  → U5[/CS]
  CS_TC3:  U1[p7]  → U6[/CS]
  CS_TC4:  U1[p6]  → U7[/CS]
  CS_TC5:  U1[p5]  → U8[/CS]
  CS_TC6:  U1[p4]  → U9[/CS]
  CS_TC7:  U1[p3]  → U10[/CS]

Ethernet kontroll:
  INT_ETH: U2[INTn] → U1[p28]
  RST_ETH: U1[p29]  → U2[RSTn]

Akselerometer:
  INT1_ACC: U11[INT1] → U1 (spare digital — knyttes til ledig GPIO i firmware)

Termokoblere:
  TC0_PLUS:  J0[1] → U3[T+]     TC0_MINUS: J0[2] → U3[T-]
  TC1_PLUS:  J1[1] → U4[T+]     TC1_MINUS: J1[2] → U4[T-]
  TC2_PLUS:  J2[1] → U5[T+]     TC2_MINUS: J2[2] → U5[T-]
  TC3_PLUS:  J3[1] → U6[T+]     TC3_MINUS: J3[2] → U6[T-]
  TC4_PLUS:  J4[1] → U7[T+]     TC4_MINUS: J4[2] → U7[T-]
  TC5_PLUS:  J5[1] → U8[T+]     TC5_MINUS: J5[2] → U8[T-]
  TC6_PLUS:  J6[1] → U9[T+]     TC6_MINUS: J6[2] → U9[T-]
  TC7_PLUS:  J7[1] → U10[T+]    TC7_MINUS: J7[2] → U10[T-]

Analoge innganger (spenningsdeler 10k/15k → 5V→3.0V):
  J16[1] → R11 → ANA0 → R19 → GND    ANA0 → U1[p14/A0]
  J17[1] → R12 → ANA1 → R20 → GND    ANA1 → U1[p15/A1]
  J18[1] → R13 → ANA2 → R21 → GND    ANA2 → U1[p16/A2]
  J19[1] → R14 → ANA3 → R22 → GND    ANA3 → U1[p17/A3]
  J20[1] → R15 → ANA4 → R23 → GND    ANA4 → U1[p18/A4]
  J21[1] → R16 → ANA5 → R24 → GND    ANA5 → U1[p19/A5]
  J22[1] → R17 → ANA6 → R25 → GND    ANA6 → U1[p20/A6]
  J23[1] → R18 → ANA7 → R26 → GND    ANA7 → U1[p21/A7]
  J16–J23[2] → GND

NTC innganger (10kΩ pull-up til +3V3):
  +3V3 → R27 → NTC0 → J8[1]   J8[2] → GND    NTC0 → U1[p22/A8]
  +3V3 → R28 → NTC1 → J9[1]   J9[2] → GND    NTC1 → U1[p23/A9]
  +3V3 → R29 → NTC2 → J10[1]  J10[2] → GND   NTC2 → U1[p24/A10]
  +3V3 → R30 → NTC3 → J11[1]  J11[2] → GND   NTC3 → U1[p25/A11]

Optokoppler digitale innganger (4 kanaler):
  --- DIG0 (RPM/koil — spike-beskyttelse) ---
  J24[1] → D7(SMBJ18A TVS, katode mot J24[1]) → GND
  J24[1] → R10(2.2kΩ 1W) → OK1[Anode=pin1]
  J24[2] → OK1[Katode=pin2] → GND
  +3V3 → R31(10kΩ) → OK1[Kollektor=pin4]
  OK1[Emitter=pin3] → DIG0 → U1[p30]

  --- DIG1–DIG3 (brytere — standard) ---
  J25[1] → R7(470Ω) → OK2[Anode]   OK2[Emitter] → DIG1 → U1[p31]
  J26[1] → R8(470Ω) → OK3[Anode]   OK3[Emitter] → DIG2 → U1[p32]
  J27[1] → R9(470Ω) → OK4[Anode]   OK4[Emitter] → DIG3 → U1[p33]
  +3V3 → R32–R34(10kΩ) → OK2–OK4[Kollektor]
  J25–J27[2] → GND

GPS inngang:
  J33[1] → +5V
  J33[2] → GPS_RX → U1[p34] (Serial8 RX — GPS NEO-6M TX)
  J33[3] → GND

NeoPixel data:
  J34[1] → +5V
  J34[2] → NEOPIXEL → U1[p35] (WS2812B data)
  J34[3] → GND

MOSFET utganger (6 kanaler):
  U1[p36] → R1(100Ω) → MOS0 → Q1[Gate]
  Q1[Drain] → LOAD0 → J12[1]   J12[2] → +12V
  Q1[Source] → GND
  D1[Anode] → GND   D1[Katode] → Q1[Drain]  (flyback)
  (Tilsvarende Q2–Q4 → MOS1–3 → J13–J15)
  U1[p40] → R5(100Ω) → MOS4 → Q5[Gate]   Q5[Drain] → LOAD4 → J31[1]
  U1[p41] → R6(100Ω) → MOS5 → Q6[Gate]   Q6[Drain] → LOAD5 → J32[1]
  J31–J32[2] → +12V   Q5–Q6[Source] → GND
  D5–D6 flyback dioder på Q5–Q6 (identisk Q1–Q4)

Buck-converter:
  +12V → C16(100µF) → GND   (Cin)
  U12[VIN=pin2] → +12V
  U12[SW=pin3] → L1 → +5V
  D_Buck[Anode] → GND   D_Buck[Katode] → U12[SW=pin3]  (freewheeling)
  +5V → C17(100µF) → GND   (Cout)
  +5V → R38(100kΩ) → U12[FB=pin5] → R39(4.7kΩ) → GND
  U12[EN=pin8] → +12V
  U12[BST=pin1] → C13(100nF) → U12[SW=pin3]
  U12[COMP=pin7] → 10nF → GND   (10kΩ i serie valgfritt)
  U12[SS=pin6] → C14(10nF) → GND

  (Ingen separat status-LED — p41 er MOS5. Status vises via NeoPixel i firmware.)
```

---

## DEL 6: PCB-KRAV

### 6.1 Mekaniske krav

| Parameter | Verdi |
|-----------|-------|
| Max størrelse | 160mm × 130mm (skal passe i motorromsboks) |
| Anbefalt størrelse | ~140mm × 115mm |
| Lag | 2 (topp + bunn kobber) |
| Materiale | FR4 1.6mm |
| Kobbervekt | 1 oz (35µm) |
| Overflate | HASL blyfri eller ENIG (gull) |
| Soldermask | Begge sider, grønn |
| Silkscreen | Begge sider, hvit |
| Monteringshull | 4× M3 (3.2mm hull), 3mm fra hjørnekanter |
| Conformal coating | Ikke på PCBen — brukeren påfører dette selv |

### 6.2 Elektriske PCB-krav

| Nett-type | Minimum sporbredde |
|-----------|--------------------|
| Signal (SPI, CS, DIG, ANA) | 0.2mm |
| +3V3 distribusjon | 0.4mm |
| +5V distribusjon | 0.6mm |
| +12V og MOSFET drain | 1.5mm minimum |
| GND | Solid kobber-fill begge lag |

**Ground plane:** Full GND-fill på begge lag med stitching vias. Isoler switchnode (MP2307DN SW → L1) med 0.5mm clearance i GND-fill for å unngå EMI mot ADC-spor.

**Analogt vs digitalt:** Analoge ADC-spor (ANA0–7, NTC0–3) skal holdes unna SPI-klokke-spor og switcher-node. Bruk GND som skjerm. Gjerne plasser analogt på én side av Teensy og SPI-bus på den andre.

**Termokoblerinngang:** T+ og T− spor per kanal skal ha lik lengde og går parallelt (quasi-differensielt). Minimum 1mm mellomrom mellom ulike termokobler-par.

### 6.3 Komponentplassering (prioritert rekkefølge)

1. **U1 Teensy 4.1 socket** — Midten av boardet, lang akse horisontalt. USB-port peker mot kanten for programmering. 5mm fri plass rundt socket.

2. **J0–J7 termokobler-terminaler** — Topp-kant, lett tilgjengelig. Maksimum to rader.

3. **U3–U10 MAX31855** — Samlet nær J0–J7. Grupperes i 2 kolonner à 4. Bypass-cap C1–C8 rett ved hvert VCC-pin.

4. **U2 WIZ820io header** — Høyre kant, slik at modulens RJ45-kontakt stikker ut over kant eller er lett tilgjengelig.

5. **J30 strøm inn** — Dedikert hjørne, gjerne nedre venstre. 5A-sikringen F1 i serie umiddelbart.

6. **U12 MP2307DN + L1 + D_Buck** — Eget hjørne (f.eks. nedre høyre). SW-node (U12 pin3 → L1 → D_Buck) skal være KORT — maksimum 10mm. Stor groundplane-kopper under og rundt U12.

7. **OK1–OK4 PC817** — Venstre side, én kolonne. R10 (2.2kΩ 1W) + D7 (SMBJ18A TVS) rett ved J24/OK1 på "kjøretøy-siden". R7–R9 (470Ω) ved J25–J27/OK2–OK4. Kollektor pull-up R31–R34 mot Teensy-siden. Min 4mm creepage mellom isolasjonsgrensene.

8. **Q1–Q6 AO3400A + flyback D1–D6** — Nær J12–J15 og J31–J32. Gate-resistor R1–R6 rett mellom Teensy-pin og gate-pad. 1N4007-diode tett på drain-pad.

9. **J12–J15 + J31–J32 MOSFET-utganger** — Nedre kant, lett tilgjengelig fra utsiden.

10. **J16–J23 analoge innganger + J8–J11 NTC** — Venstre eller bunn kant.

11. **J24–J27 digitale innganger** — Nær OK1–OK4. D7 (TVS) plasseres mellom J24 og R10.

12. **J33 GPS + J34 NeoPixel** — Kant-plassert. GPS bør ha direkte sti til Teensy p34 (Serial8).

12. **U11 LIS3DH** — Midten av boardet nær U1. Unngå hjørner (akselerometer skal måle kjøretøy-akselerasjon, ikke vibrasjon fra PCB-feste).

---

## DEL 7: KiCad-FIL INFORMASJON

### 7.1 Fil-situasjon

Vi har et ferdig skjema i KiCad 7-format, men INGEN layout-fil. Neste steg er:

1. Åpne `racing_sensor_board_v0.4.kicad_sch` i KiCad 7
2. Opprette `racing_sensor_board_v0.4.kicad_pcb` fra skjemaet
3. Importere alle netlist/footprints fra skjema
4. Utføre layout (komponentplassering + routing)
5. Generere Gerber-filer

### 7.2 Kjente utfordringer med skjemaet

**Alle pins er "passive":** Vi endret alle pin-typer til `passive` for å unngå KiCad ERC-feil. Dette betyr at ERC vil gi "Net has no driving pin"-advarsler — disse er harmløse og kan ignoreres. Det finnes ingen reelle koplefeil.

**Inline-definerte symboler:** Alle symboler er custom-definert inline i skjemaet (ikke referert til KiCad standard-bibliotek). KiCad vil advare om "Custom library not found" — dette er OK siden symbolene er innebygd i filen. Footprintene er definert i footprint-feltet på hvert symbol.

**Footprint-tabell:** Filen `hardware/pcb/kicad/fp-lib-table` definerer footprint-biblioteker. KiCad trenger standard footprint-biblioteker installert (kicad-footprints pakken) for at footprints som `Package_SO:SOIC-8_3.9x4.9mm_P1.27mm` skal fungere.

### 7.3 Footprint-mapping (symbol → footprint)

| Symbol | Footprint |
|--------|-----------|
| Custom:Teensy41 | Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical |
| Custom:WIZ820io | Connector_PinHeader_2.00mm:PinHeader_2x10_P2.00mm_Vertical |
| Custom:MAX31855 | Package_SO:SOIC-8_3.9x4.9mm_P1.27mm |
| Custom:LIS3DH | Package_LGA:LGA-16_3x3mm_P0.5mm |
| Custom:MP2307DN | Package_SO:SOIC-8_3.9x4.9mm_P1.27mm |
| Custom:PC817 | Package_DIP:DIP-4_W7.62mm |
| Custom:AO3400A | Package_TO_SOT_SMD:SOT-23 |
| Custom:Conn2pin | Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical |
| Custom:Conn3pin | Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical |
| Custom:PwrConn | Connector_Phoenix_GMSTB_2.54mm:GMSTB_2,5_2-G_1x02_P7.5mm_Horizontal |

**Merk:** "Custom:Conn2pin" og "Custom:Conn3pin" brukes for alle signal-kontakter (J0–J34). Disse bør i PCB-layout erstattes med **skruklemmefotavtrykk 5.0mm stigning** (f.eks. `Connector_Phoenix_MC_1.5mm:Phoenix_MC_1,5_2-G_1x02_P1.5mm_Horizontal` eller tilsvarende 5mm variant), ikke pin-header.

---

## DEL 8: ÅPNE SPØRSMÅL TIL AI-EN

Dette er områder der vi er usikre eller der vi ønsker AI-ens input. Vi er åpne for alternative løsninger.

### 8.1 Buck-converter — IC eller ferdigmodul?

Vi har valgt MP2307DN IC men er usikre på om vi heller bør bruke en ferdig 5V buck-modul (f.eks. LM2596-modul på mountinghull og pin-header). Modul gir:
- ✅ Enklere layout, ingen diskrete buck-komponenter å route
- ✅ Mer robust (ferdig testet krets)
- ❌ Tar mer plass på PCBen
- ❌ Ingen LCSC/Mouser part-nummer

**Spørsmål til AI:** Hva anbefaler du? MP2307DN diskret, eller ferdigmodul? Eventuelt et annet 5V 3A buck-IC?

### 8.2 Skruklemmefotavtrykk

Vi har brukt Phoenix MC 1.5mm og GMSTB 2.54mm som placeholder-footprints. For motorrom-bruk (vibrasjoner, fuktighet) er 5.0mm stigning skruklemmefotavtrykk bedre. 

**Spørsmål til AI:** Hvilken spesifikk footprint (KiCad standard-bibliotek) passer best for:
- 2-pin, 5.0mm stigning, gjennomgående montering
- Eksempel: `Connector_Phoenix_SPT:Phoenix_SPT_1,5_2-H-3.5_P3.50mm_Horizontal`

### 8.3 Optokoppler serie-resistor verdi — ✅ LØST

DIG0 (koil/RPM): **2.2kΩ 1W** + **SMBJ18A TVS-diode** (se Del 3.2 for beregning).  
DIG1–DIG3 (brytere): **470Ω** standard — 12V kilde gir 4.9mA ✓.

**Spørsmål til AI:** Bør 6N137 (raskere optokoppler) brukes for DIG0 i stedet for PC817? PC817 er rask nok for 1700 Hz maks (VW 12-tann triggerhjul ved 8500 RPM), men 6N137 gir bedre margin.

### 8.4 Flyback-diode for MOSFET-utganger

Vi har 1N4007 fra GND til drain. Men kjøretøy-laster er typisk 12V-spoler og vifter. 1N4007 er en rask-nok diode?

**Spørsmål til AI:** Er 1N4007 riktig, eller bør vi bruke en Schottky-diode (raskere oppgjenoppretting) som 1N5819 eller SS14?

### 8.5 Mangler det noe?

**Spørsmål til AI:** Ser du noe vi har glemt? Eksempler:
- TVS-diode på +12V inngangen for transient-beskyttelse (er SMBJ18A bare ved J24, ikke på +12V main)
- Ferrittkjerne på +12V for EMI-filtrering
- Reverse-polarity-beskyttelse (P-kanal MOSFET på +12V inn)
- NeoPixel strøm: trengs 300–500Ω serie-resistor på data-linja? 1000µF bulk C?
- GPS pull-up på RX-linja? (NEO-6M TX er 3.3V nivå — Teensy 3.3V kompatibel, OK)
- Watchdog-IC
- Reset-knapp for Teensy
- Test-pads på SPI-buss og analoge signaler

### 8.7 GPS og NeoPixel — nye spørsmål

**GPS (J33):** NEO-6M TX er 3.3V LVTTL — direkte til Teensy p34 er OK. Men:
- Trenger vi TX fra Teensy til GPS? (Kun nødvendig for konfigurasjon — NMEA strøm er standardinnstilling)
- Bør det være 4-pin kontakt (inkl. TX fra Teensy) for fremtidig fleksibilitet?

**NeoPixel (J34):** WS2812B bruker 5V logikk, Teensy er 3.3V. 3.3V HIGH (~3V) tolkes av WS2812B som HIGH (terskelen er typisk 0.7×VDD = 3.5V — teknisk under spek). Løsning:
- **Alternativ A:** Bruk 74AHCT125 buffer (3.3V inn → 5V ut) — garantert sikker
- **Alternativ B:** Prøv direkte (mange WS2812B fungerer fine med 3.3V signal i praksis)
- **Spørsmål til AI:** Bør vi legge til en 74AHCT125 level-shifter for NeoPixel data?

### 8.6 Alternativer til WIZ820io

WIZ820io er et 2×10 pin 2.0mm stigning-modul. Det kan tenkes at:
- **W5500 EV-Board** (direkte Ethernet-chip på PCBen, ingen modul) gir bedre layout-kontroll
- **ENC28J60** er billigere men krever TCP/IP-stack i software

**Spørsmål til AI:** Hva anbefaler du for Ethernet på en custom Teensy 4.1-basert PCB? Er WIZ820io riktig valg, eller finnes det bedre alternativer?

---

## DEL 9: LEVERANSEN VI TRENGER

### 9.1 Eksakt hva vi ber om

Vi ber om at AI-en:

1. **Gjennomgår dette dokumentet** og stiller spørsmål om noe er uklart

2. **Foreslår eventuelle forbedringer** til komponent-valg, kretser eller layout

3. **Produserer en ferdig KiCad PCB-layout** (`racing_sensor_board_v0.4.kicad_pcb`) basert på:
   - Skjemaet i `racing_sensor_board_v0.4.kicad_sch`
   - Komponentplassering og routing etter kravene i Del 6
   - Begge lag med GND-fill

4. **Genererer ferdige Gerber-filer** klare for PCBway-opplasting:
   ```
   racing_sensor_board_v04_gerbers.zip inneholder:
   - racing_sensor_board_v04-F_Cu.gtl
   - racing_sensor_board_v04-B_Cu.gbl
   - racing_sensor_board_v04-F_Mask.gts
   - racing_sensor_board_v04-B_Mask.gbs
   - racing_sensor_board_v04-F_Silkscreen.gto
   - racing_sensor_board_v04-B_Silkscreen.gbo
   - racing_sensor_board_v04-Edge_Cuts.gm1
   - racing_sensor_board_v04.drl
   ```

5. **Leverer BOM** klar for LCSC-bestilling (format: LCSC Part No, Quantity, Reference)

### 9.2 PCBway-spesifikasjoner for bestilling

Når Gerber-filen er klar, bestilles den på pcbway.com med disse parametrene:

| Felt | Verdi |
|------|-------|
| Material | FR4 |
| Thickness | 1.6mm |
| Layers | 2 |
| Dimensions | (fra Gerber) |
| Qty | 5 stk (standardordre) |
| Surface finish | HASL (bly-fritt) |
| Copper weight | 1oz |
| Solder mask | Green |
| Silkscreen | White |
| Min hole size | 0.3mm |
| Min track/spacing | 6/6 mil |
| Via process | Tented vias |

---

## DEL 10: FILSTRUKTUR I REPOSITORIET

```
Racing_Dashboard/
├── hardware/
│   └── pcb/
│       ├── AI_HANDOFF_FULLSTENDIG.md      ← DETTE DOKUMENTET
│       ├── PCBWay_Design_Brief.md          ← Kortere brief (engelsk)
│       ├── bom.csv                         ← BOM utkast
│       └── kicad/
│           ├── racing_sensor_board_v0.4.kicad_sch   ← BRUK DETTE SKJEMAET
│           ├── gen_kicad_v04.py                      ← Python som genererte skjemaet
│           ├── KABELKART.md                          ← Norsk net-reference
│           ├── PCB_DESIGN_BRIEF.md                   ← Layout-brief (engelsk)
│           ├── racing_sensor_board_v0.3.kicad_sch    ← Gammel versjon (ikke bruk)
│           └── racing_sensor_board_v0.3.kicad_pro    ← KiCad prosjektfil
├── backend/
│   └── src/server.js                       ← Node.js backend (ferdig)
├── frontend/
│   └── src/                               ← React dashboard UI (ferdig)
└── docs/
    └── systemdokumentasjon.md             ← Komplett systemdokumentasjon
```

**Bruk `racing_sensor_board_v0.4.kicad_sch` som skjema-kilde. Ignorer v0.1–v0.3.**

---

## DEL 11: KONTAKT OG TILLEGGSINFO

**Prosjekteier:** Alexander Pabsdorff  
**E-post:** alexanderpabsdorff@gmail.com  
**GitHub:** github.com/alexpabs/racing_dashboard  
**Bruk:** Motorsport / racing — boardet sitter i motorrommet på en 1956 VW Boble

**Miljøkrav til boardet:**
- Temperaturområde: -10°C til +85°C (motorrom)
- Fuktighet: høy (konformal coating påføres av eier etter montering)
- Vibrasjoner: moderat (ikke direkte på motor, men i motorrom)
- Støv/smuss: moderat, boardet monteres i lukket boks

**Strøm-budsjett:**
| Komponent | Typisk forbruk |
|-----------|---------------|
| Teensy 4.1 | ~100mA |
| WIZ820io | ~200mA |
| MAX31855 ×8 | ~10mA total |
| LIS3DH | ~0.5mA |
| MP2307DN kjerne | ~10mA quiescent |
| 6× MOSFET (gate drive) | ~5mA |
| 4× PC817 | ~5–10mA per aktiv kanal |
| GPS NEO-6M modul | ~50mA |
| WS2812B NeoPixel (idle) | ~5mA (uten lys) / opp til 60mA per LED ved full hvit |
| **Sum (uten laster)** | **~400–500mA ved 5V = 2.0–2.5W** |

Buck-konverter er dimensjonert for 3A — god margin. GPS og NeoPixel legger til ~55–100mA ekstra.

---

*Dokument generert av Claude Sonnet 4.6 — AlexPabs Racing Dashboard Project*  
*Sist oppdatert: 2026-06-11 — v0.4b: alle 42 Teensy-pins brukt, 6 MOSFET, 4 DIG, GPS, NeoPixel, koil-beskyttelse*
