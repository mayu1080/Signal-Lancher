import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/** Production CSP (no unsafe-eval). Dev CSP is injected by Vite HMR separately. */
const PRODUCTION_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"

function injectCspMeta(isDev: boolean): Plugin {
  return {
    name: 'inject-csp-meta',
    transformIndexHtml(html) {
      if (isDev) {
        const devCsp =
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:* http://localhost:* http://127.0.0.1:*"
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${devCsp}" />`
        )
      }
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`
      )
    }
  }
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/main/index.ts')
          }
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
      build: {
        rollupOptions: {
          input: {
            preload: resolve(__dirname, 'src/main/preload.ts')
          }
        }
      }
    },
    renderer: {
      root: resolve(__dirname, 'src/renderer'),
      build: {
        rollupOptions: {
          input: {
            index: resolve(__dirname, 'src/renderer/index.html')
          }
        }
      },
      plugins: [react(), injectCspMeta(isDev)]
    }
  }
})
