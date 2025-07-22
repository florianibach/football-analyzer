import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  root: './',
  build: {
    outDir: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});