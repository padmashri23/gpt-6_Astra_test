import {defineConfig} from 'vite';

// GitHub Pages serves this project from /<repo>/, so the asset base must be
// overridable. VITE_BASE is set by the deploy workflow; local dev stays at '/'.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  build: {rollupOptions: {output: {manualChunks: {three: ['three']}}}}
});
