# Vite Plugins Workspace

A collection of Vite plugins managed as a pnpm workspace.

## Packages

- [`vite-plugin-external-globals-chain`](./packages/vite-plugin-external-globals-chain) - (In development)

## Development

This project uses pnpm workspaces for managing multiple packages.

### Setup

```bash
# Install dependencies for all packages
pnpm install
```

### Scripts

```bash
# Build all packages
pnpm build

# Test all packages
pnpm test

# Run tests in watch mode for all packages
pnpm test:watch

# Lint all packages
pnpm lint

# Clean all packages
pnpm clean

# Development mode for all packages
pnpm dev
```

### Working with individual packages

```bash
# Run commands in specific package
pnpm --filter vite-plugin-external-globals-chain build
pnpm --filter vite-plugin-external-globals-chain test

# Or navigate to package directory
cd packages/vite-plugin-external-globals-chain
pnpm build
```

## Contributing

### Commit Convention

This project uses [gitmoji](https://gitmoji.dev/) for commit messages. Each commit must start with an appropriate emoji followed by a conventional commit format.

**Format**: `<gitmoji> <type>: <description>`

**Examples**:
- `✨ feat: add new plugin feature`
- `🐛 fix: resolve configuration issue`
- `📝 docs: update README`
- `🧪 test: add unit tests`

See [.gitmoji](./.gitmoji) for a complete guide.

### Development Workflow

1. Create a feature branch
2. Make your changes with proper commit messages
3. Add a changeset: `pnpm changeset`
4. Create a pull request

## License

MIT