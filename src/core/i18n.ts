// src/core/i18n.ts

// 集中管理合法語系，供編譯期與執行期共用
export const VALID_LOCALES = ['zh-HK', 'en'] as const;
export type Locale = typeof VALID_LOCALES[number];

export interface TranslationRecord {
  [key: string]: string;
}

export interface Dictionary {
  'zh-HK': TranslationRecord;
  'en': TranslationRecord;
}

// 提取硬編碼常數
const STORAGE_KEY = 'kidswritetc_locale';

const DICTIONARY: Dictionary = {
  'zh-HK': {
    'app.title': '童寫繁體字 KidsWriteTC',
    'ui.description': '專為學童設計的繁體字筆順與寫字練習工具',
    'ui.search.label': '輸入單字',
    'ui.search.placeholder': '輸入單字',
    'ui.search.button': '查詢',
    'ui.button.prev': '上一劃',
    'ui.button.next': '下一劃',
    'ui.button.replay': '重新示範',
    'ui.button.clear': '清除筆跡',
    'ui.button.play': '播放',
    'ui.button.pause': '暫停',
    'ui.meta.radical': '部首',
    'ui.meta.totalStrokes': '總筆畫數',
    'ui.meta.pronounce': '字音',
    'ui.meta.cantonese': '粵語',
    'ui.meta.mandarin': '普通話',
    'ui.unit.strokes': '畫',
    'ui.unit.radical_suffix': '部',
    'ui.alert.notFound': '找不到「{char}」的資料。',
    'ui.alert.unverified': '⚠️ 此字庫尚未完成港標驗證，筆順僅供參考',
    'ui.alert.ttsUnavailable': '您的設備未安裝粵語語音包',
    'ui.alert.dataUnavailable': '字庫索引載入失敗，請重整頁面',
    'ui.languageSelector': '語言選擇',
    // 👇 補上四態治理專屬文本
    'ui.alert.divergent': '⚠️ 此字在香港教學標準中筆順或部件可能存在分歧，僅供參考',
    'ui.alert.unknown': 'ⓘ 此字形幾何資料不完整，正在整理中',
    'ui.badge.verified': '✓ 港標核定'
  },
  'en': {
    'app.title': 'KidsWriteTC',
    'ui.description': 'Stroke Order & Tracing Tool for Kids',
    'ui.search.label': 'Enter character',
    'ui.search.placeholder': 'Enter character',
    'ui.search.button': 'Search',
    'ui.button.prev': 'Previous',
    'ui.button.next': 'Next',
    'ui.button.replay': 'Replay',
    'ui.button.clear': 'Clear',
    'ui.button.play': 'Play',
    'ui.button.pause': 'Pause',
    'ui.meta.radical': 'Radical',
    'ui.meta.totalStrokes': 'Total Strokes',
    'ui.meta.pronounce': 'Pronunciation',
    'ui.meta.cantonese': 'Cantonese',
    'ui.meta.mandarin': 'Mandarin',
    'ui.unit.strokes': 'strokes',
    'ui.unit.radical_suffix': '',
    'ui.alert.notFound': 'Character "{char}" not found.',
    'ui.alert.unverified': '⚠️ Unverified stroke standard. For reference only.',
    'ui.alert.ttsUnavailable': 'Cantonese voice pack is not installed on your device.',
    'ui.alert.dataUnavailable': 'Data index failed to load. Please refresh the page.',
    'ui.languageSelector': 'Language Selection',
    // 👇 補上四態治理專屬文本
    'ui.alert.divergent': '⚠️ This character may diverge from HK EDB guidelines. For reference only.',
    'ui.alert.unknown': 'ⓘ Incomplete stroke geometry data for this character.',
    'ui.badge.verified': '✓ HK Standard Verified'
  }
};

export class I18nManager {
  private currentLocale: Locale;
  // 使用 Set 取代 Array，天然防止重複訂閱 (O(1) 刪除效能)
  private subscribers: Set<() => void> = new Set(); 

  constructor() {
    this.currentLocale = this.getStoredLocale() || 'zh-HK';
  }

  private getStoredLocale(): Locale | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      // 執行期嚴格型別校驗
      if (VALID_LOCALES.includes(stored as Locale)) {
        return stored as Locale;
      }
    }
    return null;
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public setLocale(locale: Locale): void {
    // 執行期防禦：阻擋非法轉換 (例如從 URL Params 惡意注入)
    if (!VALID_LOCALES.includes(locale)) {
      console.warn(`[i18n] Invalid locale rejected: ${locale}`);
      return;
    }
    if (this.currentLocale === locale) return;
    
    this.currentLocale = locale;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(STORAGE_KEY, locale);
    }
    this.notifySubscribers();
  }

  public t(key: string, params?: Record<string, string | number>): string {
    let text = DICTIONARY[this.currentLocale]?.[key] ?? DICTIONARY['zh-HK']?.[key] ?? '';
    
    if (params && text) {
      // 採用單次靜態正則 (Static RegExp) 搭配 Replacer
      // 徹底解決動態正則注入與「二次替換 (Secondary Replacement)」的邊界問題
      text = text.replace(/\{([^}]+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }
    return text;
  }

  public subscribe(callback: () => void): () => void {
    if (this.subscribers.has(callback)) {
      console.warn('[i18n] Duplicate subscription detected');
    }
    this.subscribers.add(callback);
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error('[i18n] Subscriber error:', err);
      }
    });
  }
}

export const i18n = new I18nManager();
