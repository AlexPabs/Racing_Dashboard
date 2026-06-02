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
  background: { type: 'color', value: '#0a0a0a' },
  globalTheme: 'modern',
  sensors: DEFAULT_SENSORS,
  widgets: [
    { id: 'w1', sensorId: 'rpm',       type: 'gauge',  x: 40,  y: 50,  width: 240, height: 240, theme: 'modern' },
    { id: 'w2', sensorId: 'speed',     type: 'number', x: 300, y: 50,  width: 200, height: 110, theme: 'modern' },
    { id: 'w3', sensorId: 'oil_temp',  type: 'bar',    x: 300, y: 180, width: 200, height: 80,  theme: 'modern' },
    { id: 'w4', sensorId: 'cht1',      type: 'bar',    x: 300, y: 275, width: 200, height: 80,  theme: 'modern' },
    { id: 'w5', sensorId: 'oil_press', type: 'number', x: 40,  y: 310, width: 160, height: 90,  theme: 'modern' },
  ]
}
