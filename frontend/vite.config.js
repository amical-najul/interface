import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    // Simple transform to replace title
    transformIndexHtml: (html) => {
      return html.replace(
        /%VITE_APP_NAME%/g,
        env.VITE_APP_NAME || 'Vite App'
      )
    },
  }
})
