// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');

export interface FullCharData {
  char: string;
  unicode: string;
  radical: string;       // 部首（例如 "丨 部"）
  totalStrokes: number;  // 總筆畫數
  cantonese: {
    jyutping: string;    // 粵拼（例如 "zung1"）
    homophone: string;   // 同音字（例如 "宗"）
  };
  mandarin: {
    pinyin: string;      // 漢語拼音（例如 "zhōng"）
  };
  strokes: string[];     // 每一劃的獨立路徑
}

// 基礎示範字庫（符合香港學習字詞表標準）
const CHAR_DATABASE: FullCharData[] = [
  {
    char: '中',
    unicode: '4E2D',
    radical: '丨 部',
    totalStrokes: 4,
    cantonese: { jyutping: 'zung1', homophone: '宗' },
    mandarin: { pinyin: 'zhōng' },
    strokes: [
      'M 260 280 L 260 680',                      // 第 1 劃：豎
      'M 260 290 L 740 290 L 740 670',             // 第 2 劃：橫折
      'M 260 670 L 740 670',                      // 第 3 劃：橫
      'M 500 130 L 500 870'                       // 第 4 劃：豎（貫穿）
    ]
  },
  {
    char: '一',
    unicode: '4E00',
    radical: '一 部',
    totalStrokes: 1,
    cantonese: { jyutping: 'jat1', homophone: '壹' },
    mandarin: { pinyin: 'yī' },
    strokes: [
      'M 180 500 L 820 500'
    ]
  },
  {
    char: '人',
    unicode: '4EBA',
    radical: '人 部',
    totalStrokes: 2,
    cantonese: { jyutping: 'jan4', homophone: '銀' },
    mandarin: { pinyin: 'rén' },
    strokes: [
      'M 500 180 Q 400 480 200 820',              // 第 1 劃：撇
      'M 470 420 Q 620 640 820 820'               // 第 2 劃：捺
    ]
  },
  {
    char: '大',
    unicode: '5927',
    radical: '大 部',
    totalStrokes: 3,
    cantonese: { jyutping: 'daai6', homophone: '帶' },
    mandarin: { pinyin: 'dà' },
    strokes: [
      'M 200 400 L 800 400',                      // 第 1 劃：橫
      'M 500 180 Q 420 520 200 840',              // 第 2 劃：撇
      'M 460 410 Q 620 630 820 840'               // 第 3 劃：捺
    ]
  },
  {
    char: '小',
    unicode: '5C0F',
    radical: '小 部',
    totalStrokes: 3,
    cantonese: { jyutping: 'siu2', homophone: '少' },
    mandarin: { pinyin: 'xiǎo' },
    strokes: [
      'M 500 180 L 500 760 Q 500 830 430 800',    // 第 1 劃：豎鈎（先中間）
      'M 330 450 Q 250 580 220 680',              // 第 2 劃：左點（後兩邊）
      'M 670 450 Q 750 580 780 680'               // 第 3 劃：右點
    ]
  }
];

function build() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Array<{ char: string; unicode: string }> = [];

  for (const item of CHAR_DATABASE) {
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${item.unicode}.json`),
      JSON.stringify(item, null, 2),
      'utf-8'
    );
    manifest.push({ char: item.char, unicode: item.unicode });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log(`✅ 成功建置 ${CHAR_DATABASE.length} 個字詞之 EDB 元數據與筆順分片！`);
}

build();
