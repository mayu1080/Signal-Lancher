import { copyFileSync, existsSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs'
import type { ShowConfig } from './types'

function serializeConfig(config: ShowConfig): string {
  return JSON.stringify(config, null, 2) + '\n'
}

/**
 * Write config to the active show file.
 * Creates .bak from the previous file, then atomic replace via .tmp.
 */
export function writeConfigFile(configPath: string, config: ShowConfig): void {
  const bakPath = `${configPath}.bak`
  const tempPath = `${configPath}.tmp`
  const content = serializeConfig(config)

  writeFileSync(tempPath, content, 'utf-8')

  if (existsSync(configPath)) {
    copyFileSync(configPath, bakPath)
    unlinkSync(configPath)
  }

  renameSync(tempPath, configPath)
}

/**
 * Export config to an arbitrary path (no .bak on destination).
 */
export function exportConfigFile(exportPath: string, config: ShowConfig): void {
  writeFileSync(exportPath, serializeConfig(config), 'utf-8')
}

export function readConfigFile(configPath: string): unknown {
  const raw = readFileSync(configPath, 'utf-8')
  return JSON.parse(raw)
}
