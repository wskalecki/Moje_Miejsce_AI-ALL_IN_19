import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@data': path.resolve(__dirname, '../data'),
    },
  },
})
