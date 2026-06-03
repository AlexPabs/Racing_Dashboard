# PCB Design & Assembly Brief
**Project:** Racing Dashboard — Sensor Interface Board v3  
**Customer:** Alexander Pabsdorff  
**Date:** 2026-06-03  
**Service requested:** Full custom PCB design + PCB fabrication + PCBA (component assembly)

---

## 1. Project Overview

This board is the sensor interface for a 1956 Volkswagen Beetle racing car.  
It reads engine data from multiple sensors and transmits it over Ethernet (UDP) to a Raspberry Pi 5 running a real-time dashboard display.

The brain is a **WT32-ETH01** module (ESP32 + built-in LAN8720 Ethernet). The module plugs into a **2×20 female socket** on the PCB — it is NOT soldered directly. The socket should be provided and assembled by PCBWay.

---

## 2. Board Specifications

| Parameter | Requirement |
|-----------|-------------|
| Layers | 2 (top + bottom copper) |
| Dimensions | Approx. **120 mm × 100 mm** (optimize as needed) |
| Material | FR4, 1.6 mm |
| Copper weight | 1 oz (35 µm) |
| Surface finish | ENIG (gold) preferred, HASL-LF acceptable |
| Solder mask | Green (both sides) |
| Silkscreen | White (both sides) — include reference designators and connector labels |
| Min trace width | 0.2 mm signal, 0.5 mm power traces |
| Min clearance | 0.2 mm |
| Drill | Min 0.3 mm (SMD vias), min 1.0 mm for through-hole components |
| Quantity | 5 boards (prototype run) |

---

## 3. Functional Description

### 3.1 Power Supply
- **Input:** 12V DC from car battery (via blade fuse holder F1, 5A)
- **Regulation:** LM7805CT (TO-220, through-hole) → regulated +5V for board logic
- **WT32-ETH01 supply:** +5V to module VIN pin
- **Thermocouple ICs:** +3.3V from WT32-ETH01 on-board regulator
- **Bypass caps:** 100 µF (LM7805 input), 10 µF (LM7805 output), 100 nF per MAX31855

### 3.2 Thermocouple Inputs (5 channels, K-type)
Five **MAX31855KASA+** (SOIC-8) ICs measure temperature:
- CHT1, CHT2, CHT3, CHT4: Cylinder Head Temperatures
- EGT1: Exhaust Gas Temperature

All share an SPI bus:
- **SCK** → GPIO14 (WT32-ETH01)
- **MISO (SO)** → GPIO12
- **Individual chip-select lines:**
  - CS_CHT1 → GPIO5
  - CS_CHT2 → GPIO13
  - CS_CHT3 → GPIO15
  - CS_CHT4 → GPIO17
  - CS_EGT1 → GPIO16

Each MAX31855 has a dedicated 2-pin 3.5 mm screw terminal (K-type thermocouple connectors, Phoenix-compatible).

### 3.3 Analog Sensor Inputs
All analog signals are conditioned to 0–3.3V before reaching ESP32 ADC pins:

| Sensor | Connector | Conditioning | GPIO |
|--------|-----------|-------------|------|
| Oil Temperature (NTC) | J2 | 4.7 kΩ pull-up to +5V | GPIO34 |
| Intake Air Temp (NTC) | J3 | 4.7 kΩ pull-up to +5V | GPIO33 |
| Oil Pressure (0–4.5V) | J4 | Voltage divider 10kΩ/3.3kΩ → 3.3V max | GPIO35 |
| Lambda / Innovate LC-2 (0–5V) | J5 | Voltage divider 10kΩ/6.8kΩ → 3.3V max | GPIO32 |
| Battery Voltage (12–15V) | J6 | Voltage divider 100kΩ/27kΩ → 3.3V max | GPIO36 |
| Fuel Tank (0–90Ω resistive sender) | J7 | 120Ω series resistor | GPIO39 |

All sensor connectors are 2-pin 5 mm pitch screw terminals (Phoenix WJ500V-5.0-2P compatible).

### 3.4 RPM Input (Ignition Coil Signal)
- **J8** 2-pin 5 mm screw terminal
- Signal from ignition coil primary (up to 400V transient spikes)
- **4N35 optocoupler** (DIP-6) provides full galvanic isolation
- Pull-up resistors on both sides (10 kΩ to +5V)
- Output → GPIO4

### 3.5 Fan Control Output
- GPIO2 → 100Ω series gate resistor (R15) → Gate of AO3400A (SOT-23 N-MOSFET)
- 10 kΩ pull-down (R16) on gate
- Drain → Fan motor (−) terminal → J17 2-pin 5 mm screw terminal
- Fan (+) terminal → +12V
- **1N4007** flyback diode in parallel with fan (cathode to +12V, anode to Drain)
- Fan power: 12V, up to ~3A continuous

### 3.6 Status LEDs
Three indicator LEDs (0402) with 470Ω current-limiting resistors:
- **LED1** Green: Power on (connected to +3.3V permanently)
- **LED2** Blue: Ethernet link (firmware controlled)
- **LED3** Yellow: Data TX (blinks on UDP transmit)

### 3.7 Ethernet
- WT32-ETH01 module has built-in RJ45 Ethernet port on the module itself
- Additionally, **J14** (Amphenol RJHSE5380, horizontal THT) provides an external RJ45 for direct PCB-edge Ethernet connection to Raspberry Pi 5 via CAT6 FTP cable
- Both internal (module) and external (J14) can be used; external J14 is preferred for panel mounting

---

## 4. Connector Summary (Cable Numbering)

The silkscreen must clearly label each connector with its J-number:

| Ref | Type | Pitch | Function |
|-----|------|-------|----------|
| J1 | 2-pin screw terminal | 5.0 mm | 12V power input + GND |
| J2 | 2-pin screw terminal | 5.0 mm | Oil Temperature sensor (NTC) |
| J3 | 2-pin screw terminal | 5.0 mm | Intake Air Temperature (NTC) |
| J4 | 2-pin screw terminal | 5.0 mm | Oil Pressure sensor (0–4.5V) |
| J5 | 2-pin screw terminal | 5.0 mm | Lambda / Innovate LC-2 (0–5V) |
| J6 | 2-pin screw terminal | 5.0 mm | Battery voltage (12–15V) |
| J7 | 2-pin screw terminal | 5.0 mm | Fuel tank sender (0–90Ω) |
| J8 | 2-pin screw terminal | 5.0 mm | RPM signal (ignition coil) |
| J9 | 2-pin screw terminal | 3.5 mm | CHT1 K-type thermocouple |
| J10 | 2-pin screw terminal | 3.5 mm | CHT2 K-type thermocouple |
| J11 | 2-pin screw terminal | 3.5 mm | CHT3 K-type thermocouple |
| J12 | 2-pin screw terminal | 3.5 mm | CHT4 K-type thermocouple |
| J14 | RJ45 horizontal | THT | Ethernet to Raspberry Pi 5 |
| J16 | 2-pin screw terminal | 3.5 mm | EGT1 K-type thermocouple |
| J17 | 2-pin screw terminal | 5.0 mm | Fan motor output (12V) |

**H1, H2:** Two 1×20 female headers (2.54 mm pitch) form the socket for the WT32-ETH01 module.

---

## 5. Bill of Materials (BOM for LCSC Sourcing)

All components below have LCSC part numbers and can be sourced directly by PCBWay/LCSC.  
**Exception: WT32-ETH01 module** — customer will provide this component separately.

| # | Qty | Ref | Value | Package | LCSC # | Notes |
|---|-----|-----|-------|---------|--------|-------|
| 1 | 1 | U1 | WT32-ETH01 | Module 2×20 | — | **Customer supplied** |
| 2 | 5 | U2–U5, U8 | MAX31855KASA+ | SOIC-8 | C79396 | |
| 3 | 1 | U6 | 4N35 | DIP-6 | C9938 | |
| 4 | 1 | U7 | LM7805CT | TO-220 | C56158 | |
| 5 | 1 | Q1 | AO3400A | SOT-23 | C20917 | |
| 6 | 1 | D1 | 1N4007 | DO-41 THT | C14516 | |
| 7 | 5 | C1–C4, C7 | 100nF | 0402 | C1525 | |
| 8 | 1 | C5 | 100µF 25V | THT Ø6.3mm | C16780 | |
| 9 | 1 | C6 | 10µF 10V | 0805 | C15850 | |
| 10 | 2 | R1, R2 | 4.7kΩ | 0402 | C25900 | |
| 11 | 1 | R3 | 10kΩ | 0402 | C25744 | |
| 12 | 1 | R4 | 3.3kΩ | 0402 | C25890 | |
| 13 | 1 | R5 | 10kΩ | 0402 | C25744 | |
| 14 | 1 | R6 | 6.8kΩ | 0402 | C25879 | |
| 15 | 1 | R7 | 100kΩ | 0402 | C25741 | |
| 16 | 1 | R8 | 27kΩ | 0402 | C25843 | |
| 17 | 1 | R9 | 120Ω | 0402 | C25087 | |
| 18 | 4 | R10, R11, R16, R17 | 10kΩ | 0402 | C25744 | |
| 19 | 1 | R15 | 100Ω | 0402 | C25116 | |
| 20 | 3 | R12–R14 | 470Ω | 0402 | C25117 | |
| 21 | 1 | LED1 | Green 0402 | 0402 | C2286 | |
| 22 | 1 | LED2 | Blue 0402 | 0402 | C72043 | |
| 23 | 1 | LED3 | Yellow 0402 | 0402 | C2290 | |
| 24 | 9 | J1–J8, J17 | Screw terminal 5mm 2P | THT P5.0mm | C8262 | |
| 25 | 5 | J9–J12, J16 | Screw terminal 3.5mm 2P | THT P3.5mm | C8465 | |
| 26 | 1 | J14 | RJ45 horizontal | THT | C12074 | |
| 27 | 2 | H1, H2 | 1×20 female header 2.54mm | THT | C50982 | WT32-ETH01 socket |
| 28 | 1 | F1 | Fuse holder PCB 5×20mm | THT | C382046 | For 5A fuse |

---

## 6. Schematic Reference

A full schematic diagram (SVG format) is attached separately: **sensor_board_schematic.svg**

The schematic shows:
- All component connections with correct pin names
- Net labels (same label name = same net, even if drawn separately)
- Voltage divider values
- Complete connector pinout

---

## 7. Layout Guidelines for PCBWay Engineers

1. **WT32-ETH01 socket (H1+H2):** Place near top-center of board. The module extends ~56mm long and 18mm wide above the socket. Ensure clearance above the PCB for the module and its integrated RJ45 connector.

2. **Screw terminals (J1–J17):** Place along the board edges for easy cable access. Group by function:
   - Power (J1) and Fan (J17): one edge
   - Thermocouple terminals (J9–J12, J16): one edge, grouped together
   - Analog sensor terminals (J2–J7): one edge, grouped together
   - RPM (J8): near the 4N35 optocoupler

3. **MAX31855 ICs (U2–U8):** Place close to their respective thermocouple terminals. Short traces between MAX31855 T+/T− pads and the thermocouple screw terminal (keep thermocouple differential pair traces equal length if possible).

4. **LM7805 (U7):** Needs heatsinking space. Place near power input (J1). Add copper pours on both layers connected to GND tab for thermal relief if no heatsink is fitted.

5. **4N35 optocoupler (U6):** Keep high-voltage side (J8, anode/cathode) physically separated from low-voltage ESP32 side. Maintain ≥ 3mm clearance between high- and low-voltage traces.

6. **Power planes:** Use GND copper pour (filled plane) on bottom layer. Use +5V and +3.3V as routed traces, not planes.

7. **SPI traces:** Route SCK and MISO as matched-length pairs where possible. Keep short.

8. **Mounting holes:** Add 4× M3 mounting holes in corners (3.2mm drill, no copper pad needed).

9. **Label all connectors** on silkscreen with J-number AND function, e.g.:  
   `J2  OLJE TEMP` / `J9  CHT1` / `J1  12V INN` etc.

---

## 8. Assembly Notes

- **Reflow (SMD first):** 0402 resistors/caps, SOIC-8 (MAX31855), SOT-23 (AO3400A), 0805 cap
- **Wave/hand solder (THT):** LM7805 TO-220, 4N35 DIP-6, 1N4007 DO-41, all screw terminals, RJ45, female headers, fuse holder
- **Do NOT solder** the WT32-ETH01 module — install in socket only (customer installs after delivery)
- Apply flux and clean board after assembly
- No conformal coating required (prototype stage)

---

## 9. Testing / Inspection Request

- Visual inspection of all solder joints
- Electrical continuity check: +5V rail, GND, 3.3V
- Check for shorts between +12V input and logic rails before shipping
- No functional test required (firmware not included)

---

## 10. Files Included with This Order

| File | Description |
|------|-------------|
| `sensor_board_schematic.svg` | Full schematic diagram |
| `bom.csv` | Bill of materials with LCSC part numbers |
| `PCBWay_Design_Brief.md` | This document |

> **Note:** No Gerber files are included — PCBWay is requested to perform the full PCB design based on this specification and the schematic. If clarification is needed on any connection or component placement, please contact the customer before proceeding.

---

*End of design brief.*
