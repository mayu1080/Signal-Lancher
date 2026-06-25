import type { AppState } from '../../types'
import { ui } from '../../uiLabels'

interface MidiStatusBannerProps {
  state: AppState
}

export function MidiStatusBanner({ state }: MidiStatusBannerProps) {
  const inputOk = state.autoDetectedInput !== null
  const hasInputs = state.midiInputs.length > 0

  if (inputOk) return null

  return (
    <div className="midi-status-banner warn" role="status">
      {!hasInputs ? (
        <span>{ui.midiStatus.noDevices}</span>
      ) : (
        <span>
          {ui.midiStatus.notConnected} — {ui.midiStatus.checkTab}
        </span>
      )}
    </div>
  )
}
