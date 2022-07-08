import { defineConfig } from 'vite'

export default defineConfig({
    base: '/rock-raiders-web/',
    define: {
        APP_VERSION: JSON.stringify(process.env.npm_package_version),
    },
})
