import type { UiProfile, UiWorkMode } from '../../hooks/useUiPreferences'
import { ui } from '../../uiLabels'

interface DisplaySettingsControlsProps {
  workMode: UiWorkMode
  profile: UiProfile
  onWorkModeChange: (mode: UiWorkMode) => void
  onProfileChange: (profile: UiProfile) => void
  onOpenWizard: () => void
  layout?: 'inline' | 'menu'
}

export function displaySettingsSummary(workMode: UiWorkMode, profile: UiProfile): string {
  const screen = workMode === 'show' ? ui.header.showMode : ui.header.setupMode
  const detail = profile === 'field' ? ui.header.fieldProfile : ui.header.developerProfile
  return `${screen} · ${detail}`
}

export function DisplaySettingsControls({
  workMode,
  profile,
  onWorkModeChange,
  onProfileChange,
  onOpenWizard,
  layout = 'inline'
}: DisplaySettingsControlsProps) {
  const sectionClass = layout === 'menu' ? 'display-settings-section' : 'display-settings-section-inline'

  return (
    <div
      className={`display-settings-controls ${layout === 'menu' ? 'display-settings-controls-menu' : 'display-settings-controls-inline'}`}
    >
      <div className={sectionClass}>
        <span className="display-settings-label">{ui.displaySettings.screenSection}</span>
        <div className="mode-toggle" role="group" aria-label={ui.header.workModeLabel}>
          <button
            type="button"
            className={`btn small ${workMode === 'show' ? 'active' : ''}`}
            onClick={() => onWorkModeChange('show')}
          >
            {ui.header.showMode}
          </button>
          <button
            type="button"
            className={`btn small ${workMode === 'setup' ? 'active' : ''}`}
            onClick={() => onWorkModeChange('setup')}
          >
            {ui.header.setupMode}
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <span className="display-settings-label">{ui.displaySettings.detailSection}</span>
        <div className="mode-toggle" role="group" aria-label={ui.header.profileLabel}>
          <button
            type="button"
            className={`btn small ${profile === 'field' ? 'active' : ''}`}
            onClick={() => onProfileChange('field')}
          >
            {ui.header.fieldProfile}
          </button>
          <button
            type="button"
            className={`btn small ${profile === 'developer' ? 'active' : ''}`}
            onClick={() => onProfileChange('developer')}
          >
            {ui.header.developerProfile}
          </button>
        </div>
      </div>

      <div className={sectionClass}>
        <button type="button" className="btn small display-settings-wizard-btn" onClick={onOpenWizard}>
          {ui.header.setupWizard}
        </button>
      </div>
    </div>
  )
}
