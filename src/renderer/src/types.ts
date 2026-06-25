export type AppMode = 'live' | 'dryRun'
export type TargetType = 'osc' | 'udp' | 'midi'
export type UdpEncoding = 'utf-8' | 'ascii' | 'hex'

export interface TriggerMidiInput {
  type: 'note' | 'cc'
  note?: number
  cc?: number
  channel?: number
}

export interface TriggerScreenInput {
  buttonId: string
}

export interface TriggerKeyboardInput {
  key: string
}

export interface TriggerInputs {
  midi?: TriggerMidiInput[]
  screen?: TriggerScreenInput[]
  keyboard?: TriggerKeyboardInput[]
}

export interface Trigger {
  triggerId: string
  label: string
  group?: string
  color?: string
  inputs?: TriggerInputs
  actions: Action[]
}

export interface Action {
  target: string
  address?: string
  args?: unknown[]
  message?: string
  note?: number
  velocity?: number
  controller?: number
  value?: number
  durationMs?: number
}

export interface TargetBase {
  id: string
  label: string
  type: TargetType
}

export interface OscTarget extends TargetBase {
  type: 'osc'
  host: string
  port: number
}

export interface UdpTarget extends TargetBase {
  type: 'udp'
  host: string
  port: number
  encoding?: UdpEncoding
}

export interface MidiTarget extends TargetBase {
  type: 'midi'
  outputDevice: string
  channel?: number
}

export type Target = OscTarget | UdpTarget | MidiTarget

export type LogCategory =
  | 'INFO'
  | 'MIDI'
  | 'TRIGGER'
  | 'OSC'
  | 'UDP'
  | 'MIDI_OUT'
  | 'DRY_RUN'
  | 'ERROR'
  | 'CONFIG'
  | 'SCHEDULE'
  | 'SCHEDULE_FIRE'
  | 'SCHEDULE_SKIP'
  | 'SCHEDULE_ERROR'

export interface LogEntry {
  timestamp: string
  category: LogCategory
  message: string
}

export interface SendResult {
  targetId: string
  targetLabel: string
  type: TargetType
  success: boolean
  detail: string
  dryRun: boolean
}

export interface TriggerResult {
  triggerId: string
  triggerLabel: string
  source: string
  dryRun: boolean
  results: SendResult[]
}

export interface ScheduleState {
  scheduleId: string
  label: string
  enabled: boolean
  mode: 'daily' | 'oneShot'
  date?: string
  time: string
  triggerId: string
  triggerLabel: string
  lastFired: string | null
  nextFire: string | null
}

export interface AppState {
  projectName: string
  mode: AppMode
  midiInputs: string[]
  midiOutputs: string[]
  autoDetectedInput: string | null
  targets: Target[]
  triggers: Trigger[]
  schedules: ScheduleState[]
  lastTrigger: TriggerResult | null
  logs: LogEntry[]
}

export interface MidiInputConfig {
  activeDevice?: string
  autoDetect?: string
  preferredDevices?: string[]
}

export interface ShowConfig {
  projectName: string
  appMode: AppMode
  midiInput: MidiInputConfig
  targets: Target[]
  triggers: Trigger[]
  schedules: Schedule[]
}

export interface Schedule {
  scheduleId: string
  enabled: boolean
  label: string
  mode: 'daily' | 'oneShot'
  time: string
  date?: string
  triggerId: string
}

export interface ConfigValidationError {
  path: string
  message: string
}

export interface ConfigValidationResult {
  valid: boolean
  errors: ConfigValidationError[]
}

export interface ConfigSaveResult {
  success: boolean
  config?: ShowConfig
  validation?: ConfigValidationResult
  error?: string
}

export interface ConfigFileResult {
  success: boolean
  path?: string
  cancelled?: boolean
  config?: ShowConfig
  validation?: ConfigValidationResult
  error?: string
}
