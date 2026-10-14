export type BenchmarkGroup = 
  | 'control'  // A組：控制組 (無爭議、兩岸三地筆順一致的基礎字)
  | 'conflict' // B組：衝突組 (兩岸三地筆順差異極大，需 L1 分類器特化處理的字)
  | 'teaching'; // C組：教學組 (部件組合複雜、小學生常見錯寫字)

export interface BenchmarkChar {
  char: string;
  group: BenchmarkGroup;
  reason?: string; // 記錄衝突原因或教學重點
}

/**
 * HK-Stroke-120 學術基準隊列 (Phase 0 骨架)
 * 用於隔離測試切向量防腐層與 L1 特化分類器
 */
export const HK_STROKE_120: BenchmarkChar[] = [
  // --- A組：控制組 ---
  { char: '一', group: 'control' },
  { char: '十', group: 'control' },
  { char: '木', group: 'control' },
  { char: '水', group: 'control' },

  // --- B組：衝突組 (目前管線的火力集中點) ---
  { char: '方', group: 'conflict', reason: '港標：點、橫、折、撇 (與台標不同)' },
  { char: '戈', group: 'conflict', reason: '港標：橫、豎勾、撇、點 (最後寫點)' },
  { char: '草', group: 'conflict', reason: '港標草字頭：直、橫、直、橫 (四畫分開)' },
  { char: '黃', group: 'conflict', reason: '港標中間：由字穿透橫畫' },
  { char: '右', group: 'conflict', reason: '港標：先橫後撇 (與「左」字相反)' },
  { char: '萬', group: 'conflict', reason: '港標草字頭差異，且下方部件筆順具爭議' },

  // --- C組：教學組 ---
  { char: '遊', group: 'teaching', reason: '辵部 (走之底) 必須最後寫' },
  { char: '龜', group: 'teaching', reason: '極端複雜拓撲，筆順極易錯' },
  { char: '寫', group: 'teaching', reason: '寶蓋頭與下方部件的接續' }
];

// 匯出各組的快速過濾陣列，方便後續測試腳本直接調用
export const CONFLICT_CHARS = HK_STROKE_120.filter(c => c.group === 'conflict').map(c => c.char);
