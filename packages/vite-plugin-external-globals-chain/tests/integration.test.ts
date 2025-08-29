import { describe, it, expect, vi } from 'vitest'
import type { Plugin } from 'vite'
import windowExternal from '../src/index'

// Mock vite-plugin-external
vi.mock('vite-plugin-external', () => ({
  default: vi.fn((config) => ({
    name: 'vite:external',
    config: config,
    // Mock plugin structure that vite-plugin-external would return
    configResolved: vi.fn(),
    buildStart: vi.fn(),
    resolveId: vi.fn(),
  })),
}))

import pluginExternal from 'vite-plugin-external'

describe('Integration Tests - vite-plugin-external', () => {
  describe('Plugin Integration', () => {
    it('should call vite-plugin-external with transformed configuration', () => {
      const config = {
        react: ['ralWindows', 'React'],
        'react-dom': ['ralWindows', 'ReactDOM'],
        jquery: 'window.jQuery',
      }

      const plugin = windowExternal(config)

      // Verify that vite-plugin-external was called with the transformed config
      expect(pluginExternal).toHaveBeenCalledWith({
        react: 'window.ralWindows.React',
        'react-dom': 'window.ralWindows.ReactDOM',
        jquery: 'window.jQuery',
      })

      // Verify the plugin is returned
      expect(plugin).toBeDefined()
    })

    it('should return a valid Vite plugin object', () => {
      const config = { react: ['global', 'React'] }
      const plugin = windowExternal(config)

      // Verify the plugin has the expected structure
      expect(plugin).toBeDefined()
      expect(plugin).toHaveProperty('name')
      expect(plugin.name).toBe('vite:external')
    })

    it('should pass through empty configuration correctly', () => {
      const config = {}
      const plugin = windowExternal(config)

      expect(pluginExternal).toHaveBeenCalledWith({})
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vite:external')
    })

    it('should handle string-only configuration without transformation', () => {
      const config = {
        jquery: 'window.jQuery',
        lodash: 'window._',
        moment: 'window.moment',
      }

      const plugin = windowExternal(config)

      // Should pass the configuration unchanged since all values are strings
      expect(pluginExternal).toHaveBeenCalledWith(config)
      expect(plugin).toBeDefined()
    })

    it('should handle array-only configuration with proper transformation', () => {
      const config = {
        react: ['MyApp', 'React'],
        vue: ['MyApp', 'Vue'],
        angular: ['MyApp', 'ng', 'core'],
      }

      const plugin = windowExternal(config)

      expect(pluginExternal).toHaveBeenCalledWith({
        react: 'window.MyApp.React',
        vue: 'window.MyApp.Vue',
        angular: 'window.MyApp.ng.core',
      })
      expect(plugin).toBeDefined()
    })

    it('should propagate errors from configuration transformation', () => {
      // Clear previous mock calls
      vi.clearAllMocks()

      const invalidConfig = {
        react: [], // Empty array should cause error
      }

      expect(() => windowExternal(invalidConfig)).toThrow(
        'External value array for "react" cannot be empty',
      )

      // vite-plugin-external should not be called when transformation fails
      expect(pluginExternal).not.toHaveBeenCalled()
    })

    it('should propagate type errors from configuration transformation', () => {
      // Clear previous mock calls
      vi.clearAllMocks()

      const invalidConfig = {
        react: ['React', 123 as any], // Non-string element should cause error
      }

      expect(() => windowExternal(invalidConfig)).toThrow(
        'All array elements for "react" must be strings',
      )

      // vite-plugin-external should not be called when transformation fails
      expect(pluginExternal).not.toHaveBeenCalled()
    })
  })

  describe('Plugin Return Value Correctness', () => {
    it('should return the exact plugin object from vite-plugin-external', () => {
      const mockPlugin: Plugin = {
        name: 'test-plugin',
        configResolved: vi.fn(),
        buildStart: vi.fn(),
      };

      // Mock vite-plugin-external to return our test plugin
      (pluginExternal as any).mockReturnValueOnce(mockPlugin)

      const config = { react: ['global', 'React'] }
      const result = windowExternal(config)

      // Should return exactly what vite-plugin-external returns
      expect(result).toBe(mockPlugin)
      expect(result.name).toBe('test-plugin')
    })

    it('should preserve all plugin properties and methods', () => {
      const mockPlugin: Plugin = {
        name: 'vite:external',
        configResolved: vi.fn(),
        buildStart: vi.fn(),
        resolveId: vi.fn(),
        load: vi.fn(),
        transform: vi.fn(),
        generateBundle: vi.fn(),
        writeBundle: vi.fn(),
      };

      (pluginExternal as any).mockReturnValueOnce(mockPlugin)

      const config = { lodash: ['vendor', 'lodash'] }
      const result = windowExternal(config)

      // Verify all properties are preserved
      expect(result).toBe(mockPlugin)
      expect(result.configResolved).toBe(mockPlugin.configResolved)
      expect(result.buildStart).toBe(mockPlugin.buildStart)
      expect(result.resolveId).toBe(mockPlugin.resolveId)
      expect(result.load).toBe(mockPlugin.load)
      expect(result.transform).toBe(mockPlugin.transform)
      expect(result.generateBundle).toBe(mockPlugin.generateBundle)
      expect(result.writeBundle).toBe(mockPlugin.writeBundle)
    })
  })

  describe('Configuration Delegation', () => {
    it('should delegate complex nested array configurations correctly', () => {
      const config = {
        'my-lib': ['window', 'vendor', 'myLib', 'core'],
        'another-lib': ['global', 'libs', 'another'],
        'simple-lib': 'window.SimpleLib',
      }

      windowExternal(config)

      expect(pluginExternal).toHaveBeenCalledWith({
        'my-lib': 'window.window.vendor.myLib.core',
        'another-lib': 'window.global.libs.another',
        'simple-lib': 'window.SimpleLib',
      })
    })

    it('should handle package names with special characters', () => {
      const config = {
        '@scope/package': ['vendor', 'scopedPackage'],
        'package-with-dashes': ['global', 'packageWithDashes'],
        'package_with_underscores': ['window', 'packageWithUnderscores'],
      }

      windowExternal(config)

      expect(pluginExternal).toHaveBeenCalledWith({
        '@scope/package': 'window.vendor.scopedPackage',
        'package-with-dashes': 'window.global.packageWithDashes',
        'package_with_underscores': 'window.window.packageWithUnderscores',
      })
    })
  })
})
