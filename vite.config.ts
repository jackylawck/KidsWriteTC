import { defineConfig } from 'vite';

export default defineConfig({
  // 必須對應你 GitHub Repository 嘅名稱，否則 GitHub Pages 會搵唔到資源
  base: '/KidsWriteTC/',
  
  build: {
    target: 'esnext',
    assetsInlineLimit: 0, // 確保分片 JSON 走獨立載入
    sourcemap: false      // 關閉 sourcemap，防止本地絕對路徑洩漏
  }
});
