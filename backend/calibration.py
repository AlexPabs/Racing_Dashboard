"""
Kalibreringsskript for TPS (gassposisjon) og clutchposisjon
Kjøres interaktivt på Raspberry Pi 5 via terminal.

Lagrer kalibreringsverdier til calibration.json som leses av
UDP-mottakeren ved konvertering av råverdier.

Krav:
    pip install RPi.GPIO   (kun på Raspberry Pi)
    Alternativt: pip install gpiozero

Bruk:
    python calibration.py             # interaktiv meny
    python calibration.py --tps       # bare TPS
    python calibration.py --clutch    # bare clutch
    python calibration.py --vis       # vis lagrede verdier
"""

import argparse
import json
import sys
import time
from pathlib import Path

KALIB_FIL = Path(__file__).parent / "calibration.json"

# ── Standardverdier (brukes om ikke kalibrert) ────────────────────────────────
STANDARD_KALIB = {
    "tps": {
        "raa_min": 0,       # ADC-verdi ved lukket gass (0–4095)
        "raa_maks": 4095,   # ADC-verdi ved full gass
        "kalibrert": False,
        "tidspunkt": None,
    },
    "clutch": {
        "raa_sluppet": 4095,  # ADC-verdi når clutch er sluppet (up)
        "raa_trykket": 0,     # ADC-verdi når clutch er fullt trykket inn
        "kalibrert": False,
        "tidspunkt": None,
    },
}

# ── ADC-simulering (byttes med ekte GPIO på RPi) ──────────────────────────────

try:
    import RPi.GPIO as GPIO
    PÅ_RPI = True
except ImportError:
    PÅ_RPI = False

def les_adc_kanal(kanal: int) -> int:
    """
    Leser ADC-verdi (0–4095) fra WT32 ADC-inngang.
    På RPi: leses via I2C/SPI ADC-modul.
    I simulering: returnerer tilfeldig verdi for testing.
    """
    if PÅ_RPI:
        # Eksempel med ADS1115 (I2C):
        # import board, busio, adafruit_ads1x15.ads1115 as ADS
        # from adafruit_ads1x15.analog_in import AnalogIn
        # i2c = busio.I2C(board.SCL, board.SDA)
        # ads = ADS.ADS1115(i2c)
        # vin = AnalogIn(ads, getattr(ADS, f"P{kanal}"))
        # return int(vin.value / 65535 * 4095)
        raise NotImplementedError("Implementer ADC-lesing her")
    else:
        import random
        return random.randint(0, 4095)

# ── Hjelpefunksjoner ──────────────────────────────────────────────────────────

def last_kalib() -> dict:
    if KALIB_FIL.exists():
        try:
            return json.loads(KALIB_FIL.read_text())
        except Exception:
            pass
    return STANDARD_KALIB.copy()

def lagre_kalib(data: dict):
    KALIB_FIL.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"  Lagret til {KALIB_FIL}")

def raa_til_prosent(raa: int, raa_min: int, raa_maks: int) -> float:
    if raa_maks == raa_min:
        return 0.0
    return max(0.0, min(100.0, (raa - raa_min) / (raa_maks - raa_min) * 100))

def les_kontinuerlig(kanal: int, sekunder: float = 2.0) -> list[int]:
    """Leser ADC kontinuerlig i 'sekunder' og returnerer alle verdier."""
    verdier = []
    slutt = time.monotonic() + sekunder
    while time.monotonic() < slutt:
        verdier.append(les_adc_kanal(kanal))
        time.sleep(0.05)
    return verdier

# ── TPS-kalibrering ───────────────────────────────────────────────────────────

TPS_KANAL = 4  # A4 på WT32

def kalibrer_tps():
    """Interaktiv kalibrering av gassposisjonssensor (potensiometer på IDA 48)."""
    print("\n" + "═" * 50)
    print("  TPS KALIBRERING — Gassposisjon (IDA 48 karburator)")
    print("═" * 50)
    print("  Kobling: Potensiometer 10kΩ → A4 på WT32")
    print()

    kalib = last_kalib()

    # Steg 1: lukket gass
    input("  STEG 1: La gassen være HELT LUKKET, trykk Enter...")
    print("  Leser råverdi i 2 sekunder...", end="", flush=True)
    verdier = les_kontinuerlig(TPS_KANAL, 2.0)
    raa_min = int(sum(verdier) / len(verdier))
    print(f" rå ADC = {raa_min}")

    # Steg 2: full gass
    input("  STEG 2: Trykk gassen til FULL åpning (bunn), hold, trykk Enter...")
    print("  Leser råverdi i 2 sekunder...", end="", flush=True)
    verdier = les_kontinuerlig(TPS_KANAL, 2.0)
    raa_maks = int(sum(verdier) / len(verdier))
    print(f" rå ADC = {raa_maks}")

    if abs(raa_maks - raa_min) < 100:
        print(f"\n  FEIL: For liten forskjell ({abs(raa_maks - raa_min)} ADC-steg).")
        print("  Sjekk at potensiomenteret er riktig koblet og roterer fritt.")
        return

    # Lagre
    kalib["tps"]["raa_min"] = raa_min
    kalib["tps"]["raa_maks"] = raa_maks
    kalib["tps"]["kalibrert"] = True
    kalib["tps"]["tidspunkt"] = time.strftime("%Y-%m-%d %H:%M:%S")
    lagre_kalib(kalib)

    # Verifikasjon — live visning
    print("\n  Kalibrering lagret. Live verifisering (Ctrl+C for å avslutte):")
    print("  Gi gass sakte frem og tilbake for å bekrefte...")
    try:
        while True:
            raa = les_adc_kanal(TPS_KANAL)
            pst = raa_til_prosent(raa, raa_min, raa_maks)
            bar = "█" * int(pst / 2) + "░" * (50 - int(pst / 2))
            print(f"\r  TPS: [{bar}] {pst:5.1f}%  (rå: {raa:4d})", end="", flush=True)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n  Ferdig.")

# ── Clutch-kalibrering ────────────────────────────────────────────────────────

CLUTCH_KANAL = 5  # A5 på WT32

def kalibrer_clutch():
    """Interaktiv kalibrering av clutchposisjonssensor (lineært potensiometer)."""
    print("\n" + "═" * 50)
    print("  CLUTCH KALIBRERING — Pedal-posisjon")
    print("═" * 50)
    print("  Kobling: Lineært potensiometer 10kΩ → A5 på WT32")
    print()

    kalib = last_kalib()

    # Steg 1: sluppet
    input("  STEG 1: SLIPP clutchpedalen helt, trykk Enter...")
    print("  Leser råverdi i 2 sekunder...", end="", flush=True)
    verdier = les_kontinuerlig(CLUTCH_KANAL, 2.0)
    raa_sluppet = int(sum(verdier) / len(verdier))
    print(f" rå ADC = {raa_sluppet}")

    # Steg 2: fullt trykket
    input("  STEG 2: Trykk clutchpedalen helt INN, hold, trykk Enter...")
    print("  Leser råverdi i 2 sekunder...", end="", flush=True)
    verdier = les_kontinuerlig(CLUTCH_KANAL, 2.0)
    raa_trykket = int(sum(verdier) / len(verdier))
    print(f" rå ADC = {raa_trykket}")

    if abs(raa_sluppet - raa_trykket) < 100:
        print(f"\n  FEIL: For liten forskjell ({abs(raa_sluppet - raa_trykket)} ADC-steg).")
        print("  Sjekk at potensiomenteret er riktig montert og beveger seg fritt.")
        return

    # Lagre
    kalib["clutch"]["raa_sluppet"] = raa_sluppet
    kalib["clutch"]["raa_trykket"] = raa_trykket
    kalib["clutch"]["kalibrert"] = True
    kalib["clutch"]["tidspunkt"] = time.strftime("%Y-%m-%d %H:%M:%S")
    lagre_kalib(kalib)

    # Verifikasjon
    print("\n  Kalibrering lagret. Live verifisering (Ctrl+C for å avslutte):")
    print("  Trykk og slipp clutch sakte...")
    try:
        while True:
            raa = les_adc_kanal(CLUTCH_KANAL)
            pst = raa_til_prosent(raa, raa_sluppet, raa_trykket)
            bar = "█" * int(pst / 2) + "░" * (50 - int(pst / 2))
            print(f"\r  Clutch: [{bar}] {pst:5.1f}%  (rå: {raa:4d})", end="", flush=True)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n  Ferdig.")

# ── Vis lagrede verdier ────────────────────────────────────────────────────────

def vis_kalib():
    kalib = last_kalib()
    print("\n=== LAGREDE KALIBRERINGSVERDIER ===")

    tps = kalib.get("tps", {})
    print(f"\n  TPS (gassposisjon):")
    print(f"    Kalibrert:   {'JA ✓' if tps.get('kalibrert') else 'NEI ✗'}")
    print(f"    Rå min:      {tps.get('raa_min', '—')}")
    print(f"    Rå maks:     {tps.get('raa_maks', '—')}")
    print(f"    Tidspunkt:   {tps.get('tidspunkt', '—')}")

    clut = kalib.get("clutch", {})
    print(f"\n  Clutch:")
    print(f"    Kalibrert:   {'JA ✓' if clut.get('kalibrert') else 'NEI ✗'}")
    print(f"    Rå sluppet:  {clut.get('raa_sluppet', '—')}")
    print(f"    Rå trykket:  {clut.get('raa_trykket', '—')}")
    print(f"    Tidspunkt:   {clut.get('tidspunkt', '—')}")
    print()

# ── Interaktiv meny ───────────────────────────────────────────────────────────

def meny():
    while True:
        print("\n╔══════════════════════════════════╗")
        print("║   VW BOBLE — KALIBRERING        ║")
        print("╠══════════════════════════════════╣")
        print("║  1. Kalibrer TPS (gassposisjon) ║")
        print("║  2. Kalibrer Clutch             ║")
        print("║  3. Vis lagrede verdier         ║")
        print("║  4. Avslutt                     ║")
        print("╚══════════════════════════════════╝")
        valg = input("Velg [1-4]: ").strip()

        if valg == "1":
            kalibrer_tps()
        elif valg == "2":
            kalibrer_clutch()
        elif valg == "3":
            vis_kalib()
        elif valg == "4":
            print("Avslutter.")
            sys.exit(0)
        else:
            print("Ugyldig valg.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VW Boble kalibreringsskript")
    parser.add_argument("--tps",    action="store_true", help="Kalibrer TPS direkte")
    parser.add_argument("--clutch", action="store_true", help="Kalibrer clutch direkte")
    parser.add_argument("--vis",    action="store_true", help="Vis lagrede verdier")
    args = parser.parse_args()

    if args.tps:
        kalibrer_tps()
    elif args.clutch:
        kalibrer_clutch()
    elif args.vis:
        vis_kalib()
    else:
        meny()
