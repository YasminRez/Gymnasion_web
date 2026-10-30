import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.BACKEND_URL || 'http://127.0.0.1:8080'
  // Mesma regra do nginx de produção: front e API ficam na mesma origem; sem Origin o Spring não aplica CORS
  const apiProxy: ProxyOptions = {
    target: backendTarget,
    changeOrigin: true,
    configure: proxy => proxy.on('proxyReq', proxyRequest => proxyRequest.removeHeader('origin')),
  }

  return {
    plugins: [react()],
    server: {
      host: true,
      allowedHosts: (env.VITE_ALLOWED_HOSTS || '').split(',').filter(Boolean),
      proxy: { '/api': apiProxy },
    },
    preview: {
      host: true,
      allowedHosts: (env.VITE_ALLOWED_HOSTS || '').split(',').filter(Boolean),
      proxy: { '/api': apiProxy },
    },
  }
})
