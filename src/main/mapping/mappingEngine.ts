import type { ShowConfig, InputSource, TriggerResult, Trigger } from '../config/types'
import type { Logger } from '../log/logger'
import type { SignalRouter } from '../output/signalRouter'

export class MappingEngine {
  private config: ShowConfig
  private mode: 'live' | 'dryRun'
  private lastTrigger: TriggerResult | null = null
  private onStateChange: (() => void) | null = null

  constructor(
    config: ShowConfig,
    private logger: Logger,
    private signalRouter: SignalRouter
  ) {
    this.config = config
    this.mode = config.appMode
  }

  setConfig(config: ShowConfig): void {
    this.config = config
  }

  setMode(mode: 'live' | 'dryRun'): void {
    this.mode = mode
    this.logger.log('INFO', `Mode changed to: ${mode === 'live' ? 'Live' : 'Dry Run'}`)
    this.notifyStateChange()
  }

  getMode(): 'live' | 'dryRun' {
    return this.mode
  }

  getLastTrigger(): TriggerResult | null {
    return this.lastTrigger
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback
  }

  private notifyStateChange(): void {
    this.onStateChange?.()
  }

  findTriggerByMidiNote(note: number, channel?: number): Trigger | undefined {
    return this.config.triggers.find((trigger) =>
      trigger.inputs?.midi?.some((input) => {
        if (input.type !== 'note') return false
        if (input.note !== note) return false
        if (input.channel !== undefined && channel !== undefined && input.channel !== channel) {
          return false
        }
        return true
      })
    )
  }

  findTriggerByMidiCc(cc: number, channel?: number): Trigger | undefined {
    return this.config.triggers.find((trigger) =>
      trigger.inputs?.midi?.some((input) => {
        if (input.type !== 'cc') return false
        if (input.cc !== cc) return false
        if (input.channel !== undefined && channel !== undefined && input.channel !== channel) {
          return false
        }
        return true
      })
    )
  }

  fireByMidiNote(note: number, channel: number, source: InputSource): void {
    const trigger = this.findTriggerByMidiNote(note, channel)
    if (!trigger) {
      this.logger.log('MIDI', `No trigger mapped for note ${note} ch=${channel}`)
      return
    }
    void this.executeTrigger(trigger.triggerId, source)
  }

  fireByMidiCc(cc: number, channel: number, source: InputSource): void {
    const trigger = this.findTriggerByMidiCc(cc, channel)
    if (!trigger) {
      this.logger.log('MIDI', `No trigger mapped for cc ${cc} ch=${channel}`)
      return
    }
    void this.executeTrigger(trigger.triggerId, source)
  }

  fireByTriggerId(
    triggerId: string,
    source: InputSource,
    scheduleId?: string
  ): Promise<TriggerResult | null> {
    const trigger = this.config.triggers.find((t) => t.triggerId === triggerId)
    if (!trigger) {
      const msg = scheduleId
        ? `Schedule ${scheduleId}: invalid triggerId "${triggerId}"`
        : `Invalid triggerId "${triggerId}"`
      this.logger.log('ERROR', msg)
      if (scheduleId) {
        this.logger.log('SCHEDULE_ERROR', msg)
      }
      return Promise.resolve(null)
    }
    return this.executeTrigger(triggerId, source, scheduleId)
  }

  private async executeTrigger(
    triggerId: string,
    source: InputSource,
    scheduleId?: string
  ): Promise<TriggerResult> {
    const trigger = this.config.triggers.find((t) => t.triggerId === triggerId)!
    const dryRun = this.mode === 'dryRun'

    const sourceLabel =
      source === 'schedule' && scheduleId ? `schedule:${scheduleId}` : source

    this.logger.log(
      'TRIGGER',
      `Firing trigger "${trigger.label}" (${triggerId}) from ${sourceLabel}${dryRun ? ' [DRY RUN]' : ''}`
    )

    const results = await this.signalRouter.executeActions(trigger.actions, dryRun)

    const result: TriggerResult = {
      triggerId,
      triggerLabel: trigger.label,
      source,
      dryRun,
      results
    }

    this.lastTrigger = result
    this.notifyStateChange()
    return result
  }

  getConfig(): ShowConfig {
    return this.config
  }
}
