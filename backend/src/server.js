const express = require('express')
const { WebSocketServer } = require('ws')
const cors = require('cors')
const http = require('http')
const Database = require('better-sqlite3')
const path = require('path')

const app = express()
app.use(cors())
app.use(express.json())

// SQLite for logging
const db = new Database(path.join(__dirname, '../racing.db'))
db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts INTEGER NOT NULL,
    sensor_id TEXT NOT NULL,
    value REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ts ON sensor_log(ts);
`)

const insertLog = db.prepare('INSERT INTO sensor_log (ts, sensor_id, value) VALUES (?, ?, ?)')

// In-memory sensor state (matches frontend DEFAULT_SENSORS ids)
const sensors = {
  // Ignition / drivetrain
  rpm:            { value: 0,    min: 0,   max: 6000 },
  ignition_adv:   { value: 12,   min: -5,  max: 40   },
  speed:          { value: 0,    min: 0,   max: 160  },
  // Olje
  oil_temp:       { value: 80,   min: 0,   max: 150  },
  oil_press:      { value: 3,    min: 0,   max: 8    },
  // CHT — sylinderhode-temp
  cht1:           { value: 150,  min: 0,   max: 300  },
  cht2:           { value: 145,  min: 0,   max: 300  },
  cht3:           { value: 155,  min: 0,   max: 300  },
  cht4:           { value: 148,  min: 0,   max: 300  },
  // Luftkjøling
  iat:            { value: 25,   min: -20, max: 80   },
  // Blanding
  lambda:         { value: 1.0,  min: 0.7, max: 1.3  },
  // Elektrisk / drivstoff
  battery:        { value: 13.8, min: 10,  max: 16   },
  fuel:           { value: 30,   min: 0,   max: 40   },
  // Suging
  manifold_press: { value: -0.4, min: -1,  max: 0.5  },
  // TPMS — dekktrykk (433MHz trådløs, leses av RPI via rtl_433)
  tpms_fl:        { value: 2.2,  min: 0,   max: 4    },
  tpms_fr:        { value: 2.2,  min: 0,   max: 4    },
  tpms_rl:        { value: 2.0,  min: 0,   max: 4    },
  tpms_rr:        { value: 2.0,  min: 0,   max: 4    },
}

// --- REST API ---
app.get('/api/sensors', (req, res) => {
  res.json(sensors)
})

app.get('/api/log', (req, res) => {
  const { sensor, from, limit = 1000 } = req.query
  let rows
  if (sensor && from) {
    rows = db.prepare('SELECT ts, value FROM sensor_log WHERE sensor_id=? AND ts>=? ORDER BY ts DESC LIMIT ?')
      .all(sensor, Number(from), Number(limit))
  } else if (sensor) {
    rows = db.prepare('SELECT ts, value FROM sensor_log WHERE sensor_id=? ORDER BY ts DESC LIMIT ?')
      .all(sensor, Number(limit))
  } else {
    rows = db.prepare('SELECT * FROM sensor_log ORDER BY ts DESC LIMIT ?').all(Number(limit))
  }
  res.json(rows.reverse())
})

// Push raw sensor value (from ESP32 HTTP POST, or serial bridge)
app.post('/api/sensor/:id', (req, res) => {
  const { id } = req.params
  const { value } = req.body
  if (sensors[id] === undefined) return res.status(404).json({ error: 'unknown sensor' })
  sensors[id].value = Number(value)
  broadcast({ type: 'update', id, value: sensors[id].value })
  res.json({ ok: true })
})

// Bulk update from ESP32 (all sensors in one POST)
// Body: { oil_temp: 92.3, oil_press: 3.1, ... }
app.post('/api/sensors/bulk', (req, res) => {
  const updates = req.body
  for (const [id, value] of Object.entries(updates)) {
    if (sensors[id] !== undefined) sensors[id].value = Number(value)
  }
  broadcast({ type: 'bulk', sensors })
  res.json({ ok: true })
})

// --- WebSocket ---
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

function broadcast(msg) {
  const data = JSON.stringify(msg)
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data)
  }
}

wss.on('connection', ws => {
  ws.send(JSON.stringify({ type: 'snapshot', sensors }))
})

// --- Mock data (runs when MOCK !== 'false') ---
const MOCK_MODE = process.env.MOCK !== 'false'
if (MOCK_MODE) {
  let t = 0
  setInterval(() => {
    t += 0.05
    const rpm = 2000 + Math.sin(t * 0.7) * 1500 + Math.random() * 200
    sensors.rpm.value           = rpm
    sensors.speed.value         = 60   + Math.sin(t * 0.5) * 40   + Math.random() * 5
    sensors.oil_temp.value      = 85   + Math.sin(t * 0.2) * 20   + Math.random() * 2
    sensors.oil_press.value     = 3.5  + Math.sin(t * 0.3) * 1.5  + Math.random() * 0.2
    sensors.cht1.value          = 160  + Math.sin(t * 0.18) * 30  + Math.random() * 3
    sensors.cht2.value          = 155  + Math.sin(t * 0.20) * 25  + Math.random() * 3
    sensors.cht3.value          = 165  + Math.sin(t * 0.17) * 28  + Math.random() * 3
    sensors.cht4.value          = 158  + Math.sin(t * 0.19) * 32  + Math.random() * 3
    sensors.iat.value           = 28   + Math.sin(t * 0.05) * 8   + Math.random() * 1
    sensors.lambda.value        = 1.0  + Math.sin(t * 1.2) * 0.06 + Math.random() * 0.01
    sensors.battery.value       = 13.8 + Math.sin(t * 0.1) * 0.5  + Math.random() * 0.1
    sensors.fuel.value          = Math.max(0, 30 - t * 0.01)
    sensors.manifold_press.value = -0.4 + (rpm / 6000) * 0.3      + Math.random() * 0.02
    // 123ignition: advance increases with RPM, decreases under load
    sensors.ignition_adv.value  = 8 + (rpm / 6000) * 24           + Math.random() * 0.5
    // TPMS varierer sakte (trykk øker litt med varme)
    sensors.tpms_fl.value       = 2.2 + Math.sin(t * 0.01) * 0.05 + Math.random() * 0.01
    sensors.tpms_fr.value       = 2.2 + Math.sin(t * 0.01) * 0.04 + Math.random() * 0.01
    sensors.tpms_rl.value       = 2.0 + Math.sin(t * 0.01) * 0.06 + Math.random() * 0.01
    sensors.tpms_rr.value       = 2.0 + Math.sin(t * 0.01) * 0.05 + Math.random() * 0.01

    broadcast({ type: 'bulk', sensors })
  }, 100)

  // Log to SQLite every second
  setInterval(() => {
    const ts = Date.now()
    for (const [id, s] of Object.entries(sensors)) {
      insertLog.run(ts, id, s.value)
    }
  }, 1000)
}

// --- Serial port bridge (ESP32 via USB) ---
// Uncomment when hardware ready. Expected format: "sensor_id:value\n"
//
// const { SerialPort } = require('serialport')
// const { ReadlineParser } = require('@serialport/parser-readline')
// const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 })
// const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
// parser.on('data', line => {
//   const [id, val] = line.trim().split(':')
//   if (sensors[id] !== undefined) {
//     sensors[id].value = parseFloat(val)
//     broadcast({ type: 'update', id, value: sensors[id].value })
//   }
// })

// --- 123\ignition TUNE+ Bluetooth LE bridge ---
// The 123TUNE+ broadcasts RPM + advance via BLE on RPI.
// Install: npm install @abandonware/noble
// Run RPI with: sudo node server.js  (BLE needs root or cap_net_raw)
//
// const noble = require('@abandonware/noble')
// const TUNE_SERVICE = '0000ffe0-0000-1000-8000-00805f9b34fb'  // common BLE UART service
// const TUNE_CHAR    = '0000ffe1-0000-1000-8000-00805f9b34fb'
//
// noble.on('stateChange', state => { if (state === 'poweredOn') noble.startScanning() })
// noble.on('discover', peripheral => {
//   if (!peripheral.advertisement.localName?.includes('123')) return
//   peripheral.connect(() => {
//     peripheral.discoverSomeServicesAndCharacteristics([TUNE_SERVICE], [TUNE_CHAR], (_, __, chars) => {
//       chars[0].on('data', buf => {
//         // 123TUNE+ packet: 2 bytes RPM (big-endian), 1 byte advance (degrees)
//         const rpm = buf.readUInt16BE(0)
//         const adv = buf.readUInt8(2)
//         sensors.rpm.value = rpm
//         sensors.ignition_adv.value = adv
//         broadcast({ type: 'bulk', sensors })
//       })
//       chars[0].subscribe()
//     })
//   })
// })

// --- TPMS dekktrykk via rtl_433 (433MHz RF) ---
// Koble RTL-SDR USB-dongle til RPI, installer rtl_433:
//   sudo apt install rtl-433
//   rtl_433 -F json -R 161  (protokoll 161 = mange TPMS-merkevarer)
//
// Spawn child process og parse JSON-output:
//
// const { spawn } = require('child_process')
// const rtl = spawn('rtl_433', ['-F', 'json', '-R', '161'])
// rtl.stdout.on('data', chunk => {
//   const lines = chunk.toString().split('\n').filter(Boolean)
//   for (const line of lines) {
//     try {
//       const d = JSON.parse(line)
//       // d.id identifiserer sensoren (lær ID ved første kjøring)
//       // Tilordne ID → sensor:
//       const idMap = { 12345678: 'tpms_fl', 12345679: 'tpms_fr',
//                       12345680: 'tpms_rl', 12345681: 'tpms_rr' }
//       const sid = idMap[d.id]
//       if (sid && d.pressure_kPa) {
//         sensors[sid].value = d.pressure_kPa / 100  // kPa → bar
//         broadcast({ type: 'update', id: sid, value: sensors[sid].value })
//       }
//     } catch {}
//   }
// })

// Serve built frontend
const frontendDist = path.join(__dirname, '../../frontend/dist')
if (require('fs').existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')))
  console.log('Serving frontend from', frontendDist)
}

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`Racing backend on :${PORT}  →  http://localhost:${PORT}`))
