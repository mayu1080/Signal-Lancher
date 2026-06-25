import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Schedule, Trigger } from '../../types'
import { ui } from '../../uiLabels'
import { scheduleFormSchema, type ScheduleFormValues } from './scheduleFormSchema'

interface ScheduleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: Schedule | null
  existingIds: string[]
  triggers: Trigger[]
  onSubmit: (schedule: Schedule) => void
  onInvalid?: (messages: string[]) => void
}

function toFormValues(schedule: Schedule | null, triggers: Trigger[]): ScheduleFormValues {
  if (!schedule) {
    return {
      scheduleId: '',
      enabled: true,
      label: '',
      mode: 'daily',
      time: '18:00:00',
      date: '',
      triggerId: triggers[0]?.triggerId ?? ''
    }
  }
  return {
    scheduleId: schedule.scheduleId,
    enabled: schedule.enabled,
    label: schedule.label,
    mode: schedule.mode,
    time: schedule.time,
    date: schedule.date ?? '',
    triggerId: schedule.triggerId
  }
}

function toSchedule(values: ScheduleFormValues): Schedule {
  return {
    scheduleId: values.scheduleId.trim(),
    enabled: values.enabled,
    label: values.label.trim(),
    mode: values.mode,
    time: values.time.trim(),
    triggerId: values.triggerId,
    ...(values.mode === 'oneShot' && values.date ? { date: values.date.trim() } : {})
  }
}

export function ScheduleEditorDialog({
  open,
  onOpenChange,
  schedule,
  existingIds,
  triggers,
  onSubmit,
  onInvalid
}: ScheduleEditorDialogProps) {
  const isEdit = schedule !== null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    control,
    formState: { errors }
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: toFormValues(null, triggers)
  })

  const mode = watch('mode')

  useEffect(() => {
    if (open) {
      reset(toFormValues(schedule, triggers))
    }
  }, [open, schedule, triggers, reset])

  useEffect(() => {
    if (mode === 'daily') {
      setValue('date', '')
    }
  }, [mode, setValue])

  const onFormSubmit = handleSubmit(
    (values) => {
      if (!isEdit && existingIds.includes(values.scheduleId.trim())) {
        setError('scheduleId', { message: ui.schedule.duplicateId })
        return
      }
      if (triggers.length === 0) {
        setError('triggerId', { message: ui.schedule.noTriggersHint })
        return
      }
      if (!triggers.some((t) => t.triggerId === values.triggerId)) {
        setError('triggerId', { message: ui.schedule.invalidTrigger })
        return
      }
      onSubmit(toSchedule(values))
      onOpenChange(false)
    },
    (fieldErrors) => {
      const messages = Object.entries(fieldErrors).map(
        ([key, err]) => `[${key}] ${err?.message ?? 'invalid'}`
      )
      onInvalid?.(messages)
    }
  )

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">
            {isEdit ? ui.schedule.editTitle : ui.schedule.addTitle}
          </Dialog.Title>

          <form className="settings-form" onSubmit={onFormSubmit}>
            <label className="form-field">
              <span>{ui.schedule.columns.id}</span>
              <input type="text" {...register('scheduleId')} readOnly={isEdit} />
              {errors.scheduleId && <span className="field-error">{errors.scheduleId.message}</span>}
            </label>

            <label className="form-field">
              <span>{ui.schedule.columns.label}</span>
              <input type="text" {...register('label')} />
              {errors.label && <span className="field-error">{errors.label.message}</span>}
            </label>

            <Controller
              name="enabled"
              control={control}
              render={({ field }) => (
                <label className="form-field form-field-inline">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span>{ui.schedule.columns.enabled}</span>
                </label>
              )}
            />

            <label className="form-field">
              <span>{ui.schedule.columns.mode}</span>
              <select {...register('mode')}>
                <option value="daily">{ui.schedule.modeDaily}</option>
                <option value="oneShot">{ui.schedule.modeOneShot}</option>
              </select>
            </label>

            {mode === 'oneShot' && (
              <label className="form-field">
                <span>{ui.schedule.columns.date}</span>
                <input type="text" placeholder="YYYY-MM-DD" {...register('date')} />
                {errors.date && <span className="field-error">{String(errors.date.message)}</span>}
              </label>
            )}

            <label className="form-field">
              <span>{ui.schedule.columns.time}</span>
              <input type="text" placeholder="HH:mm:ss" {...register('time')} />
              {errors.time && <span className="field-error">{String(errors.time.message)}</span>}
            </label>

            <label className="form-field">
              <span>{ui.schedule.columns.trigger}</span>
              <Controller
                name="triggerId"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    disabled={triggers.length === 0}
                  >
                    {triggers.length === 0 ? (
                      <option value="">—</option>
                    ) : (
                      triggers.map((t) => (
                        <option key={t.triggerId} value={t.triggerId}>
                          {t.label} ({t.triggerId})
                        </option>
                      ))
                    )}
                  </select>
                )}
              />
              {errors.triggerId && (
                <span className="field-error">{String(errors.triggerId.message)}</span>
              )}
              {triggers.length === 0 && (
                <span className="field-hint">{ui.schedule.noTriggersHint}</span>
              )}
            </label>

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button type="button" className="btn">
                  {ui.schedule.cancel}
                </button>
              </Dialog.Close>
              <button type="submit" className="btn active" disabled={triggers.length === 0}>
                {ui.schedule.apply}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
