"""
GPS drag-analyse for VW Boble race dashboard
Kjøres på Raspberry Pi 5 som del av backend.

Parser GPS-data fra WT32 (NMEA via UDP) og beregner automatisk:
  - 60-fot tid
  - 1/8 mile tid og topphastighet
  - 1/4 mile tid og topphastighet
  - 0–100 km/h tid
  - Reaksjonstid (fra line lock slipp til bevegelse)

API-endepunkter (Flask):
  GET /api/drag/status   — nåværende kjøring
  GET /api/drag/history  — alle lagrede kjøringer
  POST /api/drag/reset   — nullstill og start ny kjøring

Krav:
    pip install flask influxdb-client
"""

import time
import json
import math
import logging
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional
from flask import Flask, jsonify, request

log = logging.getLogger(__name__)

# Distanser i meter
SEKSTI_FOT   = 18.288    # 60 fot
AATTE_MILE   = 201.168   # 1/8 mile
KVART_MILE   = 402.336   # 1/4 mile

LOGG_FIL = Path(__file__).parent / "drag_historikk.json"

# ── Datastrukturer ─────────────────────────────────────────────────────────────

@dataclass
class DragKjøring:
    id: str = ""
    dato: str = ""
    starttid: float = 0.0
    aktiv: bool = False

    # Tidtaking
    tid_seksti_fot: Optional[float] = None        # sekunder
    tid_aatte_mile: Optional[float] = None
    tid_kvart_mile: Optional[float] = None
    tid_null_hundre: Optional[float] = None        # 0–100 km/h

    # Hastigheter ved split-punkt
    fart_aatte_mile: float = 0.0                   # km/h
    fart_kvart_mile: float = 0.0
    topphastighet: float = 0.0

    # Løpt distanse
    distanse: float = 0.0

    # Reaksjonstid (line lock → bevegelse)
    reaksjonstid: Optional[float] = None
    line_lock_slipp_ts: Optional[float] = None

    def til_dict(self) -> dict:
        return asdict(self)

# ── Drag-analysator ────────────────────────────────────────────────────────────

class DragAnalysator:
    def __init__(self):
        self.kjøring = DragKjøring()
        self.historikk: list[dict] = self._last_historikk()
        self._siste_ts: Optional[float] = None
        self._siste_fart: float = 0.0
        self._hundre_passert = False

    def _last_historikk(self) -> list[dict]:
        if LOGG_FIL.exists():
            try:
                return json.loads(LOGG_FIL.read_text())
            except Exception:
                return []
        return []

    def _lagre_historikk(self):
        LOGG_FIL.write_text(json.dumps(self.historikk[-100:], indent=2))  # behold siste 100

    def line_lock_slipp(self):
        """Kalles når line lock slippes — starter reaksjonstid-måling."""
        self.kjøring.line_lock_slipp_ts = time.monotonic()
        log.info("Line lock sluppet — venter på bevegelse")

    def oppdater(self, fart_kmh: float):
        """
        Kalles for hvert GPS-datapunkt.
        fart_kmh: hastighet i km/h fra GPS
        """
        naa = time.monotonic()

        # Start kjøring automatisk når bilen begynner å bevege seg (> 3 km/h)
        if not self.kjøring.aktiv and fart_kmh > 3.0:
            self._start_kjøring(naa)

        if not self.kjøring.aktiv:
            self._siste_ts = naa
            self._siste_fart = fart_kmh
            return

        # Beregn distanse ved trapesintegrasjon
        if self._siste_ts is not None:
            dt = naa - self._siste_ts
            gjennomsnitt_fart = (fart_kmh + self._siste_fart) / 2.0
            self.kjøring.distanse += (gjennomsnitt_fart / 3.6) * dt

        elapsed = naa - self.kjøring.starttid

        # Reaksjonstid
        if (self.kjøring.reaksjonstid is None
                and self.kjøring.line_lock_slipp_ts is not None
                and fart_kmh > 3.0):
            self.kjøring.reaksjonstid = naa - self.kjøring.line_lock_slipp_ts
            log.info(f"Reaksjonstid: {self.kjøring.reaksjonstid:.3f}s")

        dist = self.kjøring.distanse

        # 60-fot
        if self.kjøring.tid_seksti_fot is None and dist >= SEKSTI_FOT:
            self.kjøring.tid_seksti_fot = elapsed
            log.info(f"60 fot: {elapsed:.3f}s")

        # 1/8 mile
        if self.kjøring.tid_aatte_mile is None and dist >= AATTE_MILE:
            self.kjøring.tid_aatte_mile = elapsed
            self.kjøring.fart_aatte_mile = fart_kmh
            log.info(f"1/8 mile: {elapsed:.3f}s @ {fart_kmh:.1f} km/h")

        # 1/4 mile
        if self.kjøring.tid_kvart_mile is None and dist >= KVART_MILE:
            self.kjøring.tid_kvart_mile = elapsed
            self.kjøring.fart_kvart_mile = fart_kmh
            log.info(f"1/4 mile: {elapsed:.3f}s @ {fart_kmh:.1f} km/h")
            self._avslutt_kjøring()

        # 0–100 km/h
        if not self._hundre_passert and fart_kmh >= 100.0:
            self.kjøring.tid_null_hundre = elapsed
            self._hundre_passert = True
            log.info(f"0–100 km/h: {elapsed:.3f}s")

        # Topphastighet
        if fart_kmh > self.kjøring.topphastighet:
            self.kjøring.topphastighet = fart_kmh

        self._siste_ts = naa
        self._siste_fart = fart_kmh

    def _start_kjøring(self, ts: float):
        self.kjøring.starttid = ts
        self.kjøring.aktiv = True
        self.kjøring.dato = datetime.now().isoformat(timespec="seconds")
        self.kjøring.id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._hundre_passert = False
        log.info(f"Kjøring startet: {self.kjøring.id}")

    def _avslutt_kjøring(self):
        self.kjøring.aktiv = False
        self.historikk.append(self.kjøring.til_dict())
        self._lagre_historikk()
        log.info(f"Kjøring fullført og lagret: {self.kjøring.id}")

    def reset(self):
        """Nullstill til ny kjøring."""
        self.kjøring = DragKjøring()
        self._siste_ts = None
        self._siste_fart = 0.0
        self._hundre_passert = False
        log.info("Drag-analysator nullstilt")

    def status(self) -> dict:
        """Returnerer gjeldende kjørestatus som dict."""
        k = self.kjøring
        naa = time.monotonic()
        elapsed = (naa - k.starttid) if k.aktiv else 0.0
        return {
            "aktiv": k.aktiv,
            "elapsed": elapsed,
            "distanse_m": k.distanse,
            "tid_seksti_fot": k.tid_seksti_fot,
            "tid_aatte_mile": k.tid_aatte_mile,
            "tid_kvart_mile": k.tid_kvart_mile,
            "tid_null_hundre": k.tid_null_hundre,
            "fart_aatte_mile": k.fart_aatte_mile,
            "fart_kvart_mile": k.fart_kvart_mile,
            "topphastighet": k.topphastighet,
            "reaksjonstid": k.reaksjonstid,
            "kjøring_id": k.id,
        }

# ── Flask API ──────────────────────────────────────────────────────────────────

analysator = DragAnalysator()
app = Flask(__name__)

@app.route("/api/drag/status")
def drag_status():
    return jsonify(analysator.status())

@app.route("/api/drag/history")
def drag_historikk():
    return jsonify(analysator.historikk[-50:])   # siste 50 kjøringer

@app.route("/api/drag/reset", methods=["POST"])
def drag_reset():
    analysator.reset()
    return jsonify({"ok": True})

@app.route("/api/drag/linelock", methods=["POST"])
def line_lock_slipp():
    analysator.line_lock_slipp()
    return jsonify({"ok": True})

# Intern funksjon — kalles fra UDP-mottaker med GPS-fart
def oppdater_fra_gps(fart_kmh: float):
    analysator.oppdater(fart_kmh)

if __name__ == "__main__":
    # Testmodus — simulerer en drag-kjøring
    print("Drag-analysator testmodus")
    import random

    def simuler_kjøring():
        print("Simulerer drag-kjøring 0–1/4 mile...")
        analysator.reset()
        fart = 0.0
        for i in range(300):
            fart = min(180, fart + random.uniform(1.5, 3.5))
            analysator.oppdater(fart)
            time.sleep(0.1)
            s = analysator.status()
            if s["tid_kvart_mile"]:
                print(f"\n=== RESULTAT ===")
                print(f"60 fot:    {s['tid_seksti_fot']:.3f}s")
                print(f"1/8 mile:  {s['tid_aatte_mile']:.3f}s @ {s['fart_aatte_mile']:.1f} km/h")
                print(f"1/4 mile:  {s['tid_kvart_mile']:.3f}s @ {s['fart_kvart_mile']:.1f} km/h")
                print(f"0–100:     {s['tid_null_hundre']:.3f}s")
                print(f"Topp:      {s['topphastighet']:.1f} km/h")
                break

    simuler_kjøring()
