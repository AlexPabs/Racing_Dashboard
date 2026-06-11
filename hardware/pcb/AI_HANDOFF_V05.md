# Komplett AI-Handoff Dokument
## Universal Racing Sensor Board — 1956 VW Boble Race-Dashboard Prosjekt

**Til: Neste AI som tar over dette prosjektet**  
**Fra: AlexPabs Racing / Claude Sonnet 4.6**  
**Dato: 2026-06-11**  
**Revisjon: v0.5 — komplett redesign med automotive-robusthet**  
**Mål: Ferdig KiCad-layout → Gerber-filer til PCBway**

---

> **TIL AI-EN SOM LESER DETTE:** Dokumentet gir deg full kontekst om hva vi vil lage, alle beslutninger som er tatt, og eksakt hva vi trenger av deg. Alle komponentvalg i v0.5 er bestemt — det er KiCad PCB-layout vi trenger hjelp med. Du oppfordres til å peke på ting vi kan ha oversett i layout-fasen.

---

## DEL 1: PROSJEKTOVERSIKT

### 1.1 Bilen og bakgrunnen

Dette er et race dashboard-system for en **1956 Volkswagen Boble** med en luftkjølt **2387cc Type 1-motor** (86mm boring × 94mm slag, ca. 185–200 hk naturlig aspirert). Bilen kjøres på gata og i SCC Drag-stevner.

**Filosofi: Sleeper.** Ingenting skal synes utenfra. Dashboardet sitter på hengsler under det originale instrumentbordet og tippes ned av eieren — usynlig for tilskuere. All elektronikk er skjult.

**Systemet konkurrerer med:** Racepak IQ3 (~10 000 kr), AiM MXG 1.3 (~12 000 kr) — men bygges for ca. 4 500 kr med langt fler funksjoner, inkludert GPS-tidtaking, NeoPixel-underglow/shift-lights, Grafana-logging og web-dashboard på telefon.

### 1.2 Systemarkitektur

```
┌─────────────────────────────────────────────────────┐
│                    MOTORROM                          │
│  Alle sensorer → SENSOR BOARD (Teensy 4.1)          │
│  Teensy → WIZ850io Ethernet → CAT6-kabel            │
└──────────────────────┬──────────────────────────────┘
                       │ CAT6 Ethernet (UDP)
┌──────────────────────▼──────────────────────────────┐
│                    DASHBORD (RPi 5)                  │
│  UDP mottar sensordata → Node.js backend             │
│  React dashboard → 7" touchscreen + telefon WiFi     │
│  InfluxDB logging → Grafana analyse                  │
└─────────────────────────────────────────────────────┘
```

Sensor-PCBen er det vi nå designer. Alt software (firmware, backend, frontend) er ferdig.

---

## DEL 2: SENSOR BOARD — HVA VI TRENGER

### 2.1 Funksjonsoversikt v0.5

| Funksjon | Detalj | v0.5 vs v0.4 |
|----------|--------|---------------|
| 8× termokobler K-type | MAX31855KASA+ SPI per kanal — CHT, EGT, oljetemperatur | Uendret |
| 2× analog 0–5V inngang | ANA1, ANA2 — oljetrykk, drivstofftrykk, TPS, MAP, etc. | ↓ fra 8 |
| 4× NTC termistor | NTC1–4 — 10kΩ pull-up til 3.3V | Uendret |
| 1× RPM isolert digital | Via 6N137 rask optokoppler (fra tenningsspole) | **6N137** (var PC817) |
| 3× digital inngang | DIG1–DIG3 — RC-filter + Zener, ingen opto | **Direkte** (var PC817 opto) |
| 4× MOSFET utgang 12V | OUT1=vifte, OUT2=pumpe, OUT3=shift-light, OUT4=spare | ↓ fra 6 |
| GPS UART bidireksjonell | 4-pin — +3V3, GND, GPS_TX→Teensy_RX, Teensy_TX→GPS_RX | **4-pin bidi** (var 3-pin) |
| NeoPixel WS2812B | Via 74AHCT125D level-shifter 3.3V→5V → 3-pin kontakt | **Level-shifter** (var direkte) |
| 3-akse akselerometer | LIS3DH på I2C (Wire, p18/p19) — G-krefter | **I2C** (var SPI) |
| 100 Mbit Ethernet | WIZ850io (W5500) SPI1 — web-dashboard, UDP-telemetri | **WIZ850io** (var WIZ820io) |
| 12V→5V 3A buck | LMR33630-Q1 automotive buck | **LMR33630-Q1** (var MP2307DN) |
| Reversbeskyttelse | P-kanal MOSFET (AO3401A) på +12V inn | **Ny i v0.5** |
| Transientbeskyttelse | SMBJ18A TVS på VBAT_PROT rail | **Ny i v0.5** |
| Overstrømbeskyttelse | PTC resettbar sikring (~500mA) på 12V inn | **Ny i v0.5** |

### 2.2 Teensy 4.1

Teensy 4.1 er et ARM Cortex-M7 utviklingskort (600 MHz, IMXRT1062):
- 18 ADC-innganger, 3× SPI-busser, 8× UART, 3× I2C
- Innebygd SD-kortleser
- 40-pin DIP-format (2×24 pins, 2.54 mm) → monteres i socket på PCBen (IKKE loddet fast)
- 3.3V I/O, 5V VIN

**Kritisk punkt:** Teensy monteres i en 2×24-pin DIP-socket. Den kan tas ut og programmeres separat med USB.

---

## DEL 3: ALLE DESIGNBESLUTNINGER — v0.5 (ENDELIG)

### 3.1 Komponentvalg v0.5 — alle valg er avgjort

#### WIZ850io — Ethernet (↑ fra WIZ820io)
**Grunn:** W5500-brikke (WIZ850io) er nyeste Wiznet-chip med offisiell QNEthernet-støtte for Teensy 4.1. Samme 2×10 pin 2.0mm stigning-header som WIZ820io — plug-in-kompatibel. RJ45 er integrert på modulen, skal plasseres mot PCB-kanten.

#### MAX31855KASA+ — Termokobler ADC (uendret)
**Grunn:** Dedikert K-type SPI ADC, intern kald-junction kompensasjon, ±2°C nøyaktighet. 8 stk for 8 termokobler-kanaler.

#### LIS3DH — Akselerometer, nå **I2C** (↑ fra SPI)
**Grunn:** Frigjør p2 (CS_ACC) til expansion. I2C-modus: CS-pin → VDD_IO (høy = I2C aktiv), SDO/SA0 → GND (I2C-adresse 0x18). Kobles til Teensy Wire på p18 (SDA) og p19 (SCL).

#### LMR33630-Q1 — Buck 12V→5V 3A (↑ fra MP2307DN)
**Grunn:** Automotive-godkjent (AEC-Q100 Grade 1), bredere inngangsspenning 3.8–36V, lavere quiescent strøm, bedre termisk ytelse. SOIC-8 pakke — same-size replacement. Trenger ekstern spole, Cin, Cout og FB-deler (identisk topologi som MP2307DN).

#### 6N137 — RPM optokoppler (↑ fra PC817 på DIG0)
**Grunn:** Raskere CTR og slew rate enn PC817 — tåler opp til 10 Mbit/s. Viktigere: klarere signalkanter ved høye RPM. VW 12-tann triggerhjul ved 8500 RPM = 1700 Hz — begge holder, men 6N137 gir bedre margin. SOIC-8/DIP-8. Enable-pin (pin 7) kobles til VCC.

**DIG1–DIG3 (bremse, linelock, launch): INGEN optokoppler i v0.5.**  
Disse er interne bilbrytere (ikke utsatt for tenningsimpulser). Krets: `J_DIGx[1] → 10kΩ → Zener 3.3V (mot GND) || 100nF → DIG_SIG → 10kΩ pull-up til 3V3 → Teensy`.

#### AO3400A — N-kanal MOSFET, low-side (uendret)
**Grunn:** Logic-level (Vgs(th) ≈ 1.4V), fullt "on" ved 3.3V. 30V/5.7A. SOT-23.  
**Redusert til 4 utganger** i v0.5 (var 6). OUT1=vifte, OUT2=pumpe, OUT3=shift-light, OUT4=spare.

#### SS14 — Schottky flyback-diode (↑ fra 1N4007)
**Grunn:** 1N4007 er for treg for induktive automotive-laster (reléer, solenoider). SS14 (eller SS24/SS34 for tyngre laster): 1A/40V Schottky, rask gjenoppretting. En per MOSFET-utgang: katode → drain, anode → GND.

#### 74AHCT125D — Level-shifter for NeoPixel (ny)
**Grunn:** WS2812B krever 5V logikk (terskel 0.7×5V=3.5V). Teensy 3.3V HIGH er under terskel — upålitelig direkte. 74AHCT125D quad-buffer løser dette rent: 3.3V inn → 5V ut. Bruker kun buffer 1 (pin 1=OE1→GND, pin 2=1A=NEO_3V3, pin 3=1Y=NEO_5V). Buffer 2–4: OE → VCC (deaktivert). SOIC-14 pakke.

#### P-kanal MOSFET (AO3401A) — Reversbeskyttelse (ny)
**Grunn:** Beskytter mot feilpolaritet på 12V inn. Krets: Source → VBAT_FUSED (etter PTC), Gate → GND (via 10kΩ), Drain → VBAT_PROT (=+12V for downstream). Normalt: VGS=-12V → fullt "on". Feilpolaritet: VGS=+12V → "off", ingen strøm. SOT-23 pakke.

#### PTC resettbar sikring (ny)
**Grunn:** Tilbakestilbar overstrømbeskyttelse på VBAT_12V_IN-linjen. Typisk verdi: 1A/16V PTC (f.eks. MF-MSMF110/16). Første komponent etter J_PWR → PTC → PMOS → +12V.

#### SMBJ18A — TVS transientbeskyttelse (utvidet fra kun DIG0)
**Grunn:** I v0.4 var TVS bare ved DIG0 (koil). I v0.5 monteres TVS direkte på VBAT_PROT-skinnen (mellom +12V og GND) for å beskytte hele boardet mot tennings- og lasttransienter.

### 3.2 Pin-kart Teensy 4.1 — v0.5 (komplett)

```
Teensy 4.1 — Pin-kart v0.5
─────────────────────────────────────────────────────────────
VENSTRE SIDE (p0–p21):
  p0   CS_ETH      → WIZ850io SCSn             (SPI1)
  p1   SP1_MISO    ← WIZ850io MISO             (SPI1)
  p2   EXPN_P2     → J_EXP pin 1               (frigjort fra CS_ACC)
  p3   CS_TC7      → MAX31855 U10 /CS
  p4   CS_TC6      → MAX31855 U9  /CS
  p5   CS_TC5      → MAX31855 U8  /CS
  p6   CS_TC4      → MAX31855 U7  /CS
  p7   CS_TC3      → MAX31855 U6  /CS
  p8   CS_TC2      → MAX31855 U5  /CS
  p9   CS_TC1      → MAX31855 U4  /CS
  p10  CS_TC0      → MAX31855 U3  /CS
  p11  SPI_MOSI    → MAX31855 ×8             (SPI0)
  p12  SPI_MISO    ← MAX31855 ×8 SO parallelt (SPI0)
  p13  SPI_SCK     → MAX31855 ×8             (SPI0)
  p14  A0/ANA1     ← J_ANA1 via 10k/15k deler (0–5V → 3.0V)
  p15  A1/ANA2     ← J_ANA2 via 10k/15k deler
  p16  EXPN_P16    → J_EXP pin 2
  p17  EXPN_P17    → J_EXP pin 3
  p18  SDA         ↔ LIS3DH SDA (Wire I2C)
  p19  SCL         → LIS3DH SCL (Wire I2C)
  p20  EXPN_P20    → J_EXP pin 4
  p21  EXPN_P21    → J_EXP pin 5

HØYRE SIDE (VIN/GND/3V3 + p22–p41):
  VIN              ← +5V fra LMR33630-Q1 buck
  GND              → Jord
  3V3              → Teensy intern reg (~250mA maks)
  p22  A8/NTC1     ← J_NTC1 via 10kΩ pull-up til +3V3
  p23  A9/NTC2     ← J_NTC2 via pull-up
  p24  A10/NTC3    ← J_NTC3 via pull-up
  p25  A11/NTC4    ← J_NTC4 via pull-up
  p26  SP1_MOSI    → WIZ850io MOSI           (SPI1)
  p27  SP1_SCK     → WIZ850io SCLK           (SPI1)
  p28  INT_ETH     ← WIZ850io INTn
  p29  RST_ETH     → WIZ850io RSTn
  p30  RPM_IN      ← 6N137 VO output (via pull-up 10kΩ til 3V3)
  p31  DIG1        ← J_DIG1 via RC + Zener
  p32  DIG2        ← J_DIG2 via RC + Zener
  p33  DIG3        ← J_DIG3 via RC + Zener
  p34  GPS_RX      ← GPS TX (Serial8 RX, 9600 baud NMEA)
  p35  GPS_TX      → GPS RX (Serial8 TX — konfigurasjon/UBX)
  p36  NEO_3V3     → 74AHCT125D 1A-inn (buffer 1, 3.3V data)
  p37  MOS1        → 100Ω → Q1 gate (AO3400A kjølevifte)
  p38  MOS2        → 100Ω → Q2 gate (pumpe)
  p39  MOS3        → 100Ω → Q3 gate (shift-light)
  p40  MOS4        → 100Ω → Q4 gate (spare)
  p41  EXPN_P41    → J_EXP pin 6
─────────────────────────────────────────────────────────────

SPI-buss #0 (SPI0, primary):
  SCK=p13, MISO=p12, MOSI=p11 → MAX31855 ×8
  CS per chip: p10(TC0), p9(TC1), p8(TC2), p7(TC3), p6(TC4), p5(TC5), p4(TC6), p3(TC7)

SPI-buss #1 (SPI1, second bus):
  SCK=p27, MISO=p1, MOSI=p26 → WIZ850io
  CS=p0, INT=p28, RST=p29

I2C Wire (Wire0):
  SDA=p18, SCL=p19 → LIS3DH (adresse 0x18)
  Bruk 4.7kΩ pull-up til +3V3 på SDA og SCL

UART Serial8:
  RX=p34 ← GPS TX (NMEA output)
  TX=p35 → GPS RX (for konfigurasjon)

Expansion header J_EXP (6-pin):
  Pin1=EXPN_P2, Pin2=EXPN_P16, Pin3=EXPN_P17
  Pin4=EXPN_P20, Pin5=EXPN_P21, Pin6=EXPN_P41
```

---

## DEL 4: FULLSTENDIG KRETSDIAGRAM — NØKKELKRETSER

### 4.1 Strømbane (kritisk for layout)

```
J_PWR[+12V] ─→ PTC (1A) ─→ VBAT_FUSED ─→ PMOS(S→D) ─→ VBAT_PROT (+12V)
                                              │
                                           Gate ─→ 10kΩ ─→ GND
                                              (P-ch: gate=GND → fullt ON)

VBAT_PROT (+12V):
  → SMBJ18A TVS katode (anode → GND) — transientbeskyttelse hele board
  → LMR33630-Q1 VIN (pins 2+3)
  → AO3400A drain side (via MOSFET-utganger)
  → SS14 katode (flyback, per MOSFET-kanal)

LMR33630-Q1 (SOIC-8):
  Pin 1: BOOT → 100nF → SW (bootstrap kondensator)
  Pin 2+3: VIN → +12V (VBAT_PROT)
  Pin 4: EN → +12V (alltid aktivert)
  Pin 5: GND
  Pin 6: FB → R_upper til +5V + R_lower til GND
         Resistor-deler for 5V: Vout = 1.0V × (1 + R_upper/R_lower)
         Anbefalt: R_upper=100kΩ, R_lower=25kΩ → 5.0V
  Pin 7: NC
  Pin 8: SW → 10µH spole → +5V (output)
  D_BOOT: Schottky fra GND til SW (bootstrap diode)
  Cin: 10µF keramisk parallelt med 100µF elektrolytisk ved VIN
  Cout: 22µF keramisk parallelt med 100µF elektrolytisk ved +5V
```

### 4.2 RPM-krets (6N137)

```
J_RPM[1] (koil-signal) ──┬── SMBJ18A katode (anode → GND)  [TVS spike-klamp]
                          │
                         270Ω (1/4W)
                          │
                         Zener 5.1V (til GND)               [spenningsbegrenser]
                          │
                    6N137 Pin 2 (Anode LED+)
J_RPM[2] ──────── 6N137 Pin 3 (Katode LED-)  → GND
                  6N137 Pin 4 (GND/Vee)       → GND
                  6N137 Pin 6 (VCC)           → +3V3
                  6N137 Pin 7 (Enable)        → +3V3 (alltid enabled)
                  6N137 Pin 5 (VO, OC output) → 10kΩ pull-up → +3V3 → RPM_IN → Teensy p30
                  6N137 Pin 1, 8: NC
```

### 4.3 DIG1–DIG3 krets (direkte, ingen opto)

```
J_DIGx[1] ── 10kΩ ──┬── Zener 3.3V katode (anode → GND)
                     ├── 100nF → GND
                     └── 10kΩ pull-up til +3V3 ── DIG_SIG → Teensy p31/32/33
J_DIGx[2] → GND

[12V inngang klemmes til 3.3V av Zener. RC-filter fjerner støy.]
```

### 4.4 MOSFET-utgang med SS14 flyback

```
Teensy pX ── 100Ω ── Q_x Gate (AO3400A)
                     Q_x Drain ──┬── LOAD_x ── J_OUTx[1]
                                 └── SS14 Katode
                                     SS14 Anode ── +12V   [flyback til +12V, ikke GND]
             Q_x Source ── GND
J_OUTx[2] ── +12V
```

### 4.5 74AHCT125D NeoPixel level-shifter

```
+5V ── Pin 14 (VCC)
GND ── Pin 7  (GND)
GND ── Pin 1  (~OE1, active low → enabled)
NEO_3V3 (Teensy p36) ── Pin 2 (1A, input 3.3V)
Pin 3 (1Y, output 5V) ── NEO_5V ── J_NEO[2] (data til WS2812B)

+5V ── Pin 4  (~OE2, deaktivert)  Pins 5,6: NC
+5V ── Pin 10 (~OE3, deaktivert)  Pins 9,8: NC
+5V ── Pin 13 (~OE4, deaktivert)  Pins 12,11: NC

J_NEO[1] ── +5V
J_NEO[3] ── GND
```

### 4.6 GPS 4-pin kontakt

```
J_GPS[1] ── +3V3           (GPS VCC)
J_GPS[2] ── GND
J_GPS[3] ── GPS_RX_NET ── Teensy p34 (Serial8 RX ← GPS TX/NMEA ut)
J_GPS[4] ── GPS_TX_NET ── Teensy p35 (Serial8 TX → GPS RX/konfigurasjon inn)
```

### 4.7 LIS3DH I2C-modus

```
LIS3DH:
  Pin 11 (VDD_IO) → +3V3
  Pin 6, 14 (GND) → GND
  Pin 4 (~CS)     → +3V3    [CS=HIGH → I2C mode, ikke SPI]
  Pin 3 (SCL)     → I2C_SCL → Teensy p19  (+ 4.7kΩ pull-up til 3V3)
  Pin 2 (SDA)     → I2C_SDA → Teensy p18  (+ 4.7kΩ pull-up til 3V3)
  Pin 16 (VDD)    → +3V3
  Pin 1 (SDO/SA0) → GND    [I2C addr = 0x18; SDO=VDD → 0x19]
  Pin 7 (INT1)    → INT1_ACC (kan kobles til Teensy GPIO eller NC)
  Pin 8 (INT2)    → NC
  Pin 5, 15 (RES) → NC
```

### 4.8 Analog og NTC innganger

```
Analog 0–5V → 3.0V spenningsdeler:
  J_ANAx[1] ── 10kΩ ── ANA_x ── 15kΩ ── GND     [5V → 3.0V = 5 × 15/25]
  ANA_x → Teensy p14 (ANA1) eller p15 (ANA2)
  J_ANAx[2] → GND
  ADD: 100nF keramisk til GND ved ANA-noden (støyfilter)

NTC 10kΩ thermistor:
  +3V3 ── 10kΩ ── NTC_x ── J_NTCx[1]   J_NTCx[2] → GND
  NTC_x → Teensy p22(NTC1), p23(NTC2), p24(NTC3), p25(NTC4)
```

---

## DEL 5: KOMPLETT BOM v0.5

| Ref | Komponent | Del/Verdi | Pakke | LCSC | Ant |
|-----|-----------|-----------|-------|------|-----|
| U1 | Teensy 4.1 | Teensy 4.1 | 2×24 DIP socket | pjrc.com | 1 |
| U2 | WIZ850io | WIZ850io | 2×10 header 2.0mm | wiznet.io | 1 |
| U3–U10 | MAX31855KASA+ | MAX31855KASA+ | SOIC-8 | C67561 | 8 |
| U11 | LIS3DH | LIS3DH | LGA-16 3×3mm | C91122 | 1 |
| U12 | LMR33630Q1 | LMR33630ADDAR | SOIC-8 | C2682 | 1 |
| U13 | 74AHCT125D | 74AHCT125D-Q100 | SOIC-14 | C6636 | 1 |
| Q1–Q4 | AO3400A (N-ch) | AO3400A | SOT-23 | C20917 | 4 |
| Q_PMOS | AO3401A (P-ch) | AO3401A | SOT-23 | C15288 | 1 |
| OK1 | 6N137 | 6N137S | DIP-8 / SOIC-8 | C6455 | 1 |
| D1–D4 | SS14 Schottky | SS14 40V/1A | SMA (DO-214AC) | C2480 | 4 |
| D_TVS | SMBJ18A | TVS 18V 600W | SMB (DO-214AA) | C17014 | 1 |
| D_RPM | Zener 5.1V | BZX84C5V1 | SOT-23 / 0805 | C75492 | 1 |
| D_DIG1-3 | Zener 3.3V ×3 | BZX84C3V3 | SOT-23 / 0805 | C80040 | 3 |
| F1 | PTC sikring | MF-MSMF110/16 1A | 1812 | C404207 | 1 |
| L1 | Spole | 10µH 3A | SMD 6.8×6.8mm | C31397 | 1 |
| R1–R4 | Gate-resistor | 100Ω | 0805 | C25116 | 4 |
| R_PMOS_G | PMOS gate pull-down | 10kΩ | 0805 | C25744 | 1 |
| R_EN6N | 6N137 serie (RPM) | 270Ω | 0805 | C25297 | 1 |
| R_6N_PU | 6N137 output pull-up | 10kΩ | 0805 | C25744 | 1 |
| R_DIG1–3_S | DIG1-3 serie 10kΩ ×3 | 10kΩ | 0805 | C25744 | 3 |
| R_DIG1–3_PU | DIG1-3 pull-up 10kΩ ×3 | 10kΩ | 0805 | C25744 | 3 |
| R_ANA_U1–2 | Analog øvre deler 10kΩ ×2 | 10kΩ | 0805 | C25744 | 2 |
| R_ANA_L1–2 | Analog nedre deler 15kΩ ×2 | 15kΩ | 0805 | C25885 | 2 |
| R_NTC1–4 | NTC pull-up 10kΩ ×4 | 10kΩ | 0805 | C25744 | 4 |
| R_I2C_SDA | I2C SDA pull-up 4.7kΩ | 4.7kΩ | 0805 | C25905 | 1 |
| R_I2C_SCL | I2C SCL pull-up 4.7kΩ | 4.7kΩ | 0805 | C25905 | 1 |
| R_FB_U | LMR33630 FB øvre 100kΩ | 100kΩ | 0805 | C25867 | 1 |
| R_FB_L | LMR33630 FB nedre 25kΩ | 25kΩ | 0805 | — | 1 |
| C_MAX1–8 | MAX31855 bypass ×8 | 100nF | 0402 | C1525 | 8 |
| C_LIS | LIS3DH bypass | 100nF | 0402 | C1525 | 1 |
| C_WIZ1–2 | WIZ850io bypass | 10µF 16V | 0805 | C15850 | 2 |
| C_TEE | Teensy VIN bypass | 10µF 16V | 0805 | C15850 | 1 |
| C_BOOT | LMR33630 BOOT | 100nF | 0402 | C1525 | 1 |
| C_IN1 | Buck Cin keramisk | 10µF 25V | 0805 | — | 1 |
| C_IN2 | Buck Cin elektrolytisk | 100µF 25V | SMD elek | C16780 | 1 |
| C_OUT1 | Buck Cout keramisk | 22µF 10V | 0805 | — | 1 |
| C_OUT2 | Buck Cout elektrolytisk | 100µF 16V | SMD elek | C16780 | 1 |
| C_DIG1–3 | DIG RC-filter ×3 | 100nF | 0402 | C1525 | 3 |
| C_ANA1–2 | Analog støyfilter ×2 | 100nF | 0402 | C1525 | 2 |
| J_TC1–8 | TC-tilkobling ×8 | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 8 |
| J_NTC1–4 | NTC-tilkobling ×4 | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 4 |
| J_ANA1–2 | Analog inngang ×2 | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 2 |
| J_DIG1–3 | Digital inngang ×3 | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 3 |
| J_RPM | RPM inngang | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 1 |
| J_OUT1–4 | MOSFET-utgang ×4 | 2-pin 5.08mm skrukloss | Phoenix PT-1.5/2-3.5mm | C8262 | 4 |
| J_PWR | Strøm inn 12V | 2-pin 5.08mm skrukloss | Phoenix MKDS-1.5/2-5.08 | C8263 | 1 |
| J_GPS | GPS 4-pin | 4-pin 5.08mm skrukloss | Phoenix PT-1.5/4-3.5mm | — | 1 |
| J_NEO | NeoPixel utgang | 3-pin 5.08mm skrukloss | Phoenix PT-1.5/3-3.5mm | — | 1 |
| J_EXP | Expansion 6-pin | 6-pin 2.54mm pin-header | PinHeader 1×06 2.54mm | — | 1 |

**Totalt skruklemmebehov:** 28× 2-pin + 1× 3-pin + 1× 4-pin, alle 5.08mm stigning

---

## DEL 6: KiCad-SKJEMA vi har

### 6.1 Filer

```
hardware/pcb/kicad/
├── racing_sensor_board_v0.5.kicad_sch   ← BRUK DETTE (2853 linjer, v0.5)
├── gen_kicad_v05.py                      ← Python som genererte v0.5-skjemaet
├── racing_sensor_board_v0.4.kicad_sch   ← Gammel versjon (ikke bruk)
├── gen_kicad_v04.py                      ← Gammel generator (ikke bruk)
└── KABELKART.md                          ← Norsk net-reference
```

### 6.2 Om skjema-filen

- KiCad 7 S-expression format (`version 20230121`)
- Alle symboler er inline-definert i `lib_symbols`-blokken (ingen ekstern bibliotek)
- Alle koblinger via net-labels (ikke wires) — samme label = samme net
- Alle pins er `passive` type → ERC vil gi "no driving pin"-advarsler, men dette er harmløst
- Alle pins på 1.27mm (50-mil) grid — verifisert

### 6.3 Footprint-mapping

| Symbol | Footprint i skjema |
|--------|-------------------|
| Custom:Teensy41 | Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical |
| Custom:WIZ850io | Connector_PinHeader_2.00mm:PinHeader_2x10_P2.00mm_Vertical |
| Custom:MAX31855 | Package_SO:SOIC-8_3.9x4.9mm_P1.27mm |
| Custom:LIS3DH | Package_LGA:LGA-16_3x3mm_P0.5mm |
| Custom:LMR33630Q1 | Package_SO:SOIC-8_3.9x4.9mm_P1.27mm |
| Custom:6N137 | Package_DIP:DIP-8_W7.62mm |
| Custom:AO3400A | Package_TO_SOT_SMD:SOT-23 |
| Custom:PMOS | Package_TO_SOT_SMD:SOT-23 |
| Custom:74AHCT125D | Package_SO:SOIC-14_3.9x8.7mm_P1.27mm |
| Custom:Conn2pin | TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02 |
| Custom:Conn3pin | TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-3-3.5_1x03 |
| Custom:Conn4pin | TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-4-3.5_1x04 |
| Custom:Conn6pin | Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical |
| Custom:PwrConn | TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.08mm |
| Custom:PTC | Fuse:Fuse_1812_4532Metric |
| Custom:TVS | Diode_SMD:D_SMB |
| Custom:SS14 | Diode_SMD:D_SMA |

**MERK:** Skjemaet inneholder IKKE alle diskrete komponenter (motstander, kondensatorer, spole etc.) — de er beskrevet som tekst-noter i skjemaet og skal legges til i PCB-fasen som diskrete komponenter.

---

## DEL 7: PCB-KRAV

### 7.1 Mekaniske krav

| Parameter | Verdi |
|-----------|-------|
| Maks størrelse | 160mm × 130mm (motorromsboks) |
| Anbefalt størrelse | ~140mm × 115mm |
| Lag | 2 (topp + bunn kobber) |
| Materiale | FR4 1.6mm |
| Kobbervekt | 1 oz (35µm) |
| Overflate | HASL bly-fritt eller ENIG |
| Soldermask | Begge sider, grønn |
| Silkscreen | Begge sider, hvit |
| Monteringshull | 4× M3 (3.2mm hull), 3mm fra hjørnekanter |

### 7.2 Elektriske PCB-krav

| Nett-type | Min sporbredde |
|-----------|---------------|
| Signal (SPI, CS, I2C, DIG, ANA) | 0.2mm |
| +3V3 distribusjon | 0.4mm |
| +5V distribusjon | 0.6mm |
| +12V og MOSFET drain/source | 1.5mm minimum |
| GND | Solid kobber-fill begge lag + stitching vias |

### 7.3 Komponentplassering (prioritert)

1. **U1 Teensy 4.1 socket** — Sentrum av boardet, horisontal. USB-porten mot kanten. 5mm fri plass rundt.

2. **U2 WIZ850io** — Høyre kant slik at RJ45 stikker ut over kanten (RJ45 er integrert på WIZ850io-modulen).

3. **U3–U10 MAX31855** — Samlet øverst, nær termokobler-klemmer. Bypass-cap 100nF ved hvert VCC.

4. **J_TC1–J_TC8** — Topp-kant, lett tilgjengelig. To rader à 4.

5. **J_PWR + F1 + Q_PMOS + D_TVS** — Strøm-inn-hjørne. PTC og PMOS i serie på +12V-linjen. TVS fra +12V til GND. Viktig: PMOS SW-node holdes kort.

6. **U12 LMR33630-Q1 + L1 + Cin + Cout** — Eget hjørne (isolert fra analog-seksjon). SW-node (U12 pin8 → L1 → +5V) holdes under 10mm. Ground-plane under og rundt U12 for termisk avledning.

7. **OK1 6N137** — Venstre side. SMBJ18A + 270Ω ved J_RPM på "kjøretøy-siden" av optokobblingen. Minimum 4mm creepage mellom LED-siden og output-siden.

8. **Q1–Q4 + D1–D4 SS14** — Nær J_OUT1–4. Gate-resistorer mellom Teensy-pin og gate. SS14 tett på drain.

9. **U11 LIS3DH** — Sentrum av board (akselerometer skal ikke sitte i hjørne). Pull-up 4.7kΩ på SDA/SCL rett ved IC.

10. **U13 74AHCT125D** — Nær Teensy p36 og J_NEO.

11. **J_GPS** — Kant-plassert, korteste vei til Teensy p34/p35.

12. **J_EXP** — Intern, trenger ikke kanttilgang.

### 7.4 EMC og layout-notat

- **Switchnode isolasjon:** Tegn 0.5mm copper-clearance i GND-fill rundt SW-node (LMR33630-Q1 pin8 → L1 → D_BOOT katode). Hindrer switching-støy i ADC-spor.
- **Differensielt termokobler-spor:** T+ og T− per kanal skal ha lik lengde og gå parallelt. Min 1mm mellom ulike termokobler-par.
- **Analog vs digital:** ANA1–2, NTC1–4 skal holdes unna SPI-klokke og switcher. Bruk GND-plan som skjerm.
- **I2C:** SDA/SCL kan gå via samme via-par. 4.7kΩ pull-up plasseres nær LIS3DH.

---

## DEL 8: LEVERANSEN VI BER OM

### 8.1 Hva vi ber AI-en gjøre

1. **Gjennomgå** dette dokumentet og still spørsmål om noe er uklart.

2. **Legg til diskrete komponenter** (motstander, caps, spole) i KiCad-skjemaet basert på kretsene i Del 4. De finnes ikke i v0.5-skjema-filen ennå.

3. **Produser ferdig KiCad PCB-layout** (`racing_sensor_board_v0.5.kicad_pcb`):
   - Last inn footprints fra skjema
   - Plasser komponenter etter Del 7.3
   - Route alle nett med sporbredder etter Del 7.2
   - GND-fill begge lag med stitching vias

4. **Generer Gerber-filer** (`racing_sensor_board_v05_gerbers.zip`):
   - F_Cu, B_Cu (kobber topp/bunn)
   - F_Mask, B_Mask (soldermask)
   - F_Silkscreen, B_Silkscreen
   - Edge_Cuts (PCB-kontur)
   - Drill file (.drl / .excellon)

5. **Lever oppdatert BOM** i LCSC-format klar for bestilling.

### 8.2 PCBway-bestillingsparametere

| Felt | Verdi |
|------|-------|
| Material | FR4 |
| Thickness | 1.6mm |
| Layers | 2 |
| Qty | 5 stk |
| Surface finish | HASL (bly-fritt) |
| Copper weight | 1oz |
| Solder mask | Green |
| Silkscreen | White |
| Min hole size | 0.3mm |
| Min track/spacing | 6/6 mil |
| Via process | Tented vias |

---

## DEL 9: GJENSTÅENDE SPØRSMÅL

Alle store komponentvalg er avgjort i v0.5. Disse småspørsmål gjenstår:

1. **Test-pads:** Bør vi legge til test-pads på SPI-buss (SCK, MOSI, MISO), I2C (SDA/SCL) og +5V/+3V3 for debugging?

2. **Reset-knapp:** Ønsker vi en taktil reset-knapp for Teensy (kortslutter RST til GND) tilgjengelig på PCB-kanten?

3. **Status-LED:** Har vi en ledig GPIO for en enkel 3.3V status-LED? (EXPN_P2 kan brukes)

4. **NeoPixel serie-resistor:** 300–500Ω serie-resistor på NEO_5V-linjen mellom 74AHCT125D og J_NEO? (Beskytter mot ESD og ringning på lang ledning til LEDs)

5. **WIZ850io footprint:** Modulen bruker 2.0mm stigning (ikke 2.54mm). Bruk: `Connector_PinHeader_2.00mm:PinHeader_2x10_P2.00mm_Vertical`

6. **LMR33630 FB-verdier:** Velg presise R-verdier for nøyaktig 5.000V output. Beregn: R_upper=100kΩ → R_lower = 100kΩ/(5.0/1.0 - 1) = 25kΩ (bruk 24.9kΩ E96-serie).

---

## DEL 10: STRØM-BUDSJETT v0.5

| Komponent | Typisk forbruk (5V) |
|-----------|-------------------|
| Teensy 4.1 | ~100mA |
| WIZ850io | ~150mA (W5500 lavere forbruk enn W5200) |
| MAX31855 ×8 | ~10mA total |
| LIS3DH | ~0.5mA |
| 74AHCT125D | ~1mA |
| 6N137 + DIG-kretser | ~5mA |
| GPS NEO-8M modul | ~30–50mA |
| WS2812B NeoPixel (idle) | ~5mA; opptil 60mA/LED ved full hvit |
| **Sum typisk (uten laster)** | **~350–420mA @ 5V = ~2W** |
| Buck-konverter overhead (12V→5V) | Effektivitet >90% ved 3A (LMR33630 spec) |
| **12V-side forbruk (sensorer)** | **~(400mA × 5V) / (12V × 0.90) ≈ 185mA @ 12V** |

LMR33630-Q1 er dimensjonert for 3A → god margin for ekspansjon og kortere perioder med full NeoPixel-last.

---

## DEL 11: PROSJEKTINFO

**Prosjekteier:** Alexander Pabsdorff  
**E-post:** alexanderpabsdorff@gmail.com  
**GitHub:** github.com/alexpabs/racing_dashboard  
**Bruk:** Motorsport — boardet sitter i motorrommet på en 1956 VW Boble drag-racer

**Miljøkrav:**
- Temperaturområde: -10°C til +85°C
- Fuktighet: høy (konformal coating påføres av eier etter montering)
- Vibrasjoner: moderat (ikke direkte på motor)
- Boardet monteres i lukket plastboks i motorrom

---

*v0.5 — Sist oppdatert 2026-06-11 av Claude Sonnet 4.6 / AlexPabs Racing*  
*Endringer fra v0.4b: WIZ850io, LMR33630-Q1, 6N137 RPM, 74AHCT125D NeoPixel,*  
*4 MOSFETs+SS14, 2 analog, GPS 4-pin bidi, PMOS+PTC+TVS, LIS3DH I2C, expansion header*
