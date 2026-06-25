import type {
  ShowConfig,
  ConfigValidationError,
  ConfigValidationResult,
  Target,
  Trigger,
  Action
} from './types'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

function push(errors: ConfigValidationError[], path: string, message: string): void {
  errors.push({ path, message })
}

function validateTarget(raw: unknown, index: number, errors: ConfigValidationError[]): Target | null {
  const path = `targets[${index}]`
  if (!isObject(raw)) {
    push(errors, path, 'must be an object')
    return null
  }

  if (!isNonEmptyString(raw.id)) {
    push(errors, `${path}.id`, 'required non-empty string')
  }
  if (!isNonEmptyString(raw.label)) {
    push(errors, `${path}.label`, 'required non-empty string')
  }
  if (raw.type !== 'osc' && raw.type !== 'udp' && raw.type !== 'midi') {
    push(errors, `${path}.type`, 'must be osc, udp, or midi')
    return null
  }

  if (raw.type === 'osc') {
    if (!isNonEmptyString(raw.host)) push(errors, `${path}.host`, 'required for osc target')
    if (!isNumber(raw.port)) push(errors, `${path}.port`, 'required number for osc target')
  }

  if (raw.type === 'udp') {
    if (!isNonEmptyString(raw.host)) push(errors, `${path}.host`, 'required for udp target')
    if (!isNumber(raw.port)) push(errors, `${path}.port`, 'required number for udp target')
    if (
      raw.encoding !== undefined &&
      raw.encoding !== 'utf-8' &&
      raw.encoding !== 'ascii' &&
      raw.encoding !== 'hex'
    ) {
      push(errors, `${path}.encoding`, 'must be utf-8, ascii, or hex')
    }
  }

  if (raw.type === 'midi') {
    if (!isNonEmptyString(raw.outputDevice)) {
      push(errors, `${path}.outputDevice`, 'required for midi target')
    }
    if (raw.channel !== undefined && (!isNumber(raw.channel) || raw.channel < 1 || raw.channel > 16)) {
      push(errors, `${path}.channel`, 'must be 1–16')
    }
  }

  return raw as unknown as Target
}

function validateTriggerInputs(
  inputs: unknown,
  triggerPath: string,
  errors: ConfigValidationError[]
): void {
  if (inputs === undefined) return
  if (!isObject(inputs)) {
    push(errors, `${triggerPath}.inputs`, 'must be an object')
    return
  }

  if (inputs.midi !== undefined) {
    if (!Array.isArray(inputs.midi)) {
      push(errors, `${triggerPath}.inputs.midi`, 'must be an array')
    } else {
      inputs.midi.forEach((entry, i) => {
        const p = `${triggerPath}.inputs.midi[${i}]`
        if (!isObject(entry)) {
          push(errors, p, 'must be an object')
          return
        }
        if (entry.type !== 'note' && entry.type !== 'cc') {
          push(errors, `${p}.type`, 'must be note or cc')
        }
        if (entry.type === 'note' && entry.note === undefined) {
          push(errors, `${p}.note`, 'required for note input')
        }
        if (entry.type === 'cc' && entry.cc === undefined) {
          push(errors, `${p}.cc`, 'required for cc input')
        }
        if (entry.channel !== undefined && (!isNumber(entry.channel) || entry.channel < 1 || entry.channel > 16)) {
          push(errors, `${p}.channel`, 'must be 1–16')
        }
      })
    }
  }

  if (inputs.screen !== undefined) {
    if (!Array.isArray(inputs.screen)) {
      push(errors, `${triggerPath}.inputs.screen`, 'must be an array')
    } else {
      inputs.screen.forEach((entry, i) => {
        const p = `${triggerPath}.inputs.screen[${i}]`
        if (!isObject(entry) || !isNonEmptyString(entry.buttonId)) {
          push(errors, `${p}.buttonId`, 'required non-empty string')
        }
      })
    }
  }

  if (inputs.keyboard !== undefined) {
    if (!Array.isArray(inputs.keyboard)) {
      push(errors, `${triggerPath}.inputs.keyboard`, 'must be an array')
    } else {
      inputs.keyboard.forEach((entry, i) => {
        const p = `${triggerPath}.inputs.keyboard[${i}]`
        if (!isObject(entry) || !isNonEmptyString(entry.key)) {
          push(errors, `${p}.key`, 'required non-empty string')
        }
      })
    }
  }
}

function validateAction(
  raw: unknown,
  index: number,
  triggerPath: string,
  targetIds: Set<string>,
  targetTypes: Map<string, string>,
  errors: ConfigValidationError[]
): Action | null {
  const path = `${triggerPath}.actions[${index}]`
  if (!isObject(raw)) {
    push(errors, path, 'must be an object')
    return null
  }

  if (!isNonEmptyString(raw.target)) {
    push(errors, `${path}.target`, 'required non-empty string')
    return null
  }

  if (!targetIds.has(raw.target)) {
    push(errors, `${path}.target`, `unknown target "${raw.target}"`)
  } else {
    const targetType = targetTypes.get(raw.target)
    if (targetType === 'osc') {
      if (!isNonEmptyString(raw.address)) {
        push(errors, `${path}.address`, 'required for osc action')
      }
    } else if (targetType === 'udp') {
      if (typeof raw.message !== 'string') {
        push(errors, `${path}.message`, 'required string for udp action')
      }
    } else if (targetType === 'midi') {
      const msg = raw.message
      if (msg !== undefined && msg !== 'noteOn' && msg !== 'noteOff' && msg !== 'cc') {
        push(errors, `${path}.message`, 'must be noteOn, noteOff, or cc')
      }
      if (raw.durationMs !== undefined && (!isNumber(raw.durationMs) || raw.durationMs < 0)) {
        push(errors, `${path}.durationMs`, 'must be a non-negative number')
      }
    }
  }

  return raw as unknown as Action
}

function validateTrigger(
  raw: unknown,
  index: number,
  targetIds: Set<string>,
  targetTypes: Map<string, string>,
  errors: ConfigValidationError[]
): Trigger | null {
  const path = `triggers[${index}]`
  if (!isObject(raw)) {
    push(errors, path, 'must be an object')
    return null
  }

  if (!isNonEmptyString(raw.triggerId)) {
    push(errors, `${path}.triggerId`, 'required non-empty string')
  }
  if (!isNonEmptyString(raw.label)) {
    push(errors, `${path}.label`, 'required non-empty string')
  }

  validateTriggerInputs(raw.inputs, path, errors)

  if (!Array.isArray(raw.actions)) {
    push(errors, `${path}.actions`, 'must be an array')
  } else if (raw.actions.length === 0) {
    push(errors, `${path}.actions`, 'must contain at least one action')
  } else {
    raw.actions.forEach((action, i) => {
      validateAction(action, i, path, targetIds, targetTypes, errors)
    })
  }

  return raw as unknown as Trigger
}

function validateSchedule(
  raw: unknown,
  index: number,
  triggerIds: Set<string>,
  errors: ConfigValidationError[]
): void {
  const path = `schedules[${index}]`
  if (!isObject(raw)) {
    push(errors, path, 'must be an object')
    return
  }

  if (!isNonEmptyString(raw.scheduleId)) push(errors, `${path}.scheduleId`, 'required')
  if (!isNonEmptyString(raw.label)) push(errors, `${path}.label`, 'required')
  if (typeof raw.enabled !== 'boolean') push(errors, `${path}.enabled`, 'must be boolean')
  if (raw.mode !== 'daily' && raw.mode !== 'oneShot') {
    push(errors, `${path}.mode`, 'must be daily or oneShot')
  }
  if (!/^\d{2}:\d{2}:\d{2}$/.test(String(raw.time ?? ''))) {
    push(errors, `${path}.time`, 'must be HH:mm:ss')
  }
  if (raw.mode === 'oneShot' && !/^\d{4}-\d{2}-\d{2}$/.test(String(raw.date ?? ''))) {
    push(errors, `${path}.date`, 'required YYYY-MM-DD for oneShot')
  }
  if (!isNonEmptyString(raw.triggerId)) {
    push(errors, `${path}.triggerId`, 'required non-empty string')
  } else if (!triggerIds.has(raw.triggerId)) {
    push(errors, `${path}.triggerId`, `unknown trigger "${raw.triggerId}"`)
  }
}

export function validateConfig(raw: unknown): ConfigValidationResult {
  const errors: ConfigValidationError[] = []

  if (!isObject(raw)) {
    return { valid: false, errors: [{ path: '', message: 'config root must be an object' }] }
  }

  if (!isNonEmptyString(raw.projectName)) {
    push(errors, 'projectName', 'required non-empty string')
  }

  if (raw.appMode !== 'live' && raw.appMode !== 'dryRun') {
    push(errors, 'appMode', 'must be live or dryRun')
  }

  if (raw.midiInput !== undefined) {
    if (!isObject(raw.midiInput)) {
      push(errors, 'midiInput', 'must be an object')
    } else {
      if (raw.midiInput.activeDevice !== undefined && typeof raw.midiInput.activeDevice !== 'string') {
        push(errors, 'midiInput.activeDevice', 'must be a string')
      }
      if (raw.midiInput.autoDetect !== undefined && typeof raw.midiInput.autoDetect !== 'string') {
        push(errors, 'midiInput.autoDetect', 'must be a string')
      }
      if (raw.midiInput.preferredDevices !== undefined) {
        if (!Array.isArray(raw.midiInput.preferredDevices)) {
          push(errors, 'midiInput.preferredDevices', 'must be an array of strings')
        } else if (!raw.midiInput.preferredDevices.every((d) => typeof d === 'string')) {
          push(errors, 'midiInput.preferredDevices', 'must be an array of strings')
        }
      }
    }
  } else {
    push(errors, 'midiInput', 'required object')
  }

  if (!Array.isArray(raw.targets)) {
    push(errors, 'targets', 'must be an array')
    return { valid: false, errors }
  }

  const targets: Target[] = []
  const targetIds = new Set<string>()
  const targetTypes = new Map<string, string>()

  raw.targets.forEach((t, i) => {
    const target = validateTarget(t, i, errors)
    if (target && isNonEmptyString((t as Record<string, unknown>).id)) {
      const id = (t as Record<string, unknown>).id as string
      if (targetIds.has(id)) {
        push(errors, `targets[${i}].id`, `duplicate target id "${id}"`)
      } else {
        targetIds.add(id)
        targetTypes.set(id, target.type)
        targets.push(target)
      }
    }
  })

  if (!Array.isArray(raw.triggers)) {
    push(errors, 'triggers', 'must be an array')
    return { valid: false, errors }
  }

  const triggerIds = new Set<string>()
  raw.triggers.forEach((t, i) => {
    const trigger = validateTrigger(t, i, targetIds, targetTypes, errors)
    if (trigger && isNonEmptyString((t as Record<string, unknown>).triggerId)) {
      const id = (t as Record<string, unknown>).triggerId as string
      if (triggerIds.has(id)) {
        push(errors, `triggers[${i}].triggerId`, `duplicate triggerId "${id}"`)
      } else {
        triggerIds.add(id)
      }
    }
  })

  if (raw.schedules !== undefined) {
    if (!Array.isArray(raw.schedules)) {
      push(errors, 'schedules', 'must be an array')
    } else {
      raw.schedules.forEach((s, i) => validateSchedule(s, i, triggerIds, errors))
    }
  }

  return { valid: errors.length === 0, errors }
}

export function normalizeConfig(raw: Record<string, unknown>): ShowConfig {
  const midiInputRaw = isObject(raw.midiInput) ? raw.midiInput : {}

  return {
    projectName: String(raw.projectName),
    appMode: raw.appMode === 'live' ? 'live' : 'dryRun',
    midiInput: {
      activeDevice:
        typeof midiInputRaw.activeDevice === 'string' ? midiInputRaw.activeDevice : undefined,
      autoDetect:
        typeof midiInputRaw.autoDetect === 'string' ? midiInputRaw.autoDetect : undefined,
      preferredDevices: Array.isArray(midiInputRaw.preferredDevices)
        ? (midiInputRaw.preferredDevices as string[])
        : []
    },
    targets: (raw.targets as Target[]) ?? [],
    triggers: (raw.triggers as Trigger[]) ?? [],
    schedules: (raw.schedules as ShowConfig['schedules']) ?? []
  }
}
