import { defineConfig } from 'vite'

export default defineConfig({
    base: '',
    define: {
        APP_VERSION: JSON.stringify(process.env['npm_package_version']),
    },
    server: {
        port: 8080,
    },
    preview: {
        port: 8080,
    },
    build: {
        sourcemap: true,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'three',
                            test: /node_modules[\\/]three[\\/]/
                        }
                    ]
                }
            }
        }
    },
    optimizeDeps: {
        exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
    },
})
