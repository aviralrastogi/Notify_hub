import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const exampleEnv = loadEnv('example', process.cwd(), '')
  const onesignalAppId = env.VITE_ONESIGNAL_APP_ID || exampleEnv.VITE_ONESIGNAL_APP_ID || ''

  return {
    plugins: [
      react(),
      {
        name: 'inject-onesignal-id',
        transformIndexHtml(html) {
          return html.replace(
            '__ONESIGNAL_APP_ID__',
            onesignalAppId
          )
        },
      },
    ],
    server: {
      port: 5173,
    },
    build: {
      outDir: 'dist',
    },
  }
})
