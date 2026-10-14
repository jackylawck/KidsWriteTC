// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');

// 常見常用字的部首與發音補全字典（未定義的字會自動優雅回退）
const KNOWN_METADATA: Record<string, { radical: string; jyutping: string; pinyin: string }> = {
  '中': { radical: '丨 部', jyutping: 'zung1', pinyin: 'zhōng' },
  '一': { radical: '一 部', jyutping: 'jat1', pinyin: 'yī' },
  '人': { radical: '人 部', jyutping: 'jan4', pinyin: 'rén' },
  '大': { radical: '大 部', jyutping: 'daai6', pinyin: 'dà' },
  '小': { radical: '小 部', jyutping: 'siu2', pinyin: 'xiǎo' },
  '口': { radical: '口 部', jyutping: 'hau2', pinyin: 'kǒu' },
  '羅': { radical: '罒 部', jyutping: 'lo4', pinyin: 'luó' },
  '子': { radical: '子 部', jyutping: 'zi2', pinyin: 'zǐ' },
  '陳': { radical: '阜 部', jyutping: 'can4', pinyin: 'chén' },
  '李': { radical: '木 部', jyutping: 'lei5', pinyin: 'lǐ' },
  '張': { radical: '弓 部', jyutping: 'zoeng1', pinyin: 'zhāng' },
  '黃': { radical: '黃 部', jyutping: 'wong4', pinyin: 'huáng' },
  '王': { radical: '玉 部', jyutping: 'wong4', pinyin: 'wáng' },
  '港': { radical: '水 部', jyutping: 'gong2', pinyin: 'gǎng' },
  '學': { radical: '子 部', jyutping: 'hok6', pinyin: 'xué' }
};

function buildAll() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. 讀取開源庫內所有漢字檔案 (例如 "中.json", "羅.json"...)
  const files = fs.readdirSync(HANZI_DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('package'));
  console.log(`📦 發現開源庫共收錄 ${files.length} 個漢字數據，開始全量編譯...`);

  const manifest: Array<{ char: string; unicode: string; totalStrokes: number }> = [];

  for (const file of files) {
    const char = path.basename(file, '.json');
    // 過濾非法單字檔名
    if (char.length !== 1) continue;

    const unicode = char.charCodeAt(0).toString(16).toUpperCase();
    const rawData = JSON.parse(fs.readFileSync(path.join(HANZI_DATA_DIR, file), 'utf-8'));
    const strokeList: string[] = rawData.strokes || [];
    const totalStrokes = strokeList.length;

    const meta = KNOWN_METADATA[char] || {
      radical: '常用部首',
      jyutping: '',
      pinyin: ''
    };

    const payload = {
      char,
      unicode,
      radical: meta.radical,
      totalStrokes,
      cantonese: {
        jyutping: meta.jyutping,
        homophone: char
      },
      mandarin: {
        pinyin: meta.pinyin
      },
      strokes: strokeList
    };

    // 輸出至 public/data/{unicode}.json
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${unicode}.json`),
      JSON.stringify(payload) // 壓縮為一行，節省空間
    );

    manifest.push({ char, unicode, totalStrokes });
  }

  // 2. 輸出完整索引 manifest.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest)
  );

  console.log(`🎉 全量編譯完成！共產出 ${manifest.length} 個漢字的獨立分片至 public/data/！`);
}

buildAll();
