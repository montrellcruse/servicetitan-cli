# Contributing to ServiceTitan CLI

Thank you for your interest in contributing! This document covers the development setup, coding conventions, and pull request process.

## Prerequisites

- Node.js >= 20
- npm >= 10
- A ServiceTitan developer account (for integration testing)
- **Linux:** `libsecret-1-dev` (`sudo apt-get install -y libsecret-1-dev`)

## Getting Started

```bash
git clone https://github.com/montrellcruse/servicetitan-cli.git
cd servicetitan-cli
npm ci
```

## Development Workflow

```bash
# Type-check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test

# Build
npm run build
```

## Adding a New Command

1. Create a new file in `src/commands/<group>/<action>.ts`
2. Extend `BaseCommand` and implement the `run()` method
3. Use `this.initializeRuntime(flags)` for auth and client setup
4. Use `this.outputResults()` for consistent table/JSON/CSV output
5. Add tests in `test/commands/<group>/<action>.test.ts`
6. Run `npm run typecheck && npm run lint && npm test` before committing

## Coding Conventions

- **TypeScript strict mode** — no `any` types, no non-null assertions where avoidable
- **Import order** — alphabetical within groups (node builtins, then external, then internal)
- **Flags** — use oclif `Flags` with descriptions and `char` shortcuts for common flags
- **Error handling** — use `ServiceTitanApiError` for API errors, provide actionable messages
- **Naming** — camelCase for variables/functions, PascalCase for classes/types, kebab-case for files

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `chore:` — maintenance, dependencies, CI
- `test:` — adding or updating tests
- `refactor:` — code change that neither fixes a bug nor adds a feature

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes with tests
3. Ensure `npm run typecheck && npm run lint && npm test` all pass
4. Update CHANGELOG.md with your changes under `[Unreleased]`
5. Submit a PR with a clear description of what changed and why

## Testing

Tests use [Vitest](https://vitest.dev/). The test helper in `test/helpers.ts` provides `createTestContext()` for mocking the oclif runtime.

- Write tests for both happy paths and error paths
- Mock API responses using the patterns in existing test files
- Test flag parsing where applicable

## Questions?

Open an issue or start a discussion on GitHub.
