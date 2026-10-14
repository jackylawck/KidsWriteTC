import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');

function buildAll() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(HANZI_DATA_DIR).filter(f => f.endsWith('.json') && !f.startsWith('package'));
  console.log(`📦 發現開源庫共收錄 ${files.length} 個漢字數據，開始全量編譯...`);

  const manifest: Array<{ char: string; unicode: string; totalStrokes: number }> = [];

  for (const file of files) {
    const char = path.basename(file, '.json');
    if (char.length !== 1) continue;

    const unicode = char.charCodeAt(0).toString(16).toUpperCase();
    const rawData = JSON.parse(fs.readFileSync(path.join(HANZI_DATA_DIR, file), 'utf-8'));
    const strokeList: string[] = rawData.strokes || [];
    const totalStrokes = strokeList.length;

    const payload = {
      char,
      unicode,
      radical: '常用部首',
      totalStrokes,
      cantonese: { jyutping: '', homophone: char },
      mandarin: { pinyin: '' },
      strokes: strokeList
    };

    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${unicode}.json`),
      JSON.stringify(payload)
    );

    manifest.push({ char, unicode, totalStrokes });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest)
  );

  console.log(`🎉 全量編譯完成！共產出 ${manifest.length} 個漢字的獨立分片至 public/data/！`);
}

buildAll();
