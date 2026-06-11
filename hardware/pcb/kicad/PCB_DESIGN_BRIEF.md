# PCB Design Brief — Universal Racing Sensor Board v0.4
**For AI PCB Design / Layout Service → Output: Gerber files for PCBway**

---

## 1. Project Summary

Design a 2-layer PCB for an automotive racing data-acquisition system based on the **Teensy 4.1** microcontroller. The board reads 8 K-type thermocouples, 4 NTC sensors, 8 analogue 0–5 V sensors, 6 digital (opto-isolated) inputs, 4 MOSFET outputs, a 3-axis accelerometer (SPI), and an Ethernet module. Power input is 12 V from a vehicle supply stepped down to 5 V via a buck converter.

---

## 2. Mandatory PCB Specifications (for PCBway)

| Parameter | Value |
|-----------|-------|
| Layers | 2 (top copper + bottom copper) |
| Board size (target) | ≤ 160 mm × 120 mm |
| Min trace width | 0.2 mm (signal), 0.5 mm (5 V power), 1.0 mm (12 V / MOSFET drain) |
| Min clearance | 0.2 mm |
| Min drill diameter | 0.3 mm |
| Via size | 0.8 mm pad / 0.4 mm drill |
| Surface finish | HASL lead-free (or ENIG) |
| Soldermask | Both sides, green |
| Silkscreen | Both sides |
| Copper weight | 1 oz (35 µm) both layers |
| PCBway stackup | Standard FR4, 1.6 mm thickness |

Gerber format: **RS-274X** + Excellon drill file, zipped.

---

## 3. Component List

| Ref | Component | Footprint | Qty |
|-----|-----------|-----------|-----|
| U1 | Teensy 4.1 | 2×24 pin 2.54 mm through-hole socket | 1 |
| U2 | WIZ820io Ethernet module | 2×10 pin 2.54 mm through-hole header | 1 |
| U3–U10 | MAX31855KASA+ (thermocouple ADC) | SOIC-8 (3.9×4.9 mm, P1.27 mm) | 8 |
| U11 | LIS3DH (accelerometer) | LGA-16 (3×3 mm, P0.5 mm) | 1 |
| U12 | MP2307DN (buck converter) | SOIC-8 (3.9×4.9 mm, P1.27 mm) | 1 |
| OK1–OK6 | PC817C (optocoupler) | DIP-4 (W7.62 mm) | 6 |
| Q1–Q4 | AO3400A (N-ch MOSFET, 30 V / 5.7 A) | SOT-23 | 4 |
| J0–J7 | 2-pin Phoenix MC 1.5 mm connector | Through-hole, horizontal | 8 |
| J8–J11 | 2-pin Phoenix MC 1.5 mm connector | Through-hole, horizontal | 4 |
| J12–J15 | 2-pin Phoenix MC 1.5 mm connector | Through-hole, horizontal | 4 |
| J16–J23 | 2-pin Phoenix MC 1.5 mm connector | Through-hole, horizontal | 8 |
| J24–J29 | 2-pin Phoenix MC 1.5 mm connector | Through-hole, horizontal | 6 |
| J30 | 2-pin Phoenix GMSTB 7.5 mm (power) | Through-hole, horizontal | 1 |
| R1–R8 | 100 Ω (gate resistors Q1–Q4) | 0603 SMD | 4 |
| R9–R14 | 1 kΩ (optocoupler anode series) | 0603 SMD | 6 |
| R15–R22 | 10 kΩ (analogue voltage divider, top half) | 0603 SMD | 8 |
| R23–R30 | 10 kΩ (analogue voltage divider, bottom half) | 0603 SMD | 8 |
| R31–R34 | 10 kΩ (NTC pull-up) | 0603 SMD | 4 |
| R35 | 100 kΩ (LED current limit) | 0603 SMD | 1 |
| R36 | 10 kΩ (MP2307DN FB upper) | 0603 SMD | 1 |
| R37 | 4.7 kΩ (MP2307DN FB lower → sets Vout=5 V) | 0603 SMD | 1 |
| C1–C4 | 100 nF / 16 V (bypass, MAX31855) | 0402 SMD | 8 |
| C5 | 10 µF / 16 V (WIZ820io bypass) | 0805 SMD | 1 |
| C6 | 10 µF / 25 V (Teensy VIN bypass) | 0805 SMD | 1 |
| C7 | 100 nF (LIS3DH bypass) | 0402 SMD | 1 |
| C8 | 100 µF / 25 V (MP2307DN Cin) | 1210 electrolytic SMD | 1 |
| C9 | 100 µF / 16 V (MP2307DN Cout) | 1210 electrolytic SMD | 1 |
| L1 | 10 µH / 1.5 A (MP2307DN inductor) | SMD 6.8×6.8 mm (e.g. Würth 7447789100) | 1 |
| D1 | Schottky 1A / 30 V (MP2307DN freewheeling) | SOD-123 | 1 |
| LED1 | Red LED 3 mm | Through-hole | 1 |

---

## 4. Net Connections (complete netlist)

### Power Rails

| Net | Source | All destinations |
|-----|--------|-----------------|
| +12V | J30 pin 1 | MP2307DN VIN, J12–J15 pin 2 (+12 V load side) |
| GND | J30 pin 2 | All component GNDs, J24–J29 pin 2, J0–J7 GND, J8–J11 pin 2, J12–J15 Q drain GND, J16–J23 pin 2 |
| +5V | MP2307DN SW (via L1/D1/Cout) | Teensy VIN |
| +3V3 | Teensy 3V3 pin | WIZ820io VCC×2, LIS3DH VDD+VDD_IO, MAX31855×8 VCC, PC817×6 Collector pull-up |

### SPI Bus (Teensy primary SPI → MAX31855 × 8 + LIS3DH)

| Net | Teensy pin | All destinations |
|-----|-----------|-----------------|
| SPI_MOSI | p11 | MAX31855 U3–U10 (no DIN pin; MOSI not used by MAX31855 — tie to GND via 10 kΩ or leave NC) |
| SPI_MISO | p12 | MAX31855 U3–U10 SO (all in parallel), LIS3DH SDO |
| SPI_SCK | p13 | MAX31855 U3–U10 SCK (all in parallel), LIS3DH SCL |

### SPI1 Bus (Teensy secondary SPI → WIZ820io)

| Net | Teensy pin | Destination |
|-----|-----------|-------------|
| SP1_MOSI | p26 | WIZ820io MOSI |
| SP1_MISO | p1 | WIZ820io MISO |
| SP1_SCK | p27 | WIZ820io SCLK |

### Chip-Select Lines

| Net | Teensy pin | Destination |
|-----|-----------|-------------|
| CS_ETH | p0 | WIZ820io SCSn |
| CS_ACC | p2 | LIS3DH CS |
| CS_TC0 | p10 | MAX31855 U3 /CS |
| CS_TC1 | p9 | MAX31855 U4 /CS |
| CS_TC2 | p8 | MAX31855 U5 /CS |
| CS_TC3 | p7 | MAX31855 U6 /CS |
| CS_TC4 | p6 | MAX31855 U7 /CS |
| CS_TC5 | p5 | MAX31855 U8 /CS |
| CS_TC6 | p4 | MAX31855 U9 /CS |
| CS_TC7 | p3 | MAX31855 U10 /CS |

### Ethernet Control

| Net | Teensy pin | Destination |
|-----|-----------|-------------|
| INT_ETH | p28 | WIZ820io INTn |
| RST_ETH | p29 | WIZ820io RSTn |

### Accelerometer Interrupt

| Net | Teensy pin | Destination |
|-----|-----------|-------------|
| INT1_ACC | p41 (or spare digital) | LIS3DH INT1 |

### Thermocouples (J0–J7 → MAX31855 U3–U10)

| Connector | Pin 1 (T+) net | Pin 2 (T−) net | MAX31855 |
|-----------|---------------|---------------|---------|
| J0 | TC0_PLUS | TC0_MINUS | U3 T+ / T− |
| J1 | TC1_PLUS | TC1_MINUS | U4 T+ / T− |
| J2 | TC2_PLUS | TC2_MINUS | U5 T+ / T− |
| J3 | TC3_PLUS | TC3_MINUS | U6 T+ / T− |
| J4 | TC4_PLUS | TC4_MINUS | U7 T+ / T− |
| J5 | TC5_PLUS | TC5_MINUS | U8 T+ / T− |
| J6 | TC6_PLUS | TC6_MINUS | U9 T+ / T− |
| J7 | TC7_PLUS | TC7_MINUS | U10 T+ / T− |

### Analogue Inputs 0–5 V (J16–J23 → Teensy A0–A7)

Each analogue input uses a 10 kΩ / 10 kΩ voltage divider to halve the 0–5 V signal to 0–2.5 V for the 3.3 V Teensy ADC.

| Connector | Net (divider midpoint) | Teensy pin |
|-----------|----------------------|-----------|
| J16 | ANA0 | p14/A0 |
| J17 | ANA1 | p15/A1 |
| J18 | ANA2 | p16/A2 |
| J19 | ANA3 | p17/A3 |
| J20 | ANA4 | p18/A4 |
| J21 | ANA5 | p19/A5 |
| J22 | ANA6 | p20/A6 |
| J23 | ANA7 | p21/A7 |

J16–J23 pin 1 → 10 kΩ top → divider midpoint (ANAx) → 10 kΩ bottom → GND.
ANAx also connects to Teensy p14–p21.

### NTC Inputs (J8–J11 → Teensy A8–A11)

Each NTC input uses a 10 kΩ pull-up resistor from +3V3 to the NTC pin. NTC other end to GND via connector pin 2.

| Connector | Net | Teensy pin |
|-----------|-----|-----------|
| J8 | NTC0 | p22/A8 |
| J9 | NTC1 | p23/A9 |
| J10 | NTC2 | p24/A10 |
| J11 | NTC3 | p25/A11 |

+3V3 → 10 kΩ → NTCx → J8–J11 pin 1. J8–J11 pin 2 → GND.

### Digital Inputs (J24–J29 → PC817 optocouplers OK1–OK6 → Teensy p30–p35)

Each digital input is opto-isolated by a PC817C. Anode-side resistor limits LED current.

| Connector | Internal net | OK | Teensy pin (net) |
|-----------|-------------|----|--------------------|
| J24 pin 1 | DCIN0_A | OK1 anode | DIG0 → p30 |
| J25 pin 1 | DCIN1_A | OK2 anode | DIG1 → p31 |
| J26 pin 1 | DCIN2_A | OK3 anode | DIG2 → p32 |
| J27 pin 1 | DCIN3_A | OK4 anode | DIG3 → p33 |
| J28 pin 1 | DCIN4_A | OK5 anode | DIG4 → p34 |
| J29 pin 1 | DCIN5_A | OK6 anode | DIG5 → p35 |

Circuit per channel:
- J24 pin 1 → 1 kΩ → OK1 Anode (pin 1)
- J24 pin 2 → OK1 Cathode (pin 2) → GND
- OK1 Collector (pin 4) → +3V3
- OK1 Emitter (pin 3) → 10 kΩ pull-down → GND, AND → Teensy p30 (DIG0)

### MOSFET Outputs (Teensy p36–p39 → Q1–Q4 → J12–J15)

Each output switches a 12 V load via an N-channel MOSFET.

| Teensy pin (net) | Gate resistor | MOSFET | Load connector |
|-----------------|--------------|--------|---------------|
| p36 / MOS0 | R1 100 Ω | Q1 AO3400A | J12 pin 1 (load +), pin 2 (+12V) |
| p37 / MOS1 | R2 100 Ω | Q2 AO3400A | J13 pin 1 (load +), pin 2 (+12V) |
| p38 / MOS2 | R3 100 Ω | Q3 AO3400A | J14 pin 1 (load +), pin 2 (+12V) |
| p39 / MOS3 | R4 100 Ω | Q4 AO3400A | J15 pin 1 (load +), pin 2 (+12V) |

MOSFET circuit: Teensy pin → 100 Ω → Gate. Source → GND. Drain → J12 pin 1 (load return). J12 pin 2 → +12V (load supply).

### Status LED

Teensy p41 → 100 kΩ → LED1 anode → LED1 cathode → GND.

### Buck Converter (U12 MP2307DN — 12V → 5V)

Follows MP2307DN application circuit:
- VIN (pin 2) → +12V (with 100 µF input cap to GND)
- SW (pin 3) → L1 (10 µH) → +5V output
- Freewheeling diode D1 between SW and GND (cathode to SW)
- Cout 100 µF from +5V to GND
- FB (pin 5): voltage divider +5V → 100 kΩ → FB → 4.7 kΩ → GND (sets Vout = 5 V)
- EN (pin 8): tie to +12V (always on)
- BST (pin 1): 100 nF cap from BST to SW
- COMP (pin 7): 10 nF + 10 kΩ series to GND (compensation)
- SS (pin 6): 10 nF to GND (soft-start)
- GND (pin 4): PCB GND pour

---

## 5. Layout Guidelines

### Placement Priorities

1. **U1 Teensy 4.1**: Centre of board, long axis horizontal. Use 2×24 DIP socket (2.54 mm grid).
2. **U2 WIZ820io**: Near Teensy, to the right. Short SP1 SPI traces.
3. **U3–U10 MAX31855**: Group in two columns of 4, top of board. Keep T+/T− traces short and symmetric. Route SPI_MISO/SCK as a short bus.
4. **U11 LIS3DH**: Near Teensy SPI lines. Decoupling cap directly under pads.
5. **U12 MP2307DN + L1 + D1**: Bottom-right area. Keep SW node (pin 3 → L1 → D1) as short as possible to reduce switching noise. Use ground pour under converter.
6. **OK1–OK6**: Left side of board, one column. Series resistors (R9–R14) directly adjacent.
7. **Q1–Q4**: Bottom-left area, drain traces routed to J12–J15. Gate resistors (R1–R4) adjacent to gate pads.
8. **J0–J7 thermocouple connectors**: Along top edge, accessible.
9. **J8–J11 NTC, J16–J23 analogue, J24–J29 digital**: Left and bottom edges, accessible.
10. **J12–J15 MOSFET outputs, J30 power**: Right or bottom edge, accessible.

### Trace Widths

| Net type | Width |
|----------|-------|
| Signal (SPI, CS, DIG, ANA) | 0.2 mm |
| +3V3 distribution | 0.4 mm |
| +5V distribution | 0.5 mm |
| +12V / MOSFET drain / J12–J15 | 1.0 mm minimum |
| GND pour | Solid copper fill, both layers |

### Ground Plane

- Use solid GND copper fill on **both layers** (flood fill entire board).
- Connect via stitching vias every 10–15 mm.
- Isolate the MP2307DN switching node (SW) with a small clearance in the GND pour to avoid capacitive noise coupling.
- Analogue signal traces (ANA0–7, NTC0–3) should be routed away from switching node.

### Bypass Capacitors

- Place 100 nF caps within 1 mm of each MAX31855 VCC pin.
- Place 100 nF cap within 0.5 mm of LIS3DH VDD/VDD_IO pins.
- Place 10 µF cap within 3 mm of WIZ820io VCC pins.

### Thermocouple Input Area

- T+/T− pairs must be routed as **differential pairs** with equal length.
- Minimum 1 mm clearance between different thermocouple pairs.
- No 5V/3V3 traces crossing the T+/T− area.

---

## 6. KiCad Schematic Reference Files

The following files are in the repository at `hardware/pcb/kicad/`:

| File | Description |
|------|-------------|
| `racing_sensor_board_v0.4.kicad_sch` | Complete schematic (all symbols, nets, labels) |
| `racing_sensor_board_v0.3.kicad_pro` | KiCad project file |
| `gen_kicad_v04.py` | Python script that generated the v0.4 schematic |
| `KABELKART.md` | Net reference table (Norwegian) |

---

## 7. Deliverable Requirements (for PCBway submission)

Please provide a `.zip` file containing:

```
gerbers/
├── racing_sensor_board_v04-F_Cu.gtl       (top copper)
├── racing_sensor_board_v04-B_Cu.gbl       (bottom copper)
├── racing_sensor_board_v04-F_Mask.gts     (top soldermask)
├── racing_sensor_board_v04-B_Mask.gbs     (bottom soldermask)
├── racing_sensor_board_v04-F_Silkscreen.gto  (top silkscreen)
├── racing_sensor_board_v04-B_Silkscreen.gbo  (bottom silkscreen)
├── racing_sensor_board_v04-Edge_Cuts.gm1  (board outline)
├── racing_sensor_board_v04.drl            (Excellon drill file, through-hole)
└── racing_sensor_board_v04.drl.ncd        (non-plated holes, if any)
```

Gerber format: **RS-274X**.
Drill format: **Excellon 2**, metric, leading zeros suppressed.

---

## 8. Contact and Notes

- Board version: v0.4
- Project: AlexPabs Racing Dashboard
- Sensor names/functions are assigned in firmware via `/settings` endpoint — labels on PCB are not required.
- All connectors must face outward (toward board edges) for easy field wiring.
- The 4 MOSFET outputs (J12–J15) carry up to 2 A each at 12 V — ensure adequate trace width and thermal relief.
