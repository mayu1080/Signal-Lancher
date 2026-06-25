import { useCallback, useState } from 'react'
import { api } from '../../api'
import type { AppMode, Target } from '../../types'
import { ui } from '../../uiLabels'
import { TargetEditorDialog } from './TargetEditorDialog'

interface TargetsPanelProps {
  targets: Target[]
  mode: AppMode
  isLive?: boolean
  isFieldProfile?: boolean
  onTest: (targetId: string) => void
  onChanged: () => void
}

function targetEndpoint(target: Target): string {
  switch (target.type) {
    case 'midi':
      return `${target.outputDevice}${target.channel ? ` ch${target.channel}` : ''}`
    case 'udp':
      return `${target.host}:${target.port} [${target.encoding ?? 'utf-8'}]`
    case 'osc':
      return `${target.host}:${target.port}`
  }
}

export function TargetsPanel({
  targets,
  mode,
  isLive = false,
  isFieldProfile = false,
  onTest,
  onChanged
}: TargetsPanelProps) {
  const crudLocked = isLive
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<Target | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const c = ui.targets.columns
  const testLabel = mode === 'dryRun' ? ui.targets.testDry : ui.targets.testLive

  const saveTargets = useCallback(
    async (nextTargets: Target[]) => {
      setStatus(null)
      setErrors([])
      const config = await api.getConfig()
      const result = await api.saveConfig({ ...config, targets: nextTargets })
      if (result.success) {
        setStatus(ui.settings.saveSuccess)
        onChanged()
      } else if (result.validation) {
        setErrors(result.validation.errors.map((e) => `[${e.path}] ${e.message}`))
        setStatus(ui.settings.saveFailed)
      } else {
        setStatus(result.error ?? ui.settings.saveFailed)
      }
    },
    [onChanged]
  )

  const openAdd = () => {
    if (crudLocked) return
    setEditingTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (target: Target) => {
    if (crudLocked) return
    setEditingTarget(target)
    setDialogOpen(true)
  }

  const handleSubmit = (target: Target) => {
    if (editingTarget) {
      void saveTargets(targets.map((t) => (t.id === editingTarget.id ? target : t)))
    } else {
      void saveTargets([...targets, target])
    }
  }

  const handleDelete = async (targetId: string) => {
    if (crudLocked) return
    const config = await api.getConfig()
    const referenced = config.triggers.some((trigger) =>
      trigger.actions.some((action) => action.target === targetId)
    )
    if (referenced) {
      setStatus(ui.targets.deleteBlocked)
      setErrors([ui.targets.deleteBlockedDetail])
      return
    }
    if (!window.confirm(ui.targets.deleteConfirm)) return
    void saveTargets(targets.filter((t) => t.id !== targetId))
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>{ui.targets.title}</h2>
        <button type="button" className="btn active" onClick={openAdd} disabled={crudLocked}>
          {ui.targets.add}
        </button>
      </div>

      {crudLocked && <p className="live-lock-banner">{ui.liveLock.hint}</p>}

      <table className="target-table">
        <thead>
          <tr>
            {!isFieldProfile && <th>{c.id}</th>}
            <th>{c.label}</th>
            <th>{c.type}</th>
            <th>{c.endpoint}</th>
            <th>{c.test}</th>
            <th>{ui.targets.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {targets.length === 0 && (
            <tr>
              <td colSpan={isFieldProfile ? 5 : 6}>{ui.targets.empty}</td>
            </tr>
          )}
          {targets.map((target) => (
            <tr key={target.id}>
              {!isFieldProfile && <td>{target.id}</td>}
              <td>{target.label}</td>
              <td>{target.type}</td>
              <td>{targetEndpoint(target)}</td>
              <td>
                <button type="button" className="btn small" onClick={() => onTest(target.id)}>
                  {testLabel}
                </button>
              </td>
              <td className="actions-cell">
                <button type="button" className="btn small" disabled={crudLocked} onClick={() => openEdit(target)}>
                  {ui.targets.edit}
                </button>
                <button
                  type="button"
                  className="btn small"
                  disabled={crudLocked}
                  onClick={() => void handleDelete(target.id)}
                >
                  {ui.targets.delete}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {status && <p className="settings-status">{status}</p>}
      {errors.length > 0 && (
        <ul className="settings-errors">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      <TargetEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        target={editingTarget}
        existingIds={targets.map((t) => t.id)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
