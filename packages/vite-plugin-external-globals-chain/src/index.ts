import MagicString from 'magic-string'
import { createFilter } from '@rollup/pluginutils'
import { PluginContext, type InputOptions } from 'rollup'
import type { Plugin } from 'vite'
import type { FilterPattern } from '@rollup/pluginutils'
import type { Program } from 'estree'
import importToGlobals from './utils/import-to-globals.js'
import { transformConfig } from './transform.js'
import type { WindowExternalConfig, ExternalValue } from './types'

export interface PluginOptions {
  include?: FilterPattern
  exclude?: FilterPattern
  dynamicWrapper?: (moduleId: string) => string
  constBindings?: boolean
}

type GetNameFunction = (name: string) => string | undefined

const defaultDynamicWrapper = (moduleId: string): string => `Promise.resolve(${moduleId})`

function isVirtualModule(id: string): boolean {
  return id.startsWith('\0')
}

function createGetNameFunction(globals: WindowExternalConfig): GetNameFunction {
  const transformedGlobals = transformConfig(globals)
  return function getName(moduleName: string): string | undefined {
    if (Object.prototype.hasOwnProperty.call(transformedGlobals, moduleName)) {
      return transformedGlobals[moduleName]
    }
    return undefined
  }
}

function getDebugFunction(context: PluginContext) {
  return (err: Error, message: string): void => {
    if ('debug' in context && typeof context.debug === 'function') {
      context.debug({
        message,
        cause: err,
      })
    } else if (context.warn) {
      context.warn(message)
    }
  }
}

/**
 * Vite plugin that extends external functionality to support array-based global variable paths
 * @param globals Configuration object mapping package names to global variable paths
 * @param options Plugin options
 * @returns Vite plugin instance
 */
export default function windowExternal(
  globals: WindowExternalConfig,
  options: PluginOptions = {},
): Plugin {
  if (!globals) {
    throw new TypeError('Missing mandatory option \'globals\'')
  }

  const {
    include,
    exclude,
    dynamicWrapper = defaultDynamicWrapper,
    constBindings = false,
  } = options

  if (typeof dynamicWrapper !== 'function') {
    throw new TypeError(
      `Unexpected type of 'dynamicWrapper', got '${typeof dynamicWrapper}'`,
    )
  }

  const getName = createGetNameFunction(globals)
  const filter = createFilter(include, exclude)

  async function resolveId(
    importee: string,
    _: string | undefined,
    resolveOptions: { isEntry?: boolean },
  ): Promise<false | null> {
    if (isVirtualModule(importee) || resolveOptions.isEntry) return null
    const globalName = getName(importee)
    return globalName ? false : null
  }

  return {
    name: 'vite-plugin-external-globals-chain',

    async options(rawOptions: InputOptions) {
      const plugins = Array.isArray(rawOptions.plugins)
        ? [...rawOptions.plugins]
        : rawOptions.plugins
          ? [rawOptions.plugins]
          : []

      plugins.unshift({
        name: 'vite-plugin-external-globals-chain--resolver',
        resolveId,
      })

      return { ...rawOptions, plugins }
    },

    async transform(code: string, fileId: string) {
      if (!isVirtualModule(fileId) && !filter(fileId)) {
        return undefined
      }

      // Quick check if any of our external modules are imported
      const transformedGlobals = transformConfig(globals)
      const hasExternalImports = Object.keys(transformedGlobals).some(
        (moduleName) => code.includes(moduleName),
      )

      if (!hasExternalImports) {
        return undefined
      }

      let ast: Program
      try {
        ast = this.parse(code) as Program
      } catch(err) {
        getDebugFunction(this)(err as Error, `Failed to parse code, skip ${fileId}`)
        return undefined
      }

      const magicString = new MagicString(code)
      const isTouched = await importToGlobals({
        ast,
        code: magicString,
        getName,
        getDynamicWrapper: dynamicWrapper,
        constBindings,
      })

      return isTouched
        ? {
          code: magicString.toString(),
          map: magicString.generateMap(),
        }
        : undefined
    },
  }
}

// Export types for consumers
export type { WindowExternalConfig, ExternalValue }
