import { useDashboard } from '../contexts/DashboardContext'
import { Widget } from './Widget'
import { Toolbar } from './Toolbar'
import { SettingsPanel } from './panels/SettingsPanel'
import { LoggerPanel } from './panels/LoggerPanel'
import { HardwarePanel } from './panels/HardwarePanel'
import { useMockData } from '../hooks/useMockData'

export function Dashboard() {
  useMockData()
  const { config, showPanel, setSelectedWidget, setShowPanel, editMode } = useDashboard()
  const { background } = config

  const bgStyle = background.type === 'image'
    ? { backgroundImage: `url(${background.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: background.value }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        ...bgStyle,
        overflow: 'hidden',
      }}
      onClick={() => editMode && setSelectedWidget(null)}
    >
      {config.widgets.map(w => <Widget key={w.id} widget={w} />)}
      <Toolbar />
      {showPanel === 'settings' && <SettingsPanel />}
      {showPanel === 'logger' && <LoggerPanel />}
      {showPanel === 'hardware' && <HardwarePanel onClose={() => setShowPanel('none')} />}
    </div>
  )
}
