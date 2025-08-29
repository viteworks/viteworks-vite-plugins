import { describe, it, expect } from 'vitest'
import windowExternal from '../src/index'

describe('Integration Tests - Plugin Functionality', () => {
  describe('Plugin Creation', () => {
    it('should create a valid Vite plugin with correct name', () => {
      const config = {
        react: ['ralWindows', 'React'],
        'react-dom': ['ralWindows', 'ReactDOM'],
        jquery: 'window.jQuery',
      }

      const plugin = windowExternal(config)

      // Verify the plugin has the expected structure
      expect(plugin).toBeDefined()
      expect(plugin).toHaveProperty('name')
      expect(plugin.name).toBe('vite-plugin-external-globals-chain')
      expect(plugin).toHaveProperty('transform')
      expect(plugin).toHaveProperty('options')
    })

    it('should handle empty configuration correctly', () => {
      const config = {}
      const plugin = windowExternal(config)

      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vite-plugin-external-globals-chain')
    })

    it('should handle string-only configuration', () => {
      const config = {
        jquery: 'window.jQuery',
        lodash: 'window._',
        moment: 'window.moment',
      }

      const plugin = windowExternal(config)
      expect(plugin).toBeDefined()
    })

    it('should handle array-only configuration', () => {
      const config = {
        react: ['MyApp', 'React'],
        vue: ['MyApp', 'Vue'],
        angular: ['MyApp', 'ng', 'core'],
      }

      const plugin = windowExternal(config)
      expect(plugin).toBeDefined()
    })

    it('should throw error for empty array configuration', () => {
      const invalidConfig = {
        react: [], // Empty array should cause error
      }

      expect(() => windowExternal(invalidConfig)).toThrow(
        'External value array for "react" cannot be empty',
      )
    })

    it('should throw error for invalid array elements', () => {
      const invalidConfig = {
        react: ['React', 123 as any], // Non-string element should cause error
      }

      expect(() => windowExternal(invalidConfig)).toThrow(
        'All array elements for "react" must be strings',
      )
    })

    it('should throw error for missing globals configuration', () => {
      expect(() => windowExternal(null as any)).toThrow(
        'Missing mandatory option \'globals\'',
      )
    })

    it('should throw error for invalid dynamicWrapper type', () => {
      const config = { react: ['global', 'React'] }

      expect(() =>
        windowExternal(config, { dynamicWrapper: 'invalid' as any }),
      ).toThrow(
        'Unexpected type of \'dynamicWrapper\', got \'string\'',
      )
    })
  })

  describe('Plugin Options', () => {
    it('should accept and handle plugin options', () => {
      const config = { react: ['global', 'React'] }
      const options = {
        include: '**/*.js',
        exclude: 'node_modules/**',
        constBindings: true,
        dynamicWrapper: (id: string) => `customWrapper(${id})`,
      }

      const plugin = windowExternal(config, options)
      expect(plugin).toBeDefined()
      expect(plugin.name).toBe('vite-plugin-external-globals-chain')
    })

    it('should work with default options', () => {
      const config = { react: ['global', 'React'] }
      const plugin = windowExternal(config)

      expect(plugin).toBeDefined()
    })
  })
})
