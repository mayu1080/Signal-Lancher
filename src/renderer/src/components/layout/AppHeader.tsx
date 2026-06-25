import type { UiProfile, UiWorkMode } from '../../hooks/useUiPreferences'
import { ui } from '../../uiLabels'
import { DisplaySettingsControls } from './DisplaySettingsControls'
import { DisplaySettingsMenu } from './DisplaySettingsMenu'

interface AppHeaderProps {
  workMode: UiWorkMode
  profile: UiProfile
  wizardDone: boolean
  onWorkModeChange: (mode: UiWorkMode) => void
  onProfileChange: (profile: UiProfile) => void
  onOpenWizard: () => void
}

export function AppHeader({
  workMode,
  profile,
  wizardDone,
  onWorkModeChange,
  onProfileChange,
  onOpenWizard
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-row">
        <h1>{ui.appTitle}</h1>
        <div className="app-header-controls">
          {wizardDone ? (
            <DisplaySettingsMenu
              workMode={workMode}
              profile={profile}
              onWorkModeChange={onWorkModeChange}
              onProfileChange={onProfileChange}
              onOpenWizard={onOpenWizard}
            />
          ) : (
            <div className="display-settings-setup-banner">
              <span className="display-settings-setup-label">{ui.displaySettings.setupBanner}</span>
              <DisplaySettingsControls
                workMode={workMode}
                profile={profile}
                onWorkModeChange={onWorkModeChange}
                onProfileChange={onProfileChange}
                onOpenWizard={onOpenWizard}
                layout="inline"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
