import { z } from 'zod'
import type { Target } from '../../types'

const oscArgRowSchema = z.object({
  type: z.enum(['number', 'string', 'boolean']),
  value: z.string()
})

export const actionFormSchema = z.object({
  target: z.string().min(1),
  address: z.string().optional(),
  oscArgs: z.array(oscArgRowSchema).optional(),
  argsJson: z.string().optional(),
  message: z.string().optional(),
  midiMessage: z.enum(['noteOn', 'noteOff', 'cc']).optional(),
  note: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(127).optional()
  ),
  velocity: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(127).optional()
  ),
  controller: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(127).optional()
  ),
  value: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(127).optional()
  ),
  durationMs: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).optional()
  )
})

export type ActionFormValues = z.infer<typeof actionFormSchema>

export const triggerFormSchema = z.object({
  triggerId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  group: z.string().optional(),
  color: z.string().optional(),
  midiNote: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(0).max(127).optional()
  ),
  midiChannel: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : val),
    z.coerce.number().int().min(1).max(16).optional()
  ),
  actions: z.array(actionFormSchema).min(1, 'at least one action required')
})

export type TriggerFormValues = z.infer<typeof triggerFormSchema>

export function createTriggerFormSchema(targets: Target[]) {
  return triggerFormSchema.superRefine((data, ctx) => {
    data.actions.forEach((action, i) => {
      const target = targets.find((t) => t.id === action.target)
      if (!target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['actions', i, 'target'],
          message: 'unknown target'
        })
        return
      }

      if (target.type === 'osc') {
        if (!action.address?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['actions', i, 'address'],
            message: 'required'
          })
        }
      } else if (target.type === 'udp') {
        if (!action.message?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['actions', i, 'message'],
            message: 'required'
          })
        }
      } else if (target.type === 'midi') {
        const msg = action.midiMessage ?? 'noteOn'
        if (msg !== 'noteOn' && msg !== 'noteOff' && msg !== 'cc') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['actions', i, 'midiMessage'],
            message: 'invalid'
          })
        }
      }
    })
  })
}
