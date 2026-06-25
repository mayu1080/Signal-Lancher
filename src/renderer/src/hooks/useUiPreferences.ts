import { useCallback, useState } from 'react'

export type UiWorkMode = 'show' | 'setup'
export type UiProfile = 'field' | 'developer'

const STORAGE_KEYS = {
  workMode: 'signal-launcher-ui-work-mode',
  profile: 'signal-launcher-ui-profile',
  wizardDone: 'signal-launcher-wizard-done'
} as const

function readStorage<T extends string>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return (v as T) ?? fallback
  } catch {
    return fallback
  }
}

export function useUiPreferences() {
  const [workMode, setWorkModeState] = useState<UiWorkMode>(() =>
    readStorage(STORAGE_KEYS.workMode, 'show')
  )
  const [profile, setProfileState] = useState<UiProfile>(() =>
    readStorage(STORAGE_KEYS.profile, 'field')
  )
  const [wizardDone, setWizardDoneState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.wizardDone) === '1'
    } catch {
      return false
    }
  })

  const setWorkMode = useCallback((mode: UiWorkMode) => {
    setWorkModeState(mode)
    localStorage.setItem(STORAGE_KEYS.workMode, mode)
  }, [])

  const setProfile = useCallback((p: UiProfile) => {
    setProfileState(p)
    localStorage.setItem(STORAGE_KEYS.profile, p)
  }, [])

  const markWizardDone = useCallback(() => {
    setWizardDoneState(true)
    localStorage.setItem(STORAGE_KEYS.wizardDone, '1')
  }, [])

  return {
    workMode,
    setWorkMode,
    profile,
    setProfile,
    wizardDone,
    markWizardDone,
    isFieldProfile: profile === 'field',
    isShowMode: workMode === 'show'
  }
}
