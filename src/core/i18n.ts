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
 * 靜態詞彙庫 (Phase 0 MVP)
 */
const DICTIONARY: Dictionary = {
  'zh-HK': {
    'app.title': '童寫繁體字 KidsWriteTC',
    'app.description': '專為香港小學生設計的純淨筆順描紅工具',
    'ui.button.start': '開始練習',
    'ui.button.clear': '清除畫布',
    'ui.button.next': '下一個字',
    'ui.mode.classroom': '課堂投影模式 (Shift+F)',
    'ui.status.ready': '準備就緒',
  },
  'zh-CN': {
    'app.title': '童写繁体字 KidsWriteTC',
    'app.description': '专为香港小学生设计的纯净笔顺描红工具',
    'ui.button.start': '开始练习',
    'ui.button.clear': '清除画布',
    'ui.button.next': '下一个字',
    'ui.mode.classroom': '课堂投影模式 (Shift+F)',
    'ui.status.ready': '准备就绪',
  },
  'en': {
    'app.title': 'KidsWriteTC',
    'app.description': 'Clean stroke tracing tool for HK primary students',
    'ui.button.start': 'Start Practice',
    'ui.button.clear': 'Clear Canvas',
    'ui.button.next': 'Next Character',
    'ui.mode.classroom': 'Classroom Mode (Shift+F)',
    'ui.status.ready': 'Ready',
  }
};

/**
 * 記憶體雙語管理器 (零延遲、不依賴外部檔案)
 */
export class I18nManager {
  private currentLocale: Locale;
  private subscribers: Array<() => void> = [];

  constructor() {
    // 初始化：優先讀取 sessionStorage，否則預設為 zh-HK
    this.currentLocale = this.getStoredLocale() || 'zh-HK';
  }

  /**
   * 獲取當前儲存的語系
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

  /**
   * 獲取當前語系
   */
  public getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * 切換語系，並通知所有訂閱者更新畫面
   */
  public setLocale(locale: Locale): void {
    this.currentLocale = locale;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('kidswritetc_locale', locale);
    }
    this.notifySubscribers();
  }

  /**
   * 翻譯指定 Key 的詞彙
   */
  public t(key: string): string {
    const text = DICTIONARY[this.currentLocale][key];
    return text || key; // 如果找不到翻譯，就回傳 Key 本身
  }

  /**
   * 註冊畫面更新回呼 (Callback)
   */
  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    // 回傳取消訂閱的函數
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有訂閱者執行更新
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
}

// 匯出單例 (Singleton) 供整個 App 使用
export const i18n = new I18nManager();
