// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');

export interface CharMetadata {
  char: string;
  radical?: string;
  strokes?: number;
  jyutping?: string;
  pinyin?: string;
}

// 基礎常用字與姓氏庫（持續擴充，包含小學常用與生活字）
const EDB_CHARACTER_LIST: CharMetadata[] = [
  // 核心示範字
  { char: '中', radical: '丨 部', strokes: 4, jyutping: 'zung1', pinyin: 'zhōng' },
  { char: '一', radical: '一 部', strokes: 1, jyutping: 'jat1', pinyin: 'yī' },
  { char: '人', radical: '人 部', strokes: 2, jyutping: 'jan4', pinyin: 'rén' },
  { char: '大', radical: '大 部', strokes: 3, jyutping: 'daai6', pinyin: 'dà' },
  { char: '小', radical: '小 部', strokes: 3, jyutping: 'siu2', pinyin: 'xiǎo' },
  { char: '口', radical: '口 部', strokes: 3, jyutping: 'hau2', pinyin: 'kǒu' },
  
  // 姓名與常用姓氏
  { char: '羅', radical: '罒 部', strokes: 19, jyutping: 'lo4', pinyin: 'luó' },
  { char: '子', radical: '子 部', strokes: 3, jyutping: 'zi2', pinyin: 'zǐ' },
  { char: '陳', radical: '阜 部', strokes: 11, jyutping: 'can4', pinyin: 'chén' },
  { char: '李', radical: '木 部', strokes: 7, jyutping: 'lei5', pinyin: 'lǐ' },
  { char: '張', radical: '弓 部', strokes: 11, jyutping: 'zoeng1', pinyin: 'zhāng' },
  { char: '黃', radical: '黃 部', strokes: 12, jyutping: 'wong4', pinyin: 'huáng' },
  { char: '王', radical: '玉 部', strokes: 4, jyutping: 'wong4', pinyin: 'wáng' },
  
  // 日常基礎字
  { char: '日', radical: '日 部', strokes: 4, jyutping: 'jat6', pinyin: 'rì' },
  { char: '月', radical: '月 部', strokes: 4, jyutping: 'jyut6', pinyin: 'yuè' },
  { char: '木', radical: '木 部', strokes: 4, jyutping: 'muk6', pinyin: 'mù' },
  { char: '水', radical: '水 部', strokes: 4, jyutping: 'seoi2', pinyin: 'shuǐ' },
  { char: '火', radical: '火 部', strokes: 4, jyutping: 'fo2', pinyin: 'huǒ' },
  { char: '土', radical: '土 部', strokes: 3, jyutping: 'tou2', pinyin: 'tǔ' },
  { char: '學', radical: '子 部', strokes: 16, jyutping: 'hok6', pinyin: 'xué' },
  { char: '校', radical: '木 部', strokes: 10, jyutping: 'haau6', pinyin: 'xiào' },
  { char: '生', radical: '生 部', strokes: 5, jyutping: 'sang1', pinyin: 'shēng' }
];

function build() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest: Array<{ char: string; unicode: string; totalStrokes: number }> = [];

  for (const item of EDB_CHARACTER_LIST) {
    const unicode = item.char.charCodeAt(0).toString(16).toUpperCase();
    const sourceFile = path.join(HANZI_DATA_DIR, `${item.char}.json`);

    if (!fs.existsSync(sourceFile)) {
      console.warn(`⚠️ 開源庫未收錄字元：${item.char} (${unicode})`);
      continue;
    }

    const rawData = JSON.parse(fs.readFileSync(sourceFile, 'utf-8'));
    const strokeList: string[] = rawData.strokes || [];
    const totalStrokes = item.strokes || strokeList.length;

    const payload = {
      char: item.char,
      unicode,
      radical: item.radical || '常用部首',
      totalStrokes,
      cantonese: {
        jyutping: item.jyutping || '',
        homophone: item.char
      },
      mandarin: {
        pinyin: item.pinyin || ''
      },
      strokes: strokeList
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${unicode}.json`),
      JSON.stringify(payload, null, 2),
      'utf-8'
    );

    manifest.push({
      char: item.char,
      unicode,
      totalStrokes
    });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  console.log(`✅ 成功萃取並生成 ${manifest.length} 個標準毛筆漢字分片與索引庫！`);
}

build();
