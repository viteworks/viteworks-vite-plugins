import { describe, it, expect } from 'vitest'
import { transformConfig } from '../src/transform'

describe('transformConfig', () => {
  describe('array to string conversion', () => {
    it('should convert single element array to window.element', () => {
      const config = { react: ['React'] }
      const result = transformConfig(config)
      expect(result).toEqual({ react: 'window.React' })
    })

    it('should convert multi-element array to window.x.y.z format', () => {
      const config = {
        react: ['ralWindows', 'React'],
        'react-dom': ['ralWindows', 'ReactDOM'],
      }
      const result = transformConfig(config)
      expect(result).toEqual({
        react: 'window.ralWindows.React',
        'react-dom': 'window.ralWindows.ReactDOM',
      })
    })

    it('should handle deeply nested arrays', () => {
      const config = { lodash: ['vendor', 'utils', 'lodash'] }
      const result = transformConfig(config)
      expect(result).toEqual({ lodash: 'window.vendor.utils.lodash' })
    })
  })

  describe('string value pass-through', () => {
    it('should pass string values unchanged', () => {
      const config = {
        jquery: 'window.jQuery',
        moment: 'window.moment',
      }
      const result = transformConfig(config)
      expect(result).toEqual(config)
    })
  })

  describe('mixed configuration types', () => {
    it('should handle mixed array and string values', () => {
      const config = {
        react: ['ralWindows', 'React'],
        jquery: 'window.jQuery',
        lodash: ['vendor', 'lodash'],
      }
      const result = transformConfig(config)
      expect(result).toEqual({
        react: 'window.ralWindows.React',
        jquery: 'window.jQuery',
        lodash: 'window.vendor.lodash',
      })
    })

    it('should preserve string values with different formats', () => {
      const config = {
        // Array values should be transformed
        react: ['global', 'React'],
        vue: ['window', 'Vue'],
        // String values should be preserved as-is
        jquery: 'window.jQuery',
        lodash: 'window._',
        moment: 'moment',
        customGlobal: 'MyApp.utils.helper',
      }
      const result = transformConfig(config)
      expect(result).toEqual({
        react: 'window.global.React',
        vue: 'window.window.Vue',
        jquery: 'window.jQuery',
        lodash: 'window._',
        moment: 'moment',
        customGlobal: 'MyApp.utils.helper',
      })
    })

    it('should handle configuration with only string values', () => {
      const config = {
        jquery: 'window.jQuery',
        lodash: 'window._',
        moment: 'window.moment',
      }
      const result = transformConfig(config)
      expect(result).toEqual(config)
    })

    it('should handle configuration with only array values', () => {
      const config = {
        react: ['global', 'React'],
        vue: ['window', 'Vue'],
        angular: ['ng'],
      }
      const result = transformConfig(config)
      expect(result).toEqual({
        react: 'window.global.React',
        vue: 'window.window.Vue',
        angular: 'window.ng',
      })
    })

    it('should handle single package with array value among strings', () => {
      const config = {
        jquery: 'window.jQuery',
        react: ['MyApp', 'React'], // Only this one is an array
        lodash: 'window._',
      }
      const result = transformConfig(config)
      expect(result).toEqual({
        jquery: 'window.jQuery',
        react: 'window.MyApp.React',
        lodash: 'window._',
      })
    })
  })

  describe('error handling', () => {
    it('should throw error for empty arrays', () => {
      const config = { react: [] }
      expect(() => transformConfig(config)).toThrow('External value array for "react" cannot be empty')
    })

    it('should throw TypeError for non-string array elements', () => {
      const config = { react: ['React', 123 as any] }
      expect(() => transformConfig(config)).toThrow('All array elements for "react" must be strings')
    })

    it('should throw TypeError for mixed type array elements', () => {
      const config = { react: ['React', null as any, 'Component'] }
      expect(() => transformConfig(config)).toThrow('All array elements for "react" must be strings')
    })

    it('should throw TypeError for arrays with undefined elements', () => {
      const config = { lodash: ['vendor', undefined as any, 'lodash'] }
      expect(() => transformConfig(config)).toThrow('All array elements for "lodash" must be strings')
    })

    it('should throw TypeError for arrays with boolean elements', () => {
      const config = { jquery: ['window', true as any] }
      expect(() => transformConfig(config)).toThrow('All array elements for "jquery" must be strings')
    })

    it('should throw TypeError for arrays with object elements', () => {
      const config = { moment: ['global', {} as any] }
      expect(() => transformConfig(config)).toThrow('All array elements for "moment" must be strings')
    })

    it('should provide specific package name in error messages', () => {
      const config = { 'my-package': [] }
      expect(() => transformConfig(config)).toThrow('External value array for "my-package" cannot be empty')
    })

    it('should handle multiple packages with one having errors', () => {
      const config = {
        react: ['React'],
        invalid: [],
      }
      expect(() => transformConfig(config)).toThrow('External value array for "invalid" cannot be empty')
    })
  })

  describe('edge cases', () => {
    it('should handle empty configuration object', () => {
      const config = {}
      const result = transformConfig(config)
      expect(result).toEqual({})
    })
  })
})
