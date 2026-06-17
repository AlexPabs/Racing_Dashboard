# PCB v0.5 — Complete Design Answers & Frozen Specification
## Project: Universal Racing Sensor Board for 1956 VW Beetle 2387cc Drag/Street
## Owner: Alex (AlexPabs Racing)

**To the AI doing PCB layout:** This document + `AI_HANDOFF_V05.md` = everything you need.
All decisions are final. No open questions remain. Build exactly this.

---

## THE PLAN — WHAT WE ARE BUILDING

We are building a **universal automotive sensor interface PCB** that sits in the engine bay of a 1956 VW Beetle drag/street car. The board reads sensors (temperature, pressure, RPM, GPS), switches 12V loads (fans, pumps, lights via relays), and streams all data over Ethernet to a Raspberry Pi dashboard in the cabin.

**What we need from the next AI:**
1. Take the existing KiCad v0.5 schematic (`racing_sensor_board_v0.5.kicad_sch`)
2. Add all missing discrete components (resistors, capacitors, inductor) that are described in the circuit diagrams in `AI_HANDOFF_V05.md` sections 4.1–4.8 but not yet placed in the schematic
3. Create a complete PCB layout (`.kicad_pcb` file) with component placement and copper routing
4. Generate Gerber files ready to upload to PCBway.com
5. Generate a final BOM with LCSC part numbers for ordering

**What we will do with the output:**
1. Order 5× bare PCBs from PCBway (~$5 + shipping)
2. Order components from LCSC/Mouser based on the BOM
3. Hand-solder everything at home with a soldering iron + hot air station
4. Plug in the Teensy 4.1 and WIZ850io modules (socketed, removable)
5. Flash firmware (to be written separately — does NOT block PCB)
6. Mount the finished board in an ABS box in the engine bay
7. Run a CAT6 Ethernet cable through the firewall to the Raspberry Pi dashboard

---

## 1. RPM / IGNITION SIGNAL

**Source: Coil negative (−) terminal. Electronic ignition, no points.**

The ignition system is a **Pat Downs Performance "Shockwave" electronic ignition kit**. This replaces the stock Bosch breaker points with a Hall-effect trigger module inside the distributor. It comes with a matched high-energy coil. If the Shockwave is unavailable, a standard **Bosch Blue Coil** with an aftermarket electronic ignition module will be used instead.

Both setups produce the same RPM signal:

| Parameter | Value |
|-----------|-------|
| Signal tap point | Coil negative (−) terminal |
| Signal type | Inductive — ~12V pulse during dwell, 300–400V back-EMF spike at spark |
| Polarity | Goes LOW when coil fires (ignition module grounds the primary) |
| Pulses per revolution | 2 (4-cylinder, single coil, distributor) |
| Max RPM | ~8500 |
| Max pulse frequency | 8500 ÷ 60 × 2 = **283 Hz** |
| Dedicated tach output? | **No** — must tap from coil − terminal |

**Protection circuit (MANDATORY — do not simplify):**

```
Coil (−) terminal
    │
    ├── SMBJ18A TVS (cathode to signal, anode to GND) — clamps 300V spikes to ~29V
    │
    ├── 270Ω resistor (1/4W) — limits current into 6N137 LED
    │
    └── 5.1V Zener (cathode to signal, anode to GND) — clamps to safe LED voltage
         │
    6N137 pin 2 (Anode) ← signal enters here
    6N137 pin 3 (Cathode/LED−) → GND
    6N137 pin 4 (GND) → GND
    6N137 pin 5 (VO, open-collector output) → 10kΩ pull-up to +3V3 → RPM_IN → Teensy p30
    6N137 pin 6 (VCC) → +3V3
    6N137 pin 7 (Enable) → +3V3
```

**Firmware RPM formula:** `RPM = (pulse_count_per_second × 60) / 2`

---

## 2. MOSFET OUTPUT LOADS

**All four outputs switch 12V relay coils (≤200mA). The MOSFET does NOT drive motors or high-current loads directly. The relay (external, not on PCB) switches the actual load.**

| Output | What it switches | Current through MOSFET | Inductive? | External relay switches... |
|--------|-----------------|----------------------|------------|---------------------------|
| OUT1 (p37) | Oil cooler fan relay coil | ~150mA | Yes | Fan motor (10–15A) |
| OUT2 (p38) | Electric fuel pump relay coil | ~150mA | Yes | Fuel pump (5–8A) |
| OUT3 (p39) | Shift light (12V LED bar) | ~500mA | No | Direct — no relay needed |
| OUT4 (p40) | Spare (likely line-lock solenoid relay) | ~150mA | Yes | Solenoid valve |

**Circuit per output (same for all 4):**

```
Teensy pX → 100Ω gate resistor → AO3400A Gate
                                  AO3400A Source → GND
                                  AO3400A Drain → LOAD_X net
                                                   │
                                              SS14 cathode ─→ +12V  (flyback: catches relay coil back-EMF)
                                              SS14 anode ──→ LOAD_X
                                                   │
                                              J_OUTx pin 1 (to external relay coil +)
                                              J_OUTx pin 2 → +12V (relay coil power)
```

**AO3400A is correct.** Max load is ~500mA (shift light). AO3400A handles 5.7A. Massive margin.
**SS14 Schottky flyback is correct.** Catches relay coil back-EMF. Cathode to +12V, anode to drain.

---

## 3. SENSOR INPUTS

### Philosophy: ALL INPUTS ARE GENERIC

The PCB provides raw electrical interfaces. **No sensor model is hardcoded in hardware.** The user connects any compatible sensor and configures the name, unit, scaling (offset × scale), and alarm thresholds in the React web dashboard. The dashboard already supports this — see `frontend/src/types/index.ts` for the sensor configuration schema.

### 3a. Analog 0–5V (2 channels)

**Hardware:** 10kΩ (upper) + 15kΩ (lower) voltage divider + 100nF ceramic cap to GND.
**Scaling:** 5.0V input → 3.0V at Teensy ADC pin (within 3.3V max).
**Connector:** 2-pin 5.08mm screw terminal per channel (signal + GND).

| Pin | Teensy ADC | Typical sensors (user's choice) |
|-----|-----------|-------------------------------|
| ANA1 | p14 (A0) | Oil pressure, fuel pressure, MAP, TPS, wideband AFR 0–5V output, boost gauge sender — anything 0–5V |
| ANA2 | p15 (A1) | Same as above — second channel |

### 3b. NTC Thermistor (4 channels)

**Hardware:** 10kΩ pull-up resistor from +3V3 to ADC pin. NTC thermistor connects between ADC pin and GND.
**Connector:** 2-pin 5.08mm screw terminal per channel (NTC + GND).
**Calibration:** Steinhart-Hart coefficients or lookup table in firmware. Dashboard shows temperature.

| Pin | Teensy ADC | Typical sensors (user's choice) |
|-----|-----------|-------------------------------|
| NTC1 | p22 (A8) | Oil temp, cylinder head temp, intake air temp, transmission temp — any 10kΩ NTC |
| NTC2 | p23 (A9) | Same |
| NTC3 | p24 (A10) | Same |
| NTC4 | p25 (A11) | Same |

### 3c. K-Type Thermocouples (8 channels)

**Hardware:** MAX31855KASA+ per channel (SOIC-8). Reads differential T+/T− directly. Internal cold-junction compensation. SPI interface (SPI0 bus, individual CS per chip).
**Connector:** 2-pin 5.08mm screw terminal per channel (T+ and T−).
**Planned usage on the VW (but not hardcoded):**

| Channel | Planned use | Why |
|---------|------------|-----|
| TC1–TC4 | CHT (cylinder head temperature) × 4 | Air-cooled engine has no coolant temp — CHT is the only overheat warning. One per cylinder. |
| TC5–TC8 | EGT (exhaust gas temperature) × 4 | Per-cylinder exhaust temp reveals lean/rich mixture. Essential for carb jetting and engine tuning. |

**All 8 channels are used. Do NOT reduce MAX31855 count.**

---

## 4. GPS MODULE

**Module: u-blox NEO-6M breakout (common blue PCB, ~$5 from eBay/AliExpress)**

| Detail | Value |
|--------|-------|
| Module | GY-NEO6MV2 or equivalent u-blox NEO-6M breakout |
| Onboard LDO | Yes — module has 3.3V regulator, can be fed 3.3–5V |
| Power from PCB | **+3V3** (bypasses module's LDO, saves current) |
| TX/RX voltage | 3.3V LVTTL — direct to Teensy, no level shifter |
| Default baud | 9600 (NMEA: GGA, RMC sentences) |
| Bidirectional? | **Yes** — TX needed to send UBX config commands (10Hz update rate for drag timing) |
| Antenna | Ceramic patch on module; may add external SMA antenna for engine bay |

**4-pin connector (J_GPS):**

| Pin | Signal | Description |
|-----|--------|-------------|
| 1 | +3V3 | Power to GPS module |
| 2 | GND | Ground |
| 3 | GPS_RX (net) | GPS module TX pin → Teensy p34 (Serial8 RX). NMEA data flows in. |
| 4 | GPS_TX (net) | Teensy p35 (Serial8 TX) → GPS module RX pin. Config commands flow out. |

---

## 5. ENCLOSURE

**PCB dimensions determine the box — box will be purchased after PCB is finalized.**

| Detail | Value |
|--------|-------|
| Target PCB size | ~140mm × 115mm (fits inside 170×130mm ABS box) |
| Enclosure type | Generic ABS project box (Hammond 1591-series or similar) |
| Enclosure approx. internal | 170mm × 130mm × 55mm |
| Mounting | 4× M3 standoffs (10mm height), screwed into box floor |
| Location in car | Engine bay firewall, passenger side, away from exhaust manifold |

**Connector placement on PCB edges:**

```
                    ┌─── TOP EDGE ───────────────────────┐
                    │  J_TC1  J_TC2  J_TC3  J_TC4       │
                    │  J_TC5  J_TC6  J_TC7  J_TC8       │
                    │  (thermocouples → heads + exhaust)  │
         ┌──────────┤                                    ├──────────┐
         │ LEFT     │                                    │ RIGHT    │
         │          │     [components in center]         │          │
         │ J_ANA1   │     U1 Teensy 4.1 (socket)        │ WIZ850io │
         │ J_ANA2   │     U3–U10 MAX31855               │ ═══RJ45══│→ CAT6
         │ J_NTC1   │     U11 LIS3DH                    │          │
         │ J_NTC2   │     U12 LMR33630 + L1             │          │
         │ J_NTC3   │     U13 74AHCT125D                │          │
         │ J_NTC4   │     OK1 6N137                     │          │
         │ J_GPS    │     Q1–Q4 MOSFETs + D1–D4         │          │
         │ J_NEO    │     F1 PTC + Q_PMOS + D_TVS       │          │
         │ J_EXP    │     LED1 status + SW1 reset       │          │
         └──────────┤                                    ├──────────┘
                    │  J_PWR  J_RPM  J_DIG1  J_DIG2     │
                    │  J_DIG3  J_OUT1  J_OUT2  J_OUT3   │
                    │  J_OUT4                            │
                    └─── BOTTOM EDGE ────────────────────┘
```

**RJ45 MUST overhang the right PCB edge** (WIZ850io module sticks out). All other connectors are screw terminals along the remaining three edges.

---

## 6. FIRMWARE

**No firmware exists yet. It does NOT block PCB layout.**

| Detail | Value |
|--------|-------|
| Current status | Not written — no firmware folder in repo |
| Framework | Arduino/PlatformIO |
| Language | C++ |
| Estimated effort | ~1 week |
| Blocks PCB? | **No** — pin map is frozen, firmware is a separate task |

Key libraries:
- `QNEthernet` — UDP telemetry over WIZ850io
- `Adafruit_MAX31855` — thermocouple reading (SPI0)
- `Wire` — LIS3DH accelerometer (I2C, addr 0x18)
- `TinyGPS++` — NMEA parsing (Serial8)
- `Adafruit_NeoPixel` — WS2812B control (via 74AHCT125D)

---

## 7. PRODUCTION METHOD

**5× bare PCBs from PCBway, hand-soldered at home.**

| Detail | Value |
|--------|-------|
| PCB order | 5× bare boards, PCBway.com |
| PCB spec | 2-layer, FR4 1.6mm, green solder mask, white silkscreen, HASL lead-free |
| Assembly | Hand-soldered by owner (soldering iron + hot air station) |
| SMD size | **0805 (2012 metric) for ALL resistors and capacitors** — no 0402 |
| Through-hole | Screw terminals, DIP-8 socket (6N137), pin headers, tactile switch |
| Socketed modules | Teensy 4.1 (2×24 DIP socket), WIZ850io (2×10 pin socket) |

**Layout rules for hand soldering:**
- 0805 passives only (no 0402)
- Minimum 1mm spacing between component pads
- Generous solder pads (extend 0.5mm beyond component body)
- Silkscreen every component: reference designator + value (e.g., "R1 100Ω")
- Clear polarity marks on diodes (cathode bar), LEDs (dot), electrolytics (+), ICs (pin 1 dot)
- Thermal relief on GND pads (cross pattern, not solid fill) — easier to hand-solder

---

## 8. EXTRA FEATURES (all confirmed YES)

### 8a. Status LED (on PCB, soldered)

A small green LED soldered directly onto the PCB surface. Provides visual confirmation that the board is powered and the Teensy is running.

| Detail | Value |
|--------|-------|
| LED type | 0805 SMD green LED (e.g., Everlight 19-213/GHC-YR1S2/3T) |
| Resistor | 1kΩ 0805 in series (3.3V − 2.0V Vf) / 1kΩ = 1.3mA — visible, low power |
| Connected to | Teensy p2 (was EXPN_P2, now dedicated to status LED) |
| Function | Firmware blinks it: 1Hz = normal, fast blink = error, off = no power/crash |
| Placement | Near board edge, visible through a small hole in the ABS enclosure lid |

**Circuit:**
```
Teensy p2 → 1kΩ (0805) → LED anode ──→ LED cathode → GND
```

This uses one of the 6 expansion pins. **5 expansion pins remain** on J_EXP (p16, p17, p20, p21, p41).

### 8b. Reset Button

| Detail | Value |
|--------|-------|
| Switch type | 6mm tactile push button, through-hole (e.g., Omron B3F-1000) |
| Function | Momentarily connects Teensy PROGRAM/RST pin to GND → resets Teensy |
| Placement | Board edge, accessible through enclosure |

### 8c. Test Pads

Round 1.5mm bare copper pads (no solder mask) for probing with multimeter or oscilloscope.

| Pad | Signal | Why |
|-----|--------|-----|
| TP1 | +12V (VBAT_PROT) | Verify protected 12V rail |
| TP2 | +5V | Verify buck output |
| TP3 | +3V3 | Verify Teensy regulator |
| TP4 | GND | Ground reference for scope |
| TP5 | SPI_SCK (p13) | Debug SPI0 bus |
| TP6 | SPI_MISO (p12) | Debug SPI0 bus |
| TP7 | SPI_MOSI (p11) | Debug SPI0 bus |
| TP8 | I2C_SDA (p18) | Debug I2C bus |
| TP9 | I2C_SCL (p19) | Debug I2C bus |
| TP10 | RPM_IN (p30) | Verify RPM signal after optocoupler |

### 8d. NeoPixel Series Resistor

| Detail | Value |
|--------|-------|
| Resistor | 300Ω 0805 |
| Location | Between 74AHCT125D output (1Y, pin 3) and J_NEO pin 2 (data) |
| Purpose | Dampens signal ringing on long wire to LED strip + ESD protection |

---

## 9. THERMOCOUPLE USAGE

**All 8 channels are active. Keep all 8× MAX31855 chips.**

| Channel | Planned use | Sensor type | Mounting |
|---------|------------|------------|----------|
| TC1 | CHT Cylinder #1 | K-type ring terminal | Under spark plug washer |
| TC2 | CHT Cylinder #2 | K-type ring terminal | Under spark plug washer |
| TC3 | CHT Cylinder #3 | K-type ring terminal | Under spark plug washer |
| TC4 | CHT Cylinder #4 | K-type ring terminal | Under spark plug washer |
| TC5 | EGT Cylinder #1 | K-type probe, welded bung | In exhaust header primary tube |
| TC6 | EGT Cylinder #2 | K-type probe, welded bung | In exhaust header primary tube |
| TC7 | EGT Cylinder #3 | K-type probe, welded bung | In exhaust header primary tube |
| TC8 | EGT Cylinder #4 | K-type probe, welded bung | In exhaust header primary tube |

**Why all 8:** Air-cooled VW has no coolant. CHT is the only way to detect overheating. Per-cylinder EGT is how you tune carburetor jetting. This is the core purpose of the board.

---

## FROZEN v0.5 SPEC — NOTHING CHANGES AFTER THIS

```
┌─────────────────────────────────────────────────────────────────┐
│  UNIVERSAL RACING SENSOR BOARD v0.5 — FINAL SPECIFICATION      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MCU            Teensy 4.1 in 2×24 DIP socket (removable)      │
│  Ethernet       WIZ850io (W5500) on SPI1, RJ45 on right edge   │
│  Thermocouples  8× MAX31855KASA+ on SPI0 (CS: p3–p10)          │
│  Accelerometer  LIS3DH on I2C Wire (p18 SDA, p19 SCL, 0x18)   │
│  Analog in      2× generic 0–5V (10k/15k divider) on p14, p15  │
│  NTC in         4× generic 10kΩ NTC (pull-up to 3V3) p22–p25   │
│  RPM input      Coil − → TVS+270Ω+Zener → 6N137 → p30         │
│  Digital in     3× filtered (10k+Zener+100nF+pull-up) p31–p33  │
│  MOSFET out     4× AO3400A + SS14 flyback, p37–p40             │
│  GPS            NEO-6M, 4-pin bidi, +3V3, Serial8 (p34/p35)   │
│  NeoPixel       74AHCT125D 3.3→5V + 300Ω → 3-pin connector    │
│  Buck           LMR33630-Q1 12V→5V 3A (automotive, SOIC-8)     │
│  Protection     PTC → P-ch MOSFET (AO3401A) → SMBJ18A TVS     │
│  Status LED     Green 0805 + 1kΩ on p2 (heartbeat)             │
│  Reset button   Tactile 6mm, RST to GND                        │
│  Test pads      10× bare copper pads (power + SPI + I2C + RPM) │
│  Expansion      5-pin header (p16, p17, p20, p21, p41)         │
│  PCB            2-layer FR4, 1.6mm, ~140×115mm, 0805 passives  │
│  Connectors     5.08mm Phoenix screw terminals + RJ45 on edge  │
│  Production     5× bare PCBs from PCBway, hand-soldered        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
