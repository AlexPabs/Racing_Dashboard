"""
UDP-mottaker for WT32-ETH01 sensordata
Kjøres på Raspberry Pi 5.

Mottar JSON-pakker fra WT32 over UDP (50 Hz),
skriver til InfluxDB og sender videre via WebSocket til frontend.

Krav:
    pip install influxdb-client aiohttp

Konfigurasjon:
    Sett INFLUX_URL, INFLUX_TOKEN og INFLUX_ORG til ditt InfluxDB-oppsett.
    Standard InfluxDB-oppsett på RPi: http://localhost:8086

Start:
    python udp_receiver.py
"""

import asyncio
import json
import logging
import time
from datetime import datetime

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# ── Konfigurasjon ─────────────────────────────────────────────────────────────

UDP_HOST   = "0.0.0.0"   # lytt på alle grensesnitt
UDP_PORT   = 5005         # WT32 sender hit

INFLUX_URL    = "http://localhost:8086"
INFLUX_TOKEN  = "ditt-influxdb-token-her"   # hentes fra InfluxDB UI under API Tokens
INFLUX_ORG    = "vw-boble"
INFLUX_BUCKET = "sensordata"

# Alarmgrenser — samme som frontend (seksjon 3.4 i spesifikasjon)
GRENSER = {
    "cht1":      {"advarsel": 220, "kritisk": 260},   # °C
    "cht2":      {"advarsel": 220, "kritisk": 260},
    "cht3":      {"advarsel": 220, "kritisk": 260},
    "cht4":      {"advarsel": 220, "kritisk": 260},
    "oil_temp":  {"advarsel": 120, "kritisk": 140},   # °C
    "oil_press": {"min_advarsel": 1.5, "min_kritisk": 0.8},  # bar
    "battery":   {"min_advarsel": 11.5, "min_kritisk": 10.5},  # V
    "fuel":      {"min_advarsel": 8.0, "min_kritisk": 4.0},    # L
}

# Heartbeat — RPi viser alarm om WT32 ikke sender på 3 sekunder
HEARTBEAT_TIMEOUT = 3.0  # sekunder

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── InfluxDB-klient ───────────────────────────────────────────────────────────

class InfluxWriter:
    def __init__(self):
        self.client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
        self.write_api = self.client.write_api(write_options=SYNCHRONOUS)
        log.info(f"Tilkoblet InfluxDB: {INFLUX_URL}")

    def skriv_sensordata(self, data: dict):
        """Skriver alle sensorverdier som ett punkt i InfluxDB."""
        punkt = Point("sensordata").time(datetime.utcnow(), WritePrecision.MILLISECONDS)
        for felt, verdi in data.items():
            if isinstance(verdi, (int, float)):
                punkt = punkt.field(felt, float(verdi))
        try:
            self.write_api.write(bucket=INFLUX_BUCKET, record=punkt)
        except Exception as e:
            log.error(f"InfluxDB skrivefeil: {e}")

    def skriv_event(self, event_type: str, detaljer: str):
        """Skriver hendelser (alarmer, kjøringer) som egne punkter."""
        punkt = (
            Point("events")
            .tag("type", event_type)
            .field("detaljer", detaljer)
            .time(datetime.utcnow(), WritePrecision.MILLISECONDS)
        )
        try:
            self.write_api.write(bucket=INFLUX_BUCKET, record=punkt)
        except Exception as e:
            log.error(f"InfluxDB event-feil: {e}")

# ── Alarm-motor ───────────────────────────────────────────────────────────────

class AlarmMotor:
    def __init__(self, influx: InfluxWriter):
        self.influx = influx
        self.aktive_alarmer: set[str] = set()

    def sjekk(self, data: dict) -> list[dict]:
        """Sjekker grenseverdier og returnerer liste over aktive alarmer."""
        alarmer = []
        for sensor, grense in GRENSER.items():
            verdi = data.get(sensor)
            if verdi is None:
                continue

            kritisk = False
            advarsel = False
            melding = ""

            if "kritisk" in grense and verdi >= grense["kritisk"]:
                kritisk = True
                melding = f"{sensor.upper()} KRITISK: {verdi:.1f}"
            elif "advarsel" in grense and verdi >= grense["advarsel"]:
                advarsel = True
                melding = f"{sensor.upper()} advarsel: {verdi:.1f}"
            elif "min_kritisk" in grense and verdi <= grense["min_kritisk"]:
                kritisk = True
                melding = f"{sensor.upper()} KRITISK LAV: {verdi:.2f}"
            elif "min_advarsel" in grense and verdi <= grense["min_advarsel"]:
                advarsel = True
                melding = f"{sensor.upper()} advarsel lav: {verdi:.2f}"

            if kritisk or advarsel:
                alarmer.append({"sensor": sensor, "melding": melding, "kritisk": kritisk})
                if sensor not in self.aktive_alarmer:
                    self.aktive_alarmer.add(sensor)
                    log.warning(f"ALARM: {melding}")
                    self.influx.skriv_event("alarm", melding)
            else:
                self.aktive_alarmer.discard(sensor)

        return alarmer

# ── UDP-protokoll ─────────────────────────────────────────────────────────────

class UDPProtocol(asyncio.DatagramProtocol):
    def __init__(self, on_pakke):
        self.on_pakke = on_pakke

    def datagram_received(self, data: bytes, addr):
        try:
            melding = json.loads(data.decode("utf-8"))
            self.on_pakke(melding, addr)
        except json.JSONDecodeError as e:
            log.debug(f"Ugyldig JSON fra {addr}: {e}")

    def error_received(self, exc):
        log.error(f"UDP-feil: {exc}")

# ── Hoveddaemon ───────────────────────────────────────────────────────────────

class UDPMottaker:
    def __init__(self):
        self.influx = InfluxWriter()
        self.alarm_motor = AlarmMotor(self.influx)
        self.siste_pakke_ts = 0.0
        self.pakker_mottatt = 0
        self.pakker_per_sekund = 0.0
        self._siste_hz_sjekk = time.monotonic()
        self._hz_teller = 0

    def on_pakke(self, data: dict, addr):
        """Kalles for hver innkommende UDP-pakke fra WT32."""
        naa = time.monotonic()
        self.siste_pakke_ts = naa
        self.pakker_mottatt += 1
        self._hz_teller += 1

        # Beregn frekvens hvert sekund
        dt = naa - self._siste_hz_sjekk
        if dt >= 1.0:
            self.pakker_per_sekund = self._hz_teller / dt
            self._hz_teller = 0
            self._siste_hz_sjekk = naa

        # Skriv til InfluxDB (hvert 10. pakke = 5 Hz for å spare disk)
        if self.pakker_mottatt % 10 == 0:
            self.influx.skriv_sensordata(data)

        # Sjekk alarmer
        alarmer = self.alarm_motor.sjekk(data)
        if alarmer:
            kritiske = [a for a in alarmer if a["kritisk"]]
            if kritiske:
                log.critical(f"KRITISK ALARM x{len(kritiske)} — vurder kill switch!")

    async def heartbeat_vakt(self):
        """Varsler om WT32 slutter å sende data."""
        while True:
            await asyncio.sleep(1.0)
            alder = time.monotonic() - self.siste_pakke_ts
            if alder > HEARTBEAT_TIMEOUT and self.siste_pakke_ts > 0:
                log.error(f"WT32 HEARTBEAT TAPT — ingen data på {alder:.1f}s!")

    async def status_logger(self):
        """Logger status til terminal hvert 10. sekund."""
        while True:
            await asyncio.sleep(10.0)
            log.info(
                f"Status: {self.pakker_mottatt} pakker totalt | "
                f"{self.pakker_per_sekund:.1f} Hz | "
                f"Aktive alarmer: {len(self.alarm_motor.aktive_alarmer)}"
            )

    async def start(self):
        loop = asyncio.get_running_loop()
        log.info(f"Starter UDP-lytter på {UDP_HOST}:{UDP_PORT}")

        transport, _ = await loop.create_datagram_endpoint(
            lambda: UDPProtocol(self.on_pakke),
            local_addr=(UDP_HOST, UDP_PORT),
        )

        log.info("Venter på data fra WT32-ETH01...")
        try:
            await asyncio.gather(
                self.heartbeat_vakt(),
                self.status_logger(),
            )
        finally:
            transport.close()

if __name__ == "__main__":
    mottaker = UDPMottaker()
    asyncio.run(mottaker.start())
