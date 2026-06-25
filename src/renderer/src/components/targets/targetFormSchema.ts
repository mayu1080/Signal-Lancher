import { z } from 'zod'

const portSchema = z.coerce.number().int().min(1).max(65535)

export const targetFormSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.literal('osc'),
    host: z.string().min(1),
    port: portSchema
  }),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.literal('udp'),
    host: z.string().min(1),
    port: portSchema,
    encoding: z.enum(['utf-8', 'ascii', 'hex']).optional()
  }),
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.literal('midi'),
    outputDevice: z.string().min(1),
    channel: z.preprocess(
      (val) => {
        if (val === '' || val === undefined || val === null) return undefined
        if (typeof val === 'number' && Number.isNaN(val)) return undefined
        return val
      },
      z.coerce.number().int().min(1).max(16).optional()
    )
  })
])

export type TargetFormValues = z.infer<typeof targetFormSchema>
