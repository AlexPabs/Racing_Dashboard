import { useState } from 'react'
import { useDashboard } from '../../contexts/DashboardContext'
import { Sensor, Theme, Widget, WidgetType } from '../../types'

const panelStyle: React.CSSProperties = {
  position: 'fixed', right: 0, top: 0, bottom: 0,
  width: 320, background: '#111', borderLeft: '1px solid #222',
  color: '#ccc', overflowY: 'auto', zIndex: 1000,
  fontFamily: 'system-ui, sans-serif', fontSize: 13,
}

const labelStyle: React.CSSProperties = { color: '#888', fontSize: 11, marginBottom: 3, display: 'block', letterSpacing: 1 }
const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4,
  color: '#ccc', padding: '4px 8px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box'
}
const sectionStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #1a1a1a' }
const btnStyle: React.CSSProperties = {
  background: '#00e5ff22', border: '1px solid #00e5ff44', color: '#00e5ff',
  borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12, marginRight: 4, marginBottom: 4
}

export function SettingsPanel() {
  const { config, selectedWidgetId, updateBackground, updateSensor, updateWidget, addWidget, setShowPanel, setEditMode, editMode } = useDashboard()
  const [tab, setTab] = useState<'background' | 'widget' | 'sensor' | 'addwidget'>('background')
  const [editSensorId, setEditSensorId] = useState<string>(config.sensors[0]?.id ?? '')

  const selectedWidget = config.widgets.find(w => w.id === selectedWidgetId)
  const editSensor = config.sensors.find(s => s.id === editSensorId)

  const tabBtn = (t: typeof tab, label: string) => (
    <button onClick={() => setTab(t)} style={{
      ...btnStyle,
      background: tab === t ? '#00e5ff33' : '#00e5ff11',
      borderColor: tab === t ? '#00e5ff88' : '#00e5ff22',
    }}>{label}</button>
  )

  return (
    <div style={panelStyle}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>SETTINGS</span>
        <button onClick={() => setShowPanel('none')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>

      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={editMode} onChange={e => setEditMode(e.target.checked)} />
          <span style={{ color: '#ccc', fontSize: 12 }}>Edit Mode (drag & resize)</span>
        </label>
      </div>

      <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #1a1a1a' }}>
        {tabBtn('background', 'Background')}
        {tabBtn('widget', 'Widget')}
        {tabBtn('sensor', 'Sensor')}
        {tabBtn('addwidget', '+ Add')}
      </div>

      {/* BACKGROUND */}
      {tab === 'background' && (
        <div style={sectionStyle}>
          <label style={labelStyle}>BACKGROUND COLOR</label>
          <input type="color" value={config.background.value.startsWith('#') ? config.background.value : '#0a0a0a'}
            onChange={e => updateBackground('color', e.target.value)}
            style={{ ...inputStyle, height: 36, padding: 2 }} />

          <label style={labelStyle}>BACKGROUND IMAGE URL</label>
          <input type="text" placeholder="https://..." style={inputStyle}
            onBlur={e => e.target.value && updateBackground('image', e.target.value)} />

          <label style={labelStyle}>REMOVE IMAGE</label>
          <button style={btnStyle} onClick={() => updateBackground('color', config.background.value)}>
            Reset to color
          </button>
        </div>
      )}

      {/* WIDGET CONFIG */}
      {tab === 'widget' && (
        <div style={sectionStyle}>
          {!selectedWidget ? (
            <p style={{ color: '#555', fontSize: 12 }}>Select a widget on the canvas to edit it (enable Edit Mode first)</p>
          ) : (
            <>
              <label style={labelStyle}>SENSOR</label>
              <select value={selectedWidget.sensorId} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { sensorId: e.target.value })}>
                {config.sensors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <label style={labelStyle}>TYPE</label>
              <select value={selectedWidget.type} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { type: e.target.value as WidgetType })}>
                <option value="gauge">Gauge</option>
                <option value="number">Number</option>
                <option value="bar">Bar</option>
                <option value="graph">Graph</option>
              </select>

              <label style={labelStyle}>THEME</label>
              <select value={selectedWidget.theme} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { theme: e.target.value as Theme })}>
                <option value="modern">Modern</option>
                <option value="analog">Analog</option>
                <option value="minimal">Minimal</option>
              </select>

              <label style={labelStyle}>POSITION X (px)</label>
              <input type="number" value={Math.round(selectedWidget.x)} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { x: +e.target.value })} />

              <label style={labelStyle}>POSITION Y (px)</label>
              <input type="number" value={Math.round(selectedWidget.y)} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { y: +e.target.value })} />

              <label style={labelStyle}>WIDTH (px)</label>
              <input type="number" value={Math.round(selectedWidget.width)} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { width: +e.target.value })} />

              <label style={labelStyle}>HEIGHT (px)</label>
              <input type="number" value={Math.round(selectedWidget.height)} style={inputStyle}
                onChange={e => updateWidget(selectedWidget.id, { height: +e.target.value })} />
            </>
          )}
        </div>
      )}

      {/* SENSOR CONFIG */}
      {tab === 'sensor' && editSensor && (
        <div style={sectionStyle}>
          <label style={labelStyle}>SENSOR</label>
          <select value={editSensorId} style={inputStyle} onChange={e => setEditSensorId(e.target.value)}>
            {config.sensors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {(['name', 'unit'] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field.toUpperCase()}</label>
              <input type="text" value={editSensor[field]} style={inputStyle}
                onChange={e => updateSensor({ ...editSensor, [field]: e.target.value })} />
            </div>
          ))}

          {(['min', 'max', 'offset', 'scale', 'decimals'] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field.toUpperCase()}</label>
              <input type="number" step="any" value={editSensor[field]} style={inputStyle}
                onChange={e => updateSensor({ ...editSensor, [field]: +e.target.value })} />
            </div>
          ))}

          <label style={{ ...labelStyle, marginTop: 8 }}>THRESHOLDS</label>
          {(['warnMin', 'warnMax', 'critMin', 'critMax'] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field.replace(/([A-Z])/g, ' $1').toUpperCase()}</label>
              <input type="number" step="any"
                value={editSensor[field] ?? ''}
                placeholder="—"
                style={inputStyle}
                onChange={e => updateSensor({ ...editSensor, [field]: e.target.value === '' ? undefined : +e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {/* ADD WIDGET */}
      {tab === 'addwidget' && (
        <AddWidget />
      )}
    </div>
  )
}

function AddWidget() {
  const { config, addWidget } = useDashboard()
  const [sensorId, setSensorId] = useState(config.sensors[0]?.id ?? '')
  const [type, setType] = useState<WidgetType>('number')
  const [theme, setTheme] = useState<Theme>('modern')

  const labelStyle: React.CSSProperties = { color: '#888', fontSize: 11, marginBottom: 3, display: 'block', letterSpacing: 1 }
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 4,
    color: '#ccc', padding: '4px 8px', fontSize: 13, marginBottom: 10, boxSizing: 'border-box'
  }
  const defaultSizes: Record<WidgetType, { w: number; h: number }> = {
    gauge: { w: 220, h: 220 }, number: { w: 180, h: 100 }, bar: { w: 200, h: 80 }, graph: { w: 280, h: 120 }
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <label style={labelStyle}>SENSOR</label>
      <select value={sensorId} style={inputStyle} onChange={e => setSensorId(e.target.value)}>
        {config.sensors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <label style={labelStyle}>WIDGET TYPE</label>
      <select value={type} style={inputStyle} onChange={e => setType(e.target.value as WidgetType)}>
        <option value="gauge">Gauge</option>
        <option value="number">Number</option>
        <option value="bar">Bar</option>
        <option value="graph">Graph</option>
      </select>

      <label style={labelStyle}>THEME</label>
      <select value={theme} style={inputStyle} onChange={e => setTheme(e.target.value as Theme)}>
        <option value="modern">Modern</option>
        <option value="analog">Analog</option>
        <option value="minimal">Minimal</option>
      </select>

      <button
        onClick={() => addWidget({ sensorId, type, theme, x: 100, y: 100, width: defaultSizes[type].w, height: defaultSizes[type].h })}
        style={{
          width: '100%', padding: '8px', background: '#00e5ff22', border: '1px solid #00e5ff',
          color: '#00e5ff', borderRadius: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13
        }}
      >
        Add Widget
      </button>
    </div>
  )
}
