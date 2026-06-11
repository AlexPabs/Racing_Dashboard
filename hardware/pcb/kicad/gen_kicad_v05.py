#!/usr/bin/env python3
"""Generate racing_sensor_board_v0.5.kicad_sch
v0.5 changes vs v0.4:
  - WIZ850io (was WIZ820io)
  - LMR33630-Q1 buck (was MP2307DN)
  - 6N137 fast opto for RPM only (was PC817 for all 4 dig inputs)
  - DIG1-3 = simple filtered inputs (no opto)
  - 4 MOSFET outputs (was 6)
  - 2 analog inputs + 4 NTC (was 8 analog + 4 NTC)
  - GPS 4-pin bidirectional (was 3-pin one-way)
  - 74AHCT125D level-shifter for NeoPixel (3.3V → 5V)
  - P-ch MOSFET reverse polarity protection
  - PTC fuse on power input
  - TVS SMBJ18A on protected rail
  - LIS3DH as I2C (was SPI: CS→VDD, use SCL/SDA)
  - SS14 Schottky flyback diodes on MOSFET outputs
  - 5.08mm screw terminals throughout
  - Expansion header for unused Teensy I/O (p2,p16,p17,p20,p21,p41)
"""
import uuid

def uid(): return str(uuid.uuid4())

out = []
def w(s=''): out.append(s)

# ── Grid helpers ───────────────────────────────────────────────────────────────
G = 1.27  # 50 mil

def gp(x):
    return round(x / G) * G

def body_dims(n_left, n_right, bw=15.24):
    n = max(n_left, n_right, 2)
    hw = bw / 2
    hh = (n + 1) * G
    return hw, hh

def lp_xy(cx, cy, hw, hh, i):
    return cx - hw - 2*G, cy + (-hh + 2*G + i*2*G)

def rp_xy(cx, cy, hw, hh, i):
    return cx + hw + 2*G, cy + (-hh + 2*G + i*2*G)

def define_sym(name, ref, fp, left_pins, right_pins, bw=15.24):
    sym = name.split(':', 1)[1]
    hw, hh = body_dims(len(left_pins), len(right_pins), bw)
    w(f'  (symbol "{name}"')
    w(f'    (in_bom yes) (on_board yes)')
    for pname, pval, dy, hide in [
        ("Reference", ref,    -hh-2.5, False),
        ("Value",     sym,     hh+2.5, False),
        ("Footprint", fp,      hh+5.0, True),
        ("Datasheet", "~",     hh+7.5, True),
    ]:
        h = ' (hide yes)' if hide else ''
        w(f'    (property "{pname}" "{pval}" (at 0 {dy:.2f} 0)')
        w(f'      (effects (font (size 1.27 1.27)){h})'); w(f'    )')
    w(f'    (symbol "{sym}_1_1"')
    w(f'      (rectangle (start {-hw:.2f} {-hh:.2f}) (end {hw:.2f} {hh:.2f})')
    w(f'        (stroke (width 0) (type default)) (fill (type background)))')
    for i, (num, pn, pt) in enumerate(left_pins):
        y = -hh + 2*G + i*2*G
        w(f'      (pin {pt} line (at {-hw-2*G:.2f} {y:.2f} 0) (length {2*G:.2f})')
        w(f'        (name "{pn}" (effects (font (size 1.27 1.27))))')
        w(f'        (number "{num}" (effects (font (size 1.27 1.27)))) )')
    for i, (num, pn, pt) in enumerate(right_pins):
        y = -hh + 2*G + i*2*G
        w(f'      (pin {pt} line (at {hw+2*G:.2f} {y:.2f} 180) (length {2*G:.2f})')
        w(f'        (name "{pn}" (effects (font (size 1.27 1.27))))')
        w(f'        (number "{num}" (effects (font (size 1.27 1.27)))) )')
    w(f'    )'); w(f'  )')
    return hw, hh

def place(name, ref, val, fp, cx, cy, pin_nums, extra_props=None):
    sym = name.split(':', 1)[1]
    nl = len(pin_nums) // 2
    hw, hh = body_dims(nl, nl)
    w(f'  (symbol (lib_id "{name}") (at {cx:.2f} {cy:.2f} 0)')
    w(f'    (unit 1) (in_bom yes) (on_board yes)')
    w(f'    (uuid "{uid()}")')
    for pname, pval, dy, hide in [
        ("Reference", ref, -hh-2.5, False),
        ("Value",     val,  hh+2.5, False),
        ("Footprint", fp,   hh+5.0, True),
        ("Datasheet", "~",  hh+7.5, True),
    ]:
        h = ' (hide yes)' if hide else ''
        w(f'    (property "{pname}" "{pval}" (at {cx:.2f} {cy+dy:.2f} 0)')
        w(f'      (effects (font (size 1.27 1.27)){h})'); w(f'    )')
    if extra_props:
        for ep in extra_props: w(f'    {ep}')
    for p in pin_nums:
        w(f'    (pin "{p}" (uuid "{uid()}"))')
    w(f'  )')

def lbl(net, x, y, ang=0):
    w(f'  (label "{net}" (at {x:.2f} {y:.2f} {ang})')
    w(f'    (effects (font (size 1.27 1.27)))')
    w(f'    (uuid "{uid()}") )')

def wire(x1, y1, x2, y2):
    w(f'  (wire (pts (xy {x1:.2f} {y1:.2f}) (xy {x2:.2f} {y2:.2f}))')
    w(f'    (stroke (width 0) (type default)) (uuid "{uid()}") )')

def no_conn(x, y):
    w(f'  (no_connect (at {x:.2f} {y:.2f}) (uuid "{uid()}") )')

def txt(s, x, y, sz=2.0, bold=False, just='left'):
    b = ' (bold yes)' if bold else ''
    w(f'  (text "{s}" (at {x:.2f} {y:.2f} 0)')
    w(f'    (effects (font (size {sz} {sz}){b}) (justify {just}))')
    w(f'    (uuid "{uid()}") )')

def box(x1, y1, x2, y2):
    w(f'  (rectangle (start {x1:.2f} {y1:.2f}) (end {x2:.2f} {y2:.2f})')
    w(f'    (stroke (width 0.3) (type default)) (fill (type none))')
    w(f'    (uuid "{uid()}") )')

def llbl(net, cx, cy, hw, hh, i):
    x, y = lp_xy(cx, cy, hw, hh, i)
    lbl(net, x, y, 180)

def rlbl(net, cx, cy, hw, hh, i):
    x, y = rp_xy(cx, cy, hw, hh, i)
    lbl(net, x, y, 0)

def lnc(cx, cy, hw, hh, i):
    x, y = lp_xy(cx, cy, hw, hh, i)
    no_conn(x, y)

def rnc(cx, cy, hw, hh, i):
    x, y = rp_xy(cx, cy, hw, hh, i)
    no_conn(x, y)

# ══════════════════════════════════════════════════════════════════════════════
# FILE HEADER
# ══════════════════════════════════════════════════════════════════════════════
w('(kicad_sch (version 20230121) (generator python_v05)')
w('  (paper "A1")')
w('  (title_block')
w('    (title "Universal Racing Sensor Board v0.5")')
w('    (date "2026-06-11")')
w('    (rev "0.5")')
w('    (company "AlexPabs Racing")')
w('    (comment 1 "WIZ850io, LMR33630-Q1, 6N137 RPM, 74AHCT125D NeoPixel, 4 MOSFETs")')
w('    (comment 2 "2 analog + 4 NTC, GPS 4-pin bidi, P-ch revprot, PTC, LIS3DH I2C")')
w('  )')
w()

# ══════════════════════════════════════════════════════════════════════════════
# LIB_SYMBOLS
# ══════════════════════════════════════════════════════════════════════════════
w('  (lib_symbols')

# ── Teensy 4.1 ── bw = 9*2.54 = 22.86 mm ─────────────────────────────────────
# v0.5 pin assignments: p18/19=I2C, p14/15=ANA, p16/17/20/21=EXPN, p35=GPS_TX
T41_L = [
    ("0",  "p0/CS_ETH",     "passive"),
    ("1",  "p1/SP1_MISO",   "passive"),
    ("2",  "p2/EXPN",       "passive"),  # freed (was CS_ACC for SPI LIS3DH)
    ("3",  "p3/CS_TC7",     "passive"),
    ("4",  "p4/CS_TC6",     "passive"),
    ("5",  "p5/CS_TC5",     "passive"),
    ("6",  "p6/CS_TC4",     "passive"),
    ("7",  "p7/CS_TC3",     "passive"),
    ("8",  "p8/CS_TC2",     "passive"),
    ("9",  "p9/CS_TC1",     "passive"),
    ("10", "p10/CS_TC0",    "passive"),
    ("11", "p11/MOSI",      "passive"),
    ("12", "p12/MISO",      "passive"),
    ("13", "p13/SCK",       "passive"),
    ("14", "p14/A0/ANA1",   "passive"),
    ("15", "p15/A1/ANA2",   "passive"),
    ("16", "p16/EXPN",      "passive"),
    ("17", "p17/EXPN",      "passive"),
    ("18", "p18/SDA",       "passive"),  # I2C Wire → LIS3DH
    ("19", "p19/SCL",       "passive"),  # I2C Wire → LIS3DH
    ("20", "p20/EXPN",      "passive"),
    ("21", "p21/EXPN",      "passive"),
]
T41_R = [
    ("VIN", "VIN",              "passive"),
    ("GND", "GND",              "passive"),
    ("3V3", "3V3",              "passive"),
    ("22",  "p22/A8/NTC1",      "passive"),
    ("23",  "p23/A9/NTC2",      "passive"),
    ("24",  "p24/A10/NTC3",     "passive"),
    ("25",  "p25/A11/NTC4",     "passive"),
    ("26",  "p26/SP1_MOSI",     "passive"),
    ("27",  "p27/SP1_SCK",      "passive"),
    ("28",  "p28/INT_ETH",      "passive"),
    ("29",  "p29/RST_ETH",      "passive"),
    ("30",  "p30/RPM_IN",       "passive"),  # 6N137 output
    ("31",  "p31/DIG1",         "passive"),
    ("32",  "p32/DIG2",         "passive"),
    ("33",  "p33/DIG3",         "passive"),
    ("34",  "p34/GPS_RX",       "passive"),  # Serial8 RX ← GPS TX
    ("35",  "p35/GPS_TX",       "passive"),  # Serial8 TX → GPS RX
    ("36",  "p36/NEO_3V3",      "passive"),  # 3.3V data → 74AHCT125D
    ("37",  "p37/MOS1",         "passive"),
    ("38",  "p38/MOS2",         "passive"),
    ("39",  "p39/MOS3",         "passive"),
    ("40",  "p40/MOS4",         "passive"),
    ("41",  "p41/EXPN",         "passive"),
]
T41_HW, T41_HH = define_sym(
    "Custom:Teensy41", "U",
    "Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical",
    T41_L, T41_R, bw=9*2.54)

# ── WIZ850io ── same 2×10 pinout as WIZ820io ─────────────────────────────────
WIZ_L = [
    ("A1",  "MISO",  "passive"),
    ("A2",  "SCLK",  "passive"),
    ("A3",  "SCSn",  "passive"),
    ("A4",  "MOSI",  "passive"),
    ("A5",  "GND",   "passive"),
    ("A6",  "INTn",  "passive"),
    ("A7",  "RSTn",  "passive"),
    ("A8",  "NC",    "no_connect"),
    ("A9",  "NC",    "no_connect"),
    ("A10", "GND",   "passive"),
]
WIZ_R = [
    ("B1",  "VCC",   "passive"),
    ("B2",  "NC",    "no_connect"),
    ("B3",  "NC",    "no_connect"),
    ("B4",  "NC",    "no_connect"),
    ("B5",  "NC",    "no_connect"),
    ("B6",  "VCC",   "passive"),
    ("B7",  "GND",   "passive"),
    ("B8",  "NC",    "no_connect"),
    ("B9",  "NC",    "no_connect"),
    ("B10", "GND",   "passive"),
]
WIZ_HW, WIZ_HH = define_sym(
    "Custom:WIZ850io", "U",
    "Connector_PinHeader_2.54mm:PinHeader_2x10_P2.54mm_Vertical",
    WIZ_L, WIZ_R, bw=8*2.54)

# ── MAX31855 ── bw = 5*2.54 ───────────────────────────────────────────────────
MAX_L = [
    ("1", "T-",  "passive"),
    ("2", "T+",  "passive"),
    ("3", "GND", "passive"),
    ("4", "~CS", "passive"),
]
MAX_R = [
    ("8", "VCC", "passive"),
    ("7", "NC",  "no_connect"),
    ("6", "SO",  "passive"),
    ("5", "SCK", "passive"),
]
MAX_HW, MAX_HH = define_sym(
    "Custom:MAX31855", "U",
    "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
    MAX_L, MAX_R, bw=5*2.54)

# ── LIS3DH ── I2C mode in v0.5 (CS→VDD, SDO=ADDR) ───────────────────────────
LIS_L = [
    ("11", "VDD_IO", "passive"),
    ("6",  "GND",    "passive"),
    ("14", "GND",    "passive"),
    ("4",  "~CS",    "passive"),  # tie to VDD_IO for I2C mode
    ("3",  "SCL",    "passive"),
    ("2",  "SDA",    "passive"),
]
LIS_R = [
    ("16", "VDD",  "passive"),
    ("1",  "SDO",  "passive"),   # I2C addr LSB: GND=0x18, VDD=0x19
    ("7",  "INT1", "passive"),
    ("8",  "INT2", "passive"),
    ("5",  "RES",  "no_connect"),
    ("15", "RES",  "no_connect"),
]
LIS_HW, LIS_HH = define_sym(
    "Custom:LIS3DH", "U",
    "Package_LGA:LGA-16_3x3mm_P0.5mm",
    LIS_L, LIS_R, bw=6*2.54)

# ── LMR33630Q1 ── SOIC-8, 12V→5V 3A automotive buck (replaces MP2307DN) ─────
LMR_L = [
    ("1", "BOOT", "passive"),
    ("2", "VIN",  "passive"),
    ("3", "VIN",  "passive"),
    ("4", "EN",   "passive"),
]
LMR_R = [
    ("8", "SW",  "passive"),
    ("7", "NC",  "no_connect"),
    ("6", "FB",  "passive"),
    ("5", "GND", "passive"),
]
LMR_HW, LMR_HH = define_sym(
    "Custom:LMR33630Q1", "U",
    "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
    LMR_L, LMR_R, bw=5*2.54)

# ── 6N137 ── fast optocoupler for RPM (replaces PC817 on DIG0) ───────────────
N6_L = [
    ("1", "NC",  "no_connect"),
    ("2", "A",   "passive"),
    ("3", "K",   "passive"),
    ("4", "GND", "passive"),
]
N6_R = [
    ("8", "NC",  "no_connect"),
    ("7", "EN",  "passive"),   # tie to VCC
    ("6", "VCC", "passive"),
    ("5", "VO",  "passive"),
]
N6_HW, N6_HH = define_sym(
    "Custom:6N137", "OK",
    "Package_DIP:DIP-8_W7.62mm",
    N6_L, N6_R, bw=5*2.54)

# ── AO3400A ── N-ch MOSFET, low-side output (same as v0.4) ───────────────────
MOS_L = [("1", "G", "passive")]
MOS_R = [
    ("3", "D", "passive"),
    ("2", "S", "passive"),
]
MOS_HW, MOS_HH = define_sym(
    "Custom:AO3400A", "Q",
    "Package_TO_SOT_SMD:SOT-23",
    MOS_L, MOS_R, bw=4*2.54)

# ── 74AHCT125D ── quad buffer SOIC-14, level-shifter 3.3V→5V for NeoPixel ────
LS_L = [
    ("1",  "~OE1", "passive"),
    ("2",  "1A",   "passive"),
    ("3",  "1Y",   "passive"),
    ("4",  "~OE2", "passive"),
    ("5",  "2A",   "passive"),
    ("6",  "2Y",   "passive"),
    ("7",  "GND",  "passive"),
]
LS_R = [
    ("14", "VCC",  "passive"),
    ("13", "~OE4", "passive"),
    ("12", "4A",   "passive"),
    ("11", "4Y",   "passive"),
    ("10", "~OE3", "passive"),
    ("9",  "3A",   "passive"),
    ("8",  "3Y",   "passive"),
]
LS_HW, LS_HH = define_sym(
    "Custom:74AHCT125D", "U",
    "Package_SO:SOIC-14_3.9x8.7mm_P1.27mm",
    LS_L, LS_R, bw=7*2.54)

# ── PMOS ── P-ch MOSFET for reverse polarity protection ──────────────────────
PMOS_L = [("2", "G", "passive")]
PMOS_R = [
    ("1", "S", "passive"),  # Source → VBAT_FUSED (positive input)
    ("3", "D", "passive"),  # Drain  → VBAT_PROT
]
PMOS_HW, PMOS_HH = define_sym(
    "Custom:PMOS", "Q",
    "Package_TO_SOT_SMD:SOT-23",
    PMOS_L, PMOS_R, bw=4*2.54)

# ── PTC fuse ── 2-terminal resettable fuse ────────────────────────────────────
PTC_L = [("1", "A", "passive")]
PTC_R = [("2", "B", "passive")]
PTC_HW, PTC_HH = define_sym(
    "Custom:PTC", "F",
    "Fuse:Fuse_1812_4532Metric",
    PTC_L, PTC_R, bw=4*2.54)

# ── TVS ── transient voltage suppressor (SMBJ18A) ────────────────────────────
TVS_L = [("1", "A", "passive")]
TVS_R = [("2", "K", "passive")]
TVS_HW, TVS_HH = define_sym(
    "Custom:TVS", "D",
    "Diode_SMD:D_SMB",
    TVS_L, TVS_R, bw=4*2.54)

# ── SS14 ── Schottky flyback diode on MOSFET outputs ─────────────────────────
SS14_L = [("1", "A", "passive")]
SS14_R = [("2", "K", "passive")]
SS14_HW, SS14_HH = define_sym(
    "Custom:SS14", "D",
    "Diode_SMD:D_SMA",
    SS14_L, SS14_R, bw=4*2.54)

# ── Conn2pin ── 2-pin screw terminal 5.08mm ───────────────────────────────────
CONN_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
]
CONN_HW, CONN_HH = define_sym(
    "Custom:Conn2pin", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
    CONN_L, [], bw=4*2.54)

# ── Conn3pin ── 3-pin screw terminal ─────────────────────────────────────────
CONN3_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
    ("3", "Pin3", "passive"),
]
CONN3_HW, CONN3_HH = define_sym(
    "Custom:Conn3pin", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-3-3.5_1x03_P3.50mm_Horizontal",
    CONN3_L, [], bw=4*2.54)

# ── Conn4pin ── 4-pin screw terminal (GPS bidirectional) ──────────────────────
CONN4_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
    ("3", "Pin3", "passive"),
    ("4", "Pin4", "passive"),
]
CONN4_HW, CONN4_HH = define_sym(
    "Custom:Conn4pin", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-4-3.5_1x04_P3.50mm_Horizontal",
    CONN4_L, [], bw=4*2.54)

# ── Conn6pin ── 6-pin expansion header ───────────────────────────────────────
CONN6_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
    ("3", "Pin3", "passive"),
    ("4", "Pin4", "passive"),
    ("5", "Pin5", "passive"),
    ("6", "Pin6", "passive"),
]
CONN6_HW, CONN6_HH = define_sym(
    "Custom:Conn6pin", "J",
    "Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical",
    CONN6_L, [], bw=4*2.54)

# ── Power input ── 2-pin 5.08mm screw terminal ────────────────────────────────
PWR_L = [
    ("1", "+12V", "passive"),
    ("2", "GND",  "passive"),
]
PWR_HW, PWR_HH = define_sym(
    "Custom:PwrConn", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.08mm_Horizontal",
    PWR_L, [], bw=4*2.54)

w('  )')  # end lib_symbols
w()

# ══════════════════════════════════════════════════════════════════════════════
# SCHEMATIC BODY
# ══════════════════════════════════════════════════════════════════════════════

# ── U1: Teensy 4.1 ────────────────────────────────────────────────────────────
T41_CX, T41_CY = gp(170), gp(230)
box(T41_CX-55, T41_CY-T41_HH-15, T41_CX+85, T41_CY+T41_HH+10)
txt("TEENSY 4.1 — MICROCONTROLLER (v0.5)", T41_CX-54, T41_CY-T41_HH-13, 2.5, True)
place("Custom:Teensy41", "U1", "Teensy_4.1",
      "Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical",
      T41_CX, T41_CY,
      [p[0] for p in T41_L] + [p[0] for p in T41_R])

nets_L = ["CS_ETH", "SP1_MISO", "EXPN_P2",
          "CS_TC7", "CS_TC6", "CS_TC5", "CS_TC4", "CS_TC3", "CS_TC2", "CS_TC1", "CS_TC0",
          "SPI_MOSI", "SPI_MISO", "SPI_SCK",
          "ANA1", "ANA2",
          "EXPN_P16", "EXPN_P17", "I2C_SDA", "I2C_SCL",
          "EXPN_P20", "EXPN_P21"]
for i, net in enumerate(nets_L):
    llbl(net, T41_CX, T41_CY, T41_HW, T41_HH, i)

nets_R = ["+5V", "GND", "+3V3",
          "NTC1", "NTC2", "NTC3", "NTC4",
          "SP1_MOSI", "SP1_SCK", "INT_ETH", "RST_ETH",
          "RPM_IN", "DIG1", "DIG2", "DIG3",
          "GPS_RX", "GPS_TX",
          "NEO_3V3",
          "MOS1", "MOS2", "MOS3", "MOS4",
          "EXPN_P41"]
for i, net in enumerate(nets_R):
    rlbl(net, T41_CX, T41_CY, T41_HW, T41_HH, i)

# ── U2: WIZ850io ──────────────────────────────────────────────────────────────
WIZ_CX, WIZ_CY = gp(370), gp(85)
box(WIZ_CX-55, WIZ_CY-WIZ_HH-12, WIZ_CX+65, WIZ_CY+WIZ_HH+10)
txt("WIZ850io — ETHERNET (SPI1, W5500)", WIZ_CX-54, WIZ_CY-WIZ_HH-10, 2.5, True)
place("Custom:WIZ850io", "U2", "WIZ850io",
      "Connector_PinHeader_2.54mm:PinHeader_2x10_P2.54mm_Vertical",
      WIZ_CX, WIZ_CY,
      [p[0] for p in WIZ_L] + [p[0] for p in WIZ_R])
llbl("SP1_MISO", WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 0)
llbl("SP1_SCK",  WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 1)
llbl("CS_ETH",   WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 2)
llbl("SP1_MOSI", WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 3)
lbl("GND",       *lp_xy(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 4), 180)
llbl("INT_ETH",  WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 5)
llbl("RST_ETH",  WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 6)
lnc(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 7)
lnc(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 8)
lbl("GND",       *lp_xy(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 9), 180)
lbl("+3V3",      *rp_xy(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 0), 0)
for i in [1, 2, 3, 4]: rnc(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, i)
lbl("+3V3",      *rp_xy(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 5), 0)
lbl("GND",       *rp_xy(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, 6), 0)
for i in [7, 8, 9]: rnc(WIZ_CX, WIZ_CY, WIZ_HW, WIZ_HH, i)

# ── U3–U10: MAX31855 × 8 ─────────────────────────────────────────────────────
MAX_CS = ["CS_TC0","CS_TC1","CS_TC2","CS_TC3","CS_TC4","CS_TC5","CS_TC6","CS_TC7"]
TC_P = [f"TC{i}_P" for i in range(1, 9)]
TC_M = [f"TC{i}_M" for i in range(1, 9)]

box(gp(440), gp(35), gp(655), gp(185))
txt("MAX31855 × 8 — THERMOCOUPLE ADC (SPI0)", gp(441), gp(37), 2.5, True)

for idx in range(8):
    col, row = idx // 4, idx % 4
    MCX = gp(510) + col * gp(87)
    MCY = gp(58)  + row * gp(28)
    place("Custom:MAX31855", f"U{idx+3}", "MAX31855KASA+",
          "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
          MCX, MCY,
          [p[0] for p in MAX_L] + [p[0] for p in MAX_R])
    llbl(TC_M[idx],    MCX, MCY, MAX_HW, MAX_HH, 0)
    llbl(TC_P[idx],    MCX, MCY, MAX_HW, MAX_HH, 1)
    lbl("GND",         *lp_xy(MCX, MCY, MAX_HW, MAX_HH, 2), 180)
    llbl(MAX_CS[idx],  MCX, MCY, MAX_HW, MAX_HH, 3)
    lbl("+3V3",        *rp_xy(MCX, MCY, MAX_HW, MAX_HH, 0), 0)
    rnc(MCX, MCY, MAX_HW, MAX_HH, 1)
    rlbl("SPI_MISO",   MCX, MCY, MAX_HW, MAX_HH, 2)
    rlbl("SPI_SCK",    MCX, MCY, MAX_HW, MAX_HH, 3)

# TC connectors J_TC1–J_TC8 (5.08mm screw terminals)
box(gp(440), gp(188), gp(655), gp(300))
txt("THERMOCOUPLE CONNECTORS J_TC1–J_TC8", gp(441), gp(190), 2.5, True)
for idx in range(8):
    col, row = idx // 4, idx % 4
    JCX = gp(468) + col * gp(87)
    JCY = gp(212) + row * gp(20)
    place("Custom:Conn2pin", f"J_TC{idx+1}", f"TC{idx+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          JCX, JCY, ["1", "2"])
    llbl(TC_P[idx], JCX, JCY, CONN_HW, CONN_HH, 0)
    llbl(TC_M[idx], JCX, JCY, CONN_HW, CONN_HH, 1)

# ── U11: LIS3DH — I2C mode ────────────────────────────────────────────────────
LIS_CX, LIS_CY = gp(370), gp(220)
box(LIS_CX-45, LIS_CY-LIS_HH-12, LIS_CX+65, LIS_CY+LIS_HH+10)
txt("LIS3DH — ACCELEROMETER (I2C, addr 0x18)", LIS_CX-44, LIS_CY-LIS_HH-10, 2.5, True)
place("Custom:LIS3DH", "U11", "LIS3DH",
      "Package_LGA:LGA-16_3x3mm_P0.5mm",
      LIS_CX, LIS_CY,
      [p[0] for p in LIS_L] + [p[0] for p in LIS_R])
lbl("+3V3",      *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 0), 180)
lbl("GND",       *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 1), 180)
lbl("GND",       *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 2), 180)
lbl("+3V3",      *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3), 180)  # CS tied to VDD → I2C mode
llbl("I2C_SCL",  LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
llbl("I2C_SDA",  LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)
lbl("+3V3",      *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 0), 0)
lbl("GND",       *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 1), 0)  # SDO→GND = addr 0x18
lbl("INT1_ACC",  *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 2), 0)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)

# ── U12: LMR33630Q1 — buck 12V→5V 3A ─────────────────────────────────────────
LMR_CX, LMR_CY = gp(370), gp(312)
box(LMR_CX-45, LMR_CY-LMR_HH-12, LMR_CX+70, LMR_CY+LMR_HH+20)
txt("LMR33630Q1 — BUCK 12V→5V 3A (automotive)", LMR_CX-44, LMR_CY-LMR_HH-10, 2.5, True)
place("Custom:LMR33630Q1", "U12", "LMR33630ADDAR",
      "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
      LMR_CX, LMR_CY,
      [p[0] for p in LMR_L] + [p[0] for p in LMR_R])
lbl("BOOT",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 0), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 1), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 2), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 3), 180)  # EN tied to VIN
lbl("+5V",       *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 0), 0)
rnc(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 1)
lbl("LMR_FB",    *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 2), 0)
lbl("GND",       *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 3), 0)
txt("Add: L_out, C_in, C_out, R-divider for 5V",
    LMR_CX-42, LMR_CY+LMR_HH+5, 1.5)

# ── POWER PROTECTION — J_PWR, F1 PTC, D_TVS, Q_PMOS ─────────────────────────
box(gp(240), gp(386), gp(430), gp(470))
txt("POWER INPUT + PROTECTION", gp(241), gp(388), 2.5, True)
txt("VBAT_12V_IN → PTC → VBAT_FUSED → PMOS(S→D) → VBAT_PROT(=+12V)", gp(241), gp(398), 1.3)
txt("TVS SMBJ18A: VBAT_PROT to GND  |  PMOS gate: GND via 10k", gp(241), gp(406), 1.3)

J_PWR_CX, J_PWR_CY = gp(272), gp(428)
place("Custom:PwrConn", "J_PWR", "PWR_IN_12V",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.08mm_Horizontal",
      J_PWR_CX, J_PWR_CY, ["1", "2"])
lbl("VBAT_12V_IN", *lp_xy(J_PWR_CX, J_PWR_CY, PWR_HW, PWR_HH, 0), 180)
lbl("GND",         *lp_xy(J_PWR_CX, J_PWR_CY, PWR_HW, PWR_HH, 1), 180)

F1_CX, F1_CY = gp(315), gp(428)
place("Custom:PTC", "F1", "PTC_500mA",
      "Fuse:Fuse_1812_4532Metric",
      F1_CX, F1_CY, ["1", "2"])
lbl("VBAT_12V_IN", *lp_xy(F1_CX, F1_CY, PTC_HW, PTC_HH, 0), 180)
lbl("VBAT_FUSED",  *rp_xy(F1_CX, F1_CY, PTC_HW, PTC_HH, 0), 0)

QP_CX, QP_CY = gp(360), gp(428)
place("Custom:PMOS", "Q_PMOS", "AO3401A",
      "Package_TO_SOT_SMD:SOT-23",
      QP_CX, QP_CY, ["2", "1", "3"])
lbl("GND",         *lp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 0), 180)  # gate→GND
lbl("VBAT_FUSED",  *rp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 0), 0)    # source
lbl("+12V",        *rp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 1), 0)     # drain → protected

D_TVS_CX, D_TVS_CY = gp(397), gp(450)
place("Custom:TVS", "D_TVS", "SMBJ18A",
      "Diode_SMD:D_SMB",
      D_TVS_CX, D_TVS_CY, ["1", "2"])
lbl("+12V",  *lp_xy(D_TVS_CX, D_TVS_CY, TVS_HW, TVS_HH, 0), 180)  # anode=VBAT_PROT
lbl("GND",   *rp_xy(D_TVS_CX, D_TVS_CY, TVS_HW, TVS_HH, 0), 0)

# ── OK1: 6N137 — RPM input ────────────────────────────────────────────────────
box(gp(28), gp(296), gp(235), gp(365))
txt("DIGITAL INPUTS", gp(29), gp(298), 2.5, True)
txt("RPM: 6N137 fast opto  |  DIG1-3: RC filter + Zener (see notes)", gp(29), gp(308), 1.2)
txt("J_RPM: 270ohm series + 5.1V Zener clamp before 6N137 LED", gp(29), gp(316), 1.2)
txt("DIG1-3: 10k series + 3.3V Zener + 100nF to GND + 10k pullup to 3V3", gp(29), gp(324), 1.2)

RPM_JCX, RPM_JCY = gp(65), gp(340)
place("Custom:Conn2pin", "J_RPM", "RPM_IN",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
      RPM_JCX, RPM_JCY, ["1", "2"])
lbl("RPM_SIG",  *lp_xy(RPM_JCX, RPM_JCY, CONN_HW, CONN_HH, 0), 180)
lbl("GND",      *lp_xy(RPM_JCX, RPM_JCY, CONN_HW, CONN_HH, 1), 180)

OK1_CX, OK1_CY = gp(150), gp(340)
place("Custom:6N137", "OK1", "6N137",
      "Package_DIP:DIP-8_W7.62mm",
      OK1_CX, OK1_CY,
      [p[0] for p in N6_L] + [p[0] for p in N6_R])
lnc(OK1_CX, OK1_CY, N6_HW, N6_HH, 0)
lbl("RPM_SIG",  *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 1), 180)
lbl("GND",      *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 2), 180)
lbl("GND",      *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 3), 180)
rnc(OK1_CX, OK1_CY, N6_HW, N6_HH, 0)
lbl("+3V3",     *rp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 1), 0)  # EN tied to VCC
lbl("+3V3",     *rp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 2), 0)
rlbl("RPM_IN",   OK1_CX, OK1_CY, N6_HW, N6_HH, 3)

# DIG1–DIG3 connectors (filtered, no opto)
DIG_NETS = ["DIG1", "DIG2", "DIG3"]
DIG_JNAMES = ["J_DIG1", "J_DIG2", "J_DIG3"]
for i in range(3):
    DJX = gp(80)
    DJY = gp(355) + i * gp(16)
    place("Custom:Conn2pin", DIG_JNAMES[i], f"DIG{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          DJX, DJY, ["1", "2"])
    lbl(f"DIG{i+1}_SIG",  *lp_xy(DJX, DJY, CONN_HW, CONN_HH, 0), 180)
    lbl("GND",              *lp_xy(DJX, DJY, CONN_HW, CONN_HH, 1), 180)
    lbl(f"DIG{i+1}_SIG",   gp(130), DJY-gp(1), 0)
    lbl(DIG_NETS[i],        gp(160), DJY-gp(1), 0)

# ── Q1–Q4: AO3400A MOSFETs + SS14 flyback + load connectors ─────────────────
MOS_NETS  = ["MOS1","MOS2","MOS3","MOS4"]
MOS_NAMES = ["FAN","PUMP","SHIFT_LIGHT","SPARE"]
box(gp(28), gp(368), gp(235), gp(468))
txt("MOSFET OUTPUTS × 4 (AO3400A N-ch + SS14 flyback)", gp(29), gp(370), 2.5, True)
txt("OUT1=FAN  OUT2=PUMP  OUT3=SHIFT-LIGHT  OUT4=SPARE", gp(29), gp(380), 1.2)

for i in range(4):
    QCX = gp(90)
    QCY = gp(396) + i * gp(17)

    place("Custom:AO3400A", f"Q{i+1}", "AO3400A",
          "Package_TO_SOT_SMD:SOT-23",
          QCX, QCY,
          [p[0] for p in MOS_L] + [p[0] for p in MOS_R])
    llbl(MOS_NETS[i], QCX, QCY, MOS_HW, MOS_HH, 0)
    rlbl(f"LOAD{i+1}",  QCX, QCY, MOS_HW, MOS_HH, 0)
    lbl("GND",         *rp_xy(QCX, QCY, MOS_HW, MOS_HH, 1), 0)

    # SS14 flyback diode (anode=LOAD, cathode=+12V)
    DSCX = gp(130)
    DSCY = QCY
    place("Custom:SS14", f"D_MOS{i+1}", "SS14",
          "Diode_SMD:D_SMA",
          DSCX, DSCY, ["1", "2"])
    llbl(f"LOAD{i+1}", DSCX, DSCY, SS14_HW, SS14_HH, 0)
    lbl("+12V",         *rp_xy(DSCX, DSCY, SS14_HW, SS14_HH, 0), 0)

    # Load connector
    JCX = gp(185)
    JCY = QCY
    place("Custom:Conn2pin", f"J_OUT{i+1}", f"OUT{i+1}_{MOS_NAMES[i]}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          JCX, JCY, ["1", "2"])
    llbl(f"LOAD{i+1}", JCX, JCY, CONN_HW, CONN_HH, 0)
    lbl("+12V",        *lp_xy(JCX, JCY, CONN_HW, CONN_HH, 1), 180)

# ── Analog inputs ANA1–ANA2 ──────────────────────────────────────────────────
box(gp(28), gp(128), gp(148), gp(190))
txt("ANALOG IN (0-5V)", gp(29), gp(130), 2.5, True)
txt("10k/15k divider to 3.3V", gp(29), gp(140), 1.2)
for i in range(2):
    ACX = gp(72)
    ACY = gp(157) + i * gp(17)
    place("Custom:Conn2pin", f"J_ANA{i+1}", f"ANA{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          ACX, ACY, ["1", "2"])
    llbl(f"ANA{i+1}", ACX, ACY, CONN_HW, CONN_HH, 0)
    lbl("GND",         *lp_xy(ACX, ACY, CONN_HW, CONN_HH, 1), 180)

# ── NTC inputs NTC1–NTC4 ─────────────────────────────────────────────────────
box(gp(28), gp(192), gp(148), gp(295))
txt("NTC INPUTS (10k pull-up to 3V3)", gp(29), gp(194), 2.5, True)
for i in range(4):
    NCX = gp(72)
    NCY = gp(218) + i * gp(17)
    place("Custom:Conn2pin", f"J_NTC{i+1}", f"NTC{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          NCX, NCY, ["1", "2"])
    llbl(f"NTC{i+1}", NCX, NCY, CONN_HW, CONN_HH, 0)
    lbl("GND",         *lp_xy(NCX, NCY, CONN_HW, CONN_HH, 1), 180)

# ── Expansion header (unused Teensy I/O) ─────────────────────────────────────
box(gp(155), gp(128), gp(238), gp(200))
txt("EXPANSION (unused Teensy I/O)", gp(156), gp(130), 2.0, True)
txt("p2, p16, p17, p20, p21, p41", gp(156), gp(140), 1.3)
EXP_CX, EXP_CY = gp(193), gp(170)
place("Custom:Conn6pin", "J_EXP", "EXPANSION",
      "Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical",
      EXP_CX, EXP_CY, ["1","2","3","4","5","6"])
for i, net in enumerate(["EXPN_P2","EXPN_P16","EXPN_P17","EXPN_P20","EXPN_P21","EXPN_P41"]):
    llbl(net, EXP_CX, EXP_CY, CONN6_HW, CONN6_HH, i)

# ── GPS 4-pin bidirectional ───────────────────────────────────────────────────
box(gp(240), gp(472), gp(430), gp(516))
txt("GPS — 4-pin bidirectional (Serial8)", gp(241), gp(474), 2.5, True)
txt("+3V3, GND, GPS_TX→Teensy_RX(p34), Teensy_TX(p35)→GPS_RX", gp(241), gp(484), 1.2)
GPS_CX, GPS_CY = gp(300), gp(500)
place("Custom:Conn4pin", "J_GPS", "GPS_MODULE",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-4-3.5_1x04_P3.50mm_Horizontal",
      GPS_CX, GPS_CY, ["1","2","3","4"])
lbl("+3V3",    *lp_xy(GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 0), 180)
lbl("GND",     *lp_xy(GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 1), 180)
llbl("GPS_RX",  GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 2)  # GPS TX → Teensy p34 RX
llbl("GPS_TX",  GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 3)  # Teensy p35 TX → GPS RX

# ── NeoPixel + 74AHCT125D level-shifter ──────────────────────────────────────
box(gp(240), gp(518), gp(430), gp(590))
txt("NEOPIXEL + 74AHCT125D LEVEL-SHIFTER", gp(241), gp(520), 2.5, True)
txt("NEO_3V3(p36) → 1A → 1Y(5V) → J_NEO data  |  OE1 tied to GND", gp(241), gp(530), 1.2)
txt("Buffers 2-4: OE tied to VCC (disabled, NC inputs/outputs)", gp(241), gp(538), 1.2)

LS_CX, LS_CY = gp(310), gp(565)
place("Custom:74AHCT125D", "U13", "74AHCT125D-Q100",
      "Package_SO:SOIC-14_3.9x8.7mm_P1.27mm",
      LS_CX, LS_CY,
      [p[0] for p in LS_L] + [p[0] for p in LS_R])
lbl("GND",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 0), 180)  # ~OE1 → GND (always enabled)
llbl("NEO_3V3",    LS_CX, LS_CY, LS_HW, LS_HH, 1)               # 1A = Teensy 3.3V data
rlbl("NEO_5V",     LS_CX, LS_CY, LS_HW, LS_HH, 2)               # ... mapped via right side
lbl("+5V",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 3), 180)  # ~OE2 → +5V (disabled)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 4)                               # 2A NC
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 5)                               # 2Y NC
lbl("GND",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 6), 180)  # GND
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 0), 0)    # VCC
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 1), 0)    # ~OE4 → +5V (disabled)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 2)                               # 4A NC
rlbl("NEO_5V",     LS_CX, LS_CY, LS_HW, LS_HH, 3)               # 1Y output = 5V NeoPixel data
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 4), 0)    # ~OE3 → +5V (disabled)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 5)                               # 3A NC
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 6)                               # 3Y NC

NEO_CX, NEO_CY = gp(393), gp(565)
place("Custom:Conn3pin", "J_NEO", "NEOPIXEL_WS2812B",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-3-3.5_1x03_P3.50mm_Horizontal",
      NEO_CX, NEO_CY, ["1","2","3"])
lbl("+5V",     *lp_xy(NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 0), 180)
llbl("NEO_5V",  NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 1)
lbl("GND",     *lp_xy(NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 2), 180)

# ── Net legend ────────────────────────────────────────────────────────────────
box(gp(658), gp(35), gp(900), gp(395))
txt("NET LEGEND — v0.5", gp(660), gp(37), 3.0, True)
legend = [
    ("SPI_MOSI/MISO/SCK", "Teensy p11/12/13 → MAX31855×8 (SPI0, main bus)"),
    ("SP1_MOSI/MISO/SCK",  "Teensy p26/1/27 ↔ WIZ850io (SPI1, second bus)"),
    ("CS_ETH",   "Teensy p0 → WIZ850io SCSn"),
    ("CS_TC0-7", "Teensy p10,9,8,7,6,5,4,3 → MAX31855 #0-7"),
    ("INT_ETH",  "WIZ850io INTn → Teensy p28"),
    ("RST_ETH",  "Teensy p29 → WIZ850io RSTn"),
    ("I2C_SDA",  "Teensy p18 (Wire SDA) ↔ LIS3DH SDA"),
    ("I2C_SCL",  "Teensy p19 (Wire SCL) ↔ LIS3DH SCL"),
    ("ANA1-2",   "0-5V sensors → Teensy A0-A1 (p14-15) via 10k/15k divider"),
    ("NTC1-4",   "NTC 10k pull-up to 3V3 → Teensy A8-A11 (p22-25)"),
    ("RPM_IN",   "Coil/tacho → 270ohm → 6N137 LED → Teensy p30 (fast opto)"),
    ("DIG1-3",   "Switch → 10k → Zener 3.3V + 100nF + 10k pullup → Teensy p31-33"),
    ("GPS_RX",   "GPS TX → Teensy p34 Serial8 RX (4800/9600 baud NMEA)"),
    ("GPS_TX",   "Teensy p35 Serial8 TX → GPS RX (bidirectional v0.5)"),
    ("NEO_3V3",  "Teensy p36 3.3V data → 74AHCT125D buf1 → 5V → NeoPixel"),
    ("MOS1-4",   "Teensy p37-40 → 100ohm → AO3400A gate (fan/pump/light/spare)"),
    ("LOAD1-4",  "MOSFET drain → SS14 Schottky to +12V (flyback) + J_OUTx"),
    ("TC1-8",    "K-type thermocouple T+/T- → MAX31855 (EGT/CHT/oil/coolant)"),
    ("VBAT_12V_IN","Vehicle 10-16V input at J_PWR (5.08mm screw terminal)"),
    ("VBAT_FUSED", "After PTC resettable fuse (~500mA)"),
    ("+12V",     "After P-ch MOSFET reverse protect + SMBJ18A TVS clamp"),
    ("+5V",      "LMR33630Q1 12V→5V 3A buck (Teensy VIN, GPS, NeoPixel)"),
    ("+3V3",     "Teensy internal reg ~250mA (LIS3DH, MAX31855, logic)"),
    ("EXPN",     "6 unused Teensy pins on J_EXP header (p2,p16,p17,p20,p21,p41)"),
    ("BOM v0.5", "WIZ850io · LMR33630-Q1 · 6N137 · 74AHCT125D · PMOS · PTC · SS14"),
]
for i, (net, desc) in enumerate(legend):
    txt(f"{net}:", gp(660), gp(57)+i*13, 1.3, True)
    txt(desc,       gp(730), gp(57)+i*13, 1.3)

# ══════════════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════════════
w()
w(')')

# ── Write ──────────────────────────────────────────────────────────────────────
path = "/home/user/Racing_Dashboard/hardware/pcb/kicad/racing_sensor_board_v0.5.kicad_sch"
with open(path, 'w') as f:
    f.write('\n'.join(out) + '\n')
print(f"Written {len(out)} lines → {path}")

bad = [(i+1, l) for i, l in enumerate(out) if l.count('"') % 2 == 1]
if bad:
    print(f"WARNING: {len(bad)} lines with odd quote count:")
    for n, l in bad[:10]: print(f"  line {n}: {l[:80]}")
else:
    print("OK: all strings properly terminated")

import re
G_CHK = 1.27
off = []
for i, line in enumerate(out):
    m = re.search(r'\(at\s+([-\d.]+)\s+([-\d.]+)\s+\d', line)
    if m and 'pin ' in line:
        for v in [float(m.group(1)), float(m.group(2))]:
            if abs(round(v/G_CHK)*G_CHK - v) > 0.005:
                off.append((i+1, line.strip()[:70]))
                break
if off:
    print(f"WARNING: {len(off)} lib-symbol pins off 1.27mm grid:")
    for n, l in off[:10]: print(f"  line {n}: {l}")
else:
    print("OK: all lib-symbol pin 'at' coordinates on 1.27mm grid")
