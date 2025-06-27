// vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Asegúrate de tener la última versión publicada de @vitejs/plugin-react-swc
// npm install -D @vitejs/plugin-react-swc@latest

export default defineConfig({
    plugins: [
        // Plugin SWC para React con HMR (Fast Refresh)
        react()
    ],
    server: {
        // Puerto en el que correrá Vite
        port: 3000,
        strictPort: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 3000
        }
    },
    build: {
        // Target mínimo para producción
        target: 'es2020'
    }
})
