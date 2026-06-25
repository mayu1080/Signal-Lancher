import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { LogEntry } from '../types'
import { ui } from '../uiLabels'

interface MonitorProps {
  logs: LogEntry[]
  allowFullscreen?: boolean
}

const categoryColors: Record<string, string> = {
  ERROR: '#ff6b6b',
  CONFIG: '#c084fc',
  SCHEDULE_ERROR: '#ff6b6b',
  DRY_RUN: '#ffd93d',
  SCHEDULE_FIRE: '#6bcb77',
  SCHEDULE: '#4d96ff',
  SCHEDULE_SKIP: '#888',
  TRIGGER: '#a78bfa',
  MIDI: '#38bdf8',
  OSC: '#f472b6',
  UDP: '#fb923c',
  MIDI_OUT: '#34d399',
  INFO: '#94a3b8'
}

function LogList({ logs }: { logs: LogEntry[] }) {
  const reversed = [...logs].reverse()
  return (
    <div className="log-list">
      {reversed.length === 0 && <div className="log-empty">{ui.monitor.empty}</div>}
      {reversed.map((entry, i) => (
        <div key={`${entry.timestamp}-${i}`} className="log-entry">
          <span className="log-time">{entry.timestamp}</span>
          <span
            className="log-category"
            style={{ color: categoryColors[entry.category] ?? '#ccc' }}
          >
            [{entry.category}]
          </span>
          <span className="log-message">{entry.message}</span>
        </div>
      ))}
    </div>
  )
}

export function Monitor({ logs, allowFullscreen = true }: MonitorProps) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <section className="panel monitor">
        <div className="panel-header-row">
          <h2>{ui.monitor.title}</h2>
          {allowFullscreen && (
            <button type="button" className="btn small" onClick={() => setFullscreen(true)}>
              {ui.monitor.fullscreen}
            </button>
          )}
        </div>
        <LogList logs={logs} />
      </section>

      <Dialog.Root open={fullscreen} onOpenChange={setFullscreen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay monitor-overlay" />
          <Dialog.Content className="dialog-content monitor-fullscreen">
            <div className="panel-header-row">
              <Dialog.Title className="dialog-title">{ui.monitor.title}</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="btn small">
                  {ui.monitor.closeFullscreen}
                </button>
              </Dialog.Close>
            </div>
            <LogList logs={logs} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
