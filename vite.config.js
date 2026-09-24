import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0', port: 8081,
    proxy: {
      '/api/v1': { target: 'http://218.85.23.37:20320', changeOrigin: true },
    },
  },
});
