// scripts/known-divergence.ts

/**
 * 香港標準（EDB）與開源字庫（國標/台標）已知存在差異之字元集合
 * 依據：
 * 1. L1 結構差異 (Structural)
 * 2. L2 筆順差異 (Stroke Sequence)
 * 3. 港標標準異體字 (HK Standard Glyphs)
 * 4. 嶺南本土/香港地名高頻字 (HK Local & Toponym Glyphs)
 */
export const KNOWN_DIVERGENT: Set<string> = new Set([
  // L1: 結構差異
  '骨', '角', '真', '告', '周', '滑', '體', '肉', '寫', '畫',
  '黃', '具', '差', '半', '反', '充', '弟', '每', '青', '展',

  // L2: 筆順差異
  '方', '放', '房', '戈', '成', '我', '歲', '草', '花', '茶',

  // 港標異體字
  '羣', '衞', '綫', '鈎', '麪', '裏', '床', '著', '涼',

  // 香港地名與本土高頻字
  '邨', '埗', '滘', '輋', '氹', '涌', '鰂', '葵', '穗', '灣'
]);

// 啟動期健全性檢查 (Sanity Check)
for (const char of KNOWN_DIVERGENT) {
  if (Array.from(char).length !== 1) {
    throw new Error(`[known-divergence] 異常：清單內含有非單一字元「${char}」`);
  }
}
