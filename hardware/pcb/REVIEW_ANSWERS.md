# PCB v0.5 — Review Answers

Answers to all 8 blockers/questions raised in the design review.

---

## 1. Generator vs hand-edit → EXTEND THE GENERATOR

`gen_kicad_v05.py` is the single source of truth. The script has been extended
to emit **all ~70 discrete components** (resistors, capacitors, inductor, LEDs,
Zener diodes, tactile switch, test pads). Never hand-edit the `.kicad_sch` —
always modify and re-run the generator.

## 2. Reference designators → STANDARD (R1, C1, J1, …)

All components now use standard KiCad reference designators:
- U1–U13: ICs (Teensy, WIZ850io, MAX31855×8, LIS3DH, LMR33630, 74AHCT125D)
- OK1: 6N137 optocoupler
- Q1–Q5: MOSFETs (Q1–Q4 AO3400A N-ch, Q5 AO3401A P-ch)
- F1: PTC fuse
- D1–D9: Diodes (D1 TVS, D2–D5 SS14, D6 Zener 5.1V, D7–D9 Zener 3.3V)
- R1–R26: Resistors
- C1–C26: Capacitors
- L1: Inductor (buck)
- LED1: Status LED
- SW1: Reset switch
- TP1–TP10: Test pads
- J1–J26: Connectors

The `Value` field still carries the human-readable name (e.g., J2 value="TC1").

## 3. KiCad version → 7

Schema version 20230121 = KiCad 7. All generated files target KiCad 7 format.
Files open in KiCad 8 as well (forward-compatible), but the canonical version is 7.

## 4. RPM Zener → RE-SPECCED (two-stage protection)

The single 270Ω approach has been replaced with a proper two-stage design:

```
Coil (−) ──→ R1 (1.5kΩ) ──┬── R2 (270Ω) ──→ 6N137 LED anode (pin 2)
                           │
                     D6 (5.1V Zener to GND)
                           │
                          GND
```

**Why:** With a single 270Ω, the Zener sees (12V − 5.1V)/270Ω = 25mA continuous
(hot for BZX84) and 88mA peak during TVS-clamped spikes. The two-stage design:
- R1 limits coil current to (12 − 5.1)/1500 = 4.6 mA through Zener (cool)
- R2 sets 6N137 LED current to (5.1 − 1.2)/270 = 14.4 mA (within spec)
- During 300V spikes: TVS clamps to ~29V, R1 sees (29 − 5.1)/1500 = 16 mA
  (well within ¼W 0805 rating)

6N137 output has a 10kΩ pull-up to 3V3 (R3), plus 100nF bypass cap (C16).

## 5. Backend → Python+InfluxDB is canonical. Keep server.js for now.

- `backend/udp_receiver.py` — the real backend, matches Teensy firmware UDP protocol
- `backend/src/server.js` — legacy Node.js mock, still used by React frontend demo mode

**Do not delete server.js yet.** The React frontend uses its WebSocket for demo/dev.
Clean up in a separate task after PCB is done. Backend cleanup should not block
Gerber generation.

## 6. WT32-ETH01 → DELETED

- `hardware/pcb/footprints/WT32-ETH01.pretty/` — deleted
- `hardware/pcb/fp-lib-table` — deleted

WT32-ETH01 was replaced by WIZ850io in v0.5. These files were dead references.

## 7. bom.csv → WILL BE REGENERATED

The existing `bom.csv` references v0.5 components but has stale NOK estimates and
is missing all discrete components. The next AI should regenerate the BOM from the
complete v0.5 schematic (which now includes all ~120 components with LCSC-compatible
footprints).

## 8. Circuit ambiguities — ALL RESOLVED

All discrete components are now explicit schematic instances:

| Category | Components | Count |
|----------|-----------|-------|
| LMR33630 buck passives | L1, C1–C5, R23–R24 | 8 |
| RPM protection | R1–R3, D6, C16 | 5 |
| DIG1–3 protection | R4–R9, D7–D9, C18–C20 | 9 |
| Analog dividers | R10–R13, C21–C22 | 6 |
| NTC pull-ups | R14–R17, C23–C26 | 8 |
| MOSFET gates + PMOS | R18–R22 | 5 |
| MAX31855 bypass | C6–C13 | 8 |
| LIS3DH bypass | C14–C15 | 2 |
| 74AHCT125D bypass | C17 | 1 |
| NeoPixel series R | R25 | 1 |
| Status LED | LED1, R26 | 2 |
| Reset button | SW1 | 1 |
| Test pads | TP1–TP10 | 10 |
| **Total discretes** | | **66** |

Combined with the 51 existing ICs/connectors = **~117 total components**.

---

## Status LED — pin p2

Teensy pin 2 is now dedicated to STATUS_LED (was on expansion header).
The expansion header (J26) is now 5 active pins + GND:
- Pin 1: p16
- Pin 2: p17
- Pin 3: p20
- Pin 4: p21
- Pin 5: p41
- Pin 6: GND

LED1 is a green 0805 SMD soldered on PCB, with R26 (1kΩ) to 3V3.
Firmware drives 1Hz heartbeat blink.

---

## Complete Reference Designator Map

```
U1   Teensy 4.1            U2   WIZ850io
U3   MAX31855 (TC0/CHT1)   U4   MAX31855 (TC1/CHT2)
U5   MAX31855 (TC2/CHT3)   U6   MAX31855 (TC3/CHT4)
U7   MAX31855 (TC4/EGT1)   U8   MAX31855 (TC5/EGT2)
U9   MAX31855 (TC6/EGT3)   U10  MAX31855 (TC7/EGT4)
U11  LIS3DH                U12  LMR33630Q1
U13  74AHCT125D             OK1  6N137

Q1   AO3400A (FAN)          Q2   AO3400A (PUMP)
Q3   AO3400A (SHIFT_LIGHT)  Q4   AO3400A (SPARE)
Q5   AO3401A (PMOS rev-prot)

F1   PTC 500mA              D1   SMBJ18A TVS
D2   SS14 (FAN flyback)     D3   SS14 (PUMP flyback)
D4   SS14 (SHIFT flyback)   D5   SS14 (SPARE flyback)
D6   BZX84-C5V1 (RPM)       D7   BZX84-C3V3 (DIG1)
D8   BZX84-C3V3 (DIG2)      D9   BZX84-C3V3 (DIG3)

R1   1.5kΩ (RPM stage 1)    R2   270Ω (RPM stage 2)
R3   10kΩ (RPM pull-up)     R4–R6   10kΩ (DIG series)
R7–R9   10kΩ (DIG pull-up)  R10–R11 10kΩ (ANA top)
R12–R13 15kΩ (ANA bottom)   R14–R17 10kΩ (NTC pull-up)
R18–R21 100Ω (MOS gate)     R22  10kΩ (PMOS gate)
R23  100kΩ (FB top)          R24  24.9kΩ (FB bottom)
R25  300Ω (NeoPixel)         R26  1kΩ (Status LED)

C1   100nF (buck in)         C2   100µF/25V (buck in)
C3   100nF (bootstrap)       C4   100nF (buck out)
C5   100µF/25V (buck out)    C6–C13 100nF (MAX31855 bypass)
C14  100nF (LIS3DH VDD)      C15  100nF (LIS3DH VDD_IO)
C16  100nF (6N137 VCC)        C17  100nF (74AHCT125D VCC)
C18–C20 100nF (DIG filter)   C21–C22 100nF (ANA filter)
C23–C26 100nF (NTC filter)

L1   10µH (buck inductor)    LED1 Green 0805 (status)
SW1  6mm tactile (reset)     TP1–TP10 (test pads)

J1  PWR_IN     J2–J9  TC1–TC8    J10 RPM      J11–J13 DIG1–DIG3
J14–J17 OUT1–OUT4   J18–J19 ANA1–ANA2   J20–J23 NTC1–NTC4
J24 GPS        J25 NeoPixel   J26 Expansion
```

---

## What the next AI should deliver

1. PCB layout from this complete schematic (~117 components)
2. Board size: ~140 × 115 mm, 2-layer, 1oz copper
3. Gerber zip ready for PCBway (5× order, bare boards)
4. Updated BOM with LCSC part numbers
5. All 0805 passives, hand-solder friendly spacing (≥0.5mm between pads)
