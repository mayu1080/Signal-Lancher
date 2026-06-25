import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { BrowserWindow } from 'electron'
import type { LogCategory, LogEntry } from '../config/types'

const MAX_LOGS = 500

function resolveLogDir(): string {
  if (app.isPackaged) {
    return join(app.getPath('userData'), 'logs')
  }
  return join(process.cwd(), 'logs')
}

export class Logger {
  private logs: LogEntry[] = []
  private logDir: string
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.logDir = resolveLogDir()
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private getLogFilePath(): string {
    const now = new Date()
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-')
    return join(this.logDir, `${date}.log`)
  }

  private formatTimestamp(): string {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  }

  log(category: LogCategory, message: string): LogEntry {
    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      category,
      message
    }

    this.logs.push(entry)
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift()
    }

    const line = `[${entry.timestamp}] [${entry.category}] ${entry.message}\n`
    appendFileSync(this.getLogFilePath(), line, 'utf-8')

    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('log:entry', entry)
    }

    return entry
  }

  getLogs(): LogEntry[] {
    return [...this.logs]
  }
}
