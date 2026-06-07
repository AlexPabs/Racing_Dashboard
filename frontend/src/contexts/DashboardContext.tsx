import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { DashboardConfig, DEFAULT_CONFIG, Sensor, SensorLog, Widget } from '../types'
import { v4 as uuid } from 'uuid'

const STORAGE_KEY = 'racing-dashboard-config'
const CONFIG_VERSION = 3  // øk ved breaking endringer i DEFAULT_CONFIG
const LOG_MAX = 600

interface Ctx {
  config: DashboardConfig
  logs: SensorLog[]
  editMode: boolean
  selectedWidgetId: string | null
  showPanel: 'none' | 'settings' | 'logger' | 'hardware' | 'drag' | 'tpms'
  canvasScale: number
  forceDesktop: boolean
  setEditMode: (v: boolean) => void
  setSelectedWidget: (id: string | null) => void
  setShowPanel: (p: 'none' | 'settings' | 'logger' | 'hardware' | 'drag' | 'tpms') => void
  setCanvasScale: (s: number) => void
  setForceDesktop: (v: boolean) => void
  updateBackground: (type: 'color' | 'image', value: string) => void
  updateSensor: (sensor: Sensor) => void
  addWidget: (widget: Omit<Widget, 'id'>) => void
  updateWidget: (id: string, patch: Partial<Widget>) => void
  removeWidget: (id: string) => void
  updateSensorValue: (id: string, value: number) => void
}

const DashboardCtx = createContext<Ctx>(null!)
export const useDashboard = () => useContext(DashboardCtx)

function load(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Nullstill til default om config-versjon er utdatert
      if (parsed.__version !== CONFIG_VERSION) {
        localStorage.removeItem(STORAGE_KEY)
        return DEFAULT_CONFIG
      }
      return { ...DEFAULT_CONFIG, ...parsed }
    }
  } catch {}
  return DEFAULT_CONFIG
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DashboardConfig>(load)
  const [logs, setLogs] = useState<SensorLog[]>([])
  const [editMode, setEditMode] = useState(false)
  const [selectedWidgetId, setSelectedWidget] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState<'none' | 'settings' | 'logger' | 'hardware' | 'drag' | 'tpms'>('none')
  const [canvasScale, setCanvasScale] = useState(1)
  const [forceDesktop, setForceDesktop] = useState(false)

  // Persist config med versjonsnummer
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, __version: CONFIG_VERSION }))
  }, [config])

  const updateBackground = useCallback((type: 'color' | 'image', value: string) => {
    setConfig(c => ({ ...c, background: { type, value } }))
  }, [])

  const updateSensor = useCallback((sensor: Sensor) => {
    setConfig(c => ({ ...c, sensors: c.sensors.map(s => s.id === sensor.id ? sensor : s) }))
  }, [])

  const addWidget = useCallback((w: Omit<Widget, 'id'>) => {
    setConfig(c => ({ ...c, widgets: [...c.widgets, { ...w, id: uuid() }] }))
  }, [])

  const updateWidget = useCallback((id: string, patch: Partial<Widget>) => {
    setConfig(c => ({ ...c, widgets: c.widgets.map(w => w.id === id ? { ...w, ...patch } : w) }))
  }, [])

  const removeWidget = useCallback((id: string) => {
    setConfig(c => ({ ...c, widgets: c.widgets.filter(w => w.id !== id) }))
    setSelectedWidget(null)
  }, [])

  const updateSensorValue = useCallback((id: string, value: number) => {
    setConfig(c => ({
      ...c,
      sensors: c.sensors.map(s => s.id === id ? { ...s, value: (value + s.offset) * s.scale } : s)
    }))
  }, [])

  // Log snapshot every second
  const configRef = useRef(config)
  configRef.current = config
  useEffect(() => {
    const t = setInterval(() => {
      const snap: SensorLog = {
        timestamp: Date.now(),
        values: Object.fromEntries(configRef.current.sensors.map(s => [s.id, s.value]))
      }
      setLogs(prev => [...prev.slice(-LOG_MAX + 1), snap])
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <DashboardCtx.Provider value={{
      config, logs, editMode, selectedWidgetId, showPanel, canvasScale, forceDesktop,
      setEditMode, setSelectedWidget, setShowPanel, setCanvasScale, setForceDesktop,
      updateBackground, updateSensor, addWidget, updateWidget, removeWidget, updateSensorValue
    }}>
      {children}
    </DashboardCtx.Provider>
  )
}
