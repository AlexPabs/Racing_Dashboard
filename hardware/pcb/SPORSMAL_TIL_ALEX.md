# PCB v0.5 — Spørsmål til Alex
## Fyll ut og send tilbake til neste AI

---

### 1. Tenningssignal / RPM (KRITISK)
Hva er kilden til RPM-signalet på bilen?

- [x ] Originale platina-punkter + tenningsspole (primærside, 300V spikes)
- [ ] MSD / CDI-boks med dedikert tach-utgang (typisk 5V-12V rent signal)
- [ ] Hall-sensor / VR-sensor på veivakselen
- [ ] Annet: _______________

Svar: _______________


### 2. MOSFET-laster (KRITISK for dimensjonering)
Hva kobler hver utgang til? Oppgi navn, ca. strøm, og om det er induktivt.

| Utgang | Last (hva) | Ca. strøm | Induktiv? (relé/spole=ja) |
|--------|-----------|-----------|--------------------------|
| OUT1 (Vifte) | f.eks. "Spal 7.5" | f.eks. "8A" | Nei (motor) |
| OUT2 (Pumpe) | | | |
| OUT3 (Shift-light) | | | |
| OUT4 (Spare) | | | |
Vet ikke. Lag en standard som kan trekke over 5A hvis det er enklere.
Hvis noen laster trekker over 5A: boardet trenger relay-mellomsteg.
AO3400A tåler maks 5.7A — er det nok for alle lastene?


### 3. Sensorliste (for korrekt skalering)
Hvilke spesifikke sensorer bruker du?

| Sensor | Merke/modell | Type | Utgang |
|--------|-------------|------|--------|
| Oljetrykk | f.eks. "VDO 360-081-030-015C" | 0-5V | 0-10 bar |
| Sensor 2 (ANA2) | | | |
| NTC 1 (hva) | | | |
| NTC 2 (hva) | | | |
| NTC 3 (hva) | | | |
| NTC 4 (hva) | | | |

Bruker du alle 8 termokobler-kanaler? Hvis bare 4-5, kan vi droppe noen MAX31855.
Hva måler de? (f.eks. CHT1, CHT2, EGT1, EGT2, oljetemperatur, ...)
Tanken er CHT1, CHT2, CHT3, CHT4, EGT1, EGT2, EGT3, EGT4, Oljetemperatur, oljetrykk, lambda, volt, turteller.

### 4. GPS-modul
Hvilken modul har du / skal kjøpe?

- [ ] u-blox NEO-6M breakout (den blå, har egen 3.3V LDO, matespenning 3.3-5V)
- [ ] u-blox NEO-M8N breakout
- [ ] u-blox NEO-M9N breakout
- [ ] Bare chip (uten breakout board)
- [ ] Har ikke bestemt, anbefal noe: __x_

Svar: _______________


### 5. Kabinett / boks
Hva slags boks monteres PCBen i?

- Innvendige mål (L×B×H): ___ × ___ × ___ mm
- Hvilken kant kommer kablene ut?
  - [ ] Topp (mot termokobler)
  - [ ] Høyre (mot RJ45/Ethernet)
  - [ ] Bunn
  - [ ] Venstre
  - [ ] Flere kanter: ___
- Har du bestemt boksen, eller skal PCB-størrelsen bestemme boksen?
PCB bestemmer boks. Jeg lager boks selv

Svar: _______________


### 6. Firmware
Har du Teensy-kode (Arduino/PlatformIO)?

- [ ] Ja, den ligger her: _______________
- [ ] Ja, men den er på min lokale maskin (ikke i repo)
- [ x] Nei, firmware er ikke skrevet ennå

Svar: _______________


### 7. Produksjon
Hva er planen?

- [ ] Én prototype, håndloddet hjemme
- [ ] 5 stk fra PCBway, håndloddet
- [x ] PCBway + JLCPCB assembly (SMD-montert)

Hvis JLCPCB assembly: vi bør holde oss til 0805 SMD og unngå 0402.

Svar: _______________


### 8. Småvalg (ja/nei)

| Funksjon | Ja/Nei |
|----------|--------|
| Test-pads på SPI, I2C, strøm? | JA|
| Reset-knapp for Teensy? | JA|
| Status-LED (grønn, på EXPN_P2)? | JA|
| NeoPixel 300Ω serie-resistor? | JA|

### 9. Termokobler-bruk
Hvor mange av de 8 TC-kanalene bruker du faktisk?

Kanal → hva den måler:
- TC1: ___CHT1
- TC2: ___CHT2
- TC3: ___CHT3
- TC4: ___CHT4
- TC5: ___EGT1
- TC6: ___EGT2
- TC7: ___EGT3
- TC8: ___EGT4

Hvis du bare bruker 4, kan vi halvere MAX31855-antallet og spare plass/penger.
kan helt sikkert halvevere disse

---

## Oppsummering: Minimum du MÅ svare på
1. RPM-kilde (punkter / MSD / Hall)
2. MOSFET-laster (hva + strøm)
3. Sensormodeller (analog + NTC)
4. GPS-modul (hvilken)
5. Kabinett (mål + kabel-kant)
6. Firmware (finnes den?)

Resten kan vi velge fornuftige defaults på hvis du ikke svarer.
