import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { loadConfig } from './config/configLoader'
import { ConfigManager } from './config/configManager'
import { Logger } from './log/logger'
import { SignalRouter } from './output/signalRouter'
import { MappingEngine } from './mapping/mappingEngine'
import { InputRouter } from './input/inputRouter'
import { MidiManager } from './input/midiManager'
import { ScheduleManager } from './schedule/scheduleManager'
import { registerIpcHandlers } from './ipc/ipcHandlers'

const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"

let mainWindow: BrowserWindow | null = null

function setupContentSecurityPolicy(): void {
  const isDev = Boolean(process.env.ELECTRON_RENDERER_URL)

  if (isDev) {
    // Vite HMR requires unsafe-eval; Electron warns in dev — expected until packaged.
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
    return
  }

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (!details.url.startsWith('file://')) {
      callback({ responseHeaders: details.responseHeaders })
      return
    }
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [PRODUCTION_CSP]
      }
    })
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

setupContentSecurityPolicy()

app.whenReady().then(() => {
  const logger = new Logger()
  const config = loadConfig(logger)
  logger.log('INFO', `Loaded config: ${config.projectName} (appMode: ${config.appMode})`)

  const signalRouter = new SignalRouter(config, logger)
  const mappingEngine = new MappingEngine(config, logger, signalRouter)
  const inputRouter = new InputRouter(mappingEngine)
  const midiManager = new MidiManager(logger, inputRouter)
  const scheduleManager = new ScheduleManager(logger, inputRouter, mappingEngine)

  scheduleManager.loadSchedules(config)

  createWindow()

  if (mainWindow) {
    logger.setMainWindow(mainWindow)
  }

  const notifyState = (): void => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app:state', {
        projectName: mappingEngine.getConfig().projectName,
        mode: mappingEngine.getMode(),
        midiInputs: midiManager.listInputs(),
        midiOutputs: midiManager.listOutputs(),
        autoDetectedInput: midiManager.getActiveInputName(),
        targets: mappingEngine.getConfig().targets,
        triggers: mappingEngine.getConfig().triggers,
        schedules: scheduleManager.getScheduleStates(),
        lastTrigger: mappingEngine.getLastTrigger(),
        logs: logger.getLogs()
      })
    }
  }

  const configManager = new ConfigManager(logger, config, {
    mappingEngine,
    signalRouter,
    scheduleManager,
    midiManager,
    notifyState
  })

  registerIpcHandlers(
    () => mainWindow,
    logger,
    midiManager,
    mappingEngine,
    signalRouter,
    scheduleManager,
    configManager
  )

  if (config.midiInput.activeDevice || config.midiInput.autoDetect) {
    midiManager.connectFromConfig(config.midiInput)
  }

  scheduleManager.start()
  logger.log('INFO', 'Signal Launcher started')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
