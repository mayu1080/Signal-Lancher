import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../api'
import type { ShowConfig } from '../../types'
import { ui } from '../../uiLabels'

const settingsFormSchema = z.object({
  projectName: z.string().min(1),
  appMode: z.enum(['live', 'dryRun'])
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

interface SettingsPanelProps {
  onSaved: () => void
  onDirtyChange?: (dirty: boolean) => void
  isLive?: boolean
}

export function SettingsPanel({ onSaved, onDirtyChange, isLive = false }: SettingsPanelProps) {
  const [configPath, setConfigPath] = useState('')
  const [fullConfig, setFullConfig] = useState<ShowConfig | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: { projectName: '', appMode: 'dryRun' }
  })

  const loadConfig = useCallback(async () => {
    const [path, config] = await Promise.all([api.getConfigFilePath(), api.getConfig()])
    setConfigPath(path)
    setFullConfig(config)
    reset({ projectName: config.projectName, appMode: config.appMode })
    setErrors([])
  }, [reset])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const confirmDiscard = (): boolean => {
    if (!isDirty) return true
    return window.confirm(ui.settings.unsavedDiscardConfirm)
  }

  const onSave = handleSubmit(async (values) => {
    if (!fullConfig) return
    setStatus(null)
    setErrors([])

    const updated: ShowConfig = {
      ...fullConfig,
      projectName: values.projectName,
      appMode: values.appMode
    }

    const result = await api.saveConfig(updated)
    if (result.success) {
      setStatus(ui.settings.saveSuccess)
      await loadConfig()
      onSaved()
    } else if (result.validation) {
      setErrors(result.validation.errors.map((e) => `[${e.path}] ${e.message}`))
      setStatus(ui.settings.saveFailed)
    } else {
      setStatus(result.error ?? ui.settings.saveFailed)
    }
  })

  const onReload = async () => {
    if (!confirmDiscard()) return
    setStatus(null)
    setErrors([])
    const result = await api.reloadConfig()
    if (result.success) {
      setStatus(ui.settings.reloadSuccess)
      await loadConfig()
      onSaved()
    } else {
      setStatus(result.error ?? ui.settings.reloadFailed)
    }
  }

  const onExport = async () => {
    setStatus(null)
    const result = await api.exportConfig()
    if (result.cancelled) return
    if (result.success) {
      setStatus(`${ui.settings.exportSuccess}: ${result.path}`)
    } else {
      setStatus(result.error ?? ui.settings.exportFailed)
    }
  }

  const onImport = async () => {
    if (!confirmDiscard()) return
    if (isLive && !window.confirm(ui.liveConfirm)) return
    setStatus(null)
    setErrors([])
    const result = await api.importConfig()
    if (result.cancelled) return
    if (result.success) {
      setStatus(ui.settings.importSuccess)
      await loadConfig()
      onSaved()
    } else if (result.validation) {
      setErrors(result.validation.errors.map((e) => `[${e.path}] ${e.message}`))
      setStatus(ui.settings.importFailed)
    } else {
      setStatus(result.error ?? ui.settings.importFailed)
    }
  }

  return (
    <section className="panel settings-panel">
      <h2>{ui.settings.title}</h2>

      <div className="settings-path">
        <strong>{ui.settings.configPath}:</strong> {configPath || '—'}
      </div>
      <p className="settings-hint">{ui.settings.portableSidecarHint}</p>

      <form className="settings-form" onSubmit={(e) => void onSave(e)}>
        <label className="form-field">
          <span>{ui.settings.projectName}</span>
          <input type="text" {...register('projectName')} />
        </label>

        <label className="form-field">
          <span>{ui.settings.startupMode}</span>
          <select {...register('appMode')}>
            <option value="dryRun">{ui.dashboard.dryRun}</option>
            <option value="live">{ui.dashboard.live}</option>
          </select>
        </label>

        <div className="settings-actions">
          <button type="submit" className="btn" disabled={!isDirty}>
            {ui.settings.save}
          </button>
          <button type="button" className="btn" onClick={() => void onReload()}>
            {ui.settings.reload}
          </button>
        </div>
      </form>

      <div className="settings-file-actions">
        <button type="button" className="btn" onClick={() => void onExport()}>
          {ui.settings.export}
        </button>
        <button type="button" className="btn" onClick={() => void onImport()}>
          {ui.settings.import}
        </button>
      </div>

      {isDirty && <p className="settings-hint">{ui.settings.unsavedHint}</p>}
      {status && <p className="settings-status">{status}</p>}
      {errors.length > 0 && (
        <ul className="settings-errors">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
