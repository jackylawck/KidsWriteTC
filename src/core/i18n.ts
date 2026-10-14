// src/core/i18n.ts

/**
 * 支援的語系列舉
 */
export type Locale = 'zh-HK' | 'zh-CN' | 'en';

/**
 * 詞彙表結構
 */
export interface TranslationRecord {
  [key: string]: string;
}

export interface Dictionary {
  'zh-HK': TranslationRecord;
  'zh-CN': TranslationRecord;
  'en': TranslationRecord;
}

/**
 * 靜態詞彙庫 (支援純淨版面與多語系動態切換)
 */
const DICTIONARY: Dictionary = {
  'zh-HK': {
    'app.title': '童寫繁體字 KidsWriteTC',
    'app.description': '專為學童設計的繁體字筆順與描紅工具',
    'ui.search.placeholder': '輸入單字',
    'ui.search.button': '查詢',
    'ui.button.prev': '上一劃',
    'ui.button.next': '下一劃',
    'ui.button.replay': '重新示範',
    'ui.button.clear': '清除筆跡',
    'ui.meta.radical': '部首',
    'ui.meta.totalStrokes': '總筆畫數',
    'ui.meta.pronounce': '字音',
    'ui.meta.cantonese': '粵語',
    'ui.meta.mandarin': '普通話',
    'ui.unit.strokes': '畫',
    'ui.unit.radical_suffix': '部',
    'ui.alert.notFound': '「{char}」字庫分片準備中。'
  },
  'zh-CN': {
    'app.title': '童写繁体字 KidsWriteTC',
    'app.description': '专为学童设计的繁体字笔顺与描红工具',
    'ui.search.placeholder': '输入单字',
    'ui.search.button': '查询',
    'ui.button.prev': '上一划',
    'ui.button.next': '下一划',
    'ui.button.replay': '重新示范',
    'ui.button.clear': '清除笔迹',
    'ui.meta.radical': '部首',
    'ui.meta.totalStrokes': '总笔画数',
    'ui.meta.pronounce': '字音',
    'ui.meta.cantonese': '粤语',
    'ui.meta.mandarin': '普通话',
    'ui.unit.strokes': '画',
    'ui.unit.radical_suffix': '部',
    'ui.alert.notFound': '「{char}」字库分片准备中。'
  },
  'en': {
    'app.title': 'KidsWriteTC',
    'app.description': 'Stroke Order & Tracing Tool for Kids',
    'ui.search.placeholder': 'Enter character',
    'ui.search.button': 'Search',
    'ui.button.prev': 'Previous',
    'ui.button.next': 'Next',
    'ui.button.replay': 'Replay',
    'ui.button.clear': 'Clear',
    'ui.meta.radical': 'Radical',
    'ui.meta.totalStrokes': 'Total Strokes',
    'ui.meta.pronounce': 'Pronunciation',
    'ui.meta.cantonese': 'Cantonese',
    'ui.meta.mandarin': 'Mandarin',
    'ui.unit.strokes': 'strokes',
    'ui.unit.radical_suffix': '',
    'ui.alert.notFound': 'Character "{char}" data not found.'
  }
};

/**
 * 記憶體雙語管理器 (零延遲、零外部依賴、隱私保護)
 */
export class I18nManager {
  private currentLocale: Locale;
  private subscribers: Array<() => void> = [];

  constructor() {
    this.currentLocale = this.getStoredLocale() || 'zh-HK';
  }

  /**
   * 讀取 sessionStorage（關閉分頁即清除，符合零數據留存資安原則）
   */
  private getStoredLocale(): Locale | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = sessionStorage.getItem('kidswritetc_locale');
      if (stored === 'zh-HK' || stored === 'zh-CN' || stored === 'en') {
        return stored as Locale;
      }
    }
    return null;
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * 切換語系並觸發畫面訂閱更新
   */
  public setLocale(locale: Locale): void {
    if (this.currentLocale === locale) return;
    this.currentLocale = locale;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('kidswritetc_locale', locale);
    }
    this.notifySubscribers();
  }

  /**
   * 翻譯字串，支援動態變數置換 (例如 t('ui.alert.notFound', { char: '港' }))
   */
  public t(key: string, params?: Record<string, string | number>): string {
    let text = DICTIONARY[this.currentLocale]?.[key] || DICTIONARY['zh-HK']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

export const i18n = new I18nManager();
