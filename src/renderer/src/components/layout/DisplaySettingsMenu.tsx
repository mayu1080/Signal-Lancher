import { useEffect, useRef, useState } from 'react'
import type { UiProfile, UiWorkMode } from '../../hooks/useUiPreferences'
import { ui } from '../../uiLabels'
import { DisplaySettingsControls, displaySettingsSummary } from './DisplaySettingsControls'

interface DisplaySettingsMenuProps {
  workMode: UiWorkMode
  profile: UiProfile
  onWorkModeChange: (mode: UiWorkMode) => void
  onProfileChange: (profile: UiProfile) => void
  onOpenWizard: () => void
}

export function DisplaySettingsMenu({
  workMode,
  profile,
  onWorkModeChange,
  onProfileChange,
  onOpenWizard
}: DisplaySettingsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleOpenWizard = () => {
    setOpen(false)
    onOpenWizard()
  }

  const handleWorkModeChange = (mode: UiWorkMode) => {
    onWorkModeChange(mode)
  }

  const handleProfileChange = (p: UiProfile) => {
    onProfileChange(p)
  }

  const summary = displaySettingsSummary(workMode, profile)

  return (
    <div className="display-settings-menu" ref={rootRef}>
      <button
        type="button"
        className={`btn small display-settings-menu-trigger ${open ? 'active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="display-settings-menu-title">{ui.displaySettings.menuButton}</span>
        <span className="display-settings-menu-summary">{summary}</span>
      </button>

      {open && (
        <div className="display-settings-menu-panel" role="menu">
          <p className="display-settings-menu-hint">{ui.displaySettings.menuHint}</p>
          <DisplaySettingsControls
            workMode={workMode}
            profile={profile}
            onWorkModeChange={handleWorkModeChange}
            onProfileChange={handleProfileChange}
            onOpenWizard={handleOpenWizard}
            layout="menu"
          />
        </div>
      )}
    </div>
  )
}
