import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import type { ShowConfig } from './types'
import { normalizeConfig, validateConfig } from './configValidator'
import type { Logger } from '../log/logger'

function bundledConfigPath(): string {
  return join(process.resourcesPath, 'config', 'show.default.json')
}

function devConfigPath(): string {
  return join(process.cwd(), 'config', 'show.default.json')
}

function userConfigPath(): string {
  return join(app.getPath('userData'), 'config', 'show.default.json')
}

/** Resolve writable config path (dev: project config/, packaged: userData). */
export function resolveConfigFilePath(): string {
  if (!app.isPackaged) {
    return devConfigPath()
  }

  const userPath = userConfigPath()
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
  const configPath = resolveConfigFilePath()
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
