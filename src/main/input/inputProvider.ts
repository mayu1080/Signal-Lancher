import type { InputSource } from '../config/types'

/**
 * Future input providers (e.g. Stream Deck) implement this interface
 * and route events through InputRouter → MappingEngine.
 */
export interface InputProvider {
  readonly name: string
  start(): void
  stop(): void
}

export type TriggerHandler = (triggerId: string, source: InputSource) => void
