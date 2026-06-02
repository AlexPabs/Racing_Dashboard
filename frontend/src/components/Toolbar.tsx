import { useDashboard } from '../contexts/DashboardContext'

export function Toolbar() {
  const { editMode, setEditMode, showPanel, setShowPanel } = useDashboard()

  const btn = (label: string, active: boolean, onClick: () => void, color = '#00e5ff') => (
    <button onClick={onClick} style={{
      background: active ? `${color}22` : 'transparent',
      border: `1px solid ${active ? color : '#333'}`,
      color: active ? color : '#666',
      borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
      fontSize: 11, fontWeight: 700, letterSpacing: 1,
      transition: 'all 0.15s'
    }}>{label}</button>
  )

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 6, alignItems: 'center',
      background: '#111', border: '1px solid #222',
      borderRadius: 10, padding: '6px 10px',
      zIndex: 2000, boxShadow: '0 4px 20px #000a'
    }}>
      <span style={{ color: '#444', fontSize: 10, letterSpacing: 2, marginRight: 4 }}>RACING DASH</span>
      {btn('EDIT', editMode, () => { setEditMode(!editMode); if (showPanel === 'settings') setShowPanel('none') })}
      {btn('SETTINGS', showPanel === 'settings', () => setShowPanel(showPanel === 'settings' ? 'none' : 'settings'))}
      {btn('LOGGER', showPanel === 'logger', () => setShowPanel(showPanel === 'logger' ? 'none' : 'logger'), '#a8ff3e')}
      {btn('HW', showPanel === 'hardware', () => setShowPanel(showPanel === 'hardware' ? 'none' : 'hardware'), '#ffaa00')}
      <span style={{ color: '#1a1a1a', fontSize: 10, marginLeft: 4 }}>●</span>
      <span style={{ color: '#444', fontSize: 10 }}>LIVE</span>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff', display: 'inline-block' }} />
    </div>
  )
}
