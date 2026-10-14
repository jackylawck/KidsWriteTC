// tests/clean-room-leak.spec.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HK_STROKE_120 } from '../data/benchmark-120';

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

describe('Clean-Room Leakage Prevention (乾淨室防外洩門禁)', () => {
  const DATA_DIR = path.resolve(process.cwd(), 'public/data');
  
  // 嚴格禁制詞彙表：任何可能引發版權爭議或曝露外部資產來源的字眼
  const PROHIBITED_TOKENS = [
    'EDB', '教育局', '常用字字形表', 'Lexlist', 
    'makemeahanzi', 'MakeMeAHanzi', 'discrepancies', 'auditStatus',
    'copyright', '©'
  ].map(t => t.normalize('NFKC').toLowerCase()); // 預先標準化並轉小寫，消除正則脆弱性
  
  const ALLOWED_SHARD_KEYS = ['char', 'unicode', 'strokes', 'medians'];
  const ALLOWED_MANIFEST_KEYS = ['source', 'standard', 'generatedAt', 'entries'];
  
  function getAllJsonFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...getAllJsonFiles(full));
      else if (entry.name.endsWith('.json')) results.push(full);
    }
    return results;
  }

  it('確保 public/data/ 不包含構建錯誤報告 (防止資訊洩露)', () => {
    const errorReportPath = path.join(DATA_DIR, 'build-errors.json');
    expect(
      fs.existsSync(errorReportPath),
      '【資安破口】build-errors.json 不得發佈至公開目錄，以免洩露原始路徑或依賴名稱'
    ).toBe(false);
  });

  it('內容淨化掃描：所有產出分片不得含有受限授權文字或官方字眼', () => {
    // 排除 manifest.json，專注掃描實際發布的字元分片
    const files = getAllJsonFiles(DATA_DIR).filter(f => !f.endsWith('manifest.json'));
    expect(files.length).toBeGreaterThan(0);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8').normalize('NFKC').toLowerCase();
      
      for (const token of PROHIBITED_TOKENS) {
        expect(
          content.includes(token),
          `【乾淨室破口】檔案 ${path.relative(process.cwd(), file)} 含有嚴格受限詞彙：「${token}」`
        ).toBe(false);
      }
    }
  });

  it('Schema 零信任掃描：單字分片不得夾帶未經授權的欄位', () => {
    const shardFiles = getAllJsonFiles(DATA_DIR).filter(f => !f.endsWith('manifest.json'));
    
    for (const file of shardFiles) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const illegalKeys = Object.keys(data).filter(k => !ALLOWED_SHARD_KEYS.includes(k));
      expect(
        illegalKeys, 
        `【Schema 污染】單字分片 ${path.basename(file)} 夾帶未授權欄位：${illegalKeys.join(', ')}`
      ).toEqual([]);
    }
  });

  it('Manifest 結構完整性與資料治理狀態驗證', () => {
    const manifestPath = path.join(DATA_DIR, 'manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // 1. 根結構白名單
    const illegalKeys = Object.keys(manifest).filter(k => !ALLOWED_MANIFEST_KEYS.includes(k));
    expect(illegalKeys, `【Manifest 污染】夾帶未授權根欄位`).toEqual([]);
    
    // 2. 確保 entries 不是空殼
    const entries = Object.entries<ManifestEntry>(manifest.entries || {});
    expect(entries.length, '【管線異常】manifest.entries 不得為空').toBeGreaterThan(0);

    // 3. 逐筆驗證 Schema 與列舉值
    const REQUIRED_ENTRY_KEYS = ['char', 'unicode', 'totalStrokes', 'hasMedians', 'level'];
    
    for (const [unicode, entry] of entries) {
      for (const key of REQUIRED_ENTRY_KEYS) {
        expect(entry, `U+${unicode} 缺少欄位 ${key}`).toHaveProperty(key);
      }
      expect(entry.unicode).toBe(unicode);
      expect(entry.totalStrokes).toBeGreaterThan(0);
      expect(typeof entry.hasMedians).toBe('boolean');
      expect(
        ['UNVERIFIED', 'HK_STANDARD', 'FALLBACK'],
        `字元 U+${unicode} 含有未知的治理狀態：${entry.level}`
      ).toContain(entry.level);
    }
  });

  it('聯動一致性掃描：Manifest 中的 hasMedians 必須與實際分片檔案吻合', () => {
    const manifestPath = path.join(DATA_DIR, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    for (const [unicode, entry] of Object.entries<ManifestEntry>(manifest.entries)) {
      const shardPath = path.join(DATA_DIR, `${unicode}.json`);
      if (!fs.existsSync(shardPath)) {
        expect.fail(`【一致性破裂】U+${unicode} 存在於 manifest，但實體分片缺失`);
      }
      
      const shard = JSON.parse(fs.readFileSync(shardPath, 'utf-8'));
      const actualHasMedians = Array.isArray(shard.medians) && shard.medians.length > 0;
      
      expect(
        entry.hasMedians,
        `【一致性破裂】U+${unicode} 的 hasMedians 標記 (${entry.hasMedians}) 與實體分片狀態 (${actualHasMedians}) 不符`
      ).toBe(actualHasMedians);
    }
  });
});

describe('學術基準隊列完整性驗證 (HK-Stroke-120)', () => {
  it('確保隊列中無重複字元污染', () => {
    const chars = HK_STROKE_120.map(e => e.char);
    const uniqueChars = new Set(chars);
    expect(uniqueChars.size).toBe(chars.length);
  });

  it('確保核心分類標籤合法', () => {
    const validLevels = ['L0', 'L1', 'L2', 'L3'];
    const validCohorts = ['A_CONTROL', 'B_DIVERGENCE', 'C_PEDAGOGY'];
    const validConfidence = ['HIGH', 'MEDIUM', 'LOW'];

    for (const entry of HK_STROKE_120) {
      expect(validLevels).toContain(entry.expectedLevel);
      expect(validCohorts).toContain(entry.cohort);
      expect(validConfidence).toContain(entry.expectedLevelConfidence);
    }
  });

  it('L1/L2 爭議字元必須具備明確的差異描述 (discrepancyDescription)', () => {
    for (const entry of HK_STROKE_120) {
      if (entry.expectedLevel === 'L1' || entry.expectedLevel === 'L2') {
        expect(
          entry.discrepancyDescription,
          `字元 ${entry.char} 標為 ${entry.expectedLevel} 但缺少差異描述`
        ).toBeTruthy();
      }
    }
  });
});
