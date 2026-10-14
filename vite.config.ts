import { defineConfig } from 'vite';

export default defineConfig({
  // 必須對應你 GitHub Repository 嘅名稱，否則 GitHub Pages 會搵唔到資源
  base: '/KidsWriteTC/',

  build: {
    target: 'esnext',
    assetsInlineLimit: 0, // 確保分片 JSON 走獨立載入
    sourcemap: false,     // 關閉 sourcemap，防止本地絕對路徑洩漏
    rollupOptions: {
      output: {
        // 固定輸出雜湊命名，確保更新發布時破除瀏覽器頑固快取
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
