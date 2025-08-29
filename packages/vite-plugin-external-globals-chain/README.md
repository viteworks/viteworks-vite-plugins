# @viteworks/vite-plugin-external-globals-chain

[![npm version](https://badge.fury.io/js/@viteworks%2Fvite-plugin-external-globals-chain.svg)](https://badge.fury.io/js/@viteworks%2Fvite-plugin-external-globals-chain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Vite plugin wrapper for [vite-plugin-external](https://github.com/fengxinming/vite-plugins/tree/main/packages/vite-plugin-external) that supports array-based global variable paths. This plugin allows you to configure external dependencies using arrays to represent nested global variable paths, which are automatically converted to dot-notation strings.

## Features

- 🎯 **Array-based configuration**: Use arrays to define nested global variable paths
- 🔄 **Automatic conversion**: Arrays are converted to `window.x.y.z` format automatically
- 🛡️ **Type safety**: Full TypeScript support with comprehensive type definitions
- ⚡ **Zero overhead**: Minimal wrapper that delegates to vite-plugin-external
- 🧪 **Well tested**: Comprehensive test suite with 100% coverage

## Installation

```bash
npm install @viteworks/vite-plugin-external-globals-chain
# or
yarn add @viteworks/vite-plugin-external-globals-chain
# or
pnpm add @viteworks/vite-plugin-external-globals-chain
```

## Usage

### Basic Example

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import windowExternal from "@viteworks/vite-plugin-external-globals-chain";

export default defineConfig({
  plugins: [
    windowExternal({
      // Array format - converted to 'window.ralWindows.React'
      react: ["ralWindows", "React"],

      // Array format - converted to 'window.ralWindows.ReactDOM'
      "react-dom": ["ralWindows", "ReactDOM"],

      // String format - passed through unchanged
      lodash: "window._",
    }),
  ],
});
```

### Advanced Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import windowExternal from "@viteworks/vite-plugin-external-globals-chain";

export default defineConfig({
  plugins: [
    windowExternal({
      // Deep nesting support
      "some-library": ["MyApp", "vendors", "SomeLibrary"],
      // Result: 'window.MyApp.vendors.SomeLibrary'

      // Mixed configuration
      jquery: "window.$",
      moment: ["MyApp", "libs", "moment"],

      // Single-level arrays
      axios: ["httpClient"],
      // Result: 'window.httpClient'
    }),
  ],
});
```

### HTML Setup

Make sure your HTML includes the global variables before your bundled code:

```html
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Set up global variables that match your configuration
      window.ralWindows = {
        React: React,
        ReactDOM: ReactDOM,
      };

      window.MyApp = {
        vendors: {
          SomeLibrary: SomeLibrary,
        },
        libs: {
          moment: moment,
        },
      };
    </script>

    <!-- Load your external libraries -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## API Reference

### `windowExternal(config: WindowExternalConfig): Plugin`

The main plugin function that accepts a configuration object and returns a Vite plugin.

#### Parameters

- `config: WindowExternalConfig` - Configuration object mapping package names to global variable paths

#### Returns

- `Plugin` - A Vite plugin instance

### Types

#### `WindowExternalConfig`

```typescript
interface WindowExternalConfig {
  [packageName: string]: ExternalValue;
}
```

Configuration interface for the plugin. Maps package names to their global variable paths.

#### `ExternalValue`

```typescript
type ExternalValue = string[] | string;
```

The value type for external dependencies:

- `string[]`: Array of path segments that will be joined with dots and prefixed with 'window.'
- `string`: Direct global variable path (passed through unchanged)

## Configuration Rules

### Array Values

When you provide an array value:

1. **Non-empty arrays**: Arrays must contain at least one element

   ```typescript
   // ✅ Valid
   'react': ['MyNamespace', 'React']

   // ❌ Invalid - will throw error
   'react': []
   ```

2. **String elements only**: All array elements must be strings

   ```typescript
   // ✅ Valid
   'lodash': ['utils', 'lodash']

   // ❌ Invalid - will throw TypeError
   'lodash': ['utils', 123, 'lodash']
   ```

3. **Automatic prefixing**: Arrays are automatically prefixed with 'window.'

   ```typescript
   // Input
   'react': ['MyApp', 'React']

   // Output (passed to vite-plugin-external)
   'react': 'window.MyApp.React'
   ```

### String Values

String values are passed through unchanged to vite-plugin-external:

```typescript
// Input
'jquery': 'window.$'

// Output (passed to vite-plugin-external)
'jquery': 'window.$'
```

## Error Handling

The plugin provides clear error messages for invalid configurations:

### Empty Array Error

```typescript
// This will throw: Error('External value array for "react" cannot be empty')
windowExternal({
  react: [],
});
```

### Type Error

```typescript
// This will throw: TypeError('All array elements for "react" must be strings')
windowExternal({
  react: ["MyApp", 123, "React"],
});
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/viteworks/vite-plugins.git
cd vite-plugins/packages/vite-plugin-external-globals-chain

# Install dependencies
npm install
```

### Scripts

```bash
# Build the project
npm run build

# Build with clean dist folder
npm run build:clean

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run lint

# Development mode (watch build)
npm run dev
```

### Project Structure

```
├── src/
│   ├── index.ts      # Main plugin export
│   ├── transform.ts  # Configuration transformation logic
│   └── types.ts      # TypeScript type definitions
├── tests/
│   ├── transform.test.ts    # Unit tests for transformation logic
│   ├── integration.test.ts  # Integration tests with vite-plugin-external
│   └── e2e.test.ts         # End-to-end tests
├── dist/             # Built files (generated)
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
├── tsconfig.build.json # Build-specific TypeScript config
└── vitest.config.ts  # Test configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add some amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [vite-plugin-external](https://github.com/fengxinming/vite-plugins/tree/main/packages/vite-plugin-external) - The underlying plugin this wrapper extends
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## Changelog

### 1.0.0

- Initial release
- Array-based configuration support
- Full TypeScript support
- Comprehensive test suite
