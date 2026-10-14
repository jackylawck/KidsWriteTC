import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { HK_STROKE_120 } from '../data/benchmark-120';

describe('Clean-Room Leakage Prevention (乾淨室防外洩測試)', () => {
  const DIST_DATA_FILE = path.resolve(process.cwd(), 'public/data/benchmark-dict.json');

  it('確保編譯產出物 (benchmark-dict.json) 成功生成', () => {
    // 驗證 build-data.ts 是否有正常運作
    expect(fs.existsSync(DIST_DATA_FILE)).toBe(true);
  });

  it('防外洩檢查：確保產物只包含 HK_STROKE_120 白名單內的字', () => {
    const distContent = JSON.parse(fs.readFileSync(DIST_DATA_FILE, 'utf-8'));
    
    // 萃取產物中的所有字元
    const distChars = distContent.map((item: any) => item.char);
    const benchmarkChars = HK_STROKE_120.map(c => c.char);

    // 1. 檢查產物總數量是否與基準隊列完全一致 (防止假陽性字元混入)
    expect(distChars.length).toBe(benchmarkChars.length);

    // 2. 檢查是否每個字都嚴格存在於白名單中 (防止 data/raw 的未授權資料外洩)
    distChars.forEach((char: string) => {
      expect(benchmarkChars).toContain(char);
    });
  });

  it('資料淨化檢查：確保產出物中不含有不必要的原始欄位', () => {
     const distContent = JSON.parse(fs.readFileSync(DIST_DATA_FILE, 'utf-8'));
     
     // 隨機抽樣檢查第一個字，確保資料結構已經被我們清洗過
     const sample = distContent[0];
     expect(sample).toHaveProperty('char');
     expect(sample).toHaveProperty('group');
     expect(sample).toHaveProperty('strokes');
     expect(sample).toHaveProperty('metadata');
     
     // 確保沒有殘留原始字庫的龐大 SVG 原屎路徑或無用編碼
     expect(sample).not.toHaveProperty('raw_svg'); 
  });
});
