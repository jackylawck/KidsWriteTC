// src/main.ts
import './style.css';
import { TraceCanvas, StrokeData } from './ui/canvas-trace';
import { i18n, Locale } from './core/i18n';

// Manifest 資料治理介面
interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: 'UNVERIFIED' | 'HK_STANDARD' | 'FALLBACK';
}

interface ManifestData {
  source: string;
  standard: string;
  generatedAt: string;
  entries: Record<string, ManifestEntry>;
}

function initApp() {
  // 初始化雙層畫布架構
  const traceCanvas = new TraceCanvas('trace-canvas', 'ink-canvas', 'stroke-badge');
  const baseUrl = import.meta.env.BASE_URL;

  // DOM 元素選取
  const inputChar = document.getElementById('input-char') as HTMLInputElement;
  const btnSearch = document.getElementById('btn-search');
  const btnPlayBubble = document.getElementById('btn-play-bubble') as HTMLButtonElement;
  
  const elTotalStrokes = document.getElementById('meta-total-strokes');
  const elWarning = document.getElementById('standard-warning');
  const langSelector = document.querySelector('.lang-selector');

  let currentCharData: StrokeData | null = null;
  let appManifest: ManifestData | null = null;
  let currentSearchController: AbortController | null = null; // 防競態條件

  // UI 警示橫幅控制器 (取代 alert)
  const showWarning = (message: string, isError: boolean = false) => {
    if (!elWarning) return;
    elWarning.textContent = message;
    elWarning.classList.toggle('warning-error', isError);
    elWarning.classList.add('visible');
  };

  const hideWarning = () => {
    if (elWarning) elWarning.classList.remove('visible');
  };

  // 預先載入 Manifest 索引
  const loadManifest = async () => {
    try {
      const res = await fetch(`${baseUrl}data/manifest.json`);
      if (res.ok) {
        appManifest = await res.json();
      }
    } catch (err) {
      console.error('Manifest 載入失敗', err);
    }
  };

  // 預先觸發 voices 載入 (解決 Chrome / Safari 非同步載入機制)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices(); 
  }

  // 原生語音合成播放 (加入 TTS 引擎防呆檢查)
  const speakText = (text: string, lang: 'zh-HK' | 'zh-CN') => {
    if (!('speechSynthesis' in window)) return;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // 寬鬆精準的 BCP-47 / 本地化標籤辨識
      const targetLang = lang.toLowerCase();
      const hasVoice = voices.some(v => {
        const vLang = v.lang.replace('_', '-').toLowerCase();
        return vLang.startsWith(targetLang) || 
               (targetLang === 'zh-hk' && vLang.startsWith('yue'));
      });
      
      if (!hasVoice) {
        showWarning(i18n.t('ui.alert.ttsUnavailable') || `您的設備未安裝 ${lang} 語音包`, true);
        return;
      }
    } else {
      showWarning('語音引擎準備中，請稍後再試', true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // 適度微調語速，便利學童跟讀
    window.speechSynthesis.speak(utterance);
  };

  // 狀態與渲染解耦
  const setCurrentCharData = (data: StrokeData) => {
    currentCharData = data;
    renderMetaCard();
  };

  const renderMetaCard = () => {
    if (!currentCharData || !elTotalStrokes) return;
    const strokesCount = currentCharData.totalStrokes || currentCharData.strokes.length;
    elTotalStrokes.textContent = `${strokesCount} ${i18n.t('ui.unit.strokes')}`;
  };

  // 查詢漢字 (含競態條件防護與資料治理驗證)
  const searchAndLoad = async (char: string) => {
    if (!char) {
      inputChar?.focus();
      return;
    }
    
    // 取消前一個正在進行的 Fetch 請求 (解決連續輸入時的競態覆蓋)
    if (currentSearchController) {
      currentSearchController.abort();
    }
    currentSearchController = new AbortController();
    const { signal } = currentSearchController;

    // 支援擴展區漢字
    const codePoint = char.codePointAt(0);
    if (!codePoint) return;
    const unicode = codePoint.toString(16).toUpperCase().padStart(4, '0');

    // 確保 manifest 已載入，否則報錯阻擋 (Fail-Safe)
    if (!appManifest) {
      showWarning(i18n.t('ui.alert.dataUnavailable') || '字庫索引載入失敗，請重整頁面', true);
      return;
    }

    // O(1) 查表並動態清理/顯示警示
    const entryMeta = appManifest.entries[unicode];
    if (!entryMeta) {
      hideWarning();
    } else if (entryMeta.level === 'UNVERIFIED') {
      showWarning(i18n.t('ui.alert.unverified'));
    } else {
      hideWarning();
    }

    try {
      const res = await fetch(`${baseUrl}data/${unicode}.json`, { signal });
      if (!res.ok) throw new Error('Not found');
      
      const data: StrokeData = await res.json();
      data.totalStrokes = entryMeta?.totalStrokes || data.strokes.length;
      
      setCurrentCharData(data);
      traceCanvas.loadCharacter(data);
      
      // 更新按鈕狀態
      if (btnPlayBubble) {
        btnPlayBubble.textContent = '▶';
        btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.play') || '播放');
      }
    } catch (err: unknown) {
      // 忽略因使用者連續輸入而被 Abort 的請求
      if (err instanceof Error && err.name === 'AbortError') return;
      showWarning(i18n.t('ui.alert.notFound', { char }) || `找不到「${char}」的資料`, true);
    }
  };

  const handleSearch = () => {
    const val = inputChar.value.trim();
    if (!val) {
      inputChar.focus();
      return;
    }
    searchAndLoad(val);
  };

  // === 事件綁定區 ===
  
  btnSearch?.addEventListener('click', handleSearch);
  inputChar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // 動態切換 aria-label 的播放暫停按鈕
  btnPlayBubble?.addEventListener('click', () => {
    const isPlaying = traceCanvas.toggleAutoPlay(() => {
      btnPlayBubble.textContent = '▶';
      btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.play') || '播放');
    });
    btnPlayBubble.textContent = isPlaying ? '⏸' : '▶';
    btnPlayBubble.setAttribute(
      'aria-label', 
      isPlaying ? (i18n.t('ui.button.pause') || '暫停') : (i18n.t('ui.button.play') || '播放')
    );
  });

  document.getElementById('btn-prev-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    if (btnPlayBubble) {
      btnPlayBubble.textContent = '▶';
      btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.play') || '播放');
    }
    traceCanvas.prevStroke();
  });

  document.getElementById('btn-next-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    if (btnPlayBubble) {
      btnPlayBubble.textContent = '▶';
      btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.play') || '播放');
    }
    traceCanvas.nextStroke();
  });

  // 重播按鈕：交給 loadCharacter 內部重置所有狀態與筆跡
  document.getElementById('btn-replay')?.addEventListener('click', () => {
    if (!currentCharData) return;
    
    if (btnPlayBubble) {
      btnPlayBubble.textContent = '⏸';
      btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.pause') || '暫停');
    }
    
    traceCanvas.loadCharacter(currentCharData); 
    traceCanvas.startAutoPlay(() => {
      if (btnPlayBubble) {
        btnPlayBubble.textContent = '▶';
        btnPlayBubble.setAttribute('aria-label', i18n.t('ui.button.play') || '播放');
      }
    });
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    traceCanvas.clearInk();
  });

  document.getElementById('btn-audio-cantonese')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-HK');
  });

  document.getElementById('btn-audio-mandarin')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-CN');
  });

  // 多語系 DOM 即時刷新監聽
  const updateUITranslations = () => {
    const titleEl = document.getElementById('ui-title');
    if (titleEl) titleEl.textContent = i18n.t('app.title') || '童寫繁體字 KidsWriteTC';

    const descEl = document.getElementById('ui-desc');
    if (descEl) descEl.textContent = i18n.t('ui.description'); 

    if (inputChar) {
      inputChar.placeholder = i18n.t('ui.search.placeholder') || '輸入單字';
    }

    const searchLabel = document.querySelector('label[for="input-char"]');
    if (searchLabel) searchLabel.textContent = i18n.t('ui.search.label');

    if (btnSearch) btnSearch.textContent = i18n.t('ui.search.button');

    const btnPrev = document.getElementById('btn-prev-stroke');
    if (btnPrev) btnPrev.textContent = i18n.t('ui.button.prev');

    const btnNext = document.getElementById('btn-next-stroke');
    if (btnNext) btnNext.textContent = i18n.t('ui.button.next');

    const btnReplay = document.getElementById('btn-replay');
    if (btnReplay) btnReplay.textContent = i18n.t('ui.button.replay');

    const btnClear = document.getElementById('btn-clear');
    if (btnClear) btnClear.textContent = i18n.t('ui.button.clear');

    const labelRadical = document.querySelector('.label-radical');
    if (labelRadical) labelRadical.textContent = i18n.t('ui.meta.radical');

    const labelTotalStrokes = document.querySelector('.label-total-strokes');
    if (labelTotalStrokes) labelTotalStrokes.textContent = i18n.t('ui.meta.totalStrokes');

    const labelPronounce = document.querySelector('.label-pronounce');
    if (labelPronounce) labelPronounce.textContent = i18n.t('ui.meta.pronounce');

    const labelCantonese = document.querySelector('.label-cantonese');
    if (labelCantonese) labelCantonese.textContent = i18n.t('ui.meta.cantonese');

    const labelMandarin = document.querySelector('.label-mandarin');
    if (labelMandarin) labelMandarin.textContent = i18n.t('ui.meta.mandarin');

    if (langSelector) langSelector.setAttribute('aria-label', i18n.t('ui.languageSelector') || '語言選擇');

    renderMetaCard(); 
  };

  const unsubscribeI18n = i18n.subscribe(updateUITranslations);

  // 生命週期清理防洩漏
  window.addEventListener('beforeunload', () => {
    unsubscribeI18n();
    traceCanvas.destroy();
  });

  // 語系按鈕事件：更新狀態並通知 i18n
  document.querySelectorAll('.lang-selector button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement; 
      const lang = target.getAttribute('data-lang') as Locale;
      if (lang) {
        i18n.setLocale(lang);
        document.querySelectorAll('.lang-selector button').forEach(b => {
          b.setAttribute('aria-checked', b === target ? 'true' : 'false');
        });
      }
    });
  });

  // === 初始啟動順序 ===
  // 1. 初始化語系
  // 2. 拉取 Manifest
  // 3. 安全載入第一筆合法字 (排除擴展區陷阱)
  updateUITranslations();
  loadManifest().then(() => {
    if (inputChar) inputChar.value = '';
    
    if (appManifest && Object.keys(appManifest.entries).length > 0) {
      const entries = appManifest.entries;
      // 優先載入標準預設字 (4E0A=上, 4E00=一)
      const defaultEntry = entries['4E0A'] || entries['4E00'];
      
      if (defaultEntry) {
        searchAndLoad(defaultEntry.char);
      } else {
        // Fallback: 過濾掉純數字索引 (如 3400 等擴展區)，找一個常見的 BMP 字元
        const fallbackKey = Object.keys(entries)
          .filter(k => /^[4-9A-F][0-9A-F]{3}$/i.test(k))
          .sort()[0];
          
        const fallbackChar = fallbackKey ? entries[fallbackKey].char : Object.values(entries)[0].char;
        searchAndLoad(fallbackChar);
      }
    } else {
      showWarning(i18n.t('ui.alert.dataUnavailable') || '字庫索引為空或載入失敗', true);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
