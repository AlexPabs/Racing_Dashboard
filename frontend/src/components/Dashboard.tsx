import { useEffect, useState } from 'react'
import { useDashboard } from '../contexts/DashboardContext'
import { Widget } from './Widget'
import { Toolbar } from './Toolbar'
import { AlarmBanner } from './AlarmBanner'
import { MobileView } from './MobileView'
import { SettingsPanel } from './panels/SettingsPanel'
import { LoggerPanel } from './panels/LoggerPanel'
import { HardwarePanel } from './panels/HardwarePanel'
import { DragPanel } from './panels/DragPanel'
import { TPMSPanel } from './panels/TPMSPanel'
import { useMockData } from '../hooks/useMockData'

function useNattmodus(): number {
  const [dimming, setDimming] = useState(1)
  useEffect(() => {
    function oppdater() {
      const time = new Date()
      const h = time.getHours()
      // Dimm mellom 22:00 og 06:00 ned til 40% lysstyrke
      if (h >= 22 || h < 6) setDimming(0.4)
      else setDimming(1)
    }
    oppdater()
    const t = setInterval(oppdater, 60_000)
    return () => clearInterval(t)
  }, [])
  return dimming
}

// Virtuell designstørrelse som widgets er laget for
const CANVAS_W = 720
const CANVAS_H = 590

function useViewport() {
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const handler = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return vp
}

export function Dashboard() {
  useMockData()
  const { config, showPanel, setSelectedWidget, setShowPanel, editMode, forceDesktop, setCanvasScale } = useDashboard()
  const { background } = config
  const dimming = useNattmodus()
  const vp = useViewport()

  const isMobileDomain = window.location.hostname.startsWith('m.')
  const erMobil = (vp.w < 768 || isMobileDomain) && !forceDesktop

  const scale = Math.min(vp.w / CANVAS_W, vp.h / CANVAS_H)
  const canvasLeft = (vp.w - CANVAS_W * scale) / 2
  const canvasTop = (vp.h - CANVAS_H * scale) / 2

  useEffect(() => {
    setCanvasScale(erMobil ? 1 : scale)
  }, [scale, erMobil, setCanvasScale])

  // Mobilvisning — kompakt layout for telefon
  if (erMobil && showPanel === 'none') {
    return (
      <div style={{ filter: `brightness(${dimming})`, transition: 'filter 2s ease' }}>
        <AlarmBanner />
        <MobileView />
      </div>
    )
  }

  const bgStyle = background.type === 'image'
    ? { backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: background.value }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        ...bgStyle,
        overflow: 'hidden',
        filter: `brightness(${dimming})`,
        transition: 'filter 2s ease',
      }}
      onClick={() => editMode && setSelectedWidget(null)}
    >
      {/* Skalert widget-canvas — passer alltid til skjermen */}
      <div style={{
        position: 'absolute',
        left: canvasLeft,
        top: canvasTop,
        width: CANVAS_W,
        height: CANVAS_H,
        transformOrigin: 'top left',
        transform: `scale(${scale})`,
      }}>
        {config.widgets.map(w => <Widget key={w.id} widget={w} />)}
      </div>
      <AlarmBanner />
      <Toolbar />
      {showPanel === 'settings' && <SettingsPanel />}
      {showPanel === 'logger' && <LoggerPanel />}
      {showPanel === 'hardware' && <HardwarePanel onClose={() => setShowPanel('none')} />}
      {showPanel === 'drag' && <DragPanel onClose={() => setShowPanel('none')} />}
      {showPanel === 'tpms' && <TPMSPanel onClose={() => setShowPanel('none')} />}
    </div>
  )
}
