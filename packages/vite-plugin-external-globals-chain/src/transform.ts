import type { WindowExternalConfig, TransformedConfig } from './types.js'

/**
 * Transforms the window external configuration by converting arrays to dot-notation strings
 * @param config The input configuration with potential array values
 * @returns Transformed configuration with all values as strings
 * @throws Error when array is empty
 * @throws TypeError when array contains non-string elements
 */
export function transformConfig(config: WindowExternalConfig): TransformedConfig {
  const result: TransformedConfig = {}

  for (const [packageName, value] of Object.entries(config)) {
    if (Array.isArray(value)) {
      // Handle array values - convert to window.x.y.z format
      if (value.length === 0) {
        throw new Error(`External value array for "${packageName}" cannot be empty`)
      }

      // Validate all elements are strings
      if (!value.every(item => typeof item === 'string')) {
        throw new TypeError(`All array elements for "${packageName}" must be strings`)
      }

      // Transform array to window.x.y.z format
      result[packageName] = `window.${value.join('.')}`
    } else {
      // Handle string values - pass through unchanged
      result[packageName] = value
    }
  }

  return result
}
