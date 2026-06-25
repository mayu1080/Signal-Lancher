import type { Action, AppMode, SendResult, Target, TargetType } from '../config/types'
import type { ShowConfig } from '../config/types'
import type { Logger } from '../log/logger'
import { OscSender } from './oscSender'
import { UdpSender } from './udpSender'
import { MidiOutSender } from './midiOutSender'
import type { SendOutcome } from './sendOutcome'

export class SignalRouter {
  private oscSender: OscSender
  private udpSender: UdpSender
  private midiOutSender: MidiOutSender

  constructor(
    private config: ShowConfig,
    private logger: Logger
  ) {
    this.oscSender = new OscSender()
    this.udpSender = new UdpSender()
    this.midiOutSender = new MidiOutSender(logger)
  }

  setConfig(config: ShowConfig): void {
    this.config = config
  }

  isDryRun(mode: AppMode): boolean {
    return mode === 'dryRun'
  }

  /**
   * Execute actions sequentially from Mapping Engine.
   * dryRun=true  → no network/MIDI output; Monitor shows DRY RUN per action.
   * dryRun=false → dispatch to oscSender / udpSender / midiOutSender by target.type.
   * Failures are isolated per action; later actions still run.
   */
  async executeActions(actions: Action[], dryRun: boolean): Promise<SendResult[]> {
    const results: SendResult[] = []
    const total = actions.length

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const index = i + 1

      try {
        const result = await this.executeAction(action, dryRun, index, total)
        results.push(result)
      } catch (err) {
        const msg = `Action ${index}/${total} crashed: ${String(err)}`
        this.logActionResult('ERROR', false, dryRun, index, total, action.target, msg)
        results.push({
          targetId: action.target,
          targetLabel: 'unknown',
          type: 'osc',
          success: false,
          detail: msg,
          dryRun
        })
      }
    }

    return results
  }

  private async executeAction(
    action: Action,
    dryRun: boolean,
    index: number,
    total: number
  ): Promise<SendResult> {
    const target = this.resolveTarget(action.target)

    if (!target) {
      const msg = `target not found "${action.target}"`
      this.logActionResult('ERROR', false, dryRun, index, total, action.target, msg)
      return {
        targetId: action.target,
        targetLabel: 'unknown',
        type: 'osc',
        success: false,
        detail: msg,
        dryRun
      }
    }

    let outcome: SendOutcome

    try {
      outcome = await this.dispatchToSender(target, action, dryRun)
    } catch (err) {
      outcome = {
        success: false,
        detail: `${target.type} send threw: ${String(err)}`
      }
    }

    this.logActionResult(
      outcome.success ? this.categoryForType(target.type, dryRun) : 'ERROR',
      outcome.success,
      dryRun,
      index,
      total,
      target.label,
      outcome.detail
    )

    return {
      targetId: target.id,
      targetLabel: target.label,
      type: target.type,
      success: outcome.success,
      detail: outcome.detail,
      dryRun
    }
  }

  private logActionResult(
    category: 'DRY_RUN' | 'OSC' | 'UDP' | 'MIDI_OUT' | 'ERROR',
    success: boolean,
    dryRun: boolean,
    index: number,
    total: number,
    label: string,
    detail: string
  ): void {
    const tag = dryRun ? 'DRY RUN' : success ? 'OK' : 'FAIL'
    this.logger.log(category, `Action ${index}/${total} [${tag}] [${label}] ${detail}`)
  }

  private categoryForType(
    type: TargetType,
    dryRun: boolean
  ): 'DRY_RUN' | 'OSC' | 'UDP' | 'MIDI_OUT' {
    if (dryRun) return 'DRY_RUN'
    switch (type) {
      case 'osc':
        return 'OSC'
      case 'udp':
        return 'UDP'
      case 'midi':
        return 'MIDI_OUT'
    }
  }

  private async dispatchToSender(
    target: Target,
    action: Action,
    dryRun: boolean
  ): Promise<SendOutcome> {
    switch (target.type) {
      case 'osc':
        return this.oscSender.send(target, action, dryRun)
      case 'udp':
        return this.udpSender.send(target, action, dryRun)
      case 'midi':
        return this.midiOutSender.send(target, action, dryRun)
      default:
        return { success: false, detail: `Unknown target type: ${(target as Target).type}` }
    }
  }

  private resolveTarget(targetId: string): Target | null {
    return this.config.targets.find((t) => t.id === targetId) ?? null
  }

  async testTarget(targetId: string, dryRun: boolean): Promise<SendResult> {
    const target = this.resolveTarget(targetId)
    if (!target) {
      const msg = `Target not found: ${targetId}`
      this.logger.log('ERROR', msg)
      return {
        targetId,
        targetLabel: 'unknown',
        type: 'osc',
        success: false,
        detail: msg,
        dryRun
      }
    }

    let testAction: Action
    switch (target.type) {
      case 'osc':
        testAction = { target: targetId, address: '/test', args: [1] }
        break
      case 'udp':
        testAction = { target: targetId, message: 'test' }
        break
      case 'midi':
        testAction = {
          target: targetId,
          message: 'noteOn',
          note: 60,
          velocity: 100,
          durationMs: 200
        }
        break
    }

    const results = await this.executeActions([testAction], dryRun)
    return results[0]
  }

  close(): void {
    this.oscSender.closeAll()
    this.midiOutSender.closeAll()
  }
}
