import easymidi from 'easymidi'
import type { Action, MidiTarget, Target } from '../config/types'
import type { Logger } from '../log/logger'
import type { SendOutcome } from './sendOutcome'

interface PendingNoteOff {
  timer: ReturnType<typeof setTimeout>
  outputName: string
  note: number
  channel: number
}

export class MidiOutSender {
  private outputs = new Map<string, easymidi.Output>()
  private pendingNoteOffs: PendingNoteOff[] = []

  constructor(private logger: Logger) {}

  send(target: Target, action: Action, dryRun: boolean): SendOutcome {
    if (target.type !== 'midi') {
      return { success: false, detail: 'Target is not midi type' }
    }

    const midiTarget = target as MidiTarget
    const outputName = midiTarget.outputDevice
    const channel = (midiTarget.channel ?? 1) - 1
    const msgType = (action.message ?? 'noteOn') as 'noteOn' | 'noteOff' | 'cc'
    const note = action.note ?? 60
    const velocity = action.velocity ?? 127
    const controller = action.controller ?? 1
    const value = action.value ?? 127
    const durationMs = action.durationMs

    let detail: string
    switch (msgType) {
      case 'noteOff':
        detail = `MIDI Out "${outputName}" ch=${channel + 1} noteOff note=${note}`
        break
      case 'cc':
        detail = `MIDI Out "${outputName}" ch=${channel + 1} cc=${controller} val=${value}`
        break
      case 'noteOn':
      default:
        detail = `MIDI Out "${outputName}" ch=${channel + 1} noteOn note=${note} vel=${velocity}`
        if (durationMs && durationMs > 0) {
          detail += ` → noteOff after ${durationMs}ms`
        }
    }

    if (dryRun) {
      return { success: true, detail }
    }

    try {
      const output = this.getOutput(outputName)

      if (msgType === 'cc') {
        output.send('cc', { controller, value, channel })
      } else if (msgType === 'noteOff') {
        output.send('noteoff', { note, velocity: 0, channel })
      } else {
        output.send('noteon', { note, velocity, channel })

        if (durationMs && durationMs > 0) {
          const timer = setTimeout(() => {
            this.sendNoteOff(outputName, note, channel)
          }, durationMs)
          this.pendingNoteOffs.push({ timer, outputName, note, channel })
        }
      }

      return { success: true, detail }
    } catch (err) {
      return { success: false, detail: `${detail} — ${String(err)}` }
    }
  }

  private sendNoteOff(outputName: string, note: number, channel: number): void {
    const detail = `MIDI Out "${outputName}" ch=${channel + 1} noteOff note=${note} (durationMs elapsed)`
    try {
      const output = this.getOutput(outputName)
      output.send('noteoff', { note, velocity: 0, channel })
      this.logger.log('MIDI_OUT', `OK — ${detail}`)
    } catch (err) {
      this.logger.log('ERROR', `MIDI Out failed — ${detail} — ${String(err)}`)
    } finally {
      this.pendingNoteOffs = this.pendingNoteOffs.filter(
        (p) => !(p.outputName === outputName && p.note === note && p.channel === channel)
      )
    }
  }

  private getOutput(name: string): easymidi.Output {
    let output = this.outputs.get(name)
    if (!output) {
      output = new easymidi.Output(name)
      this.outputs.set(name, output)
    }
    return output
  }

  closeAll(): void {
    for (const pending of this.pendingNoteOffs) {
      clearTimeout(pending.timer)
    }
    this.pendingNoteOffs = []

    for (const output of this.outputs.values()) {
      try {
        output.close()
      } catch {
        // ignore
      }
    }
    this.outputs.clear()
  }
}
