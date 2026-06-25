import { useEffect, useState, useCallback } from 'react'
import { api } from './api'
import type { AppState } from './types'
import { AppTabs, type AppTab } from './components/layout/AppTabs'
import { AppHeader } from './components/layout/AppHeader'
import { MidiStatusBanner } from './components/layout/MidiStatusBanner'
import { StatusBar } from './components/OperateTab'
import { TriggerPanel } from './components/TriggerPanel'
import { Monitor } from './components/Monitor'
import { DeviceList } from './components/DeviceList'
import { TargetsPanel } from './components/targets/TargetsPanel'
import { SchedulesPanel } from './components/schedules/SchedulesPanel'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { ConfigJsonPreview } from './components/settings/ConfigJsonPreview'
import { TriggersManagePanel } from './components/triggers/TriggersManagePanel'
import { SetupWizard } from './components/setup/SetupWizard'
import { useUiPreferences } from './hooks/useUiPreferences'
import { ui } from './uiLabels'

const SETUP_TABS: AppTab[] = ['cues', 'targets', 'schedule', 'settings']

export default function App() {
  const [state, setState] = useState<AppState | null>(null)
  const [activeTab, setActiveTab] = useState<AppTab>('operate')
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [configRefreshToken, setConfigRefreshToken] = useState(0)
  const [wizardOpen, setWizardOpen] = useState(false)

  const {
    workMode,
    setWorkMode,
    profile,
    setProfile,
    wizardDone,
    markWizardDone,
    isFieldProfile,
    isShowMode
  } = useUiPreferences()

  const refresh = useCallback(async () => {
    const s = await api.getState()
    setState(s)
  }, [])

  useEffect(() => {
    void refresh()
    const unsubState = api.onStateUpdate(setState)
    const unsubLog = api.onLogEntry(() => {
      void refresh()
    })
    return () => {
      unsubState()
      unsubLog()
    }
  }, [refresh])

  useEffect(() => {
    if (!wizardDone && state && (state.targets.length === 0 || state.triggers.length === 0)) {
      setWizardOpen(true)
    }
  }, [wizardDone, state])

  useEffect(() => {
    if (!isShowMode) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLSelectElement) return
      const idx = Number(e.key)
      if (idx >= 1 && idx <= 9 && state?.triggers[idx - 1]) {
        void api.fireTrigger(state.triggers[idx - 1].triggerId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isShowMode, state?.triggers])

  const handleConfigSaved = useCallback(() => {
    setConfigRefreshToken((n) => n + 1)
    void refresh()
  }, [refresh])

  const handleTabChange = useCallback(
    (next: AppTab) => {
      if (activeTab === 'settings' && next !== 'settings' && settingsDirty) {
        if (!window.confirm(ui.settings.unsavedTabSwitchConfirm)) return
      }
      if (isShowMode && SETUP_TABS.includes(next)) return
      setActiveTab(next)
    },
    [activeTab, settingsDirty, isShowMode]
  )

  const handleWorkModeChange = useCallback(
    (mode: typeof workMode) => {
      setWorkMode(mode)
      if (mode === 'show' && SETUP_TABS.includes(activeTab)) {
        setActiveTab('operate')
      }
    },
    [setWorkMode, activeTab]
  )

  if (!state) {
    return <div className="loading">{ui.loading}</div>
  }

  const isLive = state.mode === 'live'

  return (
    <div className={`app ${isLive ? 'app-live' : 'app-dryrun'}`}>
      <AppHeader
        workMode={workMode}
        profile={profile}
        wizardDone={wizardDone}
        onWorkModeChange={handleWorkModeChange}
        onProfileChange={setProfile}
        onOpenWizard={() => setWizardOpen(true)}
      />
      <AppTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showSetupTabs={!isShowMode}
        operate={
          <div className="operate-tab">
            <StatusBar
              state={state}
              compact={isFieldProfile}
              onSetMode={async (mode) => {
                const s = await api.setMode(mode)
                setState(s)
              }}
            />
            <MidiStatusBanner state={state} />
            {isLive && !isShowMode && (
              <div className="live-lock-banner">{ui.liveLock.hint}</div>
            )}
            <div className="operate-columns">
              <TriggerPanel
                triggers={state.triggers}
                compact={isFieldProfile || isShowMode}
                showShortcuts={isShowMode}
                onFire={(id) => void api.fireTrigger(id)}
              />
              <Monitor logs={state.logs} allowFullscreen />
            </div>
          </div>
        }
        cues={
          <TriggersManagePanel
            triggers={state.triggers}
            targets={state.targets}
            schedules={state.schedules}
            isLive={isLive}
            isFieldProfile={isFieldProfile}
            onChanged={handleConfigSaved}
          />
        }
        targets={
          <TargetsPanel
            targets={state.targets}
            mode={state.mode}
            isLive={isLive}
            isFieldProfile={isFieldProfile}
            onTest={(id) => void api.testTarget(id)}
            onChanged={handleConfigSaved}
          />
        }
        schedule={
          <SchedulesPanel
            schedules={state.schedules}
            triggers={state.triggers}
            isLive={isLive}
            isFieldProfile={isFieldProfile}
            onTestFire={(id) => void api.testFireSchedule(id)}
            getCurrentTime={api.getCurrentTime}
            onChanged={handleConfigSaved}
          />
        }
        settings={
          <div className="settings-tab">
            <SettingsPanel
              onSaved={handleConfigSaved}
              onDirtyChange={setSettingsDirty}
              isLive={isLive}
            />
            {!isFieldProfile && (
              <ConfigJsonPreview refreshToken={configRefreshToken} />
            )}
          </div>
        }
        midi={
          <DeviceList state={state} onRefresh={() => void api.refreshMidi().then(setState)} />
        }
      />

      <SetupWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onNavigate={(tab) => {
          if (isShowMode) setWorkMode('setup')
          setActiveTab(tab)
        }}
        onComplete={markWizardDone}
        targetCount={state.targets.length}
        triggerCount={state.triggers.length}
      />
    </div>
  )
}
