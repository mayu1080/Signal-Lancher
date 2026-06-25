import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppState,
  SendResult,
  ShowConfig,
  ConfigValidationResult,
  ConfigSaveResult,
  ConfigFileResult
} from './config/types'

export interface SignalLauncherAPI {
  getState: () => Promise<AppState>
  getCurrentTime: () => Promise<string>
  setMode: (mode: 'live' | 'dryRun') => Promise<AppState>
  fireTrigger: (triggerId: string) => Promise<void>
  testTarget: (targetId: string) => Promise<SendResult>
  testFireSchedule: (scheduleId: string) => Promise<void>
  refreshMidi: () => Promise<AppState>
  selectMidiInput: (deviceName: string) => Promise<ConfigSaveResult>
  midiLearn: () => Promise<{ note: number; channel: number } | null>
  midiCancelLearn: () => Promise<void>
  getConfig: () => Promise<ShowConfig>
  getConfigFilePath: () => Promise<string>
  validateConfig: (config: ShowConfig) => Promise<ConfigValidationResult>
  saveConfig: (config: ShowConfig) => Promise<ConfigSaveResult>
  reloadConfig: () => Promise<ConfigSaveResult>
  exportConfig: () => Promise<ConfigFileResult>
  importConfig: () => Promise<ConfigFileResult>
  onStateUpdate: (callback: (state: AppState) => void) => () => void
  onLogEntry: (callback: (entry: import('./config/types').LogEntry) => void) => () => void
}

const api: SignalLauncherAPI = {
  getState: () => ipcRenderer.invoke('app:getState'),
  getCurrentTime: () => ipcRenderer.invoke('app:getCurrentTime'),
  setMode: (mode) => ipcRenderer.invoke('app:setMode', mode),
  fireTrigger: (triggerId) => ipcRenderer.invoke('trigger:fire', triggerId),
  testTarget: (targetId) => ipcRenderer.invoke('target:test', targetId),
  testFireSchedule: (scheduleId) => ipcRenderer.invoke('schedule:testFire', scheduleId),
  refreshMidi: () => ipcRenderer.invoke('midi:refresh'),
  selectMidiInput: (deviceName) => ipcRenderer.invoke('midi:selectInput', deviceName),
  midiLearn: () => ipcRenderer.invoke('midi:learn'),
  midiCancelLearn: () => ipcRenderer.invoke('midi:cancelLearn'),
  getConfig: () => ipcRenderer.invoke('config:get'),
  getConfigFilePath: () => ipcRenderer.invoke('config:getFilePath'),
  validateConfig: (config) => ipcRenderer.invoke('config:validate', config),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  reloadConfig: () => ipcRenderer.invoke('config:reload'),
  exportConfig: () => ipcRenderer.invoke('config:export'),
  importConfig: () => ipcRenderer.invoke('config:import'),
  onStateUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AppState) => callback(state)
    ipcRenderer.on('app:state', handler)
    return () => ipcRenderer.removeListener('app:state', handler)
  },
  onLogEntry: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, entry: import('./config/types').LogEntry) =>
      callback(entry)
    ipcRenderer.on('log:entry', handler)
    return () => ipcRenderer.removeListener('log:entry', handler)
  }
}

contextBridge.exposeInMainWorld('signalLauncher', api)

declare global {
  interface Window {
    signalLauncher: SignalLauncherAPI
  }
}
