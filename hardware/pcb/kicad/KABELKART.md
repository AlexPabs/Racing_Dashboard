# Kabelkart — Universal Racing Sensor Board (Teensy 4.1)
> Prikk-til-prikk: samme nummer = samme ledning

## Strømnett (beholdt som navn)
| Symbol | Betydning |
|--------|-----------|
| GND | Jord (minus) |
| +5V | 5 volt (fra buck) |
| +3V3 | 3.3 volt (fra Teensy) |
| +12V | 12 volt (kjøretøy) |

---

## Signalnett (nummersystem)

### SPI-buss hoved (til MAX31855 ×8 + LIS3DH)
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 1 | SPI_MOSI | Teensy p11 → MAX31855 (alle) |
| 2 | SPI_MISO | MAX31855 SO (alle) → Teensy p12 |
| 3 | SPI_SCK | Teensy p13 → MAX31855 SCK (alle) + LIS3DH |

### SPI1-buss (til WIZ820io Ethernet)
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 4 | SP1_MOSI | Teensy p26 → WIZ820io MOSI |
| 5 | SP1_MISO | WIZ820io MISO → Teensy p1 |
| 6 | SP1_SCK | Teensy p27 → WIZ820io SCLK |

### Chip-Select (CS) signaler
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 7 | CS_ETH | Teensy p0 → WIZ820io SCSn |
| 8 | CS_ACC | Teensy p2 → LIS3DH CS |
| 9 | CS_TC0 | Teensy p10 → MAX31855 U3 /CS |
| 10 | CS_TC1 | Teensy p9 → MAX31855 U4 /CS |
| 11 | CS_TC2 | Teensy p8 → MAX31855 U5 /CS |
| 12 | CS_TC3 | Teensy p7 → MAX31855 U6 /CS |
| 13 | CS_TC4 | Teensy p6 → MAX31855 U7 /CS |
| 14 | CS_TC5 | Teensy p5 → MAX31855 U8 /CS |
| 15 | CS_TC6 | Teensy p4 → MAX31855 U9 /CS |
| 16 | CS_TC7 | Teensy p3 → MAX31855 U10 /CS |

### Ethernet kontroll
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 17 | INT_ETH | WIZ820io INTn → Teensy p28 |
| 18 | RST_ETH | Teensy p29 → WIZ820io RSTn |

### Akselerometer
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 19 | INT1_ACC | LIS3DH INT1 → Teensy (ekstra digital) |

### Digitale innganger (via optokoppler)
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 20 | DIG0 | OK1 utgang → Teensy p30 |
| 21 | DIG1 | OK2 utgang → Teensy p31 |
| 22 | DIG2 | OK3 utgang → Teensy p32 |
| 23 | DIG3 | OK4 utgang → Teensy p33 |
| 24 | DIG4 | OK5 utgang → Teensy p34 |
| 25 | DIG5 | OK6 utgang → Teensy p35 |

### MOSFET-utganger (gate-signal)
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 26 | MOS0 | Teensy p36 → R35 → Q1 Gate |
| 27 | MOS1 | Teensy p37 → R36 → Q2 Gate |
| 28 | MOS2 | Teensy p38 → R37 → Q3 Gate |
| 29 | MOS3 | Teensy p39 → R38 → Q4 Gate |

### Analoge innganger 0–5V
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 30 | ANA0 | J16 → deler → Teensy A0/p14 |
| 31 | ANA1 | J17 → deler → Teensy A1/p15 |
| 32 | ANA2 | J18 → deler → Teensy A2/p16 |
| 33 | ANA3 | J19 → deler → Teensy A3/p17 |
| 34 | ANA4 | J20 → deler → Teensy A4/p18 |
| 35 | ANA5 | J21 → deler → Teensy A5/p19 |
| 36 | ANA6 | J22 → deler → Teensy A6/p20 |
| 37 | ANA7 | J23 → deler → Teensy A7/p21 |

### NTC termistorinnganger
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 38 | NTC0 | J8 → pull-up → Teensy A8/p22 |
| 39 | NTC1 | J9 → pull-up → Teensy A9/p23 |
| 40 | NTC2 | J10 → pull-up → Teensy A10/p24 |
| 41 | NTC3 | J11 → pull-up → Teensy A11/p25 |

### LED
| Nr | Nett | Fra → Til |
|----|------|-----------|
| 42 | LED_PIN | Teensy p41 → R39 → LED |

### Termokobler (T+ og T−)
| Nr | Nett | Kontakt |
|----|------|---------|
| 43 | TC0_PLUS | J0 pin 1 (T+) → U3 pin 2 |
| 44 | TC1_PLUS | J1 pin 1 (T+) → U4 pin 2 |
| 45 | TC2_PLUS | J2 pin 1 (T+) → U5 pin 2 |
| 46 | TC3_PLUS | J3 pin 1 (T+) → U6 pin 2 |
| 47 | TC4_PLUS | J4 pin 1 (T+) → U7 pin 2 |
| 48 | TC5_PLUS | J5 pin 1 (T+) → U8 pin 2 |
| 49 | TC6_PLUS | J6 pin 1 (T+) → U9 pin 2 |
| 50 | TC7_PLUS | J7 pin 1 (T+) → U10 pin 2 |
| 51 | TC0_MINUS | J0 pin 2 (T−) → U3 pin 1 |
| 52 | TC1_MINUS | J1 pin 2 (T−) → U4 pin 1 |
| 53 | TC2_MINUS | J2 pin 2 (T−) → U5 pin 1 |
| 54 | TC3_MINUS | J3 pin 2 (T−) → U6 pin 1 |
| 55 | TC4_MINUS | J4 pin 2 (T−) → U7 pin 1 |
| 56 | TC5_MINUS | J5 pin 2 (T−) → U8 pin 1 |
| 57 | TC6_MINUS | J6 pin 2 (T−) → U9 pin 1 |
| 58 | TC7_MINUS | J7 pin 2 (T−) → U10 pin 1 |

---

## Kontaktoversikt

| Kontakt | Pins | Bruk |
|---------|------|------|
| J0–J7 | 2-pin | Termokobler K-type (T+/T−) |
| J8–J11 | 2-pin | NTC termistor |
| J12–J15 | 2-pin | MOSFET ut (+12V/LAST) |
| J16–J23 | 2-pin | Analog 0–5V sensor |
| J24–J29 | 2-pin | Digital inn (RPM, hjulhast, bryter) |
| J30 | 2-pin | 12V strøm inn |
| J22 | 2×10 | WIZ820io Ethernet modul |

---
*Sensornavn tildeles i firmware via /settings — ikke på PCBen*
