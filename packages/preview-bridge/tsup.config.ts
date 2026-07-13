import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    server: 'src/server.ts',
    client: 'src/client.ts',
  },
  format: ['esm', 'cjs'],
  dts: { resolve: false },
  clean: true,
  sourcemap: true,
  target: 'es2020',
});
