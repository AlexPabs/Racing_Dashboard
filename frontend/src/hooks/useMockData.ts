import { useEffect, useRef } from 'react'
import { useDashboard } from '../contexts/DashboardContext'

// Simulates real sensor data until hardware is connected
export function useMockData() {
  const { updateSensorValue } = useDashboard()
  const t = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      t.current += 0.05
      const T = t.current

      updateSensorValue('rpm', 2000 + Math.sin(T * 0.7) * 1500 + Math.random() * 200)
      updateSensorValue('speed', 60 + Math.sin(T * 0.5) * 40 + Math.random() * 5)
      updateSensorValue('oil_temp', 85 + Math.sin(T * 0.2) * 20 + Math.random() * 2)
      updateSensorValue('oil_press', 3.5 + Math.sin(T * 0.3) * 1.5 + Math.random() * 0.2)
      updateSensorValue('water_temp', 88 + Math.sin(T * 0.15) * 10 + Math.random() * 1)
      updateSensorValue('battery', 13.8 + Math.sin(T * 0.1) * 0.5 + Math.random() * 0.1)
      updateSensorValue('fuel', 35 - T * 0.01)
      updateSensorValue('boost', Math.sin(T * 0.8) * 0.8 + Math.random() * 0.1)
    }, 100)
    return () => clearInterval(interval)
  }, [updateSensorValue])
}
