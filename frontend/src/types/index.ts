export type WidgetType = 'gauge' | 'number' | 'bar' | 'graph'
export type Theme = 'modern' | 'analog' | 'minimal'

export interface Sensor {
  id: string
  name: string
  unit: string
  min: number
  max: number
  value: number
  // Calibration
  offset: number
  scale: number
  decimals: number
  // Thresholds
  warnMin?: number
  warnMax?: number
  critMin?: number
  critMax?: number
}

export interface SensorLog {
  timestamp: number
  values: Record<string, number>
}

export interface Widget {
  id: string
  sensorId: string
  type: WidgetType
  x: number
  y: number
  width: number
  height: number
  theme: Theme
  label?: string
}

export interface Background {
  type: 'color' | 'image'
  value: string
}

export interface DashboardConfig {
  background: Background
  widgets: Widget[]
  sensors: Sensor[]
  globalTheme: Theme
}

export const DEFAULT_SENSORS: Sensor[] = [
  // ── Ignition / drivetrain ───────────────────────────────────────────────
  { id: 'rpm',             name: 'RPM',              unit: 'rpm', min: 0,    max: 6000, value: 0, offset: 0, scale: 1, decimals: 0, warnMax: 5500 },
  { id: 'ignition_adv',   name: 'Tenning',          unit: '°',   min: -5,   max: 40,   value: 0, offset: 0, scale: 1, decimals: 1 },
  { id: 'speed',           name: 'Hastighet',        unit: 'km/h',min: 0,    max: 160,  value: 0, offset: 0, scale: 1, decimals: 0 },

  // ── Olje ────────────────────────────────────────────────────────────────
  { id: 'oil_temp',        name: 'Olje Temp',        unit: '°C',  min: 0,    max: 150,  value: 0, offset: 0, scale: 1, decimals: 1, warnMax: 120, critMax: 140 },
  { id: 'oil_press',       name: 'Olje Trykk',       unit: 'bar', min: 0,    max: 8,    value: 0, offset: 0, scale: 1, decimals: 1, warnMin: 1.5, critMin: 0.8 },

  // ── Sylinderhode-temperatur (CHT) ────────────────────────────────────────
  { id: 'cht1',            name: 'CHT Syl. 1',       unit: '°C',  min: 0,    max: 300,  value: 0, offset: 0, scale: 1, decimals: 0, warnMax: 220, critMax: 260 },
  { id: 'cht2',            name: 'CHT Syl. 2',       unit: '°C',  min: 0,    max: 300,  value: 0, offset: 0, scale: 1, decimals: 0, warnMax: 220, critMax: 260 },
  { id: 'cht3',            name: 'CHT Syl. 3',       unit: '°C',  min: 0,    max: 300,  value: 0, offset: 0, scale: 1, decimals: 0, warnMax: 220, critMax: 260 },
  { id: 'cht4',            name: 'CHT Syl. 4',       unit: '°C',  min: 0,    max: 300,  value: 0, offset: 0, scale: 1, decimals: 0, warnMax: 220, critMax: 260 },

  // ── Luftkjøling / inntaksluft ────────────────────────────────────────────
  { id: 'iat',             name: 'Inntaksluft',      unit: '°C',  min: -20,  max: 80,   value: 0, offset: 0, scale: 1, decimals: 1 },

  // ── Dekktrykk (TPMS — 433MHz trådløs) ──────────────────────────────────
  { id: 'tpms_fl',         name: 'Dekk FL',          unit: 'bar', min: 0,    max: 4,    value: 0, offset: 0, scale: 1, decimals: 2, warnMin: 1.7, critMin: 1.4 },
  { id: 'tpms_fr',         name: 'Dekk FR',          unit: 'bar', min: 0,    max: 4,    value: 0, offset: 0, scale: 1, decimals: 2, warnMin: 1.7, critMin: 1.4 },
  { id: 'tpms_rl',         name: 'Dekk RL',          unit: 'bar', min: 0,    max: 4,    value: 0, offset: 0, scale: 1, decimals: 2, warnMin: 1.7, critMin: 1.4 },
  { id: 'tpms_rr',         name: 'Dekk RR',          unit: 'bar', min: 0,    max: 4,    value: 0, offset: 0, scale: 1, decimals: 2, warnMin: 1.7, critMin: 1.4 },

  // ── Blanding ─────────────────────────────────────────────────────────────
  { id: 'lambda',          name: 'Lambda / AFR',     unit: 'λ',   min: 0.7,  max: 1.3,  value: 0, offset: 0, scale: 1, decimals: 3, warnMin: 0.85, warnMax: 1.1 },

  // ── Elektrisk / drivstoff ────────────────────────────────────────────────
  { id: 'battery',         name: 'Batteri',          unit: 'V',   min: 10,   max: 16,   value: 0, offset: 0, scale: 1, decimals: 2, warnMin: 11.5, critMin: 10.5 },
  { id: 'fuel',            name: 'Drivstoff',        unit: 'L',   min: 0,    max: 40,   value: 0, offset: 0, scale: 1, decimals: 1, warnMin: 8, critMin: 4 },

  // ── Suging / boost (valgfritt) ───────────────────────────────────────────
  { id: 'manifold_press',  name: 'Innsugning',       unit: 'bar', min: -1,   max: 0.5,  value: 0, offset: 0, scale: 1, decimals: 2 },
]

export const DEFAULT_CONFIG: DashboardConfig = {
  background: { type: 'color', value: '#0D1117' },
  globalTheme: 'modern',
  sensors: DEFAULT_SENSORS,
  widgets: [
    // Stor RPM-gauge til venstre
    { id: 'w1',  sensorId: 'rpm',           type: 'gauge',  x: 20,  y: 60,  width: 260, height: 260, theme: 'modern' },
    // Lambda/AFR gauge
    { id: 'w6',  sensorId: 'lambda',        type: 'gauge',  x: 290, y: 60,  width: 200, height: 200, theme: 'modern' },
    // Hastighet og batteri
    { id: 'w2',  sensorId: 'speed',         type: 'number', x: 500, y: 60,  width: 190, height: 100, theme: 'modern' },
    { id: 'w7',  sensorId: 'battery',       type: 'number', x: 500, y: 168, width: 190, height: 80,  theme: 'modern' },
    // Tenningsvinkel
    { id: 'w10', sensorId: 'ignition_adv',  type: 'number', x: 500, y: 255, width: 190, height: 80,  theme: 'modern' },
    // Olje og drivstoff
    { id: 'w3',  sensorId: 'oil_temp',      type: 'bar',    x: 20,  y: 335, width: 220, height: 70,  theme: 'modern' },
    { id: 'w5',  sensorId: 'oil_press',     type: 'bar',    x: 20,  y: 415, width: 220, height: 70,  theme: 'modern' },
    { id: 'w8',  sensorId: 'fuel',          type: 'bar',    x: 20,  y: 495, width: 220, height: 70,  theme: 'modern' },
    // CHT — alle fire sylindre
    { id: 'w4',  sensorId: 'cht1',          type: 'bar',    x: 250, y: 280, width: 220, height: 65,  theme: 'modern' },
    { id: 'w11', sensorId: 'cht2',          type: 'bar',    x: 250, y: 353, width: 220, height: 65,  theme: 'modern' },
    { id: 'w12', sensorId: 'cht3',          type: 'bar',    x: 250, y: 426, width: 220, height: 65,  theme: 'modern' },
    { id: 'w13', sensorId: 'cht4',          type: 'bar',    x: 250, y: 499, width: 220, height: 65,  theme: 'modern' },
    // Graf — AFR over tid
    { id: 'w9',  sensorId: 'lambda',        type: 'graph',  x: 480, y: 345, width: 220, height: 100, theme: 'modern' },
    // RPM-graf
    { id: 'w14', sensorId: 'rpm',           type: 'graph',  x: 480, y: 453, width: 220, height: 100, theme: 'modern' },
  ]
}
