import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext',
    assetsInlineLimit: 0, // 確保分片 JSON 走獨立載入
    sourcemap: false      // 關閉 sourcemap，防止本地絕對路徑洩漏
  }
});
