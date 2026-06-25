import type { AppState } from '../types'
import { ui, formatSource } from '../uiLabels'

interface StatusBarProps {
  state: AppState
  compact?: boolean
  onSetMode: (mode: 'live' | 'dryRun') => void
}

export function StatusBar({ state, compact, onSetMode }: StatusBarProps) {
  const isLive = state.mode === 'live'

  const handleLive = () => {
    if (isLive) return
    if (!window.confirm(ui.liveConfirm)) return
    onSetMode('live')
  }

  return (
    <div className={`status-bar panel ${isLive ? 'status-live' : 'status-dryrun'}`}>
      <div className={`mode-banner ${isLive ? 'mode-banner-live' : 'mode-banner-dryrun'}`}>
        {isLive ? ui.dashboard.liveBanner : ui.dashboard.dryRunBanner}
      </div>
      <div className="status-bar-row">
        <span>
          <strong>{ui.dashboard.project}:</strong> {state.projectName}
        </span>
        <span className="mode-switch">
          <strong>{ui.dashboard.mode}:</strong>{' '}
          <button
            type="button"
            className={`btn mode-btn ${isLive ? 'active live-btn' : ''}`}
            onClick={handleLive}
          >
            {ui.dashboard.live}
          </button>
          <button
            type="button"
            className={`btn mode-btn ${!isLive ? 'active dryrun-btn' : ''}`}
            onClick={() => onSetMode('dryRun')}
          >
            {ui.dashboard.dryRun}
          </button>
        </span>
        {!compact && (
          <span>
            <strong>{ui.dashboard.autoDetectedInput}:</strong>{' '}
            <span className={state.autoDetectedInput ? 'status-ok' : 'status-ng'}>
              {state.autoDetectedInput ?? ui.dashboard.none}
            </span>
          </span>
        )}
      </div>
      {state.lastTrigger && (
        <div className="last-trigger">
          <strong>{ui.dashboard.lastTrigger}:</strong> {state.lastTrigger.triggerLabel}
          {!compact && (
            <>
              {' '}
              ({state.lastTrigger.triggerId}) — {formatSource(state.lastTrigger.source)}
            </>
          )}
          {state.lastTrigger.dryRun ? ' [DRY RUN]' : ''}
        </div>
      )}
    </div>
  )
}
