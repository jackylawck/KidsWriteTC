// src/main.ts
import { TraceCanvas, StrokeData } from './ui/canvas-trace';
import { i18n, Locale } from './core/i18n';

// 擴充 StrokeData 以包含資料治理標記
interface CharacterData extends StrokeData {
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

class KidsWriteApp {
  private canvas: TraceCanvas;
  private currentData: CharacterData | null = null;
  private synth = window.speechSynthesis;

  // DOM 節點緩存
  private els = {
    inputChar: document.getElementById('input-char') as HTMLInputElement,
    btnSearch: document.getElementById('btn-search') as HTMLButtonElement,
    
    // Playback Controls
    btnPrev: document.getElementById('btn-prev-stroke') as HTMLButtonElement,
    btnNext: document.getElementById('btn-next-stroke') as HTMLButtonElement,
    btnReplay: document.getElementById('btn-replay') as HTMLButtonElement,
    btnClear: document.getElementById('btn-clear') as HTMLButtonElement,
    btnPlayBubble: document.getElementById('btn-play-bubble') as HTMLButtonElement,
    
    // Meta Info
    metaRadical: document.getElementById('meta-radical') as HTMLElement,
    metaTotalStrokes: document.getElementById('meta-total-strokes') as HTMLElement,
    metaJyutping: document.getElementById('meta-jyutping') as HTMLElement,
    metaPinyin: document.getElementById('meta-pinyin') as HTMLElement,
    
    // Audio
    btnAudioCantonese: document.getElementById('btn-audio-cantonese') as HTMLButtonElement,
    btnAudioMandarin: document.getElementById('btn-audio-mandarin') as HTMLButtonElement,
    
    // Status
    warningBanner: document.getElementById('standard-warning') as HTMLElement,
    langSelectors: document.querySelectorAll('.lang-selector button')
  };

  constructor() {
    this.canvas = new TraceCanvas('trace-canvas', 'ink-canvas', 'stroke-badge');
    
    this.bindEvents();
    this.setupI18n();
    
    // 🚀 仔仔專屬彩蛋：系統初始化時，預設載入「上」字
    this.loadCharacter('上');
  }

  private bindEvents() {
    // 搜尋功能 (按鈕與 Enter 鍵)
    this.els.btnSearch.addEventListener('click', () => this.handleSearch());
    this.els.inputChar.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    // 畫布控制
    this.els.btnPrev.addEventListener('click', () => this.canvas.prevStroke());
    this.els.btnNext.addEventListener('click', () => this.canvas.nextStroke());
    this.els.btnClear.addEventListener('click', () => this.canvas.clearInk());
    
    this.els.btnReplay.addEventListener('click', () => {
      this.canvas.clearInk();
      this.canvas.startAutoPlay(() => this.updatePlayBubbleState(false));
      this.updatePlayBubbleState(true);
    });

    this.els.btnPlayBubble.addEventListener('click', () => {
      const isPlaying = this.canvas.toggleAutoPlay(() => this.updatePlayBubbleState(false));
      this.updatePlayBubbleState(isPlaying);
    });

    // 語音播放 (TTS)
    this.els.btnAudioCantonese.addEventListener('click', () => this.speak(this.currentData?.char, 'zh-HK'));
    this.els.btnAudioMandarin.addEventListener('click', () => this.speak(this.currentData?.char, 'zh-CN'));

    // 語言切換
    this.els.langSelectors.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const lang = target.dataset.lang as Locale;
        if (lang) {
          i18n.setLocale(lang);
          this.updateLangSelectorUI(lang);
        }
      });
    });
  }

  private setupI18n() {
    // 初始化 UI 狀態
    this.updateLangSelectorUI(i18n.getLocale());
    this.updateTexts();

    // 訂閱語系變更
    i18n.subscribe(() => {
      this.updateTexts();
      this.updateMetaDataUI(); // 重新渲染部首/筆畫數單位
    });
  }

  private updateLangSelectorUI(currentLang: Locale) {
    this.els.langSelectors.forEach(btn => {
      const isSelected = btn.dataset.lang === currentLang;
      btn.setAttribute('aria-checked', isSelected.toString());
      if (isSelected) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  private updateTexts() {
    // Header
    document.getElementById('ui-title')!.textContent = i18n.t('app.title');
    document.getElementById('ui-desc')!.textContent = i18n.t('ui.description');
    
    // Search
    this.els.inputChar.placeholder = i18n.t('ui.search.placeholder');
    this.els.btnSearch.textContent = i18n.t('ui.search.button');
    
    // Controls
    this.els.btnPrev.textContent = i18n.t('ui.button.prev');
    this.els.btnNext.textContent = i18n.t('ui.button.next');
    this.els.btnReplay.textContent = i18n.t('ui.button.replay');
    this.els.btnClear.textContent = i18n.t('ui.button.clear');

    // Labels
    document.querySelector('.label-radical')!.textContent = i18n.t('ui.meta.radical');
    document.querySelector('.label-total-strokes')!.textContent = i18n.t('ui.meta.totalStrokes');
    document.querySelector('.label-pronounce')!.textContent = i18n.t('ui.meta.pronounce');
    document.querySelector('.label-cantonese')!.textContent = i18n.t('ui.meta.cantonese');
    document.querySelector('.label-mandarin')!.textContent = i18n.t('ui.meta.mandarin');

    // Warning Banner (如果存在且正在顯示)
    if (this.currentData && this.currentData.level !== 'HK_STANDARD') {
      this.els.warningBanner.textContent = i18n.t('ui.alert.unverified');
    }
  }

  private handleSearch() {
    const input = this.els.inputChar.value.trim();
    if (!input) return;
    
    // 嚴格擷取第一個字元 (支援 Surrogate Pairs)
    const char = Array.from(input)[0];
    this.loadCharacter(char);
  }

  private async loadCharacter(char: string) {
    const codePoint = char.codePointAt(0);
    if (!codePoint) return;
    
    const unicode = codePoint.toString(16).toUpperCase().padStart(4, '0');
    // 動態解析 Base URL，確保在 GitHub Pages 與本地開發環境皆可正確載入字庫
    const baseUrl = import.meta.env.BASE_URL || '/';
    const dataUrl = `${baseUrl}data/${unicode}.json`;

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) throw new Error('Character not found');
      
      const data: CharacterData = await response.json();
      this.currentData = data;
      
      // 載入畫布
      this.canvas.loadCharacter(data);
      this.updateMetaDataUI();
      
      // 自動播放筆順
      this.canvas.startAutoPlay(() => this.updatePlayBubbleState(false));
      this.updatePlayBubbleState(true);
      
      // 處理資料治理警告標籤
      if (data.level === 'HK_STANDARD') {
        this.els.warningBanner.style.display = 'none';
      } else {
        this.els.warningBanner.style.display = 'block';
        this.els.warningBanner.textContent = i18n.t('ui.alert.unverified');
      }
      
    } catch (err) {
      console.warn(`[KidsWriteTC] Failed to load character: ${char}`, err);
      alert(i18n.t('ui.alert.notFound', { char }));
      this.currentData = null;
      this.canvas.clearData();
      this.updateMetaDataUI();
      this.els.warningBanner.style.display = 'none';
      this.updatePlayBubbleState(false);
    }
  }

  private updateMetaDataUI() {
    if (!this.currentData) {
      this.els.metaRadical.textContent = '—';
      this.els.metaTotalStrokes.textContent = '—';
      this.els.metaJyutping.textContent = '—';
      this.els.metaPinyin.textContent = '—';
      
      this.els.btnAudioCantonese.style.display = 'none';
      this.els.btnAudioMandarin.style.display = 'none';
      return;
    }

    const { radical, totalStrokes, jyutping, pinyin } = this.currentData;
    
    this.els.metaRadical.textContent = radical && radical !== '—' 
      ? `${radical}${i18n.t('ui.unit.radical_suffix')}` 
      : '—';
      
    this.els.metaTotalStrokes.textContent = `${totalStrokes} ${i18n.t('ui.unit.strokes')}`;

    // 處理多音字顯示
    this.els.metaJyutping.textContent = jyutping && jyutping.length > 0 ? jyutping.join(' / ') : '—';
    this.els.metaPinyin.textContent = pinyin && pinyin.length > 0 ? pinyin.join(' / ') : '—';

    // 顯示/隱藏發音按鈕
    this.els.btnAudioCantonese.style.display = (jyutping && jyutping.length > 0) ? 'inline-flex' : 'none';
    this.els.btnAudioMandarin.style.display = (pinyin && pinyin.length > 0) ? 'inline-flex' : 'none';
  }

  private updatePlayBubbleState(isPlaying: boolean) {
    this.els.btnPlayBubble.textContent = isPlaying ? '⏸' : '▶';
    this.els.btnPlayBubble.setAttribute('aria-label', isPlaying ? i18n.t('ui.button.pause') : i18n.t('ui.button.play'));
  }

  private speak(text: string | undefined, lang: 'zh-HK' | 'zh-CN') {
    if (!text || !this.synth) return;
    
    // 中斷目前播放
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // 放慢語速，適合學童聆聽
    
    this.synth.speak(utterance);
  }
}

// 確保 DOM 載入完畢後再初始化應用程式
window.addEventListener('DOMContentLoaded', () => {
  new KidsWriteApp();
});
