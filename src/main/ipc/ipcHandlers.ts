import { ipcMain, BrowserWindow } from 'electron'

import type { AppState, ShowConfig } from '../config/types'

import type { Logger } from '../log/logger'

import type { MidiManager } from '../input/midiManager'

import type { MappingEngine } from '../mapping/mappingEngine'

import type { SignalRouter } from '../output/signalRouter'

import type { ScheduleManager } from '../schedule/scheduleManager'

import type { ConfigManager } from '../config/configManager'

import { getCurrentTimeString } from '../schedule/scheduleManager'



export function registerIpcHandlers(

  getMainWindow: () => BrowserWindow | null,

  logger: Logger,

  midiManager: MidiManager,

  mappingEngine: MappingEngine,

  signalRouter: SignalRouter,

  scheduleManager: ScheduleManager,

  configManager: ConfigManager

): void {

  const buildAppState = (): AppState => {

    const config = mappingEngine.getConfig()

    return {

      projectName: config.projectName,

      mode: mappingEngine.getMode(),

      midiInputs: midiManager.listInputs(),

      midiOutputs: midiManager.listOutputs(),

      autoDetectedInput: midiManager.getActiveInputName(),

      targets: config.targets,

      triggers: config.triggers,

      schedules: scheduleManager.getScheduleStates(),

      lastTrigger: mappingEngine.getLastTrigger(),

      logs: logger.getLogs()

    }

  }



  const notifyState = (): void => {

    const win = getMainWindow()

    if (win && !win.isDestroyed()) {

      win.webContents.send('app:state', buildAppState())

    }

  }



  mappingEngine.setOnStateChange(notifyState)

  scheduleManager.setOnStateChange(notifyState)



  ipcMain.handle('app:getState', () => buildAppState())



  ipcMain.handle('app:getCurrentTime', () => getCurrentTimeString(new Date()))



  ipcMain.handle('app:setMode', (_event, mode: 'live' | 'dryRun') => {

    mappingEngine.setMode(mode)

    notifyState()

    return buildAppState()

  })



  ipcMain.handle('trigger:fire', (_event, triggerId: string) => {

    void mappingEngine.fireByTriggerId(triggerId, 'screen')

  })



  ipcMain.handle('target:test', async (_event, targetId: string) => {

    const dryRun = mappingEngine.getMode() === 'dryRun'

    const result = await signalRouter.testTarget(targetId, dryRun)

    notifyState()

    return result

  })



  ipcMain.handle('schedule:testFire', (_event, scheduleId: string) => {

    scheduleManager.fireScheduleTest(scheduleId)

  })



  ipcMain.handle('midi:refresh', () => {

    const config = configManager.getConfig()

    if (config.midiInput.activeDevice || config.midiInput.autoDetect) {

      midiManager.connectFromConfig(config.midiInput)

    }

    notifyState()

    return buildAppState()

  })



  ipcMain.handle('midi:selectInput', (_event, deviceName: string) => {

    try {

      return configManager.setActiveMidiInput(deviceName)

    } catch (err) {

      return { success: false, error: String(err) }

    }

  })

  let learnCancel: (() => void) | null = null

  ipcMain.handle('midi:learn', () => {
    return new Promise<{ note: number; channel: number } | null>((resolve) => {
      learnCancel = () => {
        midiManager.stopLearn()
        learnCancel = null
        resolve(null)
      }
      midiManager.startLearn((note, channel) => {
        midiManager.stopLearn()
        learnCancel = null
        resolve({ note, channel })
      })
    })
  })

  ipcMain.handle('midi:cancelLearn', () => {
    if (learnCancel) {
      learnCancel()
    } else {
      midiManager.stopLearn()
    }
  })



  ipcMain.handle('config:get', () => configManager.getConfig())



  ipcMain.handle('config:getFilePath', () => configManager.getFilePath())



  ipcMain.handle('config:validate', (_event, config: ShowConfig) =>

    configManager.validate(config)

  )



  ipcMain.handle('config:save', (_event, config: ShowConfig) => {

    const result = configManager.save(config)

    if (result.success) {

      notifyState()

    }

    return result

  })



  ipcMain.handle('config:reload', () => {

    const result = configManager.reload()

    if (result.success) {

      notifyState()

    }

    return result

  })



  ipcMain.handle('config:export', async () => configManager.exportConfig())



  ipcMain.handle('config:import', async () => {

    const result = await configManager.importConfig()

    if (result.success) {

      notifyState()

    }

    return result

  })

}


