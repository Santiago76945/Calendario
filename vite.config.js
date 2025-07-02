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
        // Cambiamos el puerto de 3000 a 3001 para evitar conflictos
        port: 3001,
        strictPort: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 3001
        }
    },
    build: {
        // Target mínimo para producción
        target: 'es2020'
    }
})
