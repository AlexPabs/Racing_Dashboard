# Racing Dashboard Backend

Node.js backend som kjører på RPI i bilen.

## Start

```bash
npm install
npm start          # produksjon med mock data
MOCK=false npm start  # produksjon med ekte hardware
```

## Arduino-tilkobling

I `server.js` - uncomment SerialPort-blokken og sett riktig port:
- Linux (RPI): `/dev/ttyUSB0` eller `/dev/ttyACM0`
- Windows: `COM3` e.l.

Arduino sender `sensor_id:verdi\n` via serial, f.eks. `oil_temp:92.3\n`

## API

- `GET /api/sensors` — nåværende verdier
- `POST /api/sensor/:id` — push verdi (body: `{value: 92.3}`)
- `GET /api/log?sensor=oil_temp&limit=500` — historikk
- `WS /ws` — live WebSocket stream

## Sensorer

| ID | Navn | Enhet |
|---|---|---|
| oil_temp | Oil Temp | °C |
| oil_press | Oil Pressure | bar |
| water_temp | Water Temp | °C |
| rpm | RPM | rpm |
| speed | Speed | km/h |
| battery | Battery | V |
| fuel | Fuel | L |
| boost | Boost | bar |
