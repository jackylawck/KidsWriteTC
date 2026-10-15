// src/main.ts
import { TraceCanvas, StrokeData } from './ui/canvas-trace';
import { i18n, Locale } from './core/i18n';

export type GovernanceLevel = 'HK_VERIFIED' | 'HK_LIKELY' | 'HK_DIVERGENT';

interface ManifestEntry {
  char: string;
  unicode: string;
  totalStrokes: number;
  hasMedians: boolean;
  level: GovernanceLevel;
}

interface AppManifest {
  schemaVersion: string;
  standard: string;
  stats: Record<GovernanceLevel, number>;
  entries: Record<string, ManifestEntry>;
}

function initApp() {
  // 1. 狀態變數 (純閉包管理，無 this 包袱)
  let appManifest: AppManifest | null = null;
  let currentCharData: StrokeData | null = null;
  let currentSearchController: AbortController | null = null;
  const synth = window.speechSynthesis;

  // 2. 初始化核心畫布引擎
  const traceCanvas = new TraceCanvas('trace-canvas', 'ink-canvas', 'stroke-badge');

  // 3. DOM 節點擷取
  const elInput = document.getElementById('input-char') as HTMLInputElement;
  const elBtnSearch = document.getElementById('btn-search') as HTMLButtonElement;
  const elWarning = document.getElementById('standard-warning') as HTMLElement | null;
  const elBadgeVerified = document.getElementById('badge-verified') as HTMLElement | null;
  
  const btnPrev = document.getElementById('btn-prev-stroke') as HTMLButtonElement;
  const btnNext = document.getElementById('btn-next-stroke') as HTMLButtonElement;
  const btnReplay = document.getElementById('btn-replay') as HTMLButtonElement;
  const btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
  const btnPlayBubble = document.getElementById('btn-play-bubble') as HTMLButtonElement;
  
  const metaRadical = document.getElementById('meta-radical') as HTMLElement;
  const metaTotalStrokes = document.getElementById('meta-total-strokes') as HTMLElement;
  const metaJyutping = document.getElementById('meta-jyutping') as HTMLElement;
  const metaPinyin = document.getElementById('meta-pinyin') as HTMLElement;
  
  const btnAudioCantonese = document.getElementById('btn-audio-cantonese') as HTMLButtonElement;
  const btnAudioMandarin = document.getElementById('btn-audio-mandarin') as HTMLButtonElement;
  const langSelectors = document.querySelectorAll('.lang-selector button');

  // 4. UI 調度輔助函式
  const showWarning = (text: string, isError = false) => {
    if (!elWarning) return;
    elWarning.style.display = 'block';
    elWarning.classList.add('visible');
    if (isError) {
      elWarning.classList.add('warning-error');
    } else {
      elWarning.classList.remove('warning-error');
    }
    elWarning.textContent = text;
  };

  const hideWarning = () => {
    if (!elWarning) return;
    elWarning.style.display = 'none';
    elWarning.classList.remove('visible', 'warning-error');
  };

  const setVerifiedBadge = (visible: boolean) => {
    if (!elBadgeVerified) return;
    elBadgeVerified.classList.toggle('visible', visible);
    if (visible) {
      elBadgeVerified.setAttribute('aria-label', i18n.t('ui.badge.verified'));
      elBadgeVerified.setAttribute('title', i18n.t('ui.badge.verified'));
    }
  };

  const updatePlayBubbleState = (isPlaying: boolean) => {
    if (!btnPlayBubble) return;
    btnPlayBubble.textContent = isPlaying ? '⏸' : '▶';
    btnPlayBubble.setAttribute('aria-label', isPlaying ? i18n.t('ui.button.pause') : i18n.t('ui.button.play'));
  };

  const updateTexts = () => {
    document.getElementById('ui-title')!.textContent = i18n.t('app.title');
    document.getElementById('ui-desc')!.textContent = i18n.t('ui.description');
    elInput.placeholder = i18n.t('ui.search.placeholder');
    elBtnSearch.textContent = i18n.t('ui.search.button');
    btnPrev.textContent = i18n.t('ui.button.prev');
    btnNext.textContent = i18n.t('ui.button.next');
    btnReplay.textContent = i18n.t('ui.button.replay');
    btnClear.textContent = i18n.t('ui.button.clear');
    
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

    if (currentCharData && appManifest) {
       const unicode = currentCharData.char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0');
       if (unicode) updateGovernanceUI(unicode);
    }
  };

  const updateLangSelectorUI = (currentLang: Locale) => {
    langSelectors.forEach(btn => {
      const isSelected = (btn as HTMLElement).dataset.lang === currentLang;
      btn.setAttribute('aria-checked', isSelected.toString());
      isSelected ? btn.classList.add('active') : btn.classList.remove('active');
    });
  };

  const renderMetaCard = () => {
    if (!currentCharData) {
      metaRadical.textContent = '—';
      metaTotalStrokes.textContent = '—';
      metaJyutping.textContent = '—';
      metaPinyin.textContent = '—';
      btnAudioCantonese.style.display = 'none';
      btnAudioMandarin.style.display = 'none';
      return;
    }

    const { radical, totalStrokes, jyutping, pinyin } = currentCharData;
    metaRadical.textContent = radical && radical !== '—' ? `${radical}${i18n.t('ui.unit.radical_suffix')}` : '—';
    metaTotalStrokes.textContent = `${totalStrokes} ${i18n.t('ui.unit.strokes')}`;
    metaJyutping.textContent = jyutping && jyutping.length > 0 ? jyutping.join(' / ') : '—';
    metaPinyin.textContent = pinyin && pinyin.length > 0 ? pinyin.join(' / ') : '—';
    
    btnAudioCantonese.style.display = (jyutping && jyutping.length > 0) ? 'inline-flex' : 'none';
    btnAudioMandarin.style.display = (pinyin && pinyin.length > 0) ? 'inline-flex' : 'none';
  };

  const setCurrentCharData = (data: StrokeData | null) => {
    currentCharData = data;
    renderMetaCard();
  };

  const updateGovernanceUI = (unicode: string) => {
    const entry = appManifest?.entries?.[unicode];
    const level: GovernanceLevel = entry?.level ?? 'HK_LIKELY'; 
    
    setVerifiedBadge(level === 'HK_VERIFIED');
    
    if (level === 'HK_DIVERGENT') {
      showWarning(i18n.t('ui.alert.divergent'));
    } else {
      hideWarning();
    }
  };

  const searchAndLoad = async (char: string) => {
    // 競態保護 (Race Condition Protection)
    if (currentSearchController) currentSearchController.abort();
    currentSearchController = new AbortController();
    const { signal } = currentSearchController;

    const codePoint = char.codePointAt(0);
    if (!codePoint) return;
    
    const unicode = codePoint.toString(16).toUpperCase().padStart(4, '0');
    const baseUrl = import.meta.env.BASE_URL || '/';
    
    try {
      const response = await fetch(`${baseUrl}data/${unicode}.json`, { signal });
      if (!response.ok) throw new Error('Not found');
      
      const data: StrokeData = await response.json();
      setCurrentCharData(data);
      
      traceCanvas.loadCharacter(data);
      updateGovernanceUI(unicode);
      
      traceCanvas.startAutoPlay(() => updatePlayBubbleState(false));
      updatePlayBubbleState(true);
      
    } catch (err) {
      // 忽略因使用者快速輸入而被阻斷的舊請求
      if (err instanceof Error && err.name === 'AbortError') return;
      
      showWarning(i18n.t('ui.alert.notFound', { char }), true);
      
      setCurrentCharData(null);
      traceCanvas.clearData();
      setVerifiedBadge(false);
      updatePlayBubbleState(false);
    }
  };

  const speak = (text: string | undefined, lang: 'zh-HK' | 'zh-CN') => {
    if (!text || !synth) return;
    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;
    synth.speak(utterance);
  };

  const handleSearch = () => {
    const input = elInput.value.trim();
    if (!input) return;
    const char = Array.from(input)[0];
    searchAndLoad(char);
  };

  // 5. 綁定事件與語系訂閱
  elBtnSearch.addEventListener('click', handleSearch);
  elInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
  
  btnPrev.addEventListener('click', () => traceCanvas.prevStroke());
  btnNext.addEventListener('click', () => traceCanvas.nextStroke());
  btnClear.addEventListener('click', () => traceCanvas.clearInk());
  
  btnReplay.addEventListener('click', () => {
    traceCanvas.clearInk();
    traceCanvas.startAutoPlay(() => updatePlayBubbleState(false));
    updatePlayBubbleState(true);
  });

  btnPlayBubble.addEventListener('click', () => {
    const isPlaying = traceCanvas.toggleAutoPlay(() => updatePlayBubbleState(false));
    updatePlayBubbleState(isPlaying);
  });

  btnAudioCantonese.addEventListener('click', () => speak(currentCharData?.char, 'zh-HK'));
  btnAudioMandarin.addEventListener('click', () => speak(currentCharData?.char, 'zh-CN'));

  langSelectors.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const lang = target.dataset.lang as Locale;
      if (lang) {
        i18n.setLocale(lang);
        updateLangSelectorUI(lang);
      }
    });
  });

  i18n.subscribe(() => {
    updateTexts();
    renderMetaCard();
  });

  // 初始 UI 渲染
  updateLangSelectorUI(i18n.getLocale());
  updateTexts();

  // 6. 載入 SSOT Manifest 並啟動預設字元
  const loadApp = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const res = await fetch(`${baseUrl}data/manifest.json`);
      if (res.ok) appManifest = await res.json();
    } catch (err) {
      console.warn('[KidsWriteTC] Manifest 載入失敗', err);
    } finally {
      searchAndLoad('上');
    }
  };

  loadApp();
}

window.addEventListener('DOMContentLoaded', initApp);
