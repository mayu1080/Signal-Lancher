import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync
} from 'fs'
import { dirname, join } from 'path'
import { app } from 'electron'
import type { ShowConfig } from './types'
import { normalizeConfig, validateConfig } from './configValidator'
import type { Logger } from '../log/logger'

/** Place next to the portable .exe — auto-loaded on startup when newer than saved config. */
export const PORTABLE_SHOW_FILENAME = 'show.json'

function bundledConfigPath(): string {
  return join(process.resourcesPath, 'config', 'show.default.json')
}

function devConfigPath(): string {
  return join(process.cwd(), 'config', 'show.default.json')
}

function userConfigPath(): string {
  return join(app.getPath('userData'), 'config', 'show.default.json')
}

/** Path to show.json beside the running executable (packaged apps only). */
export function getPortableSidecarPath(): string | null {
  if (!app.isPackaged) {
    return null
  }

  const sidecar = join(dirname(process.execPath), PORTABLE_SHOW_FILENAME)
  return existsSync(sidecar) ? sidecar : null
}

function trySyncPortableSidecar(userPath: string, logger?: Logger): void {
  const sidecar = getPortableSidecarPath()
  if (!sidecar) {
    return
  }

  const userExists = existsSync(userPath)
  const shouldSync =
    !userExists ||
    statSync(sidecar).mtimeMs > statSync(userPath).mtimeMs

  if (!shouldSync) {
    return
  }

  try {
    const raw = readFileSync(sidecar, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    const validation = validateConfig(parsed)

    if (!validation.valid) {
      const first = validation.errors[0]
      const detail = first ? `[${first.path}] ${first.message}` : 'unknown error'
      logger?.log('ERROR', `Portable ${PORTABLE_SHOW_FILENAME} invalid, skipping: ${detail}`)
      return
    }

    mkdirSync(dirname(userPath), { recursive: true })
    copyFileSync(sidecar, userPath)

    if (userExists) {
      logger?.log('CONFIG', `Updated config from portable ${PORTABLE_SHOW_FILENAME}: ${sidecar}`)
    } else {
      logger?.log('CONFIG', `Loaded portable ${PORTABLE_SHOW_FILENAME}: ${sidecar}`)
    }
  } catch (err) {
    logger?.log('ERROR', `Portable ${PORTABLE_SHOW_FILENAME} unreadable (${sidecar}): ${String(err)}`)
  }
}

/** Resolve writable config path (dev: project config/, packaged: userData). */
export function resolveConfigFilePath(logger?: Logger): string {
  if (!app.isPackaged) {
    return devConfigPath()
  }

  const userPath = userConfigPath()
  trySyncPortableSidecar(userPath, logger)

  if (existsSync(userPath)) {
    return userPath
  }

  const userDir = join(app.getPath('userData'), 'config')
  mkdirSync(userDir, { recursive: true })

  const bundled = bundledConfigPath()
  if (existsSync(bundled)) {
    copyFileSync(bundled, userPath)
    return userPath
  }

  throw new Error(`config: bundled default not found at ${bundled}`)
}

export function loadConfig(logger?: Logger): ShowConfig {
  const configPath = resolveConfigFilePath(logger)
  let parsed: unknown

  try {
    const raw = readFileSync(configPath, 'utf-8')
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new Error(`config: failed to read or parse ${configPath}: ${String(err)}`)
  }

  const validation = validateConfig(parsed)

  if (!validation.valid) {
    for (const error of validation.errors) {
      const msg = `[${error.path}] ${error.message}`
      if (logger) {
        logger.log('CONFIG', `Validation error: ${msg}`)
        if (error.path.includes('.target') || error.message.includes('unknown target')) {
          logger.log('ERROR', `Invalid target reference: ${msg}`)
        }
      }
    }

    const fatal = validation.errors.filter(
      (e) =>
        e.path === '' ||
        e.path === 'projectName' ||
        e.path === 'appMode' ||
        e.path === 'targets' ||
        e.path === 'triggers' ||
        e.path === 'midiInput'
    )
    if (fatal.length > 0) {
      throw new Error(
        `config: validation failed with ${validation.errors.length} error(s). First: [${fatal[0].path}] ${fatal[0].message}`
      )
    }
  }

  const config = normalizeConfig(parsed as Record<string, unknown>)

  if (logger && validation.valid) {
    logger.log(
      'CONFIG',
      `Validated config: ${config.targets.length} targets, ${config.triggers.length} triggers, ${config.schedules.length} schedules`
    )
  }

  return config
}

export function getConfigFilePath(): string {
  return resolveConfigFilePath()
}
