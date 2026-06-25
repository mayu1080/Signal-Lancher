import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import type { Schedule, ScheduleState, Trigger } from '../../types'
import { ui, formatScheduleMode } from '../../uiLabels'
import { ScheduleEditorDialog } from './ScheduleEditorDialog'

interface SchedulesPanelProps {
  schedules: ScheduleState[]
  triggers: Trigger[]
  isLive?: boolean
  isFieldProfile?: boolean
  onTestFire: (scheduleId: string) => void
  getCurrentTime: () => Promise<string>
  onChanged: () => void
}

function toScheduleConfig(state: ScheduleState): Schedule {
  return {
    scheduleId: state.scheduleId,
    enabled: state.enabled,
    label: state.label,
    mode: state.mode,
    time: state.time,
    triggerId: state.triggerId,
    ...(state.date ? { date: state.date } : {})
  }
}

export function SchedulesPanel({
  schedules,
  triggers,
  isLive = false,
  isFieldProfile = false,
  onTestFire,
  getCurrentTime,
  onChanged
}: SchedulesPanelProps) {
  const crudLocked = isLive
  const [currentTime, setCurrentTime] = useState('--:--:--')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const c = ui.schedule.columns

  useEffect(() => {
    const update = () => {
      void getCurrentTime().then(setCurrentTime)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [getCurrentTime])

  const saveSchedules = useCallback(
    async (nextSchedules: Schedule[]) => {
      setStatus(null)
      setErrors([])
      const config = await api.getConfig()
      const result = await api.saveConfig({ ...config, schedules: nextSchedules })
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
    setEditingSchedule(null)
    setDialogOpen(true)
  }

  const openEdit = (state: ScheduleState) => {
    if (crudLocked) return
    setEditingSchedule(toScheduleConfig(state))
    setDialogOpen(true)
  }

  const handleSubmit = (schedule: Schedule) => {
    const configSchedules = schedules.map(toScheduleConfig)
    if (editingSchedule) {
      void saveSchedules(
        configSchedules.map((s) => (s.scheduleId === editingSchedule.scheduleId ? schedule : s))
      )
    } else {
      void saveSchedules([...configSchedules, schedule])
    }
  }

  const handleDelete = (scheduleId: string) => {
    if (crudLocked) return
    if (!window.confirm(ui.schedule.deleteConfirm)) return
    void saveSchedules(schedules.map(toScheduleConfig).filter((s) => s.scheduleId !== scheduleId))
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>{ui.schedule.title}</h2>
        <button type="button" className="btn active" onClick={openAdd} disabled={crudLocked}>
          {ui.schedule.add}
        </button>
      </div>

      {crudLocked && <p className="live-lock-banner">{ui.liveLock.hint}</p>}

      <p className="schedule-hint">{ui.schedule.optionalHint}</p>

      <div className="clock">
        {ui.schedule.pcTime}: {currentTime}
      </div>

      <table className="schedule-table">
        <thead>
          <tr>
            {!isFieldProfile && <th>{c.id}</th>}
            <th>{c.label}</th>
            <th>{c.enabled}</th>
            <th>{c.mode}</th>
            {!isFieldProfile && <th>{c.date}</th>}
            <th>{c.time}</th>
            <th>{c.trigger}</th>
            {!isFieldProfile && <th>{c.lastFired}</th>}
            <th>{c.nextFire}</th>
            <th>{c.test}</th>
            <th>{ui.schedule.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 && (
            <tr>
              <td colSpan={isFieldProfile ? 8 : 11}>{ui.schedule.noSchedules}</td>
            </tr>
          )}
          {schedules.map((s) => (
            <tr key={s.scheduleId} className={!s.enabled ? 'disabled' : ''}>
              {!isFieldProfile && <td>{s.scheduleId}</td>}
              <td>{s.label}</td>
              <td>{s.enabled ? ui.schedule.enabled : ui.schedule.disabled}</td>
              <td>{formatScheduleMode(s.mode)}</td>
              {!isFieldProfile && <td>{s.date ?? '-'}</td>}
              <td>{s.time}</td>
              <td>{isFieldProfile ? s.triggerLabel : `${s.triggerLabel} (${s.triggerId})`}</td>
              {!isFieldProfile && <td>{s.lastFired ?? '-'}</td>}
              <td>{s.nextFire ?? '-'}</td>
              <td>
                <button type="button" className="btn small" onClick={() => onTestFire(s.scheduleId)}>
                  {ui.schedule.testFire}
                </button>
              </td>
              <td className="actions-cell">
                <button type="button" className="btn small" disabled={crudLocked} onClick={() => openEdit(s)}>
                  {ui.schedule.edit}
                </button>
                <button type="button" className="btn small" disabled={crudLocked} onClick={() => handleDelete(s.scheduleId)}>
                  {ui.schedule.delete}
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

      <ScheduleEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editingSchedule}
        existingIds={schedules.map((s) => s.scheduleId)}
        triggers={triggers}
        onSubmit={handleSubmit}
        onInvalid={(messages) => {
          setErrors(messages)
          setStatus(ui.settings.saveFailed)
        }}
      />
    </section>
  )
}
