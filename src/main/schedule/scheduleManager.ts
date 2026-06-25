import type { ShowConfig, Schedule, ScheduleState } from '../config/types'
import type { Logger } from '../log/logger'
import type { InputRouter } from '../input/inputRouter'
import type { MappingEngine } from '../mapping/mappingEngine'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function formatDateTime(d: Date): string {
  return `${formatDate(d)} ${formatTime(d)}`
}

function parseTime(time: string): { h: number; m: number; s: number } | null {
  const match = time.match(/^(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  return { h: parseInt(match[1], 10), m: parseInt(match[2], 10), s: parseInt(match[3], 10) }
}

export class ScheduleManager {
  private schedules: Schedule[] = []
  private lastFired = new Map<string, string>()
  private firedKeys = new Set<string>()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private appStartTime: Date
  private onStateChange: (() => void) | null = null

  constructor(
    private logger: Logger,
    private inputRouter: InputRouter,
    private mappingEngine: MappingEngine
  ) {
    this.appStartTime = new Date()
  }

  loadSchedules(config: ShowConfig): void {
    this.schedules = config.schedules ?? []
    this.logger.log('SCHEDULE', `Loaded ${this.schedules.length} schedule(s)`)
  }

  start(): void {
    this.stop()
    this.intervalId = setInterval(() => this.tick(), 1000)
    this.logger.log('SCHEDULE', 'Schedule manager started (1s interval)')
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback
  }

  getScheduleStates(): ScheduleState[] {
    const config = this.mappingEngine.getConfig()
    const now = new Date()

    return this.schedules.map((schedule) => {
      const trigger = config.triggers.find((t) => t.triggerId === schedule.triggerId)
      return {
        scheduleId: schedule.scheduleId,
        label: schedule.label,
        enabled: schedule.enabled,
        mode: schedule.mode,
        date: schedule.date,
        time: schedule.time,
        triggerId: schedule.triggerId,
        triggerLabel: trigger?.label ?? '(invalid)',
        lastFired: this.lastFired.get(schedule.scheduleId) ?? null,
        nextFire: this.computeNextFire(schedule, now)
      }
    })
  }

  fireScheduleTest(scheduleId: string): void {
    const schedule = this.schedules.find((s) => s.scheduleId === scheduleId)
    if (!schedule) {
      this.logger.log('SCHEDULE_ERROR', `Schedule not found: ${scheduleId}`)
      return
    }
    this.logger.log('SCHEDULE', `Test fire: ${schedule.label} (${scheduleId})`)
    void this.mappingEngine.fireByTriggerId(schedule.triggerId, 'test', scheduleId)
  }

  private computeNextFire(schedule: Schedule, now: Date): string | null {
    if (!schedule.enabled) return null

    const parsed = parseTime(schedule.time)
    if (!parsed) return null

    if (schedule.mode === 'oneShot') {
      if (!schedule.date) return null
      const target = new Date(`${schedule.date}T${schedule.time}`)
      if (target <= now) return null
      return formatDateTime(target)
    }

    const next = new Date(now)
    next.setHours(parsed.h, parsed.m, parsed.s, 0)
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    return formatDateTime(next)
  }

  private tick(): void {
    const now = new Date()
    const currentDate = formatDate(now)
    const currentTime = formatTime(now)

    for (const schedule of this.schedules) {
      if (!schedule.enabled) continue

      const parsed = parseTime(schedule.time)
      if (!parsed) {
        this.logger.log('SCHEDULE_ERROR', `Invalid time format: ${schedule.scheduleId}`)
        continue
      }

      if (currentTime !== schedule.time) continue

      const fireKey = `${schedule.scheduleId}:${currentDate}:${schedule.time}`

      if (this.firedKeys.has(fireKey)) continue

      if (schedule.mode === 'oneShot') {
        if (!schedule.date) {
          this.logger.log('SCHEDULE_ERROR', `oneShot schedule missing date: ${schedule.scheduleId}`)
          continue
        }
        if (currentDate !== schedule.date) continue

        const scheduledDateTime = new Date(`${schedule.date}T${schedule.time}`)
        if (scheduledDateTime < this.appStartTime) {
          this.logger.log(
            'SCHEDULE_SKIP',
            `Skipped past oneShot: ${schedule.label} (${schedule.scheduleId})`
          )
          this.firedKeys.add(fireKey)
          continue
        }
      }

      if (schedule.mode === 'daily') {
        const todayScheduled = new Date(`${currentDate}T${schedule.time}`)
        if (todayScheduled < this.appStartTime) {
          this.logger.log(
            'SCHEDULE_SKIP',
            `Skipped past daily: ${schedule.label} (${schedule.scheduleId})`
          )
          this.firedKeys.add(fireKey)
          continue
        }
      }

      const trigger = this.mappingEngine.getConfig().triggers.find(
        (t) => t.triggerId === schedule.triggerId
      )
      if (!trigger) {
        this.logger.log(
          'SCHEDULE_ERROR',
          `Invalid triggerId "${schedule.triggerId}" for schedule ${schedule.scheduleId}`
        )
        this.firedKeys.add(fireKey)
        continue
      }

      this.firedKeys.add(fireKey)
      this.lastFired.set(schedule.scheduleId, formatDateTime(now))

      this.logger.log(
        'SCHEDULE_FIRE',
        `Firing schedule "${schedule.label}" (${schedule.scheduleId}) -> trigger ${schedule.triggerId}`
      )

      this.inputRouter.handleScheduledTrigger(schedule.triggerId, schedule.scheduleId)
      this.onStateChange?.()
    }
  }
}

export function getCurrentTimeString(now: Date = new Date()): string {
  return formatTime(now)
}
