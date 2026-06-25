import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Target } from '../../types'
import { ui } from '../../uiLabels'
import { targetFormSchema, type TargetFormValues } from './targetFormSchema'

interface TargetEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: Target | null
  existingIds: string[]
  onSubmit: (target: Target) => void
}

function toFormValues(target: Target | null): TargetFormValues {
  if (!target) {
    return {
      id: '',
      label: '',
      type: 'osc',
      host: '127.0.0.1',
      port: 8000
    }
  }
  switch (target.type) {
    case 'osc':
      return { id: target.id, label: target.label, type: 'osc', host: target.host, port: target.port }
    case 'udp':
      return {
        id: target.id,
        label: target.label,
        type: 'udp',
        host: target.host,
        port: target.port,
        encoding: target.encoding ?? 'utf-8'
      }
    case 'midi':
      return {
        id: target.id,
        label: target.label,
        type: 'midi',
        outputDevice: target.outputDevice,
        channel: target.channel
      }
  }
}

function toTarget(values: TargetFormValues): Target {
  switch (values.type) {
    case 'osc':
      return { id: values.id, label: values.label, type: 'osc', host: values.host, port: values.port }
    case 'udp':
      return {
        id: values.id,
        label: values.label,
        type: 'udp',
        host: values.host,
        port: values.port,
        encoding: values.encoding ?? 'utf-8'
      }
    case 'midi':
      return {
        id: values.id,
        label: values.label,
        type: 'midi',
        outputDevice: values.outputDevice,
        ...(values.channel ? { channel: values.channel } : {})
      }
  }
}

export function TargetEditorDialog({
  open,
  onOpenChange,
  target,
  existingIds,
  onSubmit
}: TargetEditorDialogProps) {
  const isEdit = target !== null

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors }
  } = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: toFormValues(null)
  })

  const targetType = watch('type')

  useEffect(() => {
    if (open) {
      reset(toFormValues(target))
    }
  }, [open, target, reset])

  const onFormSubmit = handleSubmit((values) => {
    if (!isEdit && existingIds.includes(values.id)) {
      setError('id', { message: ui.targets.duplicateId })
      return
    }
    onSubmit(toTarget(values))
    onOpenChange(false)
  })

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">
            {isEdit ? ui.targets.editTitle : ui.targets.addTitle}
          </Dialog.Title>

          <form className="settings-form" onSubmit={(e) => void onFormSubmit(e)}>
            <label className="form-field">
              <span>{ui.targets.columns.id}</span>
              <input type="text" {...register('id')} readOnly={isEdit} />
              {errors.id && <span className="field-error">{errors.id.message}</span>}
            </label>

            <label className="form-field">
              <span>{ui.targets.columns.label}</span>
              <input type="text" {...register('label')} />
              {errors.label && <span className="field-error">{errors.label.message}</span>}
            </label>

            <label className="form-field">
              <span>{ui.targets.columns.type}</span>
              <select {...register('type')} disabled={isEdit}>
                <option value="osc">osc</option>
                <option value="udp">udp</option>
                <option value="midi">midi</option>
              </select>
            </label>

            {(targetType === 'osc' || targetType === 'udp') && (
              <>
                <label className="form-field">
                  <span>host</span>
                  <input type="text" {...register('host')} />
                  {errors.host && <span className="field-error">{String(errors.host.message)}</span>}
                </label>
                <label className="form-field">
                  <span>port</span>
                  <input type="number" {...register('port', { valueAsNumber: true })} />
                  {errors.port && <span className="field-error">{String(errors.port.message)}</span>}
                </label>
              </>
            )}

            {targetType === 'udp' && (
              <label className="form-field">
                <span>encoding</span>
                <select {...register('encoding')}>
                  <option value="utf-8">utf-8</option>
                  <option value="ascii">ascii</option>
                  <option value="hex">hex</option>
                </select>
              </label>
            )}

            {targetType === 'midi' && (
              <>
                <label className="form-field">
                  <span>outputDevice</span>
                  <input type="text" {...register('outputDevice')} />
                  {errors.outputDevice && (
                    <span className="field-error">{String(errors.outputDevice.message)}</span>
                  )}
                </label>
                <label className="form-field">
                  <span>channel (1–16)</span>
                  <input type="number" min={1} max={16} {...register('channel', { valueAsNumber: true })} />
                  {errors.channel && (
                    <span className="field-error">{String(errors.channel.message)}</span>
                  )}
                </label>
              </>
            )}

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button type="button" className="btn">
                  {ui.targets.cancel}
                </button>
              </Dialog.Close>
              <button type="submit" className="btn active">
                {ui.targets.apply}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
