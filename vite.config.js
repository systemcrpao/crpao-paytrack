import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages: ตั้ง VITE_BASE_PATH=/crpao-paytrack/ ตอน build (ดู README)
  base: process.env.VITE_BASE_PATH || '/',
});
