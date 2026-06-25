import { dialog } from 'electron'
import type {
  ShowConfig,
  ConfigValidationResult,
  ConfigValidationError,
  ConfigSaveResult,
  ConfigFileResult
} from './types'
import { loadConfig, getConfigFilePath } from './configLoader'
import { normalizeConfig, validateConfig } from './configValidator'
import { writeConfigFile, exportConfigFile, readConfigFile } from './configWriter'
import type { Logger } from '../log/logger'
import type { MappingEngine } from '../mapping/mappingEngine'
import type { SignalRouter } from '../output/signalRouter'
import type { ScheduleManager } from '../schedule/scheduleManager'
import type { MidiManager } from '../input/midiManager'

export interface ConfigManagerDeps {
  mappingEngine: MappingEngine
  signalRouter: SignalRouter
  scheduleManager: ScheduleManager
  midiManager: MidiManager
  notifyState: () => void
}

export class ConfigManager {
  private config: ShowConfig
  private readonly configPath: string

  constructor(
    private logger: Logger,
    initialConfig: ShowConfig,
    private deps: ConfigManagerDeps
  ) {
    this.config = initialConfig
    this.configPath = getConfigFilePath()
  }

  getConfig(): ShowConfig {
    return this.config
  }

  getFilePath(): string {
    return this.configPath
  }

  validate(config: ShowConfig): ConfigValidationResult {
    const validation = validateConfig(config)
    this.logValidation(validation, 'validate')
    return validation
  }

  save(config: ShowConfig): ConfigSaveResult {
    const validation = validateConfig(config)
    this.logValidation(validation, 'save')

    if (!validation.valid) {
      return { success: false, validation }
    }

    try {
      const normalized = normalizeConfig(config as unknown as Record<string, unknown>)
      writeConfigFile(this.configPath, normalized)
      this.applyRuntime(normalized)
      this.logger.log('CONFIG', `Saved: ${this.configPath}`)
      return { success: true, config: normalized }
    } catch (err) {
      const error = String(err)
      this.logger.log('ERROR', `Config save failed: ${error}`)
      return { success: false, error }
    }
  }

  /** Persist and open a MIDI input without full applyRuntime (avoids double open / mode reset). */
  setActiveMidiInput(deviceName: string): ConfigSaveResult {
    const inputs = this.deps.midiManager.listInputs()
    if (!inputs.includes(deviceName)) {
      return { success: false, error: `MIDI input not found: ${deviceName}` }
    }

    const updated: ShowConfig = {
      ...this.config,
      midiInput: {
        ...this.config.midiInput,
        activeDevice: deviceName
      }
    }

    const validation = validateConfig(updated)
    this.logValidation(validation, 'midi-select')
    if (!validation.valid) {
      return { success: false, validation }
    }

    try {
      const normalized = normalizeConfig(updated as unknown as Record<string, unknown>)
      writeConfigFile(this.configPath, normalized)
      this.config = normalized

      if (this.deps.midiManager.getActiveInputName() !== deviceName) {
        const opened = this.deps.midiManager.openInput(deviceName)
        if (!opened) {
          return { success: false, error: `Failed to open MIDI input: ${deviceName}` }
        }
      }

      this.logger.log('CONFIG', `MIDI input selected: ${deviceName}`)
      this.deps.notifyState()
      return { success: true, config: normalized }
    } catch (err) {
      const error = String(err)
      this.logger.log('ERROR', `MIDI input select failed: ${error}`)
      return { success: false, error }
    }
  }

  reload(): ConfigSaveResult {
    try {
      const config = loadConfig(this.logger)
      this.applyRuntime(config)
      this.logger.log('CONFIG', `Reloaded: ${this.configPath}`)
      return { success: true, config }
    } catch (err) {
      const error = String(err)
      this.logger.log('ERROR', `Config reload failed: ${error}`)
      return { success: false, error }
    }
  }

  async exportConfig(): Promise<ConfigFileResult> {
    const result = await dialog.showSaveDialog({
      title: 'Export Show Config',
      defaultPath: `show-${this.config.projectName.replace(/\s+/g, '-')}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    try {
      exportConfigFile(result.filePath, this.config)
      this.logger.log('CONFIG', `Exported: ${result.filePath}`)
      return { success: true, path: result.filePath }
    } catch (err) {
      const error = String(err)
      this.logger.log('ERROR', `Config export failed: ${error}`)
      return { success: false, error }
    }
  }

  async importConfig(): Promise<ConfigFileResult> {
    const result = await dialog.showOpenDialog({
      title: 'Import Show Config',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths.length) {
      return { success: false, cancelled: true }
    }

    const importPath = result.filePaths[0]

    try {
      const parsed = readConfigFile(importPath)
      const validation = validateConfig(parsed)
      this.logValidation(validation, 'import')

      if (!validation.valid) {
        return { success: false, validation, error: 'Validation failed' }
      }

      const normalized = normalizeConfig(parsed as Record<string, unknown>)
      writeConfigFile(this.configPath, normalized)
      this.applyRuntime(normalized)
      this.logger.log('CONFIG', `Imported: ${importPath} → ${this.configPath}`)
      return { success: true, path: importPath, config: normalized }
    } catch (err) {
      const error = String(err)
      this.logger.log('ERROR', `Config import failed: ${error}`)
      return { success: false, error }
    }
  }

  private applyRuntime(config: ShowConfig): void {
    this.config = config
    this.deps.mappingEngine.setConfig(config)
    this.deps.mappingEngine.setMode(config.appMode)
    this.deps.signalRouter.setConfig(config)
    this.deps.scheduleManager.loadSchedules(config)

    const currentMidi = this.deps.midiManager.getActiveInputName()
    const wantedMidi = config.midiInput.activeDevice ?? null
    if (wantedMidi && currentMidi === wantedMidi) {
      // already on the saved device — skip close/reopen (can hang on Windows)
    } else if (config.midiInput.activeDevice || config.midiInput.autoDetect) {
      this.deps.midiManager.connectFromConfig(config.midiInput)
    }

    this.deps.notifyState()
  }

  private logValidation(validation: ConfigValidationResult, context: string): void {
    for (const error of validation.errors) {
      this.logValidationError(error, context)
    }
    if (validation.valid) {
      this.logger.log('CONFIG', `Validation OK (${context})`)
    }
  }

  private logValidationError(error: ConfigValidationError, context: string): void {
    const msg = `[${error.path}] ${error.message}`
    this.logger.log('CONFIG', `Validation error (${context}): ${msg}`)
    if (error.path.includes('.target') || error.message.includes('unknown target')) {
      this.logger.log('ERROR', `Invalid target reference (${context}): ${msg}`)
    }
    if (error.path.includes('triggerId') || error.message.includes('unknown trigger')) {
      this.logger.log('ERROR', `Invalid trigger reference (${context}): ${msg}`)
    }
  }
}
