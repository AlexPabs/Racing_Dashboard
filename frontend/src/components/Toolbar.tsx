import { useDashboard } from '../contexts/DashboardContext'

export function Toolbar() {
  const { editMode, setEditMode, showPanel, setShowPanel, forceDesktop, setForceDesktop } = useDashboard()

  const btn = (label: string, active: boolean, onClick: () => void, color = '#00C8FF') => (
    <button onClick={onClick} style={{
      background: active ? `${color}22` : 'transparent',
      border: `1px solid ${active ? color : '#2a3040'}`,
      color: active ? color : '#4a5568',
      borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      fontFamily: 'IBM Plex Mono, monospace',
      transition: 'all 0.15s',
    }}>{label}</button>
  )

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, alignItems: 'center',
      background: '#0a0f18', border: '1px solid #1a2030',
      borderRadius: 10, padding: '6px 10px',
      zIndex: 2000, boxShadow: '0 4px 20px #000c',
    }}>
      <span style={{ color: '#2a3040', fontSize: 10, letterSpacing: 2, marginRight: 4, fontFamily: 'IBM Plex Mono, monospace' }}>VW 1956</span>
      {forceDesktop && btn('MOBIL', false, () => setForceDesktop(false), '#a8ff3e')}
      {btn('EDIT', editMode, () => { setEditMode(!editMode); if (showPanel === 'settings') setShowPanel('none') })}
      {btn('INNSTILLINGER', showPanel === 'settings', () => setShowPanel(showPanel === 'settings' ? 'none' : 'settings'))}
      {btn('DRAG', showPanel === 'drag', () => setShowPanel(showPanel === 'drag' ? 'none' : 'drag'), '#a8ff3e')}
      {btn('TPMS', showPanel === 'tpms', () => setShowPanel(showPanel === 'tpms' ? 'none' : 'tpms'), '#ffaa00')}
      {btn('LOGGER', showPanel === 'logger', () => setShowPanel(showPanel === 'logger' ? 'none' : 'logger'), '#bf5fff')}
      {btn('HW', showPanel === 'hardware', () => setShowPanel(showPanel === 'hardware' ? 'none' : 'hardware'), '#ff6b35')}
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C8FF', boxShadow: '0 0 6px #00C8FF', display: 'inline-block', marginLeft: 4 }} />
    </div>
  )
}
