import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    alias: {
      // Prevent native keytar binary from loading in tests
      keytar: new URL('./src/__mocks__/keytar.ts', import.meta.url).pathname,
    },
  },
})
