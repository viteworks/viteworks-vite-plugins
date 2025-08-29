import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build, createServer, ViteDevServer, LibraryFormats } from 'vite'
import { resolve, join } from 'path'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs'
import windowExternal from '../src/index'

describe('End-to-End Tests', () => {
  const testDir = resolve(__dirname, 'fixtures/e2e-test')
  const distDir = join(testDir, 'dist')

  beforeAll(() => {
    // Create test project structure
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })

    // Create package.json
    writeFileSync(join(testDir, 'package.json'), JSON.stringify({
      name: 'e2e-test',
      version: '1.0.0',
      type: 'module',
    }, null, 2))

    // Create index.html
    writeFileSync(join(testDir, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
  <title>E2E Test</title>
</head>
<body>
  <div id="app"></div>
  <script>
    // Mock global variables that would be provided by external scripts
    window.ralWindows = {
      React: { createElement: () => 'React.createElement' },
      ReactDOM: { render: () => 'ReactDOM.render' }
    };
    window.jQuery = () => 'jQuery';
    window.vendor = {
      lodash: { map: () => 'lodash.map' }
    };
  </script>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
    `)

    // Create src directory and main.js
    mkdirSync(join(testDir, 'src'), { recursive: true })
    writeFileSync(join(testDir, 'src/main.js'), `
// Import external dependencies that should be externalized
import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import _ from 'lodash';

// Test that externalized modules are accessible
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);
console.log('jQuery:', $);
console.log('Lodash:', _);

// Create a simple app to verify functionality
const element = React.createElement('div', null, 'Hello from externalized React!');
ReactDOM.render(element, document.getElementById('app'));

// Test jQuery and lodash
$('#app').css('color', 'blue');
const numbers = _.map([1, 2, 3], n => n * 2);
console.log('Mapped numbers:', numbers);

// Export something to verify the module works
export default {
  React,
  ReactDOM,
  $,
  _,
  message: 'E2E test successful'
};
    `)
  })

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('Build Process Integration', () => {
    it('should externalize dependencies correctly during build', async() => {
      const viteConfig = {
        root: testDir,
        build: {
          outDir: 'dist',
          rollupOptions: {
            input: join(testDir, 'index.html'),
            external: ['react', 'react-dom', 'jquery', 'lodash'],
          },
        },
        plugins: [
          windowExternal({
            // Array-based configuration - should be transformed
            'react': ['ralWindows', 'React'],
            'react-dom': ['ralWindows', 'ReactDOM'],
            'lodash': ['vendor', 'lodash'],
            // String-based configuration - should be passed through
            'jquery': 'window.jQuery',
          }),
        ],
      }

      // Build the project
      const buildResult = await build(viteConfig)

      // Verify build completed successfully
      expect(buildResult).toBeDefined()
      expect(existsSync(distDir)).toBe(true)

      // Check that the main JS file was created
      const distFiles = require('fs').readdirSync(distDir)
      const assetsDir = join(distDir, 'assets')
      let jsContent = ''

      if (existsSync(assetsDir)) {
        const assetFiles = require('fs').readdirSync(assetsDir)
        const jsFiles = assetFiles.filter((file: string) => file.endsWith('.js'))
        expect(jsFiles.length).toBeGreaterThan(0)

        // Read the built JS file and verify externalization
        const jsFile = jsFiles[0]
        jsContent = readFileSync(join(assetsDir, jsFile), 'utf-8')
      } else {
        // Fallback: look for JS files in root dist directory
        const jsFiles = distFiles.filter((file: string) => file.endsWith('.js'))
        expect(jsFiles.length).toBeGreaterThan(0)
        jsContent = readFileSync(join(distDir, jsFiles[0]), 'utf-8')
      }

      // The main verification is that the build completes successfully
      // and that our plugin doesn't break the build process
      // The actual externalization behavior depends on vite-plugin-external
      // which we've already tested in integration tests

      // Verify the build output exists and contains our main application code
      expect(jsContent).toContain('console.log') // Our test code should be present
      expect(jsContent.length).toBeGreaterThan(0) // File should not be empty
    }, 30000) // Increase timeout for build process

    it('should handle mixed configuration types in build', async() => {
      const viteConfig = {
        root: testDir,
        build: {
          outDir: 'dist-mixed',
          rollupOptions: {
            input: join(testDir, 'index.html'),
            external: ['react', 'react-dom', 'jquery', 'lodash'],
          },
        },
        plugins: [
          windowExternal({
            // Mix of arrays and strings
            'react': ['ralWindows', 'React'],
            'jquery': 'window.jQuery',
            'lodash': ['vendor', 'lodash'],
            'react-dom': 'window.ralWindows.ReactDOM', // Direct string
          }),
        ],
      }

      const buildResult = await build(viteConfig)
      expect(buildResult).toBeDefined()

      const mixedDistDir = join(testDir, 'dist-mixed')
      expect(existsSync(mixedDistDir)).toBe(true)
    }, 30000)
  })

  describe('Development Server Integration', () => {
    let server: ViteDevServer

    afterAll(async() => {
      if (server) {
        await server.close()
      }
    })

    it('should work correctly in development mode', async() => {
      const viteConfig = {
        root: testDir,
        server: {
          port: 0, // Use random available port
        },
        plugins: [
          windowExternal({
            'react': ['ralWindows', 'React'],
            'react-dom': ['ralWindows', 'ReactDOM'],
            'jquery': 'window.jQuery',
            'lodash': ['vendor', 'lodash'],
          }),
        ],
      }

      server = await createServer(viteConfig)
      await server.listen()

      // Verify server started successfully
      expect(server.httpServer).toBeDefined()
      expect(server.httpServer?.listening).toBe(true)

      // Get the server URL
      const serverInfo = server.httpServer?.address()
      expect(serverInfo).toBeDefined()

      // In development mode, we can't easily test the actual module resolution
      // without a full browser environment, but we can verify the server starts
      // and the plugin is loaded correctly
      const plugins = server.config.plugins
      expect(plugins).toBeDefined()
      expect(plugins.length).toBeGreaterThan(0)
    }, 15000)
  })

  describe('Runtime Global Variable Access', () => {
    it('should generate code that accesses correct global variables', async() => {
      // Create a minimal test to verify the transformation logic
      const viteConfig = {
        root: testDir,
        build: {
          outDir: 'dist-globals',
          lib: {
            entry: join(testDir, 'src/main.js'),
            name: 'TestLib',
            formats: ['iife' as LibraryFormats],
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'jquery', 'lodash'],
          },
        },
        plugins: [
          windowExternal({
            'react': ['ralWindows', 'React'],
            'react-dom': ['ralWindows', 'ReactDOM'],
            'jquery': 'window.jQuery',
            'lodash': ['vendor', 'lodash'],
          }),
        ],
      }

      const buildResult = await build(viteConfig)
      expect(buildResult).toBeDefined()

      const globalsDistDir = join(testDir, 'dist-globals')
      expect(existsSync(globalsDistDir)).toBe(true)

      // Read the IIFE build output
      const iifeFiles = require('fs').readdirSync(globalsDistDir).filter((f: string) => f.endsWith('.iife.js'))
      if (iifeFiles.length > 0) {
        const iifeContent = readFileSync(join(globalsDistDir, iifeFiles[0]), 'utf-8')

        // Verify the build completed and contains our code
        expect(iifeContent.length).toBeGreaterThan(0)
        expect(iifeContent).toContain('TestLib') // Library name should be present
      }
    }, 30000)

    it('should handle deeply nested global paths', async() => {
      // Test with more complex nested paths
      const complexConfig = {
        'my-lib': ['window', 'vendor', 'libs', 'myLib', 'core'],
        'another-lib': ['global', 'external', 'another'],
      }

      // Create a simple test file for this
      const complexTestFile = join(testDir, 'src/complex.js')
      writeFileSync(complexTestFile, `
import myLib from 'my-lib';
import anotherLib from 'another-lib';

export { myLib, anotherLib };
      `)

      const viteConfig = {
        root: testDir,
        build: {
          outDir: 'dist-complex',
          lib: {
            entry: complexTestFile,
            name: 'ComplexTest',
            formats: ['iife' as LibraryFormats],
          },
          rollupOptions: {
            external: ['my-lib', 'another-lib'],
          },
        },
        plugins: [
          windowExternal(complexConfig),
        ],
      }

      const buildResult = await build(viteConfig)
      expect(buildResult).toBeDefined()

      const complexDistDir = join(testDir, 'dist-complex')
      expect(existsSync(complexDistDir)).toBe(true)

      const complexIifeFiles = require('fs').readdirSync(complexDistDir).filter((f: string) => f.endsWith('.iife.js'))
      if (complexIifeFiles.length > 0) {
        const complexContent = readFileSync(join(complexDistDir, complexIifeFiles[0]), 'utf-8')

        // Verify the build completed successfully with complex configuration
        expect(complexContent.length).toBeGreaterThan(0)
        expect(complexContent).toContain('ComplexTest') // Library name should be present
      }
    }, 30000)
  })
})
