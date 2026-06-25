import { useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  useFieldArray,
  useForm,
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../api'
import type { Action, Target, Trigger, TriggerInputs } from '../../types'
import { ui } from '../../uiLabels'
import {
  createTriggerFormSchema,
  type ActionFormValues,
  type TriggerFormValues
} from './triggerFormSchema'
import { OscArgsEditor, oscArgsToJsonArray, parseOscArgsFromJson } from './OscArgsEditor'

interface TriggerEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: Trigger | null
  existingIds: string[]
  targets: Target[]
  preservedInputs?: TriggerInputs
  onSubmit: (trigger: Trigger) => void
  onInvalid?: (messages: string[]) => void
}

function defaultAction(targets: Target[]): ActionFormValues {
  const first = targets[0]
  if (!first) {
    return { target: '', address: '', oscArgs: [] }
  }
  switch (first.type) {
    case 'osc':
      return { target: first.id, address: '', oscArgs: [] }
    case 'udp':
      return { target: first.id, message: '' }
    case 'midi':
      return { target: first.id, midiMessage: 'noteOn', note: 60, velocity: 127 }
  }
}

function actionToForm(action: Action, targetType: Target['type'] | undefined): ActionFormValues {
  const base: ActionFormValues = { target: action.target }
  if (targetType === 'osc') {
    return {
      ...base,
      address: action.address ?? '',
      oscArgs: parseOscArgsFromJson(JSON.stringify(action.args ?? []))
    }
  }
  if (targetType === 'udp') {
    return { ...base, message: action.message ?? '' }
  }
  if (targetType === 'midi') {
    const msg = action.message
    const midiMessage =
      msg === 'noteOff' || msg === 'cc' || msg === 'noteOn' ? msg : 'noteOn'
    return {
      ...base,
      midiMessage,
      note: action.note,
      velocity: action.velocity,
      controller: action.controller,
      value: action.value,
      durationMs: action.durationMs
    }
  }
  return base
}

function formToAction(values: ActionFormValues, targetType: Target['type'] | undefined): Action {
  const base: Action = { target: values.target }
  if (targetType === 'osc') {
    return {
      ...base,
      address: values.address?.trim(),
      args: oscArgsToJsonArray(values.oscArgs ?? [])
    }
  }
  if (targetType === 'udp') {
    return { ...base, message: values.message?.trim() ?? '' }
  }
  if (targetType === 'midi') {
    const msg = values.midiMessage ?? 'noteOn'
    const action: Action = { ...base, message: msg }
    if (msg === 'cc') {
      if (values.controller !== undefined) action.controller = values.controller
      if (values.value !== undefined) action.value = values.value
    } else {
      if (values.note !== undefined) action.note = values.note
      if (values.velocity !== undefined) action.velocity = values.velocity
      if (msg === 'noteOn' && values.durationMs !== undefined) {
        action.durationMs = values.durationMs
      }
    }
    return action
  }
  return base
}

function readMidiFromTrigger(trigger: Trigger | null): { midiNote?: number; midiChannel?: number } {
  const midi = trigger?.inputs?.midi?.[0]
  if (!midi || midi.type !== 'note') return {}
  return { midiNote: midi.note, midiChannel: midi.channel ?? 1 }
}

function toFormValues(trigger: Trigger | null, targets: Target[]): TriggerFormValues {
  const midi = readMidiFromTrigger(trigger)
  if (!trigger) {
    return {
      triggerId: '',
      label: '',
      group: '',
      color: '',
      ...midi,
      actions: targets.length > 0 ? [defaultAction(targets)] : [{ target: '' }]
    }
  }
  return {
    triggerId: trigger.triggerId,
    label: trigger.label,
    group: trigger.group ?? '',
    color: trigger.color ?? '',
    ...midi,
    actions: trigger.actions.map((action) => {
      const targetType = targets.find((t) => t.id === action.target)?.type
      return actionToForm(action, targetType)
    })
  }
}

function buildInputs(
  values: TriggerFormValues,
  triggerId: string,
  preserved?: TriggerInputs
): TriggerInputs {
  const inputs: TriggerInputs = {
    screen: [{ buttonId: triggerId }]
  }
  if (values.midiNote !== undefined) {
    inputs.midi = [
      { type: 'note', note: values.midiNote, channel: values.midiChannel ?? 1 }
    ]
  } else if (preserved?.midi) {
    inputs.midi = preserved.midi
  }
  if (preserved?.keyboard) {
    inputs.keyboard = preserved.keyboard
  }
  return inputs
}

function toTrigger(values: TriggerFormValues, targets: Target[], preservedInputs?: TriggerInputs): Trigger {
  const triggerId = values.triggerId.trim()
  const trigger: Trigger = {
    triggerId,
    label: values.label.trim(),
    actions: values.actions.map((action) => {
      const targetType = targets.find((t) => t.id === action.target)?.type
      return formToAction(action, targetType)
    }),
    inputs: buildInputs(values, triggerId, preservedInputs)
  }
  if (values.group?.trim()) trigger.group = values.group.trim()
  if (values.color?.trim()) trigger.color = values.color.trim()
  return trigger
}

function collectFieldErrors(fieldErrors: FieldErrors<TriggerFormValues>): string[] {
  const messages: string[] = []
  for (const [key, err] of Object.entries(fieldErrors)) {
    if (err && typeof err === 'object' && 'message' in err && err.message) {
      messages.push(`[${key}] ${String(err.message)}`)
    }
    if (Array.isArray(err)) {
      err.forEach((item, i) => {
        if (item && typeof item === 'object') {
          for (const [subKey, subErr] of Object.entries(item)) {
            const msg = (subErr as { message?: string })?.message
            if (msg) messages.push(`[${key}.${i}.${subKey}] ${msg}`)
          }
        }
      })
    }
  }
  return messages
}

interface TriggerActionRowProps {
  index: number
  control: Control<TriggerFormValues>
  register: UseFormRegister<TriggerFormValues>
  targets: Target[]
  errors: FieldErrors<TriggerFormValues>
  showTargetId: boolean
  canRemove: boolean
  onRemove: () => void
}

function TriggerActionRow({
  index,
  control,
  register,
  targets,
  errors,
  showTargetId,
  canRemove,
  onRemove
}: TriggerActionRowProps) {
  const targetId = useWatch({ control, name: `actions.${index}.target` }) ?? ''
  const midiMessage = useWatch({ control, name: `actions.${index}.midiMessage` }) ?? 'noteOn'
  const target = targets.find((t) => t.id === targetId)
  const targetType = target?.type
  const actionErrors = errors.actions?.[index]

  return (
    <div className="action-row">
      <label className="form-field">
        <span>{ui.triggersManage.actionTarget}</span>
        <Controller
          name={`actions.${index}.target`}
          control={control}
          render={({ field }) => (
            <select value={field.value ?? ''} onChange={field.onChange} disabled={targets.length === 0}>
              {targets.length === 0 ? (
                <option value="">—</option>
              ) : (
                targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {showTargetId ? `${t.label} (${t.id}) — ${t.type}` : `${t.label} — ${t.type}`}
                  </option>
                ))
              )}
            </select>
          )}
        />
        {actionErrors?.target && (
          <span className="field-error">{String(actionErrors.target.message)}</span>
        )}
      </label>

      {targetType === 'osc' && (
        <>
          <label className="form-field">
            <span>{ui.triggersManage.oscAddress}</span>
            <input type="text" placeholder="/cue/1" {...register(`actions.${index}.address`)} />
            {actionErrors?.address && (
              <span className="field-error">{String(actionErrors.address.message)}</span>
            )}
          </label>
          <Controller
            name={`actions.${index}.oscArgs`}
            control={control}
            render={({ field }) => (
              <OscArgsEditor args={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </>
      )}

      {targetType === 'udp' && (
        <label className="form-field">
          <span>{ui.triggersManage.udpMessage}</span>
          <input type="text" {...register(`actions.${index}.message`)} />
          {actionErrors?.message && (
            <span className="field-error">{String(actionErrors.message.message)}</span>
          )}
        </label>
      )}

      {targetType === 'midi' && (
        <>
          <label className="form-field">
            <span>{ui.triggersManage.midiType}</span>
            <Controller
              name={`actions.${index}.midiMessage`}
              control={control}
              render={({ field }) => (
                <select value={field.value ?? 'noteOn'} onChange={field.onChange}>
                  <option value="noteOn">{ui.triggersManage.midiNoteOn}</option>
                  <option value="noteOff">{ui.triggersManage.midiNoteOff}</option>
                  <option value="cc">{ui.triggersManage.midiCc}</option>
                </select>
              )}
            />
          </label>
          {midiMessage === 'cc' ? (
            <>
              <label className="form-field">
                <span>{ui.triggersManage.midiController}</span>
                <input type="number" min={0} max={127} {...register(`actions.${index}.controller`)} />
              </label>
              <label className="form-field">
                <span>{ui.triggersManage.midiValue}</span>
                <input type="number" min={0} max={127} {...register(`actions.${index}.value`)} />
              </label>
            </>
          ) : (
            <>
              <label className="form-field">
                <span>{ui.triggersManage.midiNote}</span>
                <input type="number" min={0} max={127} {...register(`actions.${index}.note`)} />
              </label>
              {midiMessage === 'noteOn' && (
                <>
                  <label className="form-field">
                    <span>{ui.triggersManage.midiVelocity}</span>
                    <input type="number" min={0} max={127} {...register(`actions.${index}.velocity`)} />
                  </label>
                  <label className="form-field">
                    <span>{ui.triggersManage.midiDuration}</span>
                    <input type="number" min={0} placeholder="ms" {...register(`actions.${index}.durationMs`)} />
                  </label>
                </>
              )}
            </>
          )}
        </>
      )}

      {canRemove && (
        <button type="button" className="btn small" onClick={onRemove}>
          {ui.triggersManage.removeAction}
        </button>
      )}
    </div>
  )
}

function MidiMappingFields({
  register,
  learning,
  onLearn,
  onCancelLearn
}: {
  register: UseFormRegister<TriggerFormValues>
  learning: boolean
  onLearn: () => void
  onCancelLearn: () => void
}) {
  return (
    <div className="midi-mapping-fields">
      <span className="form-label">{ui.triggersManage.inputsReadOnly}</span>
      <div className="midi-mapping-row">
        <label className="form-field">
          <span>{ui.triggersManage.midiNoteLabel}</span>
          <input type="number" min={0} max={127} placeholder="—" {...register('midiNote')} />
        </label>
        <label className="form-field">
          <span>{ui.triggersManage.midiChannelLabel}</span>
          <input type="number" min={1} max={16} defaultValue={1} {...register('midiChannel')} />
        </label>
      </div>
      <div className="midi-learn-row">
        {!learning ? (
          <button type="button" className="btn small" onClick={onLearn}>
            {ui.triggersManage.midiLearn}
          </button>
        ) : (
          <>
            <span className="field-hint">{ui.triggersManage.midiLearnWaiting}</span>
            <button type="button" className="btn small" onClick={onCancelLearn}>
              {ui.triggersManage.midiLearnCancel}
            </button>
          </>
        )}
      </div>
      <span className="field-hint">{ui.triggersManage.inputsHint}</span>
    </div>
  )
}

export function TriggerEditorDialog({
  open,
  onOpenChange,
  trigger,
  existingIds,
  targets,
  preservedInputs,
  onSubmit,
  onInvalid,
  showTargetId = false
}: TriggerEditorDialogProps & { showTargetId?: boolean }) {
  const isEdit = trigger !== null
  const schema = useMemo(() => createTriggerFormSchema(targets), [targets])
  const [submitErrors, setSubmitErrors] = useState<string[]>([])
  const [learning, setLearning] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors }
  } = useForm<TriggerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(null, targets)
  })

  const { fields, append, remove, replace } = useFieldArray({ control, name: 'actions' })

  useEffect(() => {
    if (open) {
      const values = toFormValues(trigger, targets)
      reset(values)
      replace(values.actions)
      setSubmitErrors([])
      setLearning(false)
    }
  }, [open, trigger, targets, reset, replace])

  useEffect(() => {
    return () => {
      void api.midiCancelLearn()
    }
  }, [])

  const handleLearn = async () => {
    setLearning(true)
    const result = await api.midiLearn()
    setLearning(false)
    if (result) {
      setValue('midiNote', result.note)
      setValue('midiChannel', result.channel)
    }
  }

  const onFormSubmit = handleSubmit(
    (values) => {
      if (!isEdit && existingIds.includes(values.triggerId.trim())) {
        setError('triggerId', { message: ui.triggersManage.duplicateId })
        setSubmitErrors([ui.triggersManage.duplicateId])
        return
      }
      if (targets.length === 0) {
        setError('actions', { message: ui.triggersManage.noTargetsHint })
        setSubmitErrors([ui.triggersManage.noTargetsHint])
        return
      }
      onSubmit(toTrigger(values, targets, isEdit ? trigger?.inputs : preservedInputs))
      onOpenChange(false)
    },
    (fieldErrors) => {
      const messages = collectFieldErrors(fieldErrors)
      setSubmitErrors(messages)
      onInvalid?.(messages)
    }
  )

  const formKey = isEdit ? trigger.triggerId : 'new'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content dialog-content-wide">
          <Dialog.Title className="dialog-title">
            {isEdit ? ui.triggersManage.editTitle : ui.triggersManage.addTitle}
          </Dialog.Title>

          <form key={formKey} className="settings-form" onSubmit={(e) => void onFormSubmit(e)}>
            <label className="form-field">
              <span>{ui.triggersManage.columns.id}</span>
              <input type="text" {...register('triggerId')} readOnly={isEdit} />
              {errors.triggerId && <span className="field-error">{errors.triggerId.message}</span>}
            </label>

            <label className="form-field">
              <span>{ui.triggersManage.columns.label}</span>
              <input type="text" {...register('label')} />
              {errors.label && <span className="field-error">{errors.label.message}</span>}
            </label>

            <label className="form-field">
              <span>{ui.triggersManage.columns.group}</span>
              <input type="text" {...register('group')} />
            </label>

            <label className="form-field">
              <span>{ui.triggersManage.columns.color}</span>
              <input type="text" placeholder="#4d96ff" {...register('color')} />
            </label>

            <MidiMappingFields
              register={register}
              learning={learning}
              onLearn={() => void handleLearn()}
              onCancelLearn={() => {
                void api.midiCancelLearn()
                setLearning(false)
              }}
            />

            <div className="actions-section">
              <div className="actions-section-header">
                <span>{ui.triggersManage.actionsTitle}</span>
                <button
                  type="button"
                  className="btn small"
                  disabled={targets.length === 0}
                  onClick={() => append(defaultAction(targets))}
                >
                  {ui.triggersManage.addAction}
                </button>
              </div>

              {targets.length === 0 && <p className="field-hint">{ui.triggersManage.noTargetsHint}</p>}

              {fields.map((field, index) => (
                <TriggerActionRow
                  key={field.id}
                  index={index}
                  control={control}
                  register={register}
                  targets={targets}
                  errors={errors}
                  showTargetId={showTargetId}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                />
              ))}

              {errors.actions && !Array.isArray(errors.actions) && (
                <span className="field-error">{String(errors.actions.message)}</span>
              )}
            </div>

            {submitErrors.length > 0 && (
              <ul className="settings-errors dialog-errors">
                {submitErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}

            <div className="dialog-actions">
              <Dialog.Close asChild>
                <button type="button" className="btn">
                  {ui.triggersManage.cancel}
                </button>
              </Dialog.Close>
              <button type="submit" className="btn active" disabled={targets.length === 0}>
                {ui.triggersManage.apply}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
