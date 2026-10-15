// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const TMP_DIR = path.resolve(process.cwd(), 'public/data.tmp');
const REPORT_DIR = path.resolve(process.cwd(), 'build-reports');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');
const DICT_PATH = path.resolve(process.cwd(), 'data', 'compiled', 'dictionary.json');
// 👇 補丁系統核心目錄
const PATCH_DIR = path.resolve(process.cwd(), 'data', 'patches');

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

const isValidPath = (p: string) => /^[MmLlHhVvCcSsQqTtAaZz0-9\s.,\-+eE]+$/.test(p);

// 嚴格檢驗 medians 幾何資料結構
function isValidMedians(medians: unknown): medians is number[][][] {
  if (!Array.isArray(medians)) return false;
  return medians.every(stroke =>
    Array.isArray(stroke) &&
    stroke.length >= 2 &&
    stroke.every(point =>
      Array.isArray(point) && point.length === 2 &&
      typeof point[0] === 'number' && typeof point[1] === 'number'
    )
  );
}

async function buildAll() {
  console.log('📦 啟動字庫建置管線...');

  await fs.promises.rm(TMP_DIR, { recursive: true, force: true });
  await fs.promises.mkdir(TMP_DIR, { recursive: true });
  await fs.promises.mkdir(PATCH_DIR, { recursive: true });
  await fs.promises.mkdir(REPORT_DIR, { recursive: true });
  
  let dictionary: Record<string, { radical: string; jyutping: string[]; pinyin: string[] }> = {};
  if (fs.existsSync(DICT_PATH)) {
    try {
      dictionary = JSON.parse(await fs.promises.readFile(DICT_PATH, 'utf-8'));
      console.log(`✅ 已載入擴充字典索引，共涵蓋 ${Object.keys(dictionary).length} 字`);
    } catch (err) {
      console.warn(`⚠️ dictionary.json 解析失敗，將跳過字典合併：${err}`);
    }
  } else {
    console.warn('⚠️ 未找到 dictionary.json，將跳過字典合併');
  }

  // 雙軌讀取：開源庫與手動補丁庫
  const hanziFiles = fs.existsSync(HANZI_DATA_DIR) 
    ? (await fs.promises.readdir(HANZI_DATA_DIR)).filter(f => f.endsWith('.json') && !f.startsWith('package'))
    : [];
  const patchFilesList = (await fs.promises.readdir(PATCH_DIR)).filter(f => f.endsWith('.json'));
  const patchFiles = new Set(patchFilesList); // O(1) 查詢效能優化
  
  const overlapping = hanziFiles.filter(f => patchFiles.has(f));
  if (overlapping.length > 0) {
    console.log(`🔄 補丁覆蓋了 ${overlapping.length} 個開源檔案：${overlapping.slice(0, 5).join(', ')}${overlapping.length > 5 ? '...' : ''}`);
  }

  // Set 聯集去重
  const allFiles = new Set([...patchFilesList, ...hanziFiles]);
  console.log(`📂 開源庫：${hanziFiles.length} 檔，補丁庫：${patchFilesList.length} 檔`);
  console.log(`📦 準備處理 ${allFiles.size} 個字元...\n`);
  
  const manifest: Record<string, ManifestEntry> = {};
  const errors: Array<{ file: string; reason: string }> = [];
  let processed = 0;
  
  for (const file of allFiles) {
    try {
      const basename = path.basename(file, '.json');
      let char: string;
      let unicode: string;
      
      // 支援漢字 (羣.json) 或 Unicode (7FA3.json) 命名
      if (Array.from(basename).length === 1) {
        char = basename;
        const cp = char.codePointAt(0);
        if (!cp) continue;
        unicode = cp.toString(16).toUpperCase().padStart(4, '0');
      } else if (/^[0-9A-F]{4,5}$/i.test(basename)) {
        unicode = basename.toUpperCase().padStart(4, '0');
        char = String.fromCodePoint(parseInt(unicode, 16));
      } else {
        errors.push({ file, reason: `無法解析檔名：${basename}，必須是單一漢字或 Unicode Hex` });
        continue;
      }
      
      const isPatched = patchFiles.has(file);
      const sourcePath = isPatched ? path.join(PATCH_DIR, file) : path.join(HANZI_DATA_DIR, file);
      
      const rawData = JSON.parse(await fs.promises.readFile(sourcePath, 'utf-8'));
      const strokes: string[] = rawData.strokes || [];
      const medians: unknown = rawData.medians || [];
      
      if (strokes.length === 0) {
        errors.push({ file, reason: 'no strokes data' });
        continue;
      }
      
      if (!isValidMedians(medians)) {
        errors.push({ file, reason: 'invalid medians structure' });
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

      const dictMeta = dictionary[unicode] || { radical: '—', jyutping: [], pinyin: [] };
      
      // 嚴格型別校驗：只有經過審查的補丁才能升級為 HK_STANDARD
      const hasReview = isPatched 
        && typeof rawData.reviewedBy === 'string' 
        && rawData.reviewedBy.trim().length > 0
        && typeof rawData.reviewedAt === 'string'
        && /^\d{4}-\d{2}-\d{2}/.test(rawData.reviewedAt);
        
      const level = hasReview ? 'HK_STANDARD' : (isPatched ? 'FALLBACK' : 'UNVERIFIED');

      await fs.promises.writeFile(
        path.join(TMP_DIR, `${unicode}.json`),
        JSON.stringify({ 
          char, unicode, totalStrokes: strokes.length,
          radical: dictMeta.radical, jyutping: dictMeta.jyutping, pinyin: dictMeta.pinyin,
          strokes, medians 
        })
      );
      
      manifest[unicode] = { char, unicode, totalStrokes: strokes.length, hasMedians: true, level };
      processed++;
      
      if (processed % 1000 === 0) {
        process.stdout.write(`  進度：${processed} / ${allFiles.size}\n`);
      }
    } catch (err: unknown) {
      errors.push({ file, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  await fs.promises.writeFile(
    path.join(TMP_DIR, 'manifest.json'),
    JSON.stringify({
      source: 'kidswritetc-merged',
      standard: 'MIXED',
      verifiedAtCommit: process.env.GITHUB_SHA || 'local',
      entries: manifest,
    })
  );
  
  // 錯誤報告隔離到 build-reports，避免洩漏到 public
  if (errors.length > 0) {
    await fs.promises.writeFile(
      path.join(REPORT_DIR, `build-errors-${process.env.GITHUB_SHA || 'local'}.json`),
      JSON.stringify(errors, null, 2)
    );
  }

  await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.promises.rename(TMP_DIR, OUTPUT_DIR);

  console.log('\n======================================================');
  console.log(`✅ 建置完成`);
  console.log(`   總分片數 : ${Object.keys(manifest).length}`);
  console.log(`   手動補丁 : ${Object.values(manifest).filter(e => e.level !== 'UNVERIFIED').length}`);
  console.log(`   錯誤數量 : ${errors.length}`);
  console.log('======================================================\n');
}

// 攔截所有未預期錯誤，確保 CI 亮紅燈而非靜默通過
buildAll().catch(err => {
  console.error('❌ 致命錯誤，建置管線崩潰：', err);
  process.exit(1);
});
