import dgram from 'dgram'
import type { Action, Target, UdpEncoding, UdpTarget } from '../config/types'
import type { SendOutcome } from './sendOutcome'

function encodeMessage(message: string, encoding: UdpEncoding): Buffer {
  switch (encoding) {
    case 'ascii':
      return Buffer.from(message, 'ascii')
    case 'hex': {
      const hex = message.replace(/\s+/g, '')
      if (hex.length % 2 !== 0) {
        throw new Error('hex message must have even number of digits')
      }
      return Buffer.from(hex, 'hex')
    }
    case 'utf-8':
    default:
      return Buffer.from(message, 'utf-8')
  }
}

export class UdpSender {
  send(target: Target, action: Action, dryRun: boolean): Promise<SendOutcome> {
    if (target.type !== 'udp') {
      return Promise.resolve({ success: false, detail: 'Target is not udp type' })
    }

    const udpTarget = target as UdpTarget
    const { host, port } = udpTarget
    const encoding = udpTarget.encoding ?? 'utf-8'
    const message = action.message ?? ''
    const detail = `UDP ${host}:${port} [${encoding}] "${message}"`

    if (dryRun) {
      return Promise.resolve({ success: true, detail })
    }

    return new Promise((resolve) => {
      const client = dgram.createSocket('udp4')

      const finish = (outcome: SendOutcome): void => {
        try {
          client.close()
        } catch {
          // ignore close errors
        }
        resolve(outcome)
      }

      client.on('error', (err) => {
        finish({ success: false, detail: `${detail} — ${String(err)}` })
      })

      let buffer: Buffer
      try {
        buffer = encodeMessage(message, encoding)
      } catch (err) {
        finish({ success: false, detail: `${detail} — encode error: ${String(err)}` })
        return
      }

      client.send(buffer, port, host, (err) => {
        if (err) {
          finish({ success: false, detail: `${detail} — ${String(err)}` })
        } else {
          finish({ success: true, detail })
        }
      })
    })
  }
}
