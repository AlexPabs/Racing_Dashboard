#!/usr/bin/env python3
"""Generate racing_sensor_board_v0.5.kicad_sch — COMPLETE with all discretes.

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
  - Status LED on p2 (green 0805 + 1k)
  - Reset button (6mm tactile, RST→GND)
  - 10 test pads
  - 300 ohm NeoPixel series resistor
  - ALL discrete components (R, C, L, LED, D, SW, TP) now emitted
  - Standard reference designators (R1, C1, J1, …)

v0.5.1 RPM fix: two-stage protection
  - R1 (1.5k) before Zener clamp, R2 (270) to 6N137 LED
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
w('    (date "2026-06-17")')
w('    (rev "0.5.1")')
w('    (company "AlexPabs Racing")')
w('    (comment 1 "Complete schematic with all discretes — 117 components")')
w('    (comment 2 "Standard ref designators — R1/C1/J1 scheme")')
w('  )')
w()

# ══════════════════════════════════════════════════════════════════════════════
# LIB_SYMBOLS
# ══════════════════════════════════════════════════════════════════════════════
w('  (lib_symbols')

# ── Teensy 4.1 ── bw = 9*2.54 = 22.86 mm ─────────────────────────────────────
T41_L = [
    ("0",  "p0/CS_ETH",     "passive"),
    ("1",  "p1/SP1_MISO",   "passive"),
    ("2",  "p2/STATUS_LED", "passive"),
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
    ("18", "p18/SDA",       "passive"),
    ("19", "p19/SCL",       "passive"),
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
    ("30",  "p30/RPM_IN",       "passive"),
    ("31",  "p31/DIG1",         "passive"),
    ("32",  "p32/DIG2",         "passive"),
    ("33",  "p33/DIG3",         "passive"),
    ("34",  "p34/GPS_RX",       "passive"),
    ("35",  "p35/GPS_TX",       "passive"),
    ("36",  "p36/NEO_3V3",      "passive"),
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

# ── WIZ850io ──────────────────────────────────────────────────────────────────
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

# ── MAX31855 ──────────────────────────────────────────────────────────────────
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

# ── LIS3DH ── I2C mode (CS→VDD, SDO=ADDR) ───────────────────────────────────
LIS_L = [
    ("11", "VDD_IO", "passive"),
    ("6",  "GND",    "passive"),
    ("14", "GND",    "passive"),
    ("4",  "~CS",    "passive"),
    ("3",  "SCL",    "passive"),
    ("2",  "SDA",    "passive"),
]
LIS_R = [
    ("16", "VDD",  "passive"),
    ("1",  "SDO",  "passive"),
    ("7",  "INT1", "passive"),
    ("8",  "INT2", "passive"),
    ("5",  "RES",  "no_connect"),
    ("15", "RES",  "no_connect"),
]
LIS_HW, LIS_HH = define_sym(
    "Custom:LIS3DH", "U",
    "Package_LGA:LGA-16_3x3mm_P0.5mm",
    LIS_L, LIS_R, bw=6*2.54)

# ── LMR33630Q1 ── SOIC-8, 12V→5V 3A automotive buck ─────────────────────────
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

# ── 6N137 ── fast optocoupler for RPM ────────────────────────────────────────
N6_L = [
    ("1", "NC",  "no_connect"),
    ("2", "A",   "passive"),
    ("3", "K",   "passive"),
    ("4", "GND", "passive"),
]
N6_R = [
    ("8", "NC",  "no_connect"),
    ("7", "EN",  "passive"),
    ("6", "VCC", "passive"),
    ("5", "VO",  "passive"),
]
N6_HW, N6_HH = define_sym(
    "Custom:6N137", "OK",
    "Package_DIP:DIP-8_W7.62mm",
    N6_L, N6_R, bw=5*2.54)

# ── AO3400A ── N-ch MOSFET, low-side output ─────────────────────────────────
MOS_L = [("1", "G", "passive")]
MOS_R = [
    ("3", "D", "passive"),
    ("2", "S", "passive"),
]
MOS_HW, MOS_HH = define_sym(
    "Custom:AO3400A", "Q",
    "Package_TO_SOT_SMD:SOT-23",
    MOS_L, MOS_R, bw=4*2.54)

# ── 74AHCT125D ── quad buffer SOIC-14, level-shifter 3.3V→5V ────────────────
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

# ── PMOS ── P-ch MOSFET for reverse polarity protection ─────────────────────
PMOS_L = [("2", "G", "passive")]
PMOS_R = [
    ("1", "S", "passive"),
    ("3", "D", "passive"),
]
PMOS_HW, PMOS_HH = define_sym(
    "Custom:PMOS", "Q",
    "Package_TO_SOT_SMD:SOT-23",
    PMOS_L, PMOS_R, bw=4*2.54)

# ── PTC fuse ─────────────────────────────────────────────────────────────────
PTC_L = [("1", "A", "passive")]
PTC_R = [("2", "B", "passive")]
PTC_HW, PTC_HH = define_sym(
    "Custom:PTC", "F",
    "Fuse:Fuse_1812_4532Metric",
    PTC_L, PTC_R, bw=4*2.54)

# ── TVS ── transient voltage suppressor (SMBJ18A) ───────────────────────────
TVS_L = [("1", "A", "passive")]
TVS_R = [("2", "K", "passive")]
TVS_HW, TVS_HH = define_sym(
    "Custom:TVS", "D",
    "Diode_SMD:D_SMB",
    TVS_L, TVS_R, bw=4*2.54)

# ── SS14 ── Schottky flyback diode ───────────────────────────────────────────
SS14_L = [("1", "A", "passive")]
SS14_R = [("2", "K", "passive")]
SS14_HW, SS14_HH = define_sym(
    "Custom:SS14", "D",
    "Diode_SMD:D_SMA",
    SS14_L, SS14_R, bw=4*2.54)

# ── Resistor ── 0805 generic ─────────────────────────────────────────────────
R_L = [("1", "1", "passive")]
R_R = [("2", "2", "passive")]
R_HW, R_HH = define_sym(
    "Custom:R_0805", "R",
    "Resistor_SMD:R_0805_2012Metric",
    R_L, R_R, bw=4*2.54)

# ── Capacitor ── 0805 ceramic ────────────────────────────────────────────────
C_L = [("1", "1", "passive")]
C_R = [("2", "2", "passive")]
C_HW, C_HH = define_sym(
    "Custom:C_0805", "C",
    "Capacitor_SMD:C_0805_2012Metric",
    C_L, C_R, bw=4*2.54)

# ── Capacitor electrolytic ── radial 6.3mm ───────────────────────────────────
CE_L = [("1", "+", "passive")]
CE_R = [("2", "-", "passive")]
CE_HW, CE_HH = define_sym(
    "Custom:C_Elec", "C",
    "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm",
    CE_L, CE_R, bw=4*2.54)

# ── Inductor ── for buck converter ───────────────────────────────────────────
IND_L = [("1", "1", "passive")]
IND_R = [("2", "2", "passive")]
IND_HW, IND_HH = define_sym(
    "Custom:Inductor", "L",
    "Inductor_SMD:L_1210_3225Metric",
    IND_L, IND_R, bw=4*2.54)

# ── Zener diode ── SOD-323 ───────────────────────────────────────────────────
ZEN_L = [("1", "A", "passive")]
ZEN_R = [("2", "K", "passive")]
ZEN_HW, ZEN_HH = define_sym(
    "Custom:Zener", "D",
    "Diode_SMD:D_SOD-323",
    ZEN_L, ZEN_R, bw=4*2.54)

# ── LED ── 0805 SMD ──────────────────────────────────────────────────────────
LED_SYM_L = [("1", "A", "passive")]
LED_SYM_R = [("2", "K", "passive")]
LED_HW, LED_HH = define_sym(
    "Custom:LED_0805", "LED",
    "LED_SMD:LED_0805_2012Metric",
    LED_SYM_L, LED_SYM_R, bw=4*2.54)

# ── Tactile switch ── 6mm ────────────────────────────────────────────────────
SW_L = [("1", "1", "passive")]
SW_R = [("2", "2", "passive")]
SW_HW, SW_HH = define_sym(
    "Custom:SW_Tactile", "SW",
    "Button_Switch_THT:SW_PUSH_6mm_H5mm",
    SW_L, SW_R, bw=4*2.54)

# ── Test pad ── 1-pin ────────────────────────────────────────────────────────
TP_PINS = [("1", "1", "passive")]
TP_HW, TP_HH = define_sym(
    "Custom:TestPad", "TP",
    "TestPoint:TestPoint_Pad_D1.5mm",
    TP_PINS, [], bw=3*2.54)

# ── Connectors ───────────────────────────────────────────────────────────────
CONN_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
]
CONN_HW, CONN_HH = define_sym(
    "Custom:Conn2pin", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
    CONN_L, [], bw=4*2.54)

CONN3_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
    ("3", "Pin3", "passive"),
]
CONN3_HW, CONN3_HH = define_sym(
    "Custom:Conn3pin", "J",
    "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-3-3.5_1x03_P3.50mm_Horizontal",
    CONN3_L, [], bw=4*2.54)

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
# HELPER: place 2-pin discrete inline
# ══════════════════════════════════════════════════════════════════════════════
def place_r(ref, val, cx, cy, net_a, net_b):
    """Place resistor and label both pins."""
    place("Custom:R_0805", ref, val,
          "Resistor_SMD:R_0805_2012Metric", cx, cy, ["1", "2"])
    lbl(net_a, *lp_xy(cx, cy, R_HW, R_HH, 0), 180)
    lbl(net_b, *rp_xy(cx, cy, R_HW, R_HH, 0), 0)

def place_c(ref, val, cx, cy, net_a, net_b):
    """Place ceramic capacitor and label both pins."""
    place("Custom:C_0805", ref, val,
          "Capacitor_SMD:C_0805_2012Metric", cx, cy, ["1", "2"])
    lbl(net_a, *lp_xy(cx, cy, C_HW, C_HH, 0), 180)
    lbl(net_b, *rp_xy(cx, cy, C_HW, C_HH, 0), 0)

def place_ce(ref, val, cx, cy, net_a, net_b):
    """Place electrolytic capacitor."""
    place("Custom:C_Elec", ref, val,
          "Capacitor_THT:CP_Radial_D6.3mm_P2.50mm", cx, cy, ["1", "2"])
    lbl(net_a, *lp_xy(cx, cy, CE_HW, CE_HH, 0), 180)
    lbl(net_b, *rp_xy(cx, cy, CE_HW, CE_HH, 0), 0)

def place_zener(ref, val, cx, cy, net_a, net_k):
    """Place Zener diode (anode to GND, cathode to signal)."""
    place("Custom:Zener", ref, val,
          "Diode_SMD:D_SOD-323", cx, cy, ["1", "2"])
    lbl(net_a, *lp_xy(cx, cy, ZEN_HW, ZEN_HH, 0), 180)
    lbl(net_k, *rp_xy(cx, cy, ZEN_HW, ZEN_HH, 0), 0)

def place_tp(ref, net, cx, cy):
    """Place test pad."""
    place("Custom:TestPad", ref, net,
          "TestPoint:TestPoint_Pad_D1.5mm", cx, cy, ["1"])
    lbl(net, *lp_xy(cx, cy, TP_HW, TP_HH, 0), 180)


# ══════════════════════════════════════════════════════════════════════════════
# SCHEMATIC BODY
# ══════════════════════════════════════════════════════════════════════════════

# ── U1: Teensy 4.1 ────────────────────────────────────────────────────────────
T41_CX, T41_CY = gp(170), gp(230)
box(T41_CX-55, T41_CY-T41_HH-15, T41_CX+85, T41_CY+T41_HH+10)
txt("TEENSY 4.1 — MICROCONTROLLER (v0.5.1)", T41_CX-54, T41_CY-T41_HH-13, 2.5, True)
place("Custom:Teensy41", "U1", "Teensy_4.1",
      "Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical",
      T41_CX, T41_CY,
      [p[0] for p in T41_L] + [p[0] for p in T41_R])

nets_L = ["CS_ETH", "SP1_MISO", "STATUS_LED",
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

# ── U3–U10: MAX31855 × 8 + bypass caps C6–C13 ──────────────────────────────
MAX_CS = ["CS_TC0","CS_TC1","CS_TC2","CS_TC3","CS_TC4","CS_TC5","CS_TC6","CS_TC7"]
TC_P = [f"TC{i}_P" for i in range(1, 9)]
TC_M = [f"TC{i}_M" for i in range(1, 9)]

box(gp(440), gp(35), gp(655), gp(185))
txt("MAX31855 x 8 — THERMOCOUPLE ADC (SPI0)", gp(441), gp(37), 2.5, True)

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
    # C6–C13: 100nF bypass cap for each MAX31855
    place_c(f"C{idx+6}", "100nF", MCX + gp(30), MCY, "+3V3", "GND")

# TC connectors J2–J9
box(gp(440), gp(188), gp(655), gp(300))
txt("THERMOCOUPLE CONNECTORS J2–J9", gp(441), gp(190), 2.5, True)
for idx in range(8):
    col, row = idx // 4, idx % 4
    JCX = gp(468) + col * gp(87)
    JCY = gp(212) + row * gp(20)
    place("Custom:Conn2pin", f"J{idx+2}", f"TC{idx+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          JCX, JCY, ["1", "2"])
    llbl(TC_P[idx], JCX, JCY, CONN_HW, CONN_HH, 0)
    llbl(TC_M[idx], JCX, JCY, CONN_HW, CONN_HH, 1)

# ── U11: LIS3DH — I2C + bypass caps C14–C15 ─────────────────────────────────
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
lbl("+3V3",      *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3), 180)
llbl("I2C_SCL",  LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
llbl("I2C_SDA",  LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)
lbl("+3V3",      *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 0), 0)
lbl("GND",       *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 1), 0)
lbl("INT1_ACC",  *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 2), 0)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)
# LIS3DH bypass caps
place_c("C14", "100nF", LIS_CX + gp(40), LIS_CY - gp(8), "+3V3", "GND")
place_c("C15", "100nF", LIS_CX + gp(40), LIS_CY + gp(8), "+3V3", "GND")

# ── U12: LMR33630Q1 — buck 12V→5V + ALL passives ────────────────────────────
LMR_CX, LMR_CY = gp(370), gp(312)
box(LMR_CX-45, LMR_CY-LMR_HH-12, LMR_CX+90, LMR_CY+LMR_HH+35)
txt("LMR33630Q1 — BUCK 12V to 5V 3A (automotive)", LMR_CX-44, LMR_CY-LMR_HH-10, 2.5, True)
place("Custom:LMR33630Q1", "U12", "LMR33630ADDAR",
      "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
      LMR_CX, LMR_CY,
      [p[0] for p in LMR_L] + [p[0] for p in LMR_R])
lbl("BOOT_LMR",  *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 0), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 1), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 2), 180)
lbl("+12V",      *lp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 3), 180)
lbl("SW_LMR",   *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 0), 0)
rnc(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 1)
lbl("LMR_FB",    *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 2), 0)
lbl("GND",       *rp_xy(LMR_CX, LMR_CY, LMR_HW, LMR_HH, 3), 0)

# Buck passives
PY = LMR_CY + LMR_HH + gp(8)
# C1: input ceramic
place_c("C1", "100nF", LMR_CX - gp(30), PY, "+12V", "GND")
# C2: input electrolytic
place_ce("C2", "100uF/25V", LMR_CX - gp(10), PY, "+12V", "GND")
# C3: bootstrap cap (BOOT to SW)
place_c("C3", "100nF", LMR_CX + gp(10), PY, "BOOT_LMR", "SW_LMR")
# L1: buck inductor (SW to +5V)
place("Custom:Inductor", "L1", "10uH",
      "Inductor_SMD:L_1210_3225Metric",
      LMR_CX + gp(30), PY, ["1", "2"])
lbl("SW_LMR", *lp_xy(LMR_CX + gp(30), PY, IND_HW, IND_HH, 0), 180)
lbl("+5V",    *rp_xy(LMR_CX + gp(30), PY, IND_HW, IND_HH, 0), 0)
# C4: output ceramic
PY2 = PY + gp(12)
place_c("C4", "100nF", LMR_CX + gp(30), PY2, "+5V", "GND")
# C5: output electrolytic
place_ce("C5", "100uF/25V", LMR_CX + gp(50), PY2, "+5V", "GND")
# R23: FB divider top (5V to FB)
place_r("R23", "100k", LMR_CX + gp(50), PY, "+5V", "LMR_FB")
# R24: FB divider bottom (FB to GND)
place_r("R24", "24.9k", LMR_CX + gp(70), PY, "LMR_FB", "GND")
txt("FB: 5V x 24.9k/(100k+24.9k) = 0.994V (Vref=1.0V)", LMR_CX-44, PY2 + gp(8), 1.2)

# ── POWER PROTECTION — J1, F1, Q5, D1, R22 ──────────────────────────────────
box(gp(240), gp(386), gp(430), gp(470))
txt("POWER INPUT + PROTECTION", gp(241), gp(388), 2.5, True)
txt("VBAT_12V_IN -> PTC -> VBAT_FUSED -> PMOS(S->D) -> +12V", gp(241), gp(398), 1.3)
txt("TVS SMBJ18A: +12V to GND  |  PMOS gate: R22 10k to GND", gp(241), gp(406), 1.3)

J_PWR_CX, J_PWR_CY = gp(272), gp(428)
place("Custom:PwrConn", "J1", "PWR_IN_12V",
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
place("Custom:PMOS", "Q5", "AO3401A",
      "Package_TO_SOT_SMD:SOT-23",
      QP_CX, QP_CY, ["2", "1", "3"])
lbl("PMOS_GATE",   *lp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 0), 180)
lbl("VBAT_FUSED",  *rp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 0), 0)
lbl("+12V",        *rp_xy(QP_CX, QP_CY, PMOS_HW, PMOS_HH, 1), 0)

# R22: PMOS gate pull-down 10k
place_r("R22", "10k", gp(360), gp(450), "GND", "PMOS_GATE")

D_TVS_CX, D_TVS_CY = gp(397), gp(450)
place("Custom:TVS", "D1", "SMBJ18A",
      "Diode_SMD:D_SMB",
      D_TVS_CX, D_TVS_CY, ["1", "2"])
lbl("+12V",  *lp_xy(D_TVS_CX, D_TVS_CY, TVS_HW, TVS_HH, 0), 180)
lbl("GND",   *rp_xy(D_TVS_CX, D_TVS_CY, TVS_HW, TVS_HH, 0), 0)

# ── OK1: 6N137 — RPM input (two-stage protection) ───────────────────────────
box(gp(28), gp(296), gp(235), gp(365))
txt("DIGITAL INPUTS", gp(29), gp(298), 2.5, True)
txt("RPM: Two-stage protection + 6N137 fast opto", gp(29), gp(308), 1.2)
txt("R1(1.5k) -> D6(5.1V Zener) -> R2(270) -> 6N137 LED", gp(29), gp(316), 1.2)
txt("DIG1-3: R(10k) series + D(3.3V Zener) + C(100nF) + R(10k) pull-up", gp(29), gp(324), 1.2)

RPM_JCX, RPM_JCY = gp(50), gp(340)
place("Custom:Conn2pin", "J10", "RPM_IN",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
      RPM_JCX, RPM_JCY, ["1", "2"])
lbl("RPM_RAW",  *lp_xy(RPM_JCX, RPM_JCY, CONN_HW, CONN_HH, 0), 180)
lbl("GND",      *lp_xy(RPM_JCX, RPM_JCY, CONN_HW, CONN_HH, 1), 180)

# R1: 1.5k series (stage 1 — current limit for Zener)
place_r("R1", "1.5k", gp(85), gp(340), "RPM_RAW", "RPM_CLAMP")
# D6: 5.1V Zener (clamp after R1, anode to GND)
place_zener("D6", "BZX84-C5V1", gp(110), gp(352), "GND", "RPM_CLAMP")
# R2: 270 ohm (stage 2 — LED current limit)
place_r("R2", "270", gp(135), gp(340), "RPM_CLAMP", "RPM_LED")

OK1_CX, OK1_CY = gp(170), gp(340)
place("Custom:6N137", "OK1", "6N137",
      "Package_DIP:DIP-8_W7.62mm",
      OK1_CX, OK1_CY,
      [p[0] for p in N6_L] + [p[0] for p in N6_R])
lnc(OK1_CX, OK1_CY, N6_HW, N6_HH, 0)
lbl("RPM_LED",  *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 1), 180)
lbl("GND",      *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 2), 180)
lbl("GND",      *lp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 3), 180)
rnc(OK1_CX, OK1_CY, N6_HW, N6_HH, 0)
lbl("+3V3",     *rp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 1), 0)
lbl("+3V3",     *rp_xy(OK1_CX, OK1_CY, N6_HW, N6_HH, 2), 0)
rlbl("RPM_IN",   OK1_CX, OK1_CY, N6_HW, N6_HH, 3)

# R3: 10k pull-up on 6N137 output
place_r("R3", "10k", gp(210), gp(340), "RPM_IN", "+3V3")
# C16: 100nF bypass for 6N137
place_c("C16", "100nF", gp(210), gp(352), "+3V3", "GND")

# DIG1–DIG3 connectors + protection discretes
DIG_NETS = ["DIG1", "DIG2", "DIG3"]
for i in range(3):
    DJX = gp(50)
    DJY = gp(355) + (i+1) * gp(16)
    # Connector
    place("Custom:Conn2pin", f"J{11+i}", f"DIG{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          DJX, DJY, ["1", "2"])
    lbl(f"DIG{i+1}_RAW",  *lp_xy(DJX, DJY, CONN_HW, CONN_HH, 0), 180)
    lbl("GND",              *lp_xy(DJX, DJY, CONN_HW, CONN_HH, 1), 180)
    # R4-R6: 10k series
    place_r(f"R{4+i}", "10k", gp(90), DJY, f"DIG{i+1}_RAW", f"DIG{i+1}_FILT")
    # D7-D9: 3.3V Zener (anode GND, cathode to filtered signal)
    place_zener(f"D{7+i}", "BZX84-C3V3", gp(115), DJY + gp(8), "GND", f"DIG{i+1}_FILT")
    # C18-C20: 100nF filter cap
    place_c(f"C{18+i}", "100nF", gp(140), DJY + gp(8), f"DIG{i+1}_FILT", "GND")
    # R7-R9: 10k pull-up to 3V3
    place_r(f"R{7+i}", "10k", gp(165), DJY, f"DIG{i+1}_FILT", "+3V3")
    # Net label to Teensy
    lbl(DIG_NETS[i], gp(185), DJY - gp(1), 0)
    lbl(f"DIG{i+1}_FILT", gp(185), DJY - gp(1), 180)

# ── Q1–Q4: MOSFETs + gate resistors R18–R21 + SS14 + load connectors ────────
MOS_NETS  = ["MOS1","MOS2","MOS3","MOS4"]
MOS_NAMES = ["FAN","PUMP","SHIFT_LIGHT","SPARE"]
box(gp(28), gp(420), gp(235), gp(510))
txt("MOSFET OUTPUTS x 4 (AO3400A N-ch + SS14 flyback)", gp(29), gp(422), 2.5, True)
txt("R18-R21: 100ohm gate resistors  |  D2-D5: SS14 flyback", gp(29), gp(432), 1.2)

for i in range(4):
    QCY = gp(445) + i * gp(15)

    # R18-R21: gate resistor
    place_r(f"R{18+i}", "100", gp(60), QCY, MOS_NETS[i], f"GATE_{MOS_NETS[i]}")

    # Q1-Q4: MOSFET
    QCX = gp(95)
    place("Custom:AO3400A", f"Q{i+1}", "AO3400A",
          "Package_TO_SOT_SMD:SOT-23",
          QCX, QCY,
          [p[0] for p in MOS_L] + [p[0] for p in MOS_R])
    lbl(f"GATE_{MOS_NETS[i]}", *lp_xy(QCX, QCY, MOS_HW, MOS_HH, 0), 180)
    rlbl(f"LOAD{i+1}",  QCX, QCY, MOS_HW, MOS_HH, 0)
    lbl("GND",         *rp_xy(QCX, QCY, MOS_HW, MOS_HH, 1), 0)

    # D2-D5: SS14 flyback diode
    DSCX = gp(135)
    place("Custom:SS14", f"D{i+2}", "SS14",
          "Diode_SMD:D_SMA",
          DSCX, QCY, ["1", "2"])
    llbl(f"LOAD{i+1}", DSCX, QCY, SS14_HW, SS14_HH, 0)
    lbl("+12V",         *rp_xy(DSCX, QCY, SS14_HW, SS14_HH, 0), 0)

    # J14-J17: load connector
    JCX = gp(185)
    place("Custom:Conn2pin", f"J{14+i}", f"OUT{i+1}_{MOS_NAMES[i]}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          JCX, QCY, ["1", "2"])
    llbl(f"LOAD{i+1}", JCX, QCY, CONN_HW, CONN_HH, 0)
    lbl("+12V",        *lp_xy(JCX, QCY, CONN_HW, CONN_HH, 1), 180)

# ── Analog inputs J18–J19 + dividers R10–R13 + filter caps C21–C22 ──────────
box(gp(28), gp(128), gp(175), gp(190))
txt("ANALOG IN (0-5V) + dividers", gp(29), gp(130), 2.5, True)
txt("10k top / 15k bottom = 5V -> 3.0V at ADC", gp(29), gp(140), 1.2)
for i in range(2):
    ACY = gp(157) + i * gp(17)
    # Connector
    place("Custom:Conn2pin", f"J{18+i}", f"ANA{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          gp(50), ACY, ["1", "2"])
    lbl(f"ANA{i+1}_RAW", *lp_xy(gp(50), ACY, CONN_HW, CONN_HH, 0), 180)
    lbl("GND",            *lp_xy(gp(50), ACY, CONN_HW, CONN_HH, 1), 180)
    # R10-R11: 10k top (sensor to ADC)
    place_r(f"R{10+i}", "10k", gp(90), ACY, f"ANA{i+1}_RAW", f"ANA{i+1}")
    # R12-R13: 15k bottom (ADC to GND)
    place_r(f"R{12+i}", "15k", gp(120), ACY + gp(8), f"ANA{i+1}", "GND")
    # C21-C22: 100nF filter
    place_c(f"C{21+i}", "100nF", gp(150), ACY, f"ANA{i+1}", "GND")

# ── NTC inputs J20–J23 + pull-ups R14–R17 + filter caps C23–C26 ─────────────
box(gp(28), gp(192), gp(175), gp(295))
txt("NTC INPUTS (10k pull-up to 3V3)", gp(29), gp(194), 2.5, True)
for i in range(4):
    NCY = gp(218) + i * gp(17)
    # Connector
    place("Custom:Conn2pin", f"J{20+i}", f"NTC{i+1}",
          "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-2-3.5_1x02_P3.50mm_Horizontal",
          gp(50), NCY, ["1", "2"])
    llbl(f"NTC{i+1}", gp(50), NCY, CONN_HW, CONN_HH, 0)
    lbl("GND",         *lp_xy(gp(50), NCY, CONN_HW, CONN_HH, 1), 180)
    # R14-R17: 10k pull-up
    place_r(f"R{14+i}", "10k", gp(100), NCY, f"NTC{i+1}", "+3V3")
    # C23-C26: 100nF filter
    place_c(f"C{23+i}", "100nF", gp(140), NCY, f"NTC{i+1}", "GND")

# ── Expansion header J26 (5 pins + GND, p2 now STATUS_LED) ──────────────────
box(gp(155), gp(128), gp(238), gp(200))
txt("EXPANSION (unused Teensy I/O)", gp(156), gp(130), 2.0, True)
txt("p16, p17, p20, p21, p41 + GND", gp(156), gp(140), 1.3)
EXP_CX, EXP_CY = gp(193), gp(170)
place("Custom:Conn6pin", "J26", "EXPANSION",
      "Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical",
      EXP_CX, EXP_CY, ["1","2","3","4","5","6"])
for i, net in enumerate(["EXPN_P16","EXPN_P17","EXPN_P20","EXPN_P21","EXPN_P41","GND"]):
    llbl(net, EXP_CX, EXP_CY, CONN6_HW, CONN6_HH, i)

# ── GPS 4-pin bidirectional J24 ──────────────────────────────────────────────
box(gp(240), gp(472), gp(430), gp(516))
txt("GPS — 4-pin bidirectional (Serial8)", gp(241), gp(474), 2.5, True)
txt("+3V3, GND, GPS_TX->Teensy_RX(p34), Teensy_TX(p35)->GPS_RX", gp(241), gp(484), 1.2)
GPS_CX, GPS_CY = gp(300), gp(500)
place("Custom:Conn4pin", "J24", "GPS_MODULE",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-4-3.5_1x04_P3.50mm_Horizontal",
      GPS_CX, GPS_CY, ["1","2","3","4"])
lbl("+3V3",    *lp_xy(GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 0), 180)
lbl("GND",     *lp_xy(GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 1), 180)
llbl("GPS_RX",  GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 2)
llbl("GPS_TX",  GPS_CX, GPS_CY, CONN4_HW, CONN4_HH, 3)

# ── NeoPixel + 74AHCT125D + series R25 + bypass C17 ─────────────────────────
box(gp(240), gp(518), gp(430), gp(600))
txt("NEOPIXEL + 74AHCT125D LEVEL-SHIFTER", gp(241), gp(520), 2.5, True)
txt("NEO_3V3(p36) -> 1A -> 1Y(5V) -> R25(300) -> J25", gp(241), gp(530), 1.2)
txt("Buffers 2-4: OE tied to VCC (disabled)", gp(241), gp(538), 1.2)

LS_CX, LS_CY = gp(310), gp(565)
place("Custom:74AHCT125D", "U13", "74AHCT125D-Q100",
      "Package_SO:SOIC-14_3.9x8.7mm_P1.27mm",
      LS_CX, LS_CY,
      [p[0] for p in LS_L] + [p[0] for p in LS_R])
lbl("GND",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 0), 180)
llbl("NEO_3V3",    LS_CX, LS_CY, LS_HW, LS_HH, 1)
rlbl("NEO_5V_BUF", LS_CX, LS_CY, LS_HW, LS_HH, 2)
lbl("+5V",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 3), 180)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 4)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 5)
lbl("GND",        *lp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 6), 180)
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 0), 0)
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 1), 0)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 2)
lbl("NEO_5V_BUF", *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 3), 0)
lbl("+5V",        *rp_xy(LS_CX, LS_CY, LS_HW, LS_HH, 4), 0)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 5)
lnc(LS_CX, LS_CY, LS_HW, LS_HH, 6)

# R25: 300 ohm NeoPixel series resistor
place_r("R25", "300", gp(375), gp(565), "NEO_5V_BUF", "NEO_DATA")
# C17: 74AHCT125D bypass cap
place_c("C17", "100nF", gp(375), gp(580), "+5V", "GND")

NEO_CX, NEO_CY = gp(400), gp(565)
place("Custom:Conn3pin", "J25", "NEOPIXEL_WS2812B",
      "TerminalBlock_Phoenix:TerminalBlock_Phoenix_PT-1,5-3-3.5_1x03_P3.50mm_Horizontal",
      NEO_CX, NEO_CY, ["1","2","3"])
lbl("+5V",     *lp_xy(NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 0), 180)
llbl("NEO_DATA", NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 1)
lbl("GND",     *lp_xy(NEO_CX, NEO_CY, CONN3_HW, CONN3_HH, 2), 180)

# ── STATUS LED (LED1 + R26 on Teensy p2) ────────────────────────────────────
box(gp(28), gp(100), gp(148), gp(127))
txt("STATUS LED (p2, green 0805)", gp(29), gp(102), 2.0, True)
# R26: 1k series
place_r("R26", "1k", gp(65), gp(117), "STATUS_LED", "LED_A")
# LED1: green 0805
place("Custom:LED_0805", "LED1", "GREEN_0805",
      "LED_SMD:LED_0805_2012Metric",
      gp(105), gp(117), ["1", "2"])
lbl("LED_A", *lp_xy(gp(105), gp(117), LED_HW, LED_HH, 0), 180)
lbl("GND",   *rp_xy(gp(105), gp(117), LED_HW, LED_HH, 0), 0)

# ── RESET BUTTON (SW1: RST to GND) ──────────────────────────────────────────
box(gp(180), gp(100), gp(250), gp(127))
txt("RESET BUTTON (6mm tactile)", gp(181), gp(102), 2.0, True)
place("Custom:SW_Tactile", "SW1", "RESET",
      "Button_Switch_THT:SW_PUSH_6mm_H5mm",
      gp(215), gp(117), ["1", "2"])
lbl("TEENSY_RST", *lp_xy(gp(215), gp(117), SW_HW, SW_HH, 0), 180)
lbl("GND",        *rp_xy(gp(215), gp(117), SW_HW, SW_HH, 0), 0)

# ── TEST PADS TP1–TP10 ──────────────────────────────────────────────────────
box(gp(658), gp(400), gp(850), gp(465))
txt("TEST PADS (TP1–TP10)", gp(660), gp(402), 2.5, True)

tp_list = [
    ("TP1",  "+12V"),
    ("TP2",  "+5V"),
    ("TP3",  "+3V3"),
    ("TP4",  "GND"),
    ("TP5",  "SPI_MOSI"),
    ("TP6",  "SPI_MISO"),
    ("TP7",  "SPI_SCK"),
    ("TP8",  "I2C_SDA"),
    ("TP9",  "I2C_SCL"),
    ("TP10", "RPM_IN"),
]
for idx, (tp_ref, tp_net) in enumerate(tp_list):
    col, row = idx // 5, idx % 5
    tpx = gp(690) + col * gp(70)
    tpy = gp(425) + row * gp(10)
    place_tp(tp_ref, tp_net, tpx, tpy)

# ── Net legend ────────────────────────────────────────────────────────────────
box(gp(658), gp(35), gp(900), gp(395))
txt("NET LEGEND — v0.5.1 (complete with discretes)", gp(660), gp(37), 3.0, True)
legend = [
    ("SPI_MOSI/MISO/SCK", "Teensy p11/12/13 -> MAX31855x8 (SPI0, main bus)"),
    ("SP1_MOSI/MISO/SCK",  "Teensy p26/1/27 <-> WIZ850io (SPI1, second bus)"),
    ("CS_ETH",   "Teensy p0 -> WIZ850io SCSn"),
    ("CS_TC0-7", "Teensy p10,9,8,7,6,5,4,3 -> MAX31855 #0-7"),
    ("INT_ETH",  "WIZ850io INTn -> Teensy p28"),
    ("RST_ETH",  "Teensy p29 -> WIZ850io RSTn"),
    ("I2C_SDA",  "Teensy p18 (Wire SDA) <-> LIS3DH SDA"),
    ("I2C_SCL",  "Teensy p19 (Wire SCL) <-> LIS3DH SCL"),
    ("ANA1-2",   "0-5V sensors -> R(10k)/R(15k) divider -> Teensy A0-A1 (p14-15)"),
    ("NTC1-4",   "NTC + R(10k) pull-up to 3V3 -> Teensy A8-A11 (p22-25)"),
    ("RPM_RAW",  "Coil(-) -> R1(1.5k) -> D6(5.1V Zener) -> R2(270) -> 6N137"),
    ("RPM_IN",   "6N137 output -> R3(10k pull-up) -> Teensy p30"),
    ("DIG1-3",   "Switch -> R(10k) -> D(3.3V Zener) + C(100nF) + R(10k PU) -> p31-33"),
    ("GPS_RX",   "GPS TX -> Teensy p34 Serial8 RX (4800/9600 baud NMEA)"),
    ("GPS_TX",   "Teensy p35 Serial8 TX -> GPS RX (bidirectional v0.5)"),
    ("NEO_3V3",  "Teensy p36 -> 74AHCT125D buf1 -> R25(300) -> NeoPixel"),
    ("MOS1-4",   "Teensy p37-40 -> R(100) -> AO3400A gate (fan/pump/light/spare)"),
    ("LOAD1-4",  "MOSFET drain -> SS14 Schottky to +12V (flyback) + J_OUTx"),
    ("STATUS_LED", "Teensy p2 -> R26(1k) -> LED1(green 0805) -> GND"),
    ("TC1-8",    "K-type thermocouple T+/T- -> MAX31855 (EGT/CHT)"),
    ("VBAT_12V_IN","Vehicle 10-16V at J1 (5.08mm screw terminal)"),
    ("VBAT_FUSED", "After F1 PTC fuse (~500mA)"),
    ("+12V",     "After Q5 PMOS + D1 SMBJ18A TVS clamp"),
    ("+5V",      "U12 LMR33630Q1 buck: L1(10uH), C1-C5, R23/R24 FB divider"),
    ("+3V3",     "Teensy internal reg ~250mA (LIS3DH, MAX31855, 6N137, logic)"),
    ("EXPN",     "5 unused Teensy pins on J26: p16, p17, p20, p21, p41 + GND"),
    ("TEENSY_RST", "SW1 tactile button -> Teensy RST pin -> GND"),
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
print(f"Written {len(out)} lines -> {path}")

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

# Component count summary
import collections
refs = []
for line in out:
    m = re.search(r'"Reference"\s+"([A-Z]+\d*)"', line)
    if m:
        prefix = re.match(r'[A-Z]+', m.group(1)).group()
        refs.append(prefix)
counts = collections.Counter(refs)
print(f"\nComponent summary ({sum(counts.values())} total placements):")
for k in sorted(counts): print(f"  {k}: {counts[k]}")
