import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0', port: 8081,
    proxy: {
      '/api': { target: 'http://192.168.2.92:7010', changeOrigin: true },
      '/river': { target: 'http://192.168.2.67:8905', changeOrigin: true },
      '/jwsk-resource': { target: 'http://192.168.2.103:8086', changeOrigin: true },
    },
  },
});
