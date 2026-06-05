# PCB Design Brief — Universal Racing Sensor Board
**Project:** Universal Racing Sensor Board — Teensy 4.1 Edition  
**Customer:** Alexander Pabsdorff  
**Date:** 2026-06-05  
**Service:** Custom PCB design + PCB fabrication (component assembly optional)

---

## 1. Project Overview

A universal, open-hardware sensor interface board for racing vehicles.  
Designed for **maximum flexibility** — not vehicle-specific. Sensor assignment happens via a web browser at `/settings`, where each connector gets a label (e.g. "J3 → Oil Pressure"). The configuration is saved to the Teensy's SD card and a printable wiring sheet can be generated.

The brain is a **Teensy 4.1** (600 MHz ARM Cortex-M7, 18× ADC, multiple SPI buses, built-in SD card reader). A **WIZ820io** Ethernet module provides 100 Mbit LAN for the dashboard web UI. All connectors are labeled generically (J0, J1, J2 …) — sensor names are applied in firmware, not on the PCB silkscreen.

---

## 2. Board Specifications

| Parameter | Requirement |
|-----------|-------------|
| Layers | 2 (top + bottom copper) |
| Dimensions | Approx. **130 mm × 110 mm** (adjust to fit layout) |
| Material | FR4, 1.6 mm |
| Copper weight | 1 oz (35 µm) |
| Surface finish | ENIG (gold) |
| Solder mask | Green (both sides) |
| Silkscreen | White (both sides) — reference designators + J-numbers only |
| Min trace width | 0.2 mm signal, 0.8 mm power (5V/GND) |
| Min clearance | 0.2 mm |
| Via size | 0.6 mm drill, 1.0 mm pad |
| GND pour | Yes — both layers, stitching vias |
| Mounting holes | 4× M3, 3.2 mm, each corner, 3 mm from edge |

---

## 3. Functional Description

### 3.1 Power Supply
- **Input:** 12 V from vehicle (screw terminal J30, fused 5 A)
- **Converter:** MP2307DN 3 A synchronous buck, 8–24 V → 5.0 V, ~90% efficiency
- **Output capacitors:** 100 µF + 10 µF on 5 V rail
- **Teensy supply:** 5 V via VIN pin; Teensy generates internal 3.3 V for sensors
- **12 V rail** also available for MOSFET drain load switching

### 3.2 Main Controller — Teensy 4.1
- Socket-mounted (**do NOT solder Teensy directly**) — use 2×24 precision socket strips
- SPI primary bus: MOSI=11, MISO=12, SCK=13
- SPI1 bus (Ethernet): MOSI=26, MISO=1, SCK=27
- ADC inputs: A0–A7 (analog 0–5 V channels), A8–A11 (NTC thermistor channels)
- Digital outputs: pins 36–39 (MOSFET gates)
- Digital inputs: pins 30–35 (optocoupler outputs)
- CS pins for MAX31855: pins 3–10 (8 chips)
- CS for LIS3DH: pin 2
- CS for WIZ820io: pin 0
- Status LED: pin 41

### 3.3 Thermocouple Amplifiers — 8× MAX31855KASA+ (SOIC-8)
- Each chip reads one K-type thermocouple (T+/T− screw terminals J0–J7)
- Shared SPI bus (SCK, MISO=SO) — individual /CS per chip
- 100 nF decoupling cap per chip (VCC to GND)
- Suitable for: CHT (cylinder head temp), EGT (exhaust gas temp), oil temp, coolant — any combination

### 3.4 Analog 0–5 V Inputs — 8× channels (J16–J23)
- Voltage divider per channel: 10 kΩ (top) + 15 kΩ (bottom) → scales 5 V → 3.0 V (Teensy ADC max 3.3 V)
- 100 nF filter cap at ADC input
- Suitable for: oil pressure (0–5 V), fuel pressure, fuel level, throttle position, lambda/AFR, IAT, MAP, brake pressure

### 3.5 NTC Thermistor Inputs — 4× channels (J8–J11)
- 10 kΩ pull-up resistor to 3.3 V per channel
- 100 nF filter cap
- Suitable for: oil temp, coolant temp, intake air temp, cabin temp (10 kΩ NTC thermistors)

### 3.6 Digital Inputs — 6× PC817C Optocouplers (J24–J29)
- Full galvanic isolation from vehicle electrical system
- Input side: 470 Ω series resistor for 12 V source signals
- Output side: pull-up to 5 V, open-collector to Teensy digital pin
- Tolerates inductive transients from ignition coil (up to ~400 V spike)
- Suitable for: crankshaft RPM, wheel speed (Hall sensors), gear position switches, brake light switch

### 3.7 MOSFET Switched Outputs — 4× AO3400A SOT-23 (J12–J15)
- Logic-level N-channel MOSFET: 30 V / 5.7 A, gate threshold ~1.4 V
- 100 Ω gate resistor (protects Teensy GPIO)
- 1N4007 flyback diode (drain to 12 V rail)
- Output connector: switched 12 V at drain
- Suitable for: cooling fan, water pump, relay coil, solenoid valve, warning buzzer

### 3.8 Accelerometer — LIS3DH (on-board)
- 3-axis MEMS accelerometer, ±2/4/8/16 g selectable
- SPI interface, shared bus with MAX31855, own CS (Teensy pin 2)
- 100 nF decoupling cap
- Measures: lateral G-force, longitudinal acceleration, braking, body tilt

### 3.9 Ethernet — WIZ820io Module
- Module plugs into 2×10 pin header (2 mm pitch) — J22
- SPI1 interface: MOSI=26, MISO=1, SCK=27, CS=0
- Interrupt: pin 28, Reset: pin 29
- Provides: 10/100 Mbit Ethernet, RJ45 connector on module
- Dashboard web UI served from Teensy over HTTP + WebSocket

---

## 4. Connector Summary

| Reference | Type | Pitch | Description |
|-----------|------|-------|-------------|
| J0–J7 | Screw terminal 2-pin | 5.0 mm | Thermocouple pairs T+/T− |
| J8–J11 | Screw terminal 2-pin | 5.0 mm | NTC thermistor SIG/GND |
| J12–J15 | Screw terminal 2-pin | 5.0 mm | MOSFET outputs +12V/LOAD |
| J16–J23 | Screw terminal 2-pin | 5.0 mm | Analog 0–5 V SIG/GND |
| J24–J29 | Screw terminal 2-pin | 5.0 mm | Digital inputs IN+/IN− |
| J30 | Screw terminal 2-pin | 5.0 mm | 12 V power input |
| J22 | 2×10 pin header | 2.0 mm | WIZ820io Ethernet module |

**Total screw terminals:** 31× 2-pin, 5.0 mm pitch  
**Important:** All connectors should be placed at PCB edge for easy wiring access.

---

## 5. Complete Bill of Materials

| Qty | Reference | Value | Package | LCSC | Description |
|-----|-----------|-------|---------|------|-------------|
| 1 | U1 | Teensy 4.1 | 2×24 socket | pjrc.com | Main controller — socket only, do NOT solder |
| 1 | U2 | WIZ820io | 2×10 header 2mm | wiznet.io | Ethernet module |
| 8 | U3–U10 | MAX31855KASA+ | SOIC-8 | C67561 | Thermocouple amplifier |
| 1 | U11 | LIS3DH | 14-LGA | C91122 | 3-axis accelerometer |
| 1 | U12 | MP2307DN | SOP-8 | C89312 | Buck converter 3 A |
| 4 | Q1–Q4 | AO3400A | SOT-23 | C20917 | MOSFET output |
| 6 | OK1–OK6 | PC817C | DIP-4 | C6366 | Optocoupler |
| 4 | D1–D4 | 1N4007 | DO-41 | C14007 | Flyback diode |
| 20 | R1–R20 | 10 kΩ | 0805 | C25744 | Pull-up / ADC divider |
| 8 | R21–R28 | 15 kΩ | 0805 | C25885 | ADC divider lower |
| 6 | R29–R34 | 470 Ω | 0805 | C25117 | Optocoupler input |
| 4 | R35–R38 | 100 Ω | 0805 | C25116 | MOSFET gate |
| 1 | R39 | 330 Ω | 0805 | C25087 | Status LED |
| 20 | C1–C20 | 100 nF | 0805 16 V | C1525 | Decoupling / filter |
| 3 | C21–C23 | 10 µF | 0805 16 V | C15850 | Buck output + Teensy |
| 2 | C24–C25 | 100 µF/25 V | Electrolytic | C16780 | Buck input/output |
| 1 | F1 | 5 A | Glass fuse + holder | C382046 | Input protection |
| 31 | J0–J30 | Screw terminal 2-pin | 5.0 mm THT | C8262 | All sensor connectors |
| 1 | J22 | 2×10 header | 2.0 mm THT | C50982 | Ethernet module socket |
| 1 | LED1 | Any color | 0805 or 3 mm | C2286 | Status LED |

---

## 6. Layout Guidelines

### Component Placement
1. **Teensy 4.1 socket:** Center of board. Orient with USB connector pointing to board edge (for programming access). Keep 5 mm clearance around socket.
2. **WIZ820io header (J22):** Near RJ45 edge — the module's RJ45 will overhang or align with board edge.
3. **MP2307DN buck converter:** Corner of board with thermal relief pad. Keep inductor (on module) away from ADC traces.
4. **MAX31855 × 8:** Group near thermocouple connectors. Keep T+/T− traces short to connectors.
5. **LIS3DH:** Center of board (measures vehicle acceleration — avoid mounting near edge where vibration is highest). Keep away from high-current traces.
6. **PC817C optocouplers (×6):** Group together. Maintain 4 mm creepage between input (vehicle-side) and output (Teensy-side) traces.
7. **AO3400A MOSFETs (×4):** Place near J12–J15 output connectors. Flyback diode 1N4007 close to drain pad.
8. **All screw terminals:** Along PCB edge — all four sides if needed. Silkscreen J-number next to each connector.

### Routing Guidelines
- Power traces (+5 V, GND): min 0.8 mm width
- Signal traces: 0.2 mm
- SPI bus (SCK, MOSI, MISO): route as short as possible, parallel traces same length
- Analog ADC traces: keep away from SPI clock lines — use GND pour as shield
- Optocoupler input/output: physical separation, no shared GND pour across isolation boundary
- GND pour on both layers, stitching vias every 10 mm

### Special Notes
- **Do NOT solder Teensy 4.1 or WIZ820io directly** — socket/header only
- **Silkscreen connector labels:** J0, J1, J2 … (generic). Do NOT write sensor names on PCB.
- **Buck converter:** MP2307DN is available as complete module (e.g. LM2596 module) — if using a module, provide footprint for its mounting holes + pin header

---

## 7. Firmware & Software (for reference)
- **Language:** Arduino/Teensyduino (C++)
- **Libraries:** QNEthernet (Teensy native), MAX31855 SPI, LIS3DH SPI, ArduinoJSON
- **Web UI:** Served from Teensy via HTTP — `/` (dashboard), `/settings` (connector assignment), `/print` (printable wiring sheet)
- **Data storage:** Settings JSON saved to Teensy SD card
- **Protocol:** HTTP + WebSocket for real-time gauge updates

---

## 8. Contact & Delivery

Please send:
1. Manufacturing files (Gerber + drill)
2. Assembly files (pick-and-place + BOM) — if PCBA requested
3. 3D step file of assembled board
4. Any DFM notes or questions

**Email:** alexanderpabsdorff@gmail.com
