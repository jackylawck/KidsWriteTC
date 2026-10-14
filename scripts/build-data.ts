// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const TMP_DIR = path.resolve(process.cwd(), 'public/data.tmp');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

// 支援科學記號 (e/E) 與正號 (+) 的穩健 SVG Path 正則
const isValidPath = (p: string) => /^[MmLlHhVvCcSsQqTtAaZz0-9\s.,\-+eE]+$/.test(p);

async function buildAll() {
  await fs.promises.rm(TMP_DIR, { recursive: true, force: true });
  await fs.promises.mkdir(TMP_DIR, { recursive: true });
  
  const files = (await fs.promises.readdir(HANZI_DATA_DIR))
    .filter(f => f.endsWith('.json') && !f.startsWith('package'));
  
  const manifest: Record<string, ManifestEntry> = {};
  const errors: Array<{ file: string; reason: string }> = [];
  let processed = 0;
  
  console.log(`📦 啟動 Phase 0.0 管線：掃描 ${files.length} 個原始資料檔...`);

  for (const file of files) {
    try {
      const char = path.basename(file, '.json');
      if (Array.from(char).length !== 1) continue;
      
      const codePoint = char.codePointAt(0);
      if (!codePoint) continue;
      
      const unicode = codePoint.toString(16).toUpperCase().padStart(4, '0');
      
      const raw = await fs.promises.readFile(path.join(HANZI_DATA_DIR, file), 'utf-8');
      const rawData = JSON.parse(raw);
      
      const strokes: string[] = rawData.strokes || [];
      const medians: number[][][] = rawData.medians || [];
      
      // 結構與幾何完整性驗證
      if (strokes.length === 0) {
        errors.push({ file, reason: 'no strokes data' });
        continue;
      }
      if (strokes.length !== medians.length) {
        errors.push({ file, reason: `length mismatch: strokes (${strokes.length}) vs medians (${medians.length})` });
        continue;
      }
      if (!strokes.every(isValidPath)) {
        errors.push({ file, reason: 'invalid SVG path detected' });
        continue;
      }

      // 寫入包含 medians 的完整幾何分片
      await fs.promises.writeFile(
        path.join(TMP_DIR, `${unicode}.json`),
        JSON.stringify({ char, unicode, strokes, medians })
      );
      
      manifest[unicode] = {
        char,
        unicode,
        totalStrokes: strokes.length,
        hasMedians: medians.length > 0,
        level: 'UNVERIFIED',
      };
      
      processed++;
      if (processed % 500 === 0) {
        process.stdout.write(`  進度：${processed} / ${files.length}\n`);
      }
    } catch (err: unknown) {
      // 穩健的錯誤型別處理
      const reason = err instanceof Error ? err.message : String(err);
      errors.push({ file, reason });
    }
  }

  await fs.promises.writeFile(
    path.join(TMP_DIR, 'manifest.json'),
    JSON.stringify({
      source: 'hanzi-writer-data',
      standard: 'UNVERIFIED',
      generatedAt: new Date().toISOString(),
      entries: manifest,
    })
  );
  
  await fs.promises.writeFile(
    path.join(TMP_DIR, 'build-errors.json'),
    JSON.stringify(errors, null, 2)
  );

  await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.promises.rename(TMP_DIR, OUTPUT_DIR);
  
  console.log(`🎉 產出 ${Object.keys(manifest).length} 個分片，${errors.length} 個異常已記錄至 build-errors.json`);
}

buildAll();
