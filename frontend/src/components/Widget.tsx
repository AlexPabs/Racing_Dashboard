import { useRef, useCallback } from 'react'
import { useDashboard } from '../contexts/DashboardContext'
import { Widget as WidgetType } from '../types'
import { GaugeWidget } from './widgets/GaugeWidget'
import { NumberWidget } from './widgets/NumberWidget'
import { BarWidget } from './widgets/BarWidget'
import { GraphWidget } from './widgets/GraphWidget'

interface Props { widget: WidgetType }

const HS = 10 // handle size

export function Widget({ widget }: Props) {
  const { config, editMode, selectedWidgetId, setSelectedWidget, updateWidget, removeWidget } = useDashboard()
  const sensor = config.sensors.find(s => s.id === widget.sensorId)
  const isSelected = selectedWidgetId === widget.id

  const dragRef  = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  const resizeRef = useRef<{ dir: string; sx: number; sy: number; ow: number; oh: number; ox: number; oy: number } | null>(null)

  // Drag — triggered from the transparent overlay, not the widget content
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelectedWidget(widget.id)
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: widget.x, oy: widget.y }
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return
      updateWidget(widget.id, {
        x: dragRef.current.ox + ev.clientX - dragRef.current.sx,
        y: dragRef.current.oy + ev.clientY - dragRef.current.sy,
      })
    }
    const up = () => { dragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [widget, updateWidget, setSelectedWidget])

  // Resize handles
  const startResize = useCallback((e: React.MouseEvent, dir: string) => {
    e.stopPropagation()
    e.preventDefault()
    resizeRef.current = { dir, sx: e.clientX, sy: e.clientY, ow: widget.width, oh: widget.height, ox: widget.x, oy: widget.y }
    const move = (ev: MouseEvent) => {
      if (!resizeRef.current) return
      const dx = ev.clientX - resizeRef.current.sx
      const dy = ev.clientY - resizeRef.current.sy
      const { dir: d, ow, oh, ox, oy } = resizeRef.current
      let w = ow, h = oh, x = ox, y = oy
      if (d.includes('e')) w = Math.max(80, ow + dx)
      if (d.includes('s')) h = Math.max(50, oh + dy)
      if (d.includes('w')) { w = Math.max(80, ow - dx); x = ox + (ow - w) }
      if (d.includes('n')) { h = Math.max(50, oh - dy); y = oy + (oh - h) }
      updateWidget(widget.id, { x, y, width: w, height: h })
    }
    const up = () => { resizeRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [widget, updateWidget])

  if (!sensor) return null

  const handles = [
    { dir: 'n',  s: { top: -HS/2, left: '50%', transform: 'translateX(-50%)', width: 40, height: HS, cursor: 'n-resize' } },
    { dir: 's',  s: { bottom: -HS/2, left: '50%', transform: 'translateX(-50%)', width: 40, height: HS, cursor: 's-resize' } },
    { dir: 'e',  s: { right: -HS/2, top: '50%', transform: 'translateY(-50%)', width: HS, height: 40, cursor: 'e-resize' } },
    { dir: 'w',  s: { left: -HS/2, top: '50%', transform: 'translateY(-50%)', width: HS, height: 40, cursor: 'w-resize' } },
    { dir: 'nw', s: { top: -HS/2, left: -HS/2, width: HS, height: HS, cursor: 'nw-resize' } },
    { dir: 'ne', s: { top: -HS/2, right: -HS/2, width: HS, height: HS, cursor: 'ne-resize' } },
    { dir: 'sw', s: { bottom: -HS/2, left: -HS/2, width: HS, height: HS, cursor: 'sw-resize' } },
    { dir: 'se', s: { bottom: -HS/2, right: -HS/2, width: HS, height: HS, cursor: 'se-resize' } },
  ]

  return (
    // Outer shell — no overflow:hidden so resize handles aren't clipped
    <div style={{
      position: 'absolute',
      left: widget.x, top: widget.y,
      width: widget.width, height: widget.height,
      userSelect: 'none',
      zIndex: isSelected ? 100 : 1,
    }}>
      {/* Widget content — clipped to its own bounds */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 8, overflow: 'hidden',
        outline: isSelected && editMode ? '2px solid #00e5ff'
               : editMode              ? '1px dashed #333'
               : 'none',
        outlineOffset: 1,
      }}>
        {widget.type === 'gauge'  && <GaugeWidget  sensor={sensor} theme={widget.theme} width={widget.width} height={widget.height} />}
        {widget.type === 'number' && <NumberWidget  sensor={sensor} theme={widget.theme} width={widget.width} height={widget.height} />}
        {widget.type === 'bar'    && <BarWidget     sensor={sensor} theme={widget.theme} width={widget.width} height={widget.height} />}
        {widget.type === 'graph'  && <GraphWidget   sensor={sensor} theme={widget.theme} width={widget.width} height={widget.height} />}
      </div>

      {/* Transparent drag overlay — sits on top of content, stops all bubbling */}
      {editMode && (
        <div
          onMouseDown={startDrag}
          onClick={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', inset: 0,
            cursor: 'move', zIndex: 10,
            borderRadius: 8,
          }}
        />
      )}

      {/* Resize handles + delete — only when selected */}
      {isSelected && editMode && (
        <>
          {handles.map(h => (
            <div key={h.dir}
              onMouseDown={e => startResize(e, h.dir)}
              style={{
                position: 'absolute',
                background: '#00e5ff',
                borderRadius: 2,
                zIndex: 20,
                ...h.s,
              }}
            />
          ))}
          <button
            onMouseDown={e => { e.stopPropagation(); removeWidget(widget.id) }}
            style={{
              position: 'absolute', top: -1, right: -1,
              background: '#ff2020', border: 'none', color: '#fff',
              borderRadius: 4, cursor: 'pointer', fontSize: 10,
              padding: '1px 5px', zIndex: 30, lineHeight: 1.4,
            }}
          >✕</button>
        </>
      )}
    </div>
  )
}
