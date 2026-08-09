import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/dashboard-radio/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  }
});