import easymidi from 'easymidi'
import type { MidiInputConfig } from '../config/types'
import type { Logger } from '../log/logger'
import type { InputRouter } from '../input/inputRouter'

export class MidiManager {
  private input: easymidi.Input | null = null
  private activeInputName: string | null = null
  private learnActive = false
  private learnHandler: ((note: number, channel: number) => void) | null = null

  constructor(
    private logger: Logger,
    private inputRouter: InputRouter
  ) {}

  listInputs(): string[] {
    try {
      return easymidi.getInputs()
    } catch (err) {
      this.logger.log('ERROR', `MIDI input list failed: ${String(err)}`)
      return []
    }
  }

  listOutputs(): string[] {
    try {
      return easymidi.getOutputs()
    } catch (err) {
      this.logger.log('ERROR', `MIDI output list failed: ${String(err)}`)
      return []
    }
  }

  autoDetect(pattern: string, preferredDevices: string[] = []): string | null {
    const inputs = this.listInputs()

    const match = inputs.find((name) =>
      name.toLowerCase().includes(pattern.toLowerCase())
    )
    if (match) {
      this.logger.log('INFO', `Auto-detected MIDI input: ${match}`)
      this.openInput(match)
      return match
    }

    for (const preferred of preferredDevices) {
      const preferredMatch = inputs.find((name) =>
        name.toLowerCase().includes(preferred.toLowerCase())
      )
      if (preferredMatch) {
        this.logger.log('INFO', `Opened preferred MIDI input: ${preferredMatch}`)
        this.openInput(preferredMatch)
        return preferredMatch
      }
    }

    this.logger.log('INFO', `No MIDI input matching "${pattern}" or preferred devices found`)
    return null
  }

  /** Open input from saved config: activeDevice first, then autoDetect fallback. */
  connectFromConfig(midiInput: MidiInputConfig): string | null {
    const inputs = this.listInputs()

    if (midiInput.activeDevice) {
      const saved = midiInput.activeDevice
      if (inputs.includes(saved)) {
        this.logger.log('INFO', `Opened saved MIDI input: ${saved}`)
        this.openInput(saved)
        return saved
      }
      this.logger.log('INFO', `Saved MIDI input "${saved}" is not available`)
    }

    if (midiInput.autoDetect) {
      return this.autoDetect(midiInput.autoDetect, midiInput.preferredDevices ?? [])
    }

    return null
  }

  openInput(name: string): boolean {
    if (this.activeInputName === name && this.input) {
      return true
    }

    this.closeInput()
    try {
      this.input = new easymidi.Input(name)
      this.activeInputName = name

      this.input.on('noteon', (msg: { note: number; velocity: number; channel: number }) => {
        this.logger.log(
          'MIDI',
          `Note ON ch=${msg.channel + 1} note=${msg.note} vel=${msg.velocity} (${name})`
        )
        if (this.learnActive && this.learnHandler) {
          this.learnHandler(msg.note, msg.channel + 1)
          return
        }
        this.inputRouter.handleMidiNote(msg.note, msg.channel + 1, msg.velocity)
      })

      this.input.on('cc', (msg: { controller: number; value: number; channel: number }) => {
        this.logger.log(
          'MIDI',
          `CC ch=${msg.channel + 1} cc=${msg.controller} val=${msg.value} (${name})`
        )
        this.inputRouter.handleMidiCc(msg.controller, msg.channel + 1, msg.value)
      })

      this.logger.log('INFO', `MIDI input opened: ${name}`)
      return true
    } catch (err) {
      this.logger.log('ERROR', `Failed to open MIDI input "${name}": ${String(err)}`)
      return false
    }
  }

  closeInput(): void {
    if (!this.input) return

    const port = this.input
    this.input = null
    this.activeInputName = null

    try {
      port.close()
    } catch {
      // ignore close errors
    }
  }

  getActiveInputName(): string | null {
    return this.activeInputName
  }

  startLearn(handler: (note: number, channel: number) => void): void {
    this.learnActive = true
    this.learnHandler = handler
    this.logger.log('INFO', 'MIDI learn mode started — press a pad or key')
  }

  stopLearn(): void {
    this.learnActive = false
    this.learnHandler = null
  }

  isLearnActive(): boolean {
    return this.learnActive
  }
}
