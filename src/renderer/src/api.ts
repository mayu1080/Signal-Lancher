import type {
  AppState,
  SendResult,
  ShowConfig,
  ConfigValidationResult,
  ConfigSaveResult,
  ConfigFileResult
} from './types'

export const api = {
  getState: (): Promise<AppState> => window.signalLauncher.getState(),
  getCurrentTime: (): Promise<string> => window.signalLauncher.getCurrentTime(),
  setMode: (mode: 'live' | 'dryRun'): Promise<AppState> => window.signalLauncher.setMode(mode),
  fireTrigger: (triggerId: string): Promise<void> => window.signalLauncher.fireTrigger(triggerId),
  testTarget: (targetId: string): Promise<SendResult> => window.signalLauncher.testTarget(targetId),
  testFireSchedule: (scheduleId: string): Promise<void> =>
    window.signalLauncher.testFireSchedule(scheduleId),
  refreshMidi: (): Promise<AppState> => window.signalLauncher.refreshMidi(),
  selectMidiInput: (deviceName: string): Promise<ConfigSaveResult> =>
    window.signalLauncher.selectMidiInput(deviceName),
  midiLearn: (): Promise<{ note: number; channel: number } | null> =>
    window.signalLauncher.midiLearn(),
  midiCancelLearn: (): Promise<void> => window.signalLauncher.midiCancelLearn(),
  getConfig: (): Promise<ShowConfig> => window.signalLauncher.getConfig(),
  getConfigFilePath: (): Promise<string> => window.signalLauncher.getConfigFilePath(),
  validateConfig: (config: ShowConfig): Promise<ConfigValidationResult> =>
    window.signalLauncher.validateConfig(config),
  saveConfig: (config: ShowConfig): Promise<ConfigSaveResult> =>
    window.signalLauncher.saveConfig(config),
  reloadConfig: (): Promise<ConfigSaveResult> => window.signalLauncher.reloadConfig(),
  exportConfig: (): Promise<ConfigFileResult> => window.signalLauncher.exportConfig(),
  importConfig: (): Promise<ConfigFileResult> => window.signalLauncher.importConfig(),
  onStateUpdate: (callback: (state: AppState) => void) => window.signalLauncher.onStateUpdate(callback),
  onLogEntry: (callback: (entry: import('./types').LogEntry) => void) =>
    window.signalLauncher.onLogEntry(callback)
}
