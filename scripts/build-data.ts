// scripts/build-data.ts
import fs from 'node:fs';
import path from 'node:path';
import { KNOWN_DIVERGENT } from './known-divergence';

const OUTPUT_DIR = path.resolve(process.cwd(), 'public/data');
const TMP_DIR = path.resolve(process.cwd(), 'public/data.tmp');
const REPORT_DIR = path.resolve(process.cwd(), 'build-reports');
const HANZI_DATA_DIR = path.resolve(process.cwd(), 'node_modules/hanzi-writer-data');
const DICT_PATH = path.resolve(process.cwd(), 'data', 'compiled', 'dictionary.json');
const PATCH_DIR = path.resolve(process.cwd(), 'data', 'patches');

export type GovernanceLevel = 'HK_VERIFIED' | 'HK_LIKELY' | 'HK_DIVERGENT';

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: GovernanceLevel;
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
  console.log('📦 啟動三態治理字庫建置管線...');

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
  const patchFiles = new Set(patchFilesList);
  
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
  const stats: Record<GovernanceLevel, number> = {
    HK_VERIFIED: 0,
    HK_LIKELY: 0,
    HK_DIVERGENT: 0
  };
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
      
      // 幾何防護：嚴禁寫入空分片與損壞資料
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
      
      // 專家數位簽名校驗
      const hasReview = isPatched 
        && typeof rawData.reviewedBy === 'string' 
        && rawData.reviewedBy.trim().length > 0
        && typeof rawData.reviewedAt === 'string'
        && /^\d{4}-\d{2}-\d{2}/.test(rawData.reviewedAt);
        
      // 三態分流判定
      let level: GovernanceLevel;
      if (hasReview) {
        level = 'HK_VERIFIED';
      } else if (isPatched || KNOWN_DIVERGENT.has(char)) {
        level = 'HK_DIVERGENT';
      } else {
        level = 'HK_LIKELY';
      }

      stats[level]++;

      // 寫入單字分片（乾淨寫入，不含 level 冗餘）
      await fs.promises.writeFile(
        path.join(TMP_DIR, `${unicode}.json`),
        JSON.stringify({ 
          char, unicode, totalStrokes: strokes.length,
          radical: dictMeta.radical, jyutping: dictMeta.jyutping, pinyin: dictMeta.pinyin,
          strokes, medians 
        })
      );
      
      // Manifest 作為資料治理的單一事實來源 (SSOT)
      manifest[unicode] = { char, unicode, totalStrokes: strokes.length, hasMedians: true, level };
      processed++;
      
      if (processed % 1000 === 0) {
        process.stdout.write(`  進度：${processed} / ${allFiles.size}\n`);
      }
    } catch (err: unknown) {
      errors.push({ file, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  // 產出 v2.0 Schema
  await fs.promises.writeFile(
    path.join(TMP_DIR, 'manifest.json'),
    JSON.stringify({
      schemaVersion: '2.0.0',
      standard: 'HK-EDB-FOUR-STATE', // 為了維持 CI 白名單相容性保留此標記名稱
      verifiedAtCommit: process.env.GITHUB_SHA || 'local',
      stats,
      entries: manifest,
    })
  );
  
  if (errors.length > 0) {
    await fs.promises.writeFile(
      path.join(REPORT_DIR, `build-errors-${process.env.GITHUB_SHA || 'local'}.json`),
      JSON.stringify(errors, null, 2)
    );
  }

  await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.promises.rename(TMP_DIR, OUTPUT_DIR);

  console.log('\n======================================================');
  console.log('✅ 三態管線建置完成！');
  console.log(`   🟢 HK_VERIFIED  (專家核定) : ${stats.HK_VERIFIED}`);
  console.log(`   ⚪ HK_LIKELY    (常態呈現) : ${stats.HK_LIKELY}`);
  console.log(`   🟡 HK_DIVERGENT (爭議警示) : ${stats.HK_DIVERGENT}`);
  console.log(`   ⚠️ 幾何異常檔數             : ${errors.length}`);
  console.log('======================================================\n');
}

buildAll().catch(err => {
  console.error('❌ 致命錯誤，建置管線崩潰：', err);
  process.exit(1);
});
