// src/main.ts
import './style.css';
import { TraceCanvas } from './ui/canvas-trace';
import { i18n, Locale } from './core/i18n';

// 本地字元資料型別定義（解耦 scripts/build-data，符合純淨編譯標準）
export interface FullCharData {
  char: string;
  unicode: string;
  radical: string;
  totalStrokes: number;
  cantonese: {
    jyutping: string;
    homophone: string;
  };
  mandarin: {
    pinyin: string;
  };
  strokes: string[];
}

function initApp() {
  const traceCanvas = new TraceCanvas('trace-canvas', 'stroke-badge');
  const baseUrl = import.meta.env.BASE_URL;

  // DOM 元素選取
  const inputChar = document.getElementById('input-char') as HTMLInputElement;
  const btnSearch = document.getElementById('btn-search');
  const btnPlayBubble = document.getElementById('btn-play-bubble') as HTMLButtonElement;
  
  const elRadical = document.getElementById('meta-radical');
  const elTotalStrokes = document.getElementById('meta-total-strokes');
  const elJyutping = document.getElementById('meta-jyutping');
  const elHomophone = document.getElementById('meta-homophone');
  const elPinyin = document.getElementById('meta-pinyin');

  let currentCharData: FullCharData | null = null;

  // 原生語音合成播放 (香港粵語 zh-HK / 普通話 zh-CN)
  const speakText = (text: string, lang: 'zh-HK' | 'zh-CN') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // 適度微調語速，便利學童跟讀
    window.speechSynthesis.speak(utterance);
  };

  // 更新右側屬性卡片
  const updateMetaCard = (data: FullCharData) => {
    currentCharData = data;
    if (elRadical) elRadical.textContent = data.radical;
    if (elTotalStrokes) {
      elTotalStrokes.textContent = `${data.totalStrokes} ${i18n.t('ui.unit.strokes')}`;
    }
    if (elJyutping) elJyutping.textContent = data.cantonese.jyutping;
    if (elHomophone) {
      elHomophone.textContent = data.cantonese.homophone ? `〔${data.cantonese.homophone}〕` : '';
    }
    if (elPinyin) elPinyin.textContent = data.mandarin.pinyin;
  };

  // 查詢漢字並動態載入靜態分片 (Zero-Trust GET)
  const searchAndLoad = async (char: string) => {
    if (!char) return;
    const unicode = char.charCodeAt(0).toString(16).toUpperCase();

    try {
      const res = await fetch(`${baseUrl}data/${unicode}.json`);
      if (!res.ok) throw new Error('Not found');
      const data: FullCharData = await res.json();
      
      updateMetaCard(data);
      traceCanvas.loadCharacter(data);
      btnPlayBubble.textContent = '▶';
    } catch {
      alert(i18n.t('ui.alert.notFound', { char }));
    }
  };

  // 1. 綁定搜尋輸入
  btnSearch?.addEventListener('click', () => searchAndLoad(inputChar.value.trim()));
  inputChar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchAndLoad(inputChar.value.trim());
  });

  // 2. 圓形播放暫停控制
  btnPlayBubble?.addEventListener('click', () => {
    const isPlaying = traceCanvas.toggleAutoPlay(() => {
      btnPlayBubble.textContent = '▶';
    });
    btnPlayBubble.textContent = isPlaying ? '⏸' : '▶';
  });

  // 3. 筆劃微調控制
  document.getElementById('btn-prev-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    btnPlayBubble.textContent = '▶';
    traceCanvas.prevStroke();
  });

  document.getElementById('btn-next-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    btnPlayBubble.textContent = '▶';
    traceCanvas.nextStroke();
  });

  document.getElementById('btn-replay')?.addEventListener('click', () => {
    btnPlayBubble.textContent = '⏸';
    traceCanvas.startAutoPlay(() => {
      btnPlayBubble.textContent = '▶';
    });
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    traceCanvas.clear();
  });

  // 4. 發音按鈕
  document.getElementById('btn-audio-cantonese')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-HK');
  });

  document.getElementById('btn-audio-mandarin')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-CN');
  });

  // 5. 多語系 DOM 即時刷新監聽
  const updateUITranslations = () => {
    const descEl = document.getElementById('ui-desc');
    if (descEl) descEl.textContent = i18n.t('app.description');

    const searchLabel = document.querySelector('.search-label');
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

    if (currentCharData) updateMetaCard(currentCharData);
  };

  i18n.subscribe(updateUITranslations);

  // 頂部語系按鈕切換
  document.querySelectorAll('.lang-selector button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const lang = target.getAttribute('data-lang') as Locale;
      if (lang) {
        i18n.setLocale(lang);
      }
    });
  });

  // 初次執行多語系文字注入
  updateUITranslations();

  // 初始化載入「上」字
  searchAndLoad('上');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
