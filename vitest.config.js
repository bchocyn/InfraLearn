import { defineConfig } from 'vitest/config';

// Vitest is configured for jsdom even though current tests are pure-function
// only — keeps the door open for React-component tests later without a
// second config rewrite. `globals: true` lets specs use describe/it/expect
// without imports, matching the conventional Jest-style spec style.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js', 'src/**/*.test.js'],
  },
});
