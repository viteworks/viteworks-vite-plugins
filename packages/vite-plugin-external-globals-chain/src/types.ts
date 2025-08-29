/**
 * Configuration value for external dependencies
 * Can be either a string (direct global variable path) or an array of strings (path segments)
 */
export type ExternalValue = string[] | string

/**
 * Configuration interface for the window external plugin
 * Maps package names to their global variable paths
 */
export interface WindowExternalConfig {
  [packageName: string]: ExternalValue;
}

/**
 * Transformed configuration after processing arrays into dot-notation strings
 */
export interface TransformedConfig {
  [packageName: string]: string;
}
