import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
      },
      {
        // Preload process entry file
        entry: 'electron/preload.ts',
        onstart(options) {
          // Notify the Renderer process to reload
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
}) 