// scripts/audit-curriculum.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HK_SAMPLE_COHORT_120, AUDIT_METADATA } from './hk-standard-corpus';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MANIFEST_PATH = path.join(ROOT_DIR, 'public', 'data', 'manifest.json');
const REPORT_DIR = path.join(ROOT_DIR, 'reports');
const REPORT_OUTPUT = path.join(REPORT_DIR, 'curriculum-audit-report.json');

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

interface ManifestFile {
  entries: Record<string, ManifestEntry>;
}

async function runAudit() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ 找不到 public/data/manifest.json，請先執行 pnpm build:data 構建管線。');
    process.exit(1);
  }

  const manifest: ManifestFile = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  const manifestEntries = manifest.entries;

  const categorized = {
    HK_STANDARD: [] as Array<{ char: string; unicode: string }>,
    FALLBACK: [] as Array<{ char: string; unicode: string }>,
    UNVERIFIED: [] as Array<{ char: string; unicode: string }>,
    MISSING: [] as Array<{ char: string; unicode: string }>
  };

  for (const char of HK_SAMPLE_COHORT_120) {
    const codePoint = char.codePointAt(0);
    if (!codePoint) continue;
    const unicode = codePoint.toString(16).toUpperCase().padStart(4, '0');

    const entry = manifestEntries[unicode];
    if (!entry) {
      categorized.MISSING.push({ char, unicode });
    } else if (entry.level === 'HK_STANDARD') {
      categorized.HK_STANDARD.push({ char, unicode });
    } else if (entry.level === 'FALLBACK') {
      categorized.FALLBACK.push({ char, unicode });
    } else {
      categorized.UNVERIFIED.push({ char, unicode });
    }
  }

  const total = HK_SAMPLE_COHORT_120.length;
  const availableCount = total - categorized.MISSING.length;
  const coverageRate = ((availableCount / total) * 100).toFixed(2);

  console.log('\n======================================================');
  console.log(`  KidsWriteTC 資料治理審計報告 (${AUDIT_METADATA.cohortName})`);
  console.log('======================================================');
  console.log(` 測試樣本總數      : ${total} 字`);
  console.log(` 可用字元 (Available) : ${availableCount} 字 (${coverageRate}%)`);
  console.log(' ------------------------------------------------------');
  console.log(`  - 港標驗證 (HK_STANDARD) : ${categorized.HK_STANDARD.length} 字`);
  console.log(`  - 通用降級 (FALLBACK)    : ${categorized.FALLBACK.length} 字`);
  console.log(`  - 未驗證   (UNVERIFIED)  : ${categorized.UNVERIFIED.length} 字`);
  console.log(`  - 完全缺失 (MISSING)     : ${categorized.MISSING.length} 字`);
  console.log('======================================================');

  if (categorized.MISSING.length > 0) {
    console.log('\n⚠️ 缺失字元清單：');
    console.log(categorized.MISSING.map(i => `${i.char}(U+${i.unicode})`).join(' '));
  }

  // 確保 reports 目錄存在
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  // 可重現性產出：移除動態時間戳，依賴 GITHUB_SHA
  const reportData = {
    metadata: AUDIT_METADATA,
    summary: {
      totalCohort: total,
      availableCount,
      coverageRate: `${coverageRate}%`,
      breakdown: {
        hkStandard: categorized.HK_STANDARD.length,
        fallback: categorized.FALLBACK.length,
        unverified: categorized.UNVERIFIED.length,
        missing: categorized.MISSING.length
      }
    },
    details: categorized
  };

  fs.writeFileSync(REPORT_OUTPUT, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\n📄 審計報告已寫入: reports/curriculum-audit-report.json\n`);
}

runAudit().catch(err => {
  console.error('審計執行失敗:', err);
  process.exit(1);
});
