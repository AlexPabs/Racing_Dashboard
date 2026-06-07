import { useDashboard } from '../contexts/DashboardContext'

export function Toolbar() {
  const { editMode, setEditMode, showPanel, setShowPanel, forceDesktop, setForceDesktop } = useDashboard()

  const btn = (label: string, active: boolean, onClick: () => void, color = '#00C8FF') => (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}1a` : 'transparent',
        border: `1px solid ${active ? color : '#1e2d3d'}`,
        color: active ? color : '#3a5068',
        borderRadius: 5,
        padding: '5px 11px',
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.2,
        fontFamily: "'IBM Plex Mono', monospace",
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          const t = e.currentTarget
          t.style.borderColor = color + '66'
          t.style.color = color + 'aa'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          const t = e.currentTarget
          t.style.borderColor = '#1e2d3d'
          t.style.color = '#3a5068'
        }
      }}
    >{label}</button>
  )

  return (
    <div style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 5, alignItems: 'center',
      background: 'linear-gradient(180deg, #0c1222 0%, #08090f 100%)',
      border: '1px solid #1e2d3d',
      borderRadius: 10,
      padding: '6px 10px',
      zIndex: 2000,
      boxShadow: '0 4px 24px #000d, 0 0 0 1px #00C8FF08',
    }}>
      {/* Brand */}
      <span style={{
        color: '#1e2d3d',
        fontSize: 9,
        letterSpacing: 2.5,
        marginRight: 6,
        fontFamily: "'IBM Plex Mono', monospace",
        whiteSpace: 'nowrap',
      }}>RACING SYS</span>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: '#1e2d3d', marginRight: 4 }} />

      {btn('EDIT',          editMode,                () => { setEditMode(!editMode); if (showPanel === 'settings') setShowPanel('none') })}
      {btn('SETTINGS',      showPanel === 'settings', () => setShowPanel(showPanel === 'settings' ? 'none' : 'settings'))}
      {btn('DRAG',          showPanel === 'drag',     () => setShowPanel(showPanel === 'drag' ? 'none' : 'drag'),     '#a8ff3e')}
      {btn('TPMS',          showPanel === 'tpms',     () => setShowPanel(showPanel === 'tpms' ? 'none' : 'tpms'),     '#ffaa00')}
      {btn('LOGGER',        showPanel === 'logger',   () => setShowPanel(showPanel === 'logger' ? 'none' : 'logger'), '#bf5fff')}
      {btn('HARDWARE',      showPanel === 'hardware', () => setShowPanel(showPanel === 'hardware' ? 'none' : 'hardware'), '#ff6b35')}

      {/* Status indicator */}
      <div style={{ marginLeft: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#00C8FF',
          boxShadow: '0 0 8px #00C8FF',
        }} />
        <span style={{ color: '#1e2d3d', fontSize: 8, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1 }}>LIVE</span>
      </div>
    </div>
  )
}
