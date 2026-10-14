// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
// 指向 pnpm 安裝的開源毛筆 SVG 數據庫
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');

// 香港教育局 (EDB) 字典清單擴充 (此處可隨時加至 3000 字)
const EDB_DICT = [
  { char: '中', radical: '丨 部', strokes: 4, jyutping: 'zung1', pinyin: 'zhōng' },
  { char: '一', radical: '一 部', strokes: 1, jyutping: 'jat1', pinyin: 'yī' },
  { char: '人', radical: '人 部', strokes: 2, jyutping: 'jan4', pinyin: 'rén' },
  { char: '大', radical: '大 部', strokes: 3, jyutping: 'daai6', pinyin: 'dà' },
  { char: '小', radical: '小 部', strokes: 3, jyutping: 'siu2', pinyin: 'xiǎo' },
  { char: '口', radical: '口 部', strokes: 3, jyutping: 'hau2', pinyin: 'kǒu' },
  { char: '日', radical: '日 部', strokes: 4, jyutping: 'jat6', pinyin: 'rì' },
  { char: '月', radical: '月 部', strokes: 4, jyutping: 'jyut6', pinyin: 'yuè' },
  { char: '木', radical: '木 部', strokes: 4, jyutping: 'muk6', pinyin: 'mù' },
  { char: '水', radical: '水 部', strokes: 4, jyutping: 'seoi2', pinyin: 'shuǐ' },
  { char: '火', radical: '火 部', strokes: 4, jyutping: 'fo2', pinyin: 'huǒ' },
  { char: '土', radical: '土 部', strokes: 3, jyutping: 'tou2', pinyin: 'tǔ' },
  { char: '上', radical: '一 部', strokes: 3, jyutping: 'soeng6', pinyin: 'shàng' },
  { char: '下', radical: '一 部', strokes: 3, jyutping: 'haa6', pinyin: 'xià' }
];

function build() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Array<{ char: string; unicode: string }> = [];

  for (const item of EDB_DICT) {
    const unicode = item.char.charCodeAt(0).toString(16).toUpperCase();
    const sourcePath = path.join(HANZI_DATA_DIR, `${item.char}.json`);
    
    // 檢查開源庫中是否有這個字的毛筆 SVG
    if (!fs.existsSync(sourcePath)) {
      console.warn(`⚠️ 找不到「${item.char}」的毛筆數據，已跳過。`);
      continue;
    }

    // 讀取真實毛筆 SVG 輪廓數據
    const hwData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    
    const fullData = {
      char: item.char,
      unicode,
      radical: item.radical,
      totalStrokes: item.strokes,
      cantonese: { jyutping: item.jyutping, homophone: item.char },
      mandarin: { pinyin: item.pinyin },
      strokes: hwData.strokes // <== 注入真實的毛筆輪廓 Path
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, `${unicode}.json`), JSON.stringify(fullData, null, 2));
    manifest.push({ char: item.char, unicode });
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`✅ 成功建置 ${manifest.length} 個字詞的毛筆筆順分片！`);
}

build();
