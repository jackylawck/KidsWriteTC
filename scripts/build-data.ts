import fs from 'node:fs';
import path from 'node:path';

// 定義輸出目錄 (Vite 打包時會將 public/ 完整複製到 dist/)
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');

// 基礎啟動字庫範本 (確保離線與初次載入具備標準繁體筆順數據)
interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes: number;
  strokes: string[]; // SVG Path 或切向量軌跡
}

// 核心繁體示範字集（符合香港小學中文學習字詞表基礎字）
const INITIAL_CHAR_SET: StrokeData[] = [
  {
    char: '一',
    unicode: '4E00',
    totalStrokes: 1,
    strokes: [
      'M 150 500 L 850 500'
    ]
  },
  {
    char: '人',
    unicode: '4EBA',
    totalStrokes: 2,
    strokes: [
      'M 500 200 Q 400 500 200 800',
      'M 460 450 Q 600 650 800 800'
    ]
  },
  {
    char: '中',
    unicode: '4E2D',
    totalStrokes: 4,
    strokes: [
      'M 250 300 L 250 650',
      'M 250 300 L 750 300 L 750 650',
      'M 250 650 L 750 650',
      'M 500 150 L 500 850'
    ]
  },
  {
    char: '大',
    unicode: '5927',
    totalStrokes: 3,
    strokes: [
      'M 200 400 L 800 400',
      'M 500 200 Q 420 550 200 850',
      'M 460 420 Q 620 650 820 850'
    ]
  },
  {
    char: '小',
    unicode: '5C0F',
    totalStrokes: 3,
    strokes: [
      'M 500 200 L 500 750 Q 500 820 440 800',
      'M 350 450 Q 250 600 220 700',
      'M 650 450 Q 750 600 780 700'
    ]
  }
];

function buildData() {
  console.log('🚀 開始建置漢字筆順分片數據...');

  // 1. 確保 public/data 目錄存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 2. 獨立輸出個別漢字分片 JSON (按需載入，落實 CSP 與零記憶體浪費)
  const manifest: Array<{ char: string; unicode: string; totalStrokes: number }> = [];

  for (const item of INITIAL_CHAR_SET) {
    const filePath = path.join(OUTPUT_DIR, `${item.unicode}.json`);
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2), 'utf-8');
    
    manifest.push({
      char: item.char,
      unicode: item.unicode,
      totalStrokes: item.totalStrokes
    });
  }

  // 3. 輸出字庫總索引清單 manifest.json
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`✅ 成功產出 ${INITIAL_CHAR_SET.length} 個漢字獨立分片與 manifest.json 至 public/data/`);
}

buildData();
