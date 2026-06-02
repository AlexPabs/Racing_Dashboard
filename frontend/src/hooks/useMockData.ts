import { useEffect, useRef } from 'react'
import { useDashboard } from '../contexts/DashboardContext'

// Simulerer reell sensordata til hardware er koblet til
// Når backend kjører på port 4000, kobles WebSocket automatisk i stedet
export function useMockData() {
  const { updateSensorValue } = useDashboard()
  const t = useRef(0)

  useEffect(() => {
    // Forsøk WebSocket-tilkobling til backend
    let ws: WebSocket | null = null
    let useMock = true

    try {
      ws = new WebSocket(`ws://${window.location.hostname}:4000/ws`)

      ws.onopen = () => {
        useMock = false
      }

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)
          if (msg.type === 'snapshot' || msg.type === 'bulk') {
            for (const [id, data] of Object.entries(msg.sensors as Record<string, { value: number }>)) {
              updateSensorValue(id, data.value)
            }
          } else if (msg.type === 'update') {
            updateSensorValue(msg.id, msg.value)
          }
        } catch {}
      }

      ws.onerror = () => { useMock = true }
      ws.onclose = () => { useMock = true }
    } catch {}

    // Mock-data loop (brukes om WebSocket ikke er tilgjengelig)
    const interval = setInterval(() => {
      if (!useMock) return
      t.current += 0.05
      const T = t.current

      const rpm = 2000 + Math.sin(T * 0.7) * 1500 + Math.random() * 200
      updateSensorValue('rpm', rpm)
      updateSensorValue('speed', 60 + Math.sin(T * 0.5) * 40 + Math.random() * 5)
      updateSensorValue('ignition_adv', 8 + (rpm / 6000) * 24 + Math.random() * 0.5)

      // Olje
      updateSensorValue('oil_temp', 85 + Math.sin(T * 0.2) * 20 + Math.random() * 2)
      updateSensorValue('oil_press', 3.5 + Math.sin(T * 0.3) * 1.5 + Math.random() * 0.2)

      // CHT — alle fire sylindre
      updateSensorValue('cht1', 160 + Math.sin(T * 0.18) * 30 + Math.random() * 3)
      updateSensorValue('cht2', 155 + Math.sin(T * 0.20) * 25 + Math.random() * 3)
      updateSensorValue('cht3', 165 + Math.sin(T * 0.17) * 28 + Math.random() * 3)
      updateSensorValue('cht4', 158 + Math.sin(T * 0.19) * 32 + Math.random() * 3)

      // Lambda/AFR
      updateSensorValue('lambda', 1.0 + Math.sin(T * 1.2) * 0.06 + Math.random() * 0.01)

      // Inntaksluft + drivstoff
      updateSensorValue('iat', 28 + Math.sin(T * 0.05) * 8 + Math.random() * 1)
      updateSensorValue('fuel', Math.max(0, 30 - T * 0.01))
      updateSensorValue('manifold_press', -0.4 + (rpm / 6000) * 0.3 + Math.random() * 0.02)

      // Elektrisk
      updateSensorValue('battery', 13.8 + Math.sin(T * 0.1) * 0.5 + Math.random() * 0.1)

      // TPMS — trykk varierer sakte med varme
      updateSensorValue('tpms_fl', 2.2 + Math.sin(T * 0.01) * 0.05 + Math.random() * 0.01)
      updateSensorValue('tpms_fr', 2.2 + Math.sin(T * 0.01) * 0.04 + Math.random() * 0.01)
      updateSensorValue('tpms_rl', 2.0 + Math.sin(T * 0.01) * 0.06 + Math.random() * 0.01)
      updateSensorValue('tpms_rr', 2.0 + Math.sin(T * 0.01) * 0.05 + Math.random() * 0.01)
    }, 100)

    return () => {
      clearInterval(interval)
      ws?.close()
    }
  }, [updateSensorValue])
}
