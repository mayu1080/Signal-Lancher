import { useState } from 'react'
import { api } from '../api'
import type { AppState } from '../types'
import { ui } from '../uiLabels'

interface DeviceListProps {
  state: AppState
  onRefresh: () => void
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? 'device-status ok' : 'device-status ng'}>
      {ok ? ui.devices.statusOk : ui.devices.statusNg}
    </span>
  )
}

function formatSaveError(result: {
  error?: string
  validation?: { errors: Array<{ path: string; message: string }> }
}): string {
  if (result.validation?.errors.length) {
    return result.validation.errors.map((e) => `[${e.path}] ${e.message}`).join('; ')
  }
  return result.error ?? ui.devices.selectFailed
}

export function DeviceList({ state, onRefresh }: DeviceListProps) {
  const inputConnected = state.autoDetectedInput !== null
  const [selecting, setSelecting] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleSelect = async (deviceName: string) => {
    if (deviceName === state.autoDetectedInput) return
    if (typeof window.signalLauncher?.selectMidiInput !== 'function') {
      setStatus(ui.devices.selectUnavailable)
      return
    }

    setSelecting(deviceName)
    setStatus(null)
    try {
      const result = await api.selectMidiInput(deviceName)
      if (result.success) {
        setStatus(ui.devices.selectSuccess)
        onRefresh()
      } else {
        setStatus(formatSaveError(result))
      }
    } catch (err) {
      setStatus(String(err))
    } finally {
      setSelecting(null)
    }
  }

  const handleRefresh = () => {
    setStatus(null)
    onRefresh()
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>{ui.devices.title}</h2>
        <button type="button" className="btn" onClick={handleRefresh} disabled={selecting !== null}>
          {ui.devices.refresh}
        </button>
      </div>

      <p className="field-hint">{ui.devices.selectHint}</p>

      <div className="device-status-cards">
        <div className={`device-status-card ${inputConnected ? 'ok' : 'ng'}`}>
          <strong>{ui.devices.activeInput}</strong>
          <span>{state.autoDetectedInput ?? ui.devices.none}</span>
          <StatusBadge ok={inputConnected} />
        </div>
      </div>

      <div className="device-columns">
        <div>
          <h3>{ui.devices.inputs}</h3>
          <ul className="device-input-list">
            {state.midiInputs.length === 0 && <li>{ui.devices.none}</li>}
            {state.midiInputs.map((name) => {
              const isActive = name === state.autoDetectedInput
              const isSelecting = selecting === name
              return (
                <li
                  key={name}
                  className={`device-input-row ${isActive ? 'highlight active' : ''}`}
                >
                  <span className="device-input-name">{name}</span>
                  {isActive ? (
                    <span className="device-active-badge">{ui.devices.usingBadge}</span>
                  ) : (
                    <button
                      type="button"
                      className="btn small"
                      disabled={selecting !== null}
                      onClick={() => void handleSelect(name)}
                    >
                      {isSelecting ? ui.devices.selecting : ui.devices.useButton}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
        <div>
          <h3>{ui.devices.outputs}</h3>
          <ul>
            {state.midiOutputs.length === 0 && <li>{ui.devices.none}</li>}
            {state.midiOutputs.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>

      {status && <p className="settings-status">{status}</p>}
    </section>
  )
}
