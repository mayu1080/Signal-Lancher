import type { InputSource } from '../config/types'
import type { MappingEngine } from '../mapping/mappingEngine'

export class InputRouter {
  constructor(private mappingEngine: MappingEngine) {}

  handleMidiNote(note: number, channel: number, velocity: number): void {
    if (velocity === 0) return
    this.mappingEngine.fireByMidiNote(note, channel, 'midi')
  }

  handleMidiCc(cc: number, channel: number, value: number): void {
    if (value === 0) return
    this.mappingEngine.fireByMidiCc(cc, channel, 'midi')
  }

  handleScreenTrigger(triggerId: string): void {
    this.mappingEngine.fireByTriggerId(triggerId, 'screen')
  }

  handleScheduledTrigger(triggerId: string, scheduleId: string): void {
    this.mappingEngine.fireByTriggerId(triggerId, 'schedule', scheduleId)
  }

  handleTestTrigger(triggerId: string, source: InputSource = 'test'): void {
    this.mappingEngine.fireByTriggerId(triggerId, source)
  }
}
