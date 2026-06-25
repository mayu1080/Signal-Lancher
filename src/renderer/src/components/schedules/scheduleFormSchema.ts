import { z } from 'zod'

const timePattern = /^\d{2}:\d{2}:\d{2}$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/

export const scheduleFormSchema = z
  .object({
    scheduleId: z.string().min(1, 'required'),
    enabled: z.boolean(),
    label: z.string().min(1, 'required'),
    mode: z.enum(['daily', 'oneShot']),
    time: z.string().regex(timePattern, 'HH:mm:ss'),
    date: z.string().optional(),
    triggerId: z.string().min(1, 'required')
  })
  .superRefine((data, ctx) => {
    if (data.mode === 'oneShot') {
      if (!data.date || !datePattern.test(data.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['date'],
          message: 'YYYY-MM-DD required for oneShot'
        })
      }
    }
  })

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>
