import { defineConfig } from 'vite'

// noinspection JSUnusedGlobalSymbols
export default defineConfig({
    base: '',
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
    server: {
        port: 8080,
    },
    preview: {
        port: 8080,
    },
    build: {
        sourcemap: true,
        chunkSizeWarningLimit: 520,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three']
                }
            }
        }
    },
})
