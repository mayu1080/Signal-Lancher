import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { ui } from '../../uiLabels'

export type AppTab = 'operate' | 'cues' | 'targets' | 'schedule' | 'settings' | 'midi'

interface AppTabsProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  showSetupTabs: boolean
  operate: ReactNode
  cues: ReactNode
  targets: ReactNode
  schedule: ReactNode
  settings: ReactNode
  midi: ReactNode
}

export function AppTabs({
  activeTab,
  onTabChange,
  showSetupTabs,
  operate,
  cues,
  targets,
  schedule,
  settings,
  midi
}: AppTabsProps) {
  return (
    <Tabs.Root
      className="app-tabs"
      value={activeTab}
      onValueChange={(v) => onTabChange(v as AppTab)}
    >
      <Tabs.List className="tabs-list" aria-label={ui.tabs.ariaLabel}>
        <Tabs.Trigger className="tabs-trigger" value="operate">
          {ui.tabs.operate}
        </Tabs.Trigger>
        {showSetupTabs && (
          <>
            <Tabs.Trigger className="tabs-trigger" value="cues">
              {ui.tabs.cues}
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-trigger" value="targets">
              {ui.tabs.targets}
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-trigger" value="schedule">
              {ui.tabs.schedule}
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-trigger" value="settings">
              {ui.tabs.settings}
            </Tabs.Trigger>
          </>
        )}
        <Tabs.Trigger className="tabs-trigger" value="midi">
          {ui.tabs.midi}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content className="tabs-content" value="operate">
        {operate}
      </Tabs.Content>
      {showSetupTabs && (
        <>
          <Tabs.Content className="tabs-content" value="cues">
            {cues}
          </Tabs.Content>
          <Tabs.Content className="tabs-content" value="targets">
            {targets}
          </Tabs.Content>
          <Tabs.Content className="tabs-content" value="schedule">
            {schedule}
          </Tabs.Content>
          <Tabs.Content className="tabs-content" value="settings">
            {settings}
          </Tabs.Content>
        </>
      )}
      <Tabs.Content className="tabs-content" value="midi">
        {midi}
      </Tabs.Content>
    </Tabs.Root>
  )
}
