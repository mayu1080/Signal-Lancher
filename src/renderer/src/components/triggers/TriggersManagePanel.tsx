import { useCallback, useState } from 'react'
import { api } from '../../api'
import type { ScheduleState, Target, Trigger } from '../../types'
import { ui } from '../../uiLabels'
import { TriggerEditorDialog } from './TriggerEditorDialog'

interface TriggersManagePanelProps {
  triggers: Trigger[]
  targets: Target[]
  schedules: ScheduleState[]
  isLive: boolean
  isFieldProfile: boolean
  onChanged: () => void
}

function summarizeActions(trigger: Trigger, targets: Target[]): string {
  return trigger.actions
    .map((action) => {
      const target = targets.find((t) => t.id === action.target)
      const type = target?.type ?? '?'
      const label = target?.label ?? action.target
      if (type === 'osc') return `${label}: ${action.address ?? ''}`
      if (type === 'udp') return `${label}: "${action.message ?? ''}"`
      if (type === 'midi') {
        const msg = action.message ?? 'noteOn'
        return `${label}: ${msg}${action.note !== undefined ? ` n${action.note}` : ''}`
      }
      return action.target
    })
    .join('; ')
}

export function TriggersManagePanel({
  triggers,
  targets,
  schedules,
  isLive,
  isFieldProfile,
  onChanged
}: TriggersManagePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const c = ui.triggersManage.columns
  const crudLocked = isLive

  const saveTriggers = useCallback(
    async (nextTriggers: Trigger[]) => {
      setStatus(null)
      setErrors([])
      const config = await api.getConfig()
      const result = await api.saveConfig({ ...config, triggers: nextTriggers })
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
    setEditingTrigger(null)
    setDialogOpen(true)
  }

  const openEdit = (trigger: Trigger) => {
    if (crudLocked) return
    setEditingTrigger(trigger)
    setDialogOpen(true)
  }

  const handleSubmit = (trigger: Trigger) => {
    if (editingTrigger) {
      void saveTriggers(
        triggers.map((t) => (t.triggerId === editingTrigger.triggerId ? trigger : t))
      )
    } else {
      void saveTriggers([...triggers, trigger])
    }
  }

  const handleDelete = (triggerId: string) => {
    if (crudLocked) return
    const referenced = schedules.some((s) => s.triggerId === triggerId)
    if (referenced) {
      setStatus(ui.triggersManage.deleteBlocked)
      setErrors([ui.triggersManage.deleteBlockedDetail])
      return
    }
    if (!window.confirm(ui.triggersManage.deleteConfirm)) return
    void saveTriggers(triggers.filter((t) => t.triggerId !== triggerId))
  }

  const moveTrigger = (from: number, to: number) => {
    if (to < 0 || to >= triggers.length) return
    const next = [...triggers]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    void saveTriggers(next)
  }

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return
    moveTrigger(dragIndex, toIndex)
    setDragIndex(null)
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>{ui.triggersManage.title}</h2>
        <button type="button" className="btn active" onClick={openAdd} disabled={crudLocked}>
          {ui.triggersManage.add}
        </button>
      </div>

      {crudLocked && <p className="live-lock-banner">{ui.liveLock.hint}</p>}
      {!isFieldProfile && <p className="field-hint">{ui.triggersManage.reorderHint}</p>}

      <table className="trigger-table">
        <thead>
          <tr>
            {!isFieldProfile && <th>{c.order}</th>}
            {!isFieldProfile && <th>{c.id}</th>}
            <th>{c.label}</th>
            {!isFieldProfile && <th>{c.group}</th>}
            <th>{c.actions}</th>
            <th>{c.edit}</th>
          </tr>
        </thead>
        <tbody>
          {triggers.length === 0 && (
            <tr>
              <td colSpan={isFieldProfile ? 3 : 6}>{ui.triggersManage.empty}</td>
            </tr>
          )}
          {triggers.map((trigger, index) => (
            <tr
              key={trigger.triggerId}
              draggable={!crudLocked && !isFieldProfile}
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className={dragIndex === index ? 'dragging' : ''}
            >
              {!isFieldProfile && (
                <td className="reorder-cell">
                  <button
                    type="button"
                    className="btn small"
                    disabled={crudLocked || index === 0}
                    onClick={() => moveTrigger(index, index - 1)}
                    title={ui.triggersManage.moveUp}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    disabled={crudLocked || index === triggers.length - 1}
                    onClick={() => moveTrigger(index, index + 1)}
                    title={ui.triggersManage.moveDown}
                  >
                    ↓
                  </button>
                </td>
              )}
              {!isFieldProfile && <td>{trigger.triggerId}</td>}
              <td>
                {trigger.color && (
                  <span className="color-swatch" style={{ backgroundColor: trigger.color }} aria-hidden />
                )}
                {trigger.label}
              </td>
              {!isFieldProfile && <td>{trigger.group ?? '—'}</td>}
              <td className="actions-summary">{summarizeActions(trigger, targets)}</td>
              <td className="actions-cell">
                <button
                  type="button"
                  className="btn small"
                  disabled={crudLocked}
                  onClick={() => openEdit(trigger)}
                >
                  {ui.triggersManage.edit}
                </button>
                <button
                  type="button"
                  className="btn small"
                  disabled={crudLocked}
                  onClick={() => handleDelete(trigger.triggerId)}
                >
                  {ui.triggersManage.delete}
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

      <TriggerEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        trigger={editingTrigger}
        existingIds={triggers.map((t) => t.triggerId)}
        targets={targets}
        showTargetId={!isFieldProfile}
        onSubmit={handleSubmit}
        onInvalid={(messages) => {
          setErrors(messages)
          setStatus(ui.settings.saveFailed)
        }}
      />
    </section>
  )
}
