import type { Plugin } from 'vite'
import pluginExternal from 'vite-plugin-external'
import type { WindowExternalConfig } from './types.js'
import { transformConfig } from './transform.js'

/**
 * Vite plugin that extends vite-plugin-external to support array-based global variable paths
 * @param config Configuration object mapping package names to global variable paths
 * @returns Vite plugin instance
 */
export default function windowExternal(config: WindowExternalConfig): Plugin {
  // Transform the configuration to convert arrays to dot-notation strings
  const transformedConfig = transformConfig(config)

  // Delegate to vite-plugin-external with the transformed configuration
  return pluginExternal(transformedConfig)
}

// Export types for consumers
export type { WindowExternalConfig, ExternalValue } from './types.js'
