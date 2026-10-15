// tests/clean-room-leak.spec.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
// import { HK_STROKE_120 } from '../data/benchmark-120'; // 暫時移除尚未實作的問卷基準清單，避免編譯報錯

export type GovernanceLevel = 'HK_VERIFIED' | 'HK_LIKELY' | 'HK_DIVERGENT';

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: GovernanceLevel;
}

describe('Clean-Room Leakage Prevention (乾淨室防外洩門禁)', () => {
  const DATA_DIR = path.resolve(process.cwd(), 'public/data');
  
  // 嚴格禁制詞彙表：任何可能引發版權爭議或曝露外部資產來源的字眼
  const PROHIBITED_TOKENS = [
    'EDB', '教育局', '常用字字形表', 'Lexlist', 
    'makemeahanzi', 'MakeMeAHanzi', 'discrepancies', 'auditStatus',
    'copyright', '©'
  ].map(t => t.normalize('NFKC').toLowerCase()); 
  
  // 🟢 白名單更新：加入字典欄位
  const ALLOWED_SHARD_KEYS = ['char', 'unicode', 'totalStrokes', 'radical', 'jyutping', 'pinyin', 'strokes', 'medians'];
  
  // 🟢 白名單更新：加入 Schema v2.0 的新欄位
  const ALLOWED_MANIFEST_KEYS = ['schemaVersion', 'standard', 'verifiedAtCommit', 'stats', 'entries'];
  
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
    // 使用萬用字元前綴檢查，因為現在的錯誤報告檔名包含 commit hash
    const reportFiles = fs.existsSync(DATA_DIR) 
      ? fs.readdirSync(DATA_DIR).filter(f => f.startsWith('build-errors'))
      : [];
    
    expect(
      reportFiles.length,
      '【資安破口】build-errors 報告不得發佈至公開目錄，以免洩露原始路徑或依賴名稱'
    ).toBe(0);
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

    // 3. 確保 Schema Version 是 v2.0
    expect(manifest.schemaVersion).toBe('2.0.0');

    // 4. 逐筆驗證 Schema 與列舉值
    const REQUIRED_ENTRY_KEYS = ['char', 'unicode', 'totalStrokes', 'hasMedians', 'level'];
    
    // 效能優化：針對 9000 字全量掃描，不再只抽樣前 500 筆
    for (const [unicode, entry] of entries) {
      for (const key of REQUIRED_ENTRY_KEYS) {
        expect(entry, `U+${unicode} 缺少欄位 ${key}`).toHaveProperty(key);
      }
      expect(entry.unicode).toBe(unicode);
      expect(entry.totalStrokes).toBeGreaterThan(0);
      expect(typeof entry.hasMedians).toBe('boolean');
      
      // 🟢 狀態機更新：對齊三態治理 (移除舊的 UNVERIFIED 與 FALLBACK)
      expect(
        ['HK_VERIFIED', 'HK_LIKELY', 'HK_DIVERGENT'],
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
