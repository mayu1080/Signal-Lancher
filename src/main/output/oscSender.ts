import OSC from 'osc-js'
import type { Action, OscTarget, Target } from '../config/types'
import type { SendOutcome } from './sendOutcome'

export class OscSender {
  private clients = new Map<string, OSC>()

  send(target: Target, action: Action, dryRun: boolean): SendOutcome {
    if (target.type !== 'osc') {
      return { success: false, detail: 'Target is not osc type' }
    }

    const oscTarget = target as OscTarget
    const address = action.address
    if (!address) {
      return { success: false, detail: 'OSC action requires address' }
    }

    const args = action.args ?? []
    const { host, port } = oscTarget
    const detail = `OSC ${host}:${port} ${address} ${JSON.stringify(args)}`

    if (dryRun) {
      return { success: true, detail }
    }

    try {
      const client = this.getClient(host, port)
      client.send(new OSC.Message(address, ...args))
      return { success: true, detail }
    } catch (err) {
      return { success: false, detail: `${detail} — ${String(err)}` }
    }
  }

  private getClient(host: string, port: number): OSC {
    const key = `${host}:${port}`
    let client = this.clients.get(key)
    if (!client) {
      client = new OSC({
        plugin: new OSC.DatagramPlugin({ send: { host, port } })
      })
      this.clients.set(key, client)
    }
    return client
  }

  closeAll(): void {
    this.clients.clear()
  }
}
