declare module 'easymidi' {
  interface MidiMessage {
    note: number
    velocity: number
    channel: number
  }

  class Input {
    constructor(name: string)
    on(event: 'noteon', callback: (msg: MidiMessage) => void): void
    on(event: 'cc', callback: (msg: { controller: number; value: number; channel: number }) => void): void
    close(): void
  }

  class Output {
    constructor(name: string)
    send(event: 'noteon', msg: MidiMessage): void
    close(): void
  }

  interface Easymidi {
    getInputs(): string[]
    getOutputs(): string[]
    Input: typeof Input
    Output: typeof Output
  }

  const easymidi: Easymidi
  export default easymidi
}

declare module 'osc-js' {
  export class Message {
    constructor(address: string, ...args: unknown[])
  }

  export class Packet {
    constructor(message: Message)
    encode(): ArrayBuffer
  }

  export class DatagramPlugin {
    constructor(options: { send: { host: string; port: number } })
  }

  export default class OSC {
    constructor(options: { plugin: DatagramPlugin })
    send(message: Message): void
  }
}
