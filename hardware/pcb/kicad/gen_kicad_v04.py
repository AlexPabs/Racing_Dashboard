#!/usr/bin/env python3
"""Generate racing_sensor_board_v0.4.kicad_sch — all pins on 50-mil grid.
v0.4 redesign: all 42 Teensy pins used, 6 MOSFETs, 4 opto DIG, GPS UART, NeoPixel.
"""
import uuid

def uid(): return str(uuid.uuid4())

out = []
def w(s=''): out.append(s)

# ── Grid helpers ───────────────────────────────────────────────────────────────
G = 1.27  # 1 grid step = 50 mil = 1.27 mm

def gp(x):
    """Snap x to nearest 50-mil grid point (multiple of 1.27 mm)."""
    return round(x / G) * G

# ── Geometry ───────────────────────────────────────────────────────────────────
def body_dims(n_left, n_right, bw=15.24):
    """Returns (hw, hh).  bw must be k*2.54 for integer k."""
    n = max(n_left, n_right, 2)
    hw = bw / 2
    hh = (n + 1) * G
    return hw, hh

def lp_xy(cx, cy, hw, hh, i):
    return cx - hw - 2*G, cy + (-hh + 2*G + i*2*G)

def rp_xy(cx, cy, hw, hh, i):
    return cx + hw + 2*G, cy + (-hh + 2*G + i*2*G)

# ── Symbol definition ─────────────────────────────────────────────────────────
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

# ── Instance placement ────────────────────────────────────────────────────────
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

# ── Net / wire helpers ────────────────────────────────────────────────────────
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

# ── Label helpers at pin endpoints ────────────────────────────────────────────
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
w('(kicad_sch (version 20230121) (generator python_v04)')
w('  (paper "A1")')
w('  (title_block')
w('    (title "Universal Racing Sensor Board v0.4")')
w('    (date "2026-06-10")')
w('    (rev "0.4b")')
w('    (company "AlexPabs Racing")')
w('    (comment 1 "All 42 Teensy pins used: 8TC + 8ANA + 4NTC + 4DIG + 6MOS + GPS + NEOPIXEL + ETH + SPI")')
w('    (comment 2 "DIG0=RPM(coil) TVS+2.2kohm  DIG1=brake  DIG2=linelock  DIG3=launch")')
w('  )')
w()

# ══════════════════════════════════════════════════════════════════════════════
# LIB_SYMBOLS — bw must be a multiple of 2.54 mm (= 2*G)
# ══════════════════════════════════════════════════════════════════════════════
w('  (lib_symbols')

# ── Teensy 4.1 ── bw = 9*2.54 = 22.86 mm → hw = 9*G ─────────────────────────
# Left side: p0–p21 (22 pins) — SPI bus, ADC, CS lines
T41_L = [
    ("0",  "p0/CS_ETH",   "passive"),
    ("1",  "p1/SP1_MISO", "passive"),
    ("2",  "p2/CS_ACC",   "passive"),
    ("3",  "p3/CS_TC7",   "passive"),
    ("4",  "p4/CS_TC6",   "passive"),
    ("5",  "p5/CS_TC5",   "passive"),
    ("6",  "p6/CS_TC4",   "passive"),
    ("7",  "p7/CS_TC3",   "passive"),
    ("8",  "p8/CS_TC2",   "passive"),
    ("9",  "p9/CS_TC1",   "passive"),
    ("10", "p10/CS_TC0",  "passive"),
    ("11", "p11/MOSI",    "passive"),
    ("12", "p12/MISO",    "passive"),
    ("13", "p13/SCK",     "passive"),
    ("14", "p14/A0",      "passive"),
    ("15", "p15/A1",      "passive"),
    ("16", "p16/A2",      "passive"),
    ("17", "p17/A3",      "passive"),
    ("18", "p18/A4",      "passive"),
    ("19", "p19/A5",      "passive"),
    ("20", "p20/A6",      "passive"),
    ("21", "p21/A7",      "passive"),
]
# Right side: VIN/GND/3V3 + p22–p41 (all remaining pins) = 23 pins
T41_R = [
    ("VIN", "VIN",           "passive"),
    ("GND", "GND",           "passive"),
    ("3V3", "3V3",           "passive"),
    ("22",  "p22/A8",        "passive"),   # NTC0
    ("23",  "p23/A9",        "passive"),   # NTC1
    ("24",  "p24/A10",       "passive"),   # NTC2
    ("25",  "p25/A11",       "passive"),   # NTC3
    ("26",  "p26/SP1_MOSI",  "passive"),
    ("27",  "p27/SP1_SCK",   "passive"),
    ("28",  "p28/INT_ETH",   "passive"),
    ("29",  "p29/RST_ETH",   "passive"),
    ("30",  "p30/DIG0",      "passive"),   # RPM from ignition coil (opto isolated)
    ("31",  "p31/DIG1",      "passive"),   # Brake light switch
    ("32",  "p32/DIG2",      "passive"),   # Line lock switch
    ("33",  "p33/DIG3",      "passive"),   # Launch control switch
    ("34",  "p34/GPS_RX",    "passive"),   # GPS NEO-6M TX → Teensy Serial8 RX
    ("35",  "p35/NEOPIXEL",  "passive"),   # WS2812B data (underglow + shift lights)
    ("36",  "p36/MOS0",      "passive"),   # Cooling fan
    ("37",  "p37/MOS1",      "passive"),   # Water pump / spare
    ("38",  "p38/MOS2",      "passive"),   # Shift light power / spare
    ("39",  "p39/MOS3",      "passive"),   # Spare MOSFET
    ("40",  "p40/MOS4",      "passive"),   # Spare MOSFET
    ("41",  "p41/MOS5",      "passive"),   # Spare MOSFET
]
T41_HW, T41_HH = define_sym(
    "Custom:Teensy41", "U",
    "Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical",
    T41_L, T41_R, bw=9*2.54)

# ── WIZ820io ── bw = 8*2.54 = 20.32 mm → hw = 8*G ───────────────────────────
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
    "Custom:WIZ820io", "U",
    "Connector_PinHeader_2.54mm:PinHeader_2x10_P2.54mm_Vertical",
    WIZ_L, WIZ_R, bw=8*2.54)

# ── MAX31855 ── bw = 5*2.54 = 12.70 mm → hw = 5*G ───────────────────────────
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

# ── LIS3DH ── bw = 6*2.54 = 15.24 mm → hw = 6*G ─────────────────────────────
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

# ── MP2307DN ── bw = 5*2.54 = 12.70 mm → hw = 5*G ───────────────────────────
MP_L = [
    ("2", "VIN", "passive"),
    ("1", "BST", "passive"),
    ("3", "SW",  "passive"),
    ("4", "GND", "passive"),
]
MP_R = [
    ("8", "EN",   "passive"),
    ("5", "FB",   "passive"),
    ("7", "COMP", "passive"),
    ("6", "SS",   "passive"),
]
MP_HW, MP_HH = define_sym(
    "Custom:MP2307DN", "U",
    "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
    MP_L, MP_R, bw=5*2.54)

# ── PC817C ── bw = 4*2.54 = 10.16 mm → hw = 4*G ─────────────────────────────
PC_L = [
    ("1", "A", "passive"),
    ("2", "K", "passive"),
]
PC_R = [
    ("4", "C", "passive"),
    ("3", "E", "passive"),
]
PC_HW, PC_HH = define_sym(
    "Custom:PC817", "OK",
    "Package_DIP:DIP-4_W7.62mm",
    PC_L, PC_R, bw=4*2.54)

# ── AO3400A ── bw = 4*2.54 = 10.16 mm → hw = 4*G ────────────────────────────
MOS_L = [
    ("1", "G", "passive"),
]
MOS_R = [
    ("3", "D", "passive"),
    ("2", "S", "passive"),
]
MOS_HW, MOS_HH = define_sym(
    "Custom:AO3400A", "Q",
    "Package_TO_SOT_SMD:SOT-23",
    MOS_L, MOS_R, bw=4*2.54)

# ── 2-pin connector ── bw = 4*2.54 = 10.16 mm ────────────────────────────────
CONN_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
]
CONN_HW, CONN_HH = define_sym(
    "Custom:Conn2pin", "J",
    "Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical",
    CONN_L, [], bw=4*2.54)

# ── 3-pin connector ── bw = 4*2.54 = 10.16 mm ────────────────────────────────
CONN3_L = [
    ("1", "Pin1", "passive"),
    ("2", "Pin2", "passive"),
    ("3", "Pin3", "passive"),
]
CONN3_HW, CONN3_HH = define_sym(
    "Custom:Conn3pin", "J",
    "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical",
    CONN3_L, [], bw=4*2.54)

# ── Power input connector ── bw = 4*2.54 = 10.16 mm ──────────────────────────
PWR_L = [
    ("1", "+12V", "passive"),
    ("2", "GND",  "passive"),
]
PWR_HW, PWR_HH = define_sym(
    "Custom:PwrConn", "J",
    "Connector_Phoenix_GMSTB_2.54mm_1x02_P7.5mm_Horizontal",
    PWR_L, [], bw=4*2.54)

w('  )')  # end lib_symbols
w()

# ══════════════════════════════════════════════════════════════════════════════
# SCHEMATIC BODY — all cx/cy through gp() so they land on the 1.27 mm grid
# ══════════════════════════════════════════════════════════════════════════════

# ── U1: Teensy 4.1 ────────────────────────────────────────────────────────────
T41_CX, T41_CY = gp(170), gp(230)
box(T41_CX-55, T41_CY-T41_HH-15, T41_CX+85, T41_CY+T41_HH+10)
txt("TEENSY 4.1 — MICROCONTROLLER (ALL 42 PINS USED)", T41_CX-54, T41_CY-T41_HH-13, 2.5, True)
place("Custom:Teensy41", "U1", "Teensy_4.1",
      "Connector_PinHeader_2.54mm:PinHeader_2x24_P2.54mm_Vertical",
      T41_CX, T41_CY,
      [p[0] for p in T41_L] + [p[0] for p in T41_R])

nets_L = ["CS_ETH", "SP1_MISO", "CS_ACC", "CS_TC7", "CS_TC6", "CS_TC5",
          "CS_TC4",  "CS_TC3",  "CS_TC2", "CS_TC1",  "CS_TC0",
          "SPI_MOSI","SPI_MISO","SPI_SCK",
          "ANA0","ANA1","ANA2","ANA3","ANA4","ANA5","ANA6","ANA7"]
for i, net in enumerate(nets_L):
    llbl(net, T41_CX, T41_CY, T41_HW, T41_HH, i)

nets_R = ["+5V", "GND", "+3V3",
          "NTC0","NTC1","NTC2","NTC3",
          "SP1_MOSI","SP1_SCK","INT_ETH","RST_ETH",
          "DIG0","DIG1","DIG2","DIG3",
          "GPS_RX","NEOPIXEL",
          "MOS0","MOS1","MOS2","MOS3","MOS4","MOS5"]
for i, net in enumerate(nets_R):
    rlbl(net, T41_CX, T41_CY, T41_HW, T41_HH, i)

# ── U2: WIZ820io ──────────────────────────────────────────────────────────────
WIZ_CX, WIZ_CY = gp(370), gp(85)
box(WIZ_CX-55, WIZ_CY-WIZ_HH-12, WIZ_CX+65, WIZ_CY+WIZ_HH+10)
txt("WIZ820io — ETHERNET", WIZ_CX-54, WIZ_CY-WIZ_HH-10, 2.5, True)
place("Custom:WIZ820io", "U2", "WIZ820io",
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

# ── U3–U10: MAX31855 ×8 ───────────────────────────────────────────────────────
MAX_CS = ["CS_TC0","CS_TC1","CS_TC2","CS_TC3","CS_TC4","CS_TC5","CS_TC6","CS_TC7"]
TC_P = [f"TC{i}_PLUS"  for i in range(8)]
TC_M = [f"TC{i}_MINUS" for i in range(8)]

box(gp(440), gp(35), gp(655), gp(185))
txt("MAX31855 × 8 — THERMOCOUPLE ADC", gp(441), gp(37), 2.5, True)

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

# TC connectors J0–J7
box(gp(440), gp(188), gp(655), gp(300))
txt("THERMOCOUPLE CONNECTORS J0–J7", gp(441), gp(190), 2.5, True)
for idx in range(8):
    col, row = idx // 4, idx % 4
    JCX = gp(468) + col * gp(87)
    JCY = gp(212) + row * gp(20)
    place("Custom:Conn2pin", f"J{idx}", f"TC{idx}",
          "Connector_Phoenix_MC_1.5mm_1x02_P1.5mm_Horizontal",
          JCX, JCY, ["1", "2"])
    llbl(TC_P[idx], JCX, JCY, CONN_HW, CONN_HH, 0)
    llbl(TC_M[idx], JCX, JCY, CONN_HW, CONN_HH, 1)

# ── U11: LIS3DH ───────────────────────────────────────────────────────────────
LIS_CX, LIS_CY = gp(370), gp(220)
box(LIS_CX-45, LIS_CY-LIS_HH-12, LIS_CX+60, LIS_CY+LIS_HH+10)
txt("LIS3DH — ACCELEROMETER", LIS_CX-44, LIS_CY-LIS_HH-10, 2.5, True)
place("Custom:LIS3DH", "U11", "LIS3DH",
      "Package_LGA:LGA-16_3x3mm_P0.5mm",
      LIS_CX, LIS_CY,
      [p[0] for p in LIS_L] + [p[0] for p in LIS_R])
lbl("+3V3",     *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 0), 180)
lbl("GND",      *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 1), 180)
lbl("GND",      *lp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 2), 180)
llbl("CS_ACC",  LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3)
llbl("SPI_SCK", LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
llbl("SPI_MISO",LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)
lbl("+3V3",     *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 0), 0)
rlbl("SPI_MOSI",LIS_CX, LIS_CY, LIS_HW, LIS_HH, 1)
lbl("INT1_ACC", *rp_xy(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 2), 0)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 3)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 4)
rnc(LIS_CX, LIS_CY, LIS_HW, LIS_HH, 5)

# ── U12: MP2307DN ─────────────────────────────────────────────────────────────
MP_CX, MP_CY = gp(370), gp(312)
box(MP_CX-45, MP_CY-MP_HH-12, MP_CX+65, MP_CY+MP_HH+20)
txt("MP2307DN — BUCK 12V→5V", MP_CX-44, MP_CY-MP_HH-10, 2.5, True)
place("Custom:MP2307DN", "U12", "MP2307DN",
      "Package_SO:SOIC-8_3.9x4.9mm_P1.27mm",
      MP_CX, MP_CY,
      [p[0] for p in MP_L] + [p[0] for p in MP_R])
lbl("+12V", *lp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 0), 180)
lbl("BST",  *lp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 1), 180)
lbl("+5V",  *lp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 2), 180)
lbl("GND",  *lp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 3), 180)
lbl("EN",   *rp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 0), 0)
lbl("FB",   *rp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 1), 0)
lbl("COMP", *rp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 2), 0)
lbl("SS",   *rp_xy(MP_CX, MP_CY, MP_HW, MP_HH, 3), 0)
txt("Cout, Lout, R-divider — add manually in KiCad",
    MP_CX-42, MP_CY+MP_HH+5, 1.5)

# ── OK1–OK4: PC817 optocouplers + J24–J27 digital inputs ─────────────────────
# DIG0 = RPM from ignition coil (requires spike protection — see note)
# DIG1 = Brake light switch, DIG2 = Line lock, DIG3 = Launch control
DIG_NETS = ["DIG0","DIG1","DIG2","DIG3"]
box(gp(30), gp(296), gp(232), gp(400))
txt("DIGITAL INPUTS — J24-J27 (PC817 OPTO)", gp(31), gp(298), 2.5, True)
txt("! DIG0=COIL/RPM: use SMBJ18A TVS + 2.2kohm (not 470ohm) at J24 input",
    gp(31), gp(308), 1.2)

for i in range(4):
    OCY = gp(326) + i * gp(16)

    JCX = gp(65)
    JCY = OCY
    place("Custom:Conn2pin", f"J{24+i}", f"DIG{i}",
          "Connector_Phoenix_MC_1.5mm_1x02_P1.5mm_Horizontal",
          JCX, JCY, ["1", "2"])
    lbl(f"DCIN{i}_A", *lp_xy(JCX, JCY, CONN_HW, CONN_HH, 0), 180)
    lbl("GND",         *lp_xy(JCX, JCY, CONN_HW, CONN_HH, 1), 180)

    OCX = gp(155)
    place("Custom:PC817", f"OK{i+1}", "PC817C",
          "Package_DIP:DIP-4_W7.62mm",
          OCX, OCY,
          [p[0] for p in PC_L] + [p[0] for p in PC_R])
    lbl(f"DCIN{i}_A", *lp_xy(OCX, OCY, PC_HW, PC_HH, 0), 180)
    lbl("GND",          *lp_xy(OCX, OCY, PC_HW, PC_HH, 1), 180)
    lbl("+3V3",         *rp_xy(OCX, OCY, PC_HW, PC_HH, 0), 0)
    rlbl(DIG_NETS[i],   OCX, OCY, PC_HW, PC_HH, 1)

# ── Q1–Q6: AO3400A MOSFETs + load connectors ─────────────────────────────────
# J12–J15 = MOS0–MOS3, J31–J32 = MOS4–MOS5 (all 6 use same circuit)
MOS_NETS  = ["MOS0","MOS1","MOS2","MOS3","MOS4","MOS5"]
MOS_JNUMS = [12, 13, 14, 15, 31, 32]
box(gp(30), gp(404), gp(232), gp(524))
txt("MOSFET OUTPUTS — J12-J15 + J31-J32 (AO3400A)", gp(31), gp(406), 2.5, True)
txt("MOS0=fan  MOS1=pump  MOS2=shift-light  MOS3-5=spare", gp(31), gp(416), 1.2)

for i in range(6):
    QCX = gp(90)
    QCY = gp(430) + i * gp(16)

    place("Custom:AO3400A", f"Q{i+1}", "AO3400A",
          "Package_TO_SOT_SMD:SOT-23",
          QCX, QCY,
          [p[0] for p in MOS_L] + [p[0] for p in MOS_R])

    llbl(MOS_NETS[i], QCX, QCY, MOS_HW, MOS_HH, 0)
    rlbl(f"LOAD{i}",  QCX, QCY, MOS_HW, MOS_HH, 0)
    lbl("GND",        *rp_xy(QCX, QCY, MOS_HW, MOS_HH, 1), 0)

    JCX = gp(165)
    JCY = QCY
    place("Custom:Conn2pin", f"J{MOS_JNUMS[i]}", f"OUT{i}",
          "Connector_Phoenix_MC_1.5mm_1x02_P1.5mm_Horizontal",
          JCX, JCY, ["1", "2"])
    llbl(f"LOAD{i}", JCX, JCY, CONN_HW, CONN_HH, 0)
    lbl("+12V",      *lp_xy(JCX, JCY, CONN_HW, CONN_HH, 1), 180)

# ── J16–J23: Analog inputs 0–5V ──────────────────────────────────────────────
ANA_NETS = ["ANA0","ANA1","ANA2","ANA3","ANA4","ANA5","ANA6","ANA7"]
box(gp(28), gp(128), gp(148), gp(296))
txt("ANALOG IN J16-J23", gp(29), gp(130), 2.5, True)
for i in range(8):
    ACX = gp(72)
    ACY = gp(155) + i * gp(16)
    place("Custom:Conn2pin", f"J{16+i}", f"ANA{i}",
          "Connector_Phoenix_MC_1.5mm_1x02_P1.5mm_Horizontal",
          ACX, ACY, ["1", "2"])
    llbl(ANA_NETS[i], ACX, ACY, CONN_HW, CONN_HH, 0)
    lbl("GND",         *lp_xy(ACX, ACY, CONN_HW, CONN_HH, 1), 180)

# ── J8–J11: NTC inputs ───────────────────────────────────────────────────────
NTC_NETS = ["NTC0","NTC1","NTC2","NTC3"]
box(gp(240), gp(296), gp(375), gp(382))
txt("NTC INPUTS J8-J11", gp(241), gp(298), 2.5, True)
for i in range(4):
    NCX = gp(287)
    NCY = gp(320) + i * gp(14)
    place("Custom:Conn2pin", f"J{8+i}", f"NTC{i}",
          "Connector_Phoenix_MC_1.5mm_1x02_P1.5mm_Horizontal",
          NCX, NCY, ["1", "2"])
    llbl(NTC_NETS[i], NCX, NCY, CONN_HW, CONN_HH, 0)
    lbl("GND",         *lp_xy(NCX, NCY, CONN_HW, CONN_HH, 1), 180)

# ── J30: Power input 12V ─────────────────────────────────────────────────────
box(gp(240), gp(386), gp(375), gp(432))
txt("POWER INPUT J30", gp(241), gp(388), 2.5, True)
J30_CX, J30_CY = gp(287), gp(408)
place("Custom:PwrConn", "J30", "PWR_IN",
      "Connector_Phoenix_GMSTB_2.54mm_1x02_P7.5mm_Horizontal",
      J30_CX, J30_CY, ["1", "2"])
lbl("+12V", *lp_xy(J30_CX, J30_CY, PWR_HW, PWR_HH, 0), 180)
lbl("GND",  *lp_xy(J30_CX, J30_CY, PWR_HW, PWR_HH, 1), 180)

# ── J33: GPS module + J34: NeoPixel data ─────────────────────────────────────
# GPS NEO-6M: 5V power, TX→Teensy p34 (Serial8 RX), GND
# NeoPixel WS2812B: 5V power, data→Teensy p35, GND
box(gp(240), gp(436), gp(375), gp(524))
txt("GPS (J33) + NEOPIXEL (J34)", gp(241), gp(438), 2.5, True)
txt("J33: GPS NEO-6M  Pin1=+5V  Pin2=GPS_TX(to p34)  Pin3=GND", gp(241), gp(448), 1.2)
txt("J34: WS2812B     Pin1=+5V  Pin2=DATA(to p35)    Pin3=GND", gp(241), gp(456), 1.2)

G33_CX, G33_CY = gp(300), gp(476)
place("Custom:Conn3pin", "J33", "GPS_NEO-6M",
      "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical",
      G33_CX, G33_CY, ["1", "2", "3"])
lbl("+5V",    *lp_xy(G33_CX, G33_CY, CONN3_HW, CONN3_HH, 0), 180)
llbl("GPS_RX",  G33_CX, G33_CY, CONN3_HW, CONN3_HH, 1)
lbl("GND",    *lp_xy(G33_CX, G33_CY, CONN3_HW, CONN3_HH, 2), 180)

N34_CX, N34_CY = gp(300), gp(504)
place("Custom:Conn3pin", "J34", "NEOPIXEL_WS2812B",
      "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical",
      N34_CX, N34_CY, ["1", "2", "3"])
lbl("+5V",       *lp_xy(N34_CX, N34_CY, CONN3_HW, CONN3_HH, 0), 180)
llbl("NEOPIXEL",   N34_CX, N34_CY, CONN3_HW, CONN3_HH, 1)
lbl("GND",       *lp_xy(N34_CX, N34_CY, CONN3_HW, CONN3_HH, 2), 180)

# ── Net legend ────────────────────────────────────────────────────────────────
box(gp(658), gp(35), gp(870), gp(355))
txt("NET LEGEND — v0.4b (ALL PINS USED)", gp(660), gp(37), 3.0, True)
legend = [
    ("SPI_MOSI/MISO/SCK", "Teensy p11/12/13 → MAX31855 ×8 + LIS3DH"),
    ("SP1_MOSI/MISO/SCK",  "Teensy p26/1/27 ↔ WIZ820io"),
    ("CS_ETH",   "Teensy p0 → WIZ820io SCSn"),
    ("CS_ACC",   "Teensy p2 → LIS3DH CS"),
    ("CS_TC0-7", "Teensy p10,9,8,7,6,5,4,3 → MAX31855"),
    ("INT_ETH",  "WIZ820io INTn → Teensy p28"),
    ("RST_ETH",  "Teensy p29 → WIZ820io RSTn"),
    ("INT1_ACC", "LIS3DH INT1 → Teensy (spare digital)"),
    ("ANA0-7",   "0-5V sensors → Teensy A0-A7 (p14-21) via 10k/15k divider"),
    ("NTC0-3",   "NTC 10k pullup → Teensy A8-A11 (p22-25)"),
    ("DIG0",     "RPM — coil signal via PC817 + SMBJ18A TVS + 2.2kohm"),
    ("DIG1",     "Brake light switch → PC817 → Teensy p31"),
    ("DIG2",     "Line lock switch → PC817 → Teensy p32"),
    ("DIG3",     "Launch control switch → PC817 → Teensy p33"),
    ("GPS_RX",   "GPS NEO-6M TX → Teensy p34 (Serial8 RX, 9600 baud NMEA)"),
    ("NEOPIXEL", "WS2812B data → Teensy p35 (underglow + shift lights)"),
    ("MOS0-5",   "Teensy p36-41 → 100ohm → AO3400A gate (fan/pump/light/spare)"),
    ("TC0-7",    "K-type thermocouple T+/T- → MAX31855 (CHT/EGT/oil/coolant)"),
    ("+12V",     "Vehicle supply 10-16V  (fused 5A at J30)"),
    ("+5V",      "MP2307DN 12V→5V 3A buck (powers Teensy, GPS, NeoPixel)"),
    ("+3V3",     "Teensy internal reg max 250mA (logic, sensors)"),
    ("COIL NOTE","J24 DIG0: replace 470ohm with 2.2kohm + add SMBJ18A TVS"),
]
for i, (net, desc) in enumerate(legend):
    txt(f"{net}:", gp(660), gp(57)+i*13, 1.3, True)
    txt(desc,       gp(720), gp(57)+i*13, 1.3)

# ══════════════════════════════════════════════════════════════════════════════
# FOOTER
# ══════════════════════════════════════════════════════════════════════════════
w()
w(')')

# ── Write & verify ────────────────────────────────────────────────────────────
path = "/home/user/Racing_Dashboard/hardware/pcb/kicad/racing_sensor_board_v0.4.kicad_sch"
with open(path, 'w') as f:
    f.write('\n'.join(out) + '\n')
print(f"Written {len(out)} lines → {path}")

# Verify no unterminated strings
bad = [(i+1, l) for i, l in enumerate(out) if l.count('"') % 2 == 1]
if bad:
    print(f"WARNING: {len(bad)} lines with odd quote count:")
    for n, l in bad[:10]: print(f"  line {n}: {l[:80]}")
else:
    print("OK: all strings properly terminated")

# Verify all pin endpoints land on 1.27 mm grid
import re
off = []
for i, line in enumerate(out):
    m = re.search(r'\(at\s+([-\d.]+)\s+([-\d.]+)\s+\d', line)
    if m and 'pin ' in line:
        for v in [float(m.group(1)), float(m.group(2))]:
            if abs(round(v/G)*G - v) > 0.005:
                off.append((i+1, line.strip()[:70]))
                break
if off:
    print(f"WARNING: {len(off)} lib-symbol pins off 1.27mm grid:")
    for n, l in off[:10]: print(f"  line {n}: {l}")
else:
    print("OK: all lib-symbol pin 'at' coordinates on 1.27mm grid")
