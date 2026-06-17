# PCB v0.5 — Answers to Design Questions
## From: Alex (AlexPabs Racing) — 1956 VW Beetle 2387cc Drag/Street Build

**To the AI doing PCB layout:** These answers pin down the remaining unknowns. 
Combined with `AI_HANDOFF_V05.md`, you have everything needed for layout + Gerbers.

---

## 1. RPM / Ignition Signal Source

**Answer: Inductive coil, negative terminal — electronic ignition (no points)**

The car runs one of two ignition setups:
- **Primary choice:** Pat Downs Performance "Shockwave" electronic ignition kit. This replaces the stock Bosch points with a Hall-effect trigger module inside the distributor. Comes with a matched high-energy coil. The ignition module switches the coil primary ground — signal is tapped from the coil negative (−) terminal.
- **Fallback:** Standard Bosch "Blue Coil" (high-performance, ~3Ω primary resistance) with either the Shockwave module or aftermarket electronic ignition module.

**Signal characteristics (both setups):**
- Source: Coil negative terminal (primary side switching)
- Waveform: Inductive — clean ~12V square-ish pulse during dwell, followed by 300–400V back-EMF spike at spark event
- Polarity: Signal goes LOW when coil fires (module grounds the primary)
- Frequency: VW Type 1, 4-cylinder, single coil + distributor = **2 pulses per crankshaft revolution**
- Max frequency at 8500 RPM: 8500/60 × 2 = **283 Hz** (very manageable for 6N137)
- No dedicated tach output — signal must be tapped from coil − terminal

**Protection circuit needed: YES — full fortress**
The 6N137 + SMBJ18A TVS + 270Ω + 5.1V Zener protection circuit in v0.5 is correct and necessary. Do not simplify this.

**Firmware note:** RPM calculation = `(pulse_frequency × 60) / 2` for 4-cyl single-coil distributor.

---

## 2. MOSFET Output Loads

| Output | Load | Estimated Current | Inductive? | Notes |
|--------|------|-------------------|------------|-------|
| OUT1 (MOS1) | Oil cooler fan relay coil | ~150mA | Yes (relay coil) | Air-cooled VW — no radiator. External oil cooler with thermostat-switched fan. MOSFET switches a 12V relay coil, relay switches the fan motor (10-15A). SS14 flyback handles the relay coil. |
| OUT2 (MOS2) | Electric fuel pump relay coil | ~150mA | Yes (relay coil) | High-flow fuel pump for 2387cc ~200hp. Pump draws 5-8A — switched via relay, MOSFET drives the relay coil only. |
| OUT3 (MOS3) | Shift light (LED strip/module) | ~500mA–1A | No | LED-based shift light indicator. Direct drive, no relay needed. Could be a small 12V LED bar. |
| OUT4 (MOS4) | Spare / Line lock solenoid relay | ~150mA | Yes (relay coil) | Reserved for future use. Likely a line-lock solenoid relay for drag staging. |

**Conclusion:** All loads are under 1.5A. AO3400A (5.7A max) is massively oversized — perfect safety margin. No direct high-current motor loads on the MOSFET outputs. All inductive loads (relay coils) need the SS14 flyback diode.

**If Alex later wants to drive a fan motor directly (no relay):** AO3400A is NOT sufficient for a 10-15A Spal fan. Would need an IRLZ44N (TO-220) or external relay. Current design with relay coils is the right approach.

---

## 3. Sensor List

### Analog 0–5V Inputs (2 channels)

| Channel | Sensor | Model/Type | Output Range | Notes |
|---------|--------|-----------|-------------|-------|
| ANA1 (p14) | Oil pressure | VDO 360-081-030-015C or Autometer 2246 | 0.5–4.5V (0–10 bar) | Ratiometric 5V sensor, 1/8" NPT thread. Common on VW race builds. |
| ANA2 (p15) | Fuel pressure | Generic 0-100 PSI (0-5V) | 0.5–4.5V | Monitors fuel rail pressure. Important for EFI conversion or high-flow carb setups. |

**Scaling resistor values (10k/15k divider):**
- Input 0–5V → Teensy sees 0–3.0V (within 3.3V ADC range) ✓
- If sensors are ratiometric (powered from +5V rail): accuracy depends on 5V rail stability. LMR33630-Q1 should be stable enough.

### NTC Thermistor Inputs (4 channels)

| Channel | Measures | Sensor Type | Notes |
|---------|----------|------------|-------|
| NTC1 (p22) | Oil temperature | 10kΩ NTC, 1/8" NPT (e.g., Bosch 0280130026 or generic) | At oil cooler or sump drain plug |
| NTC2 (p23) | Cylinder head temp (CHT) — spare/average | 10kΩ NTC, ring terminal (CHT sensor under spark plug gasket) | Air-cooled VW: CHT is critical — no coolant temp available |
| NTC3 (p24) | Intake air temperature (IAT) | 10kΩ NTC, open-tip or threaded | In air filter housing or intake manifold runner |
| NTC4 (p25) | Transmission / ambient | 10kΩ NTC | Gearbox temp or ambient reference |

**Pull-up value:** 10kΩ to +3V3 is correct for 10kΩ NTC — gives best resolution around 25–100°C range.

### K-Type Thermocouple Inputs (8 channels via MAX31855)

| Channel | Measures | Sensor | Notes |
|---------|----------|--------|-------|
| TC1 | CHT Cylinder #1 | K-type ring, under spark plug washer | Critical for air-cooled engine — prevents overheating |
| TC2 | CHT Cylinder #2 | K-type ring | |
| TC3 | CHT Cylinder #3 | K-type ring | Cylinders 3 & 4 run hotter (rear, less airflow) |
| TC4 | CHT Cylinder #4 | K-type ring | |
| TC5 | EGT Cylinder #1 | K-type probe, welded in header | Exhaust gas temp — monitors mixture per cylinder |
| TC6 | EGT Cylinder #2 | K-type probe | |
| TC7 | EGT Cylinder #3 | K-type probe | |
| TC8 | EGT Cylinder #4 | K-type probe | |

**Recommendation: Keep all 8 channels.** On an air-cooled engine, per-cylinder CHT is not a luxury — it's how you prevent melted pistons. The 4× EGT channels let you tune carb jetting per cylinder. This is the whole reason the board exists.

---

## 4. GPS Module

**Answer: u-blox NEO-6M breakout board (the common blue PCB module from eBay/AliExpress)**

- Has onboard 3.3V LDO — can be powered from 3.3V or 5V
- **Power from +3V3** (not 5V) — saves current on the 5V buck, and the module's LDO is bypassed when fed 3.3V directly
- TX/RX are 3.3V LVTTL — direct connection to Teensy, no level shifting needed
- Default output: NMEA 9600 baud (GGA, RMC sentences)
- J_GPS pin 1 = +3V3, pin 2 = GND, pin 3 = GPS_TX → Teensy p34 RX, pin 4 = Teensy p35 TX → GPS_RX
- Bidirectional needed: YES — for UBX binary protocol config (higher update rate, 10Hz for drag timing)
- Antenna: Ceramic patch antenna on module, or external SMA antenna for better reception in metal engine bay

**Update to v0.5 schematic:** J_GPS power pin should be +3V3, not +5V. The v0.5 schematic currently shows +3V3 which is correct.

---

## 5. Enclosure

**Answer: PCB size determines the box — not the other way around**

- No specific enclosure purchased yet
- Target: Generic ABS project box, approximately 170mm × 130mm × 55mm internal
- Will be sourced after PCB dimensions are finalized (Hammond 1591-series or similar)
- Board mounts on standoffs (M3 × 10mm) inside the box
- Box mounts in engine bay on the firewall (passenger side, away from exhaust)

**Connector exit sides:**
- **Top edge:** Thermocouple connectors (J_TC1–8) — harness goes up to cylinder heads and exhaust
- **Right edge:** RJ45 (WIZ850io) — CAT6 cable runs through firewall to dashboard
- **Bottom edge:** Power in (J_PWR), MOSFET outputs (J_OUT1–4), digital inputs (J_RPM, J_DIG1–3)
- **Left edge:** Analog inputs (J_ANA1–2), NTC inputs (J_NTC1–4), GPS (J_GPS), NeoPixel (J_NEO)

**Layout priority:** RJ45 MUST be on the PCB edge (WIZ850io module overhangs). Screw terminals along remaining three edges. Components in the center.

---

## 6. Firmware

**Answer: No Teensy firmware exists yet — it needs to be written**

- No firmware folder in the repository
- Frontend (React) and backend (Node.js) are complete and deployed
- Teensy firmware is a separate task (~1 week estimated)
- Will be Arduino/PlatformIO based
- Key libraries: QNEthernet (UDP), Adafruit_MAX31855, Wire (I2C for LIS3DH), TinyGPS++ (NMEA parsing), Adafruit_NeoPixel
- Firmware does NOT block PCB layout — the pin map is frozen in v0.5

---

## 7. Production Method

**Answer: 5 boards from PCBway, hand-soldered at home**

- Order 5× bare PCBs from PCBway (standard 2-layer, green, HASL)
- Hand-solder all SMD components (0805 resistors/caps, SOIC ICs, SOT-23 MOSFETs)
- Through-hole: screw terminals, DIP-8 (6N137), pin headers
- Teensy 4.1 in DIP socket (removable)
- WIZ850io in 2×10 pin socket (removable)
- **Prefer 0805 over 0402** for hand soldering — 0402 is possible but painful under magnification
- No JLCPCB assembly needed — just bare PCBs

**Important for layout:**
- Use 0805 (2012 metric) for all passives — not 0402
- Generous pad sizes for hand soldering
- Component spacing ≥ 1mm between pads
- Silkscreen every component reference + value
- Clear polarity markings on diodes, electrolytics, ICs

---

## 8. Feature Choices

| Feature | Answer | Notes |
|---------|--------|-------|
| Test-pads on SPI, I2C, power rails? | **YES** | SPI0 (SCK/MISO/MOSI), I2C (SDA/SCL), +5V, +3V3, +12V, GND. 1.5mm round pads near Teensy. |
| Reset button for Teensy? | **YES** | Tactile switch, accessible from board edge. Connects Teensy RST pin to GND momentarily. |
| Status LED (green, on EXPN_P2)? | **YES** | Green 0805 LED + 1kΩ resistor on EXPN_P2 (Teensy p2). Heartbeat in firmware. |
| NeoPixel 300Ω series resistor? | **YES** | 300Ω between 74AHCT125D output (1Y) and J_NEO data pin. Protects against ESD and signal ringing on long wire to LED strip. |

---

## 9. Thermocouple Channel Usage

**All 8 channels are used. Do NOT reduce MAX31855 count.**

| Channel | Measures | Why |
|---------|----------|-----|
| TC1 | CHT Cylinder #1 | Air-cooled engine — CHT is the primary overheating indicator |
| TC2 | CHT Cylinder #2 | Per-cylinder monitoring catches individual problems |
| TC3 | CHT Cylinder #3 | Rear cylinders (3&4) run hotter — less cooling airflow |
| TC4 | CHT Cylinder #4 | This is why the board has 8 channels |
| TC5 | EGT Cylinder #1 | Exhaust gas temp — lean/rich per cylinder |
| TC6 | EGT Cylinder #2 | Tune carb jets per cylinder based on EGT spread |
| TC7 | EGT Cylinder #3 | Target: ~700–800°C at WOT, >900°C = too lean |
| TC8 | EGT Cylinder #4 | 4× EGT is standard on serious race builds |

---

## Summary — Canonical v0.5 Spec (frozen)

```
MCU:          Teensy 4.1 in DIP socket
Ethernet:     WIZ850io (W5500), SPI1, RJ45 on board edge
Thermocouples: 8× MAX31855 on SPI0 (4× CHT + 4× EGT)
Accelerometer: LIS3DH on I2C Wire (p18 SDA, p19 SCL), addr 0x18
Analog in:    2× 0–5V via 10k/15k divider (oil pressure, fuel pressure)
NTC in:       4× 10kΩ pull-up (oil temp, CHT spare, IAT, trans/ambient)
RPM:          Coil −terminal → SMBJ18A + 270Ω + 5.1V Zener → 6N137 → p30
Digital in:   3× filtered (10kΩ + 3.3V Zener + 100nF + pull-up) → p31-33
MOSFET out:   4× AO3400A + SS14 flyback (relay coils, shift light)
GPS:          NEO-6M, 4-pin bidi, +3V3 power, Serial8 (p34 RX, p35 TX)
NeoPixel:     74AHCT125D 3.3V→5V + 300Ω series → 3-pin connector
Buck:         LMR33630-Q1 12V→5V 3A (automotive grade)
Protection:   PTC fuse → P-ch MOSFET (AO3401A) → SMBJ18A TVS on +12V rail
Expansion:    6-pin header (p2, p16, p17, p20, p21, p41)
Extras:       Test pads, reset button, status LED on p2
PCB:          2-layer, FR4 1.6mm, ~140×115mm, 0805 passives, hand-soldered
Connectors:   5.08mm Phoenix screw terminals, RJ45 on edge
```
