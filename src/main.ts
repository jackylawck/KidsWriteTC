// src/main.ts
import './easter-egg'; // 
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

// =================================================================
// 📜 F12 控制台：倉頡時空彩蛋模組 (Cangjie Easter Egg CLI)
// =================================================================
(function initConsoleEasterEgg() {
  const S_BAMBOO = 'background: #2b1d0c; color: #f5deb3; font-family: "PingFang HK", "MingLiU", monospace; font-size: 12px; line-height: 1.8; padding: 12px 16px; border-left: 6px solid #d4af37; border-radius: 4px; display: block;';
  const S_TITLE = 'background: #d4af37; color: #1a0f00; font-family: "PingFang HK", sans-serif; font-size: 13px; font-weight: 900; padding: 4px 10px; border-radius: 2px;';
  const S_TIP = 'background: #0f172a; color: #38bdf8; font-family: "PingFang HK", monospace; font-size: 11.5px; line-height: 1.6; padding: 10px 14px; border-left: 5px solid #0284c7; display: block;';

  (window as unknown as { cangjie: unknown }).cangjie = Object.freeze({
    letter: function () {
      console.log('%c📜【造字官倉頡 給二十一世紀香港學童的親筆信】', S_TITLE);
      console.log(
        '%c小友你好：\n\n' +
        '我係四千幾年前喺泥土睇鳥獸腳印造字嘅倉頡。\n' +
        '第一次嚟到現代香港，見到小學手冊入面嗰啲「警、禮、護、讀」，我都睇到眼花繚亂！\n' +
        '老實講，如果今日要我同你一齊默書，我都未必拿滿分。\n\n' +
        '但你知唔知？繁體字係全世界最靚嘅密碼積木：\n' +
        '每一橫係地平線，每一豎係頂天立地嘅大樹，\n' +
        '只要拆開部首、順住筆順慢慢起樓，每一隻字都裝住一個故事。\n\n' +
        '寫字出界？唔緊要，我都成日畫出泥地！\n' +
        '慢慢寫，呼吸一下，你寫出嚟嘅每一筆，都係同幾千年嘅我喺時空擊掌。\n\n' +
        '—— 正在努力練習寫自己個名嘅 倉頡 筆',
        S_BAMBOO
      );
      return '倉頡阿叔同你擊咗個掌！請輸入 cangjie.tips() 查看三大練字秘笈。';
    },
    tips: function () {
      console.log(
        '%c🛠️【倉頡現代求生．練字三大秘笈】\n\n' +
        '1. 【字係積木，唔好死記】👉 唔好硬記廿劃！認清部首（水、木、言、心），拆散再拼合。\n' +
        '2. 【筆順係力學結構】👉 先橫後豎、從上至下、外圍起好先關門，隻字先至企得穩。\n' +
        '3. 【中間坐穩，四周呼吸】👉 米字格好珍貴，字重心擺中間，留少少空間畀字呼吸。',
        S_TIP
      );
      return '秘笈已傳授！在搜尋框輸入「倉頡」查看時空信件！';
    }
  });
})();

function initApp() {
  // 終極防線 1：強制喚醒 iOS Safari 語音庫，解決 getVoices() 偷懶回傳空陣列的 Bug
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  // 1. 狀態變數
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
    if (isError) elWarning.classList.add('warning-error');
    else elWarning.classList.remove('warning-error');
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
    if (level === 'HK_DIVERGENT') showWarning(i18n.t('ui.alert.divergent'));
    else hideWarning();
  };

  const searchAndLoad = async (char: string) => {
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
    utterance.lang = lang; // 基礎防線
    utterance.rate = 0.85;

    // 終極防線 2：擴充中文名稱比對，並抓出系統真實發音人
    const voices = synth.getVoices();
    let targetVoice = undefined;

    if (lang === 'zh-HK') {
      targetVoice = voices.find(v => /yue|cantonese|hong kong|zh-hk|粵|廣東/i.test(v.name + ' ' + v.lang));
    } else if (lang === 'zh-CN') {
      targetVoice = voices.find(v => 
        /zh-cn|zh-tw|mandarin|cmn|普通|國語|ting-ting|meijia|yaling/i.test(v.lang + ' ' + v.name) && 
        !/yue|cantonese|hong kong|zh-hk|粵|廣東/i.test(v.name + ' ' + v.lang)
      );
    }

    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    synth.speak(utterance);
  };

  // 📜 觸發倉頡時空信件互動彈窗
  const showCangjieModal = () => {
    const existing = document.getElementById('cangjie-easter-egg');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cangjie-easter-egg';
    overlay.className = 'cangjie-overlay';
    overlay.innerHTML = `
      <div class="cangjie-modal" role="dialog" aria-modal="true" aria-labelledby="cj-title">
        <div class="cangjie-header">
          <span class="cangjie-badge">造字之神・穿越時空</span>
          <h2 id="cj-title" class="cangjie-title">📜 倉頡大叔給小朋友的信</h2>
        </div>
        
        <div class="cangjie-letter">
          小友你好！我係四千年前喺泥土睇鳥獸腳印造字嘅倉頡。<br><br>
          第一次嚟到現代香港，見到小學手冊入面嗰啲「警、禮、護、讀」，連我都睇到眼花！老實講，如果今日要我同你一齊默書，我都未必拿滿分。<br><br>
          繁體字係全世界最靚嘅密碼積木。寫字出界？唔緊要，我都成日畫出泥地！慢慢寫，每一筆都係同幾千年嘅我喺時空擊掌。
        </div>

        <div class="cangjie-tips-box">
          <div class="cangjie-tips-title">💡 倉頡現代求生．練字三大秘笈</div>
          <div class="cangjie-tip-item">
            <span class="cangjie-tip-num">1</span>
            <div><strong>字係積木，唔好死記：</strong>認清部首（水、木、言、心），拆開再拼，廿筆劃即刻變分解動作。</div>
          </div>
          <div class="cangjie-tip-item">
            <span class="cangjie-tip-num">2</span>
            <div><strong>筆順係起樓力學：</strong>先橫後豎、由上而下、先入後關門，隻字先至企得穩唔會冧。</div>
          </div>
          <div class="cangjie-tip-item">
            <span class="cangjie-tip-num">3</span>
            <div><strong>中間坐穩，四周呼吸：</strong>米字格好珍貴，重心放正中間，四邊留返窗位畀字呼吸。</div>
          </div>
        </div>

        <button type="button" class="cangjie-btn-close" id="btn-close-cangjie">一齊練字！倉頡示範寫個「倉」字</button>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeModal = () => {
      overlay.remove();
      window.removeEventListener('keydown', handleEsc);
      elInput.value = '倉';
      searchAndLoad('倉');
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    overlay.querySelector('#btn-close-cangjie')?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    window.addEventListener('keydown', handleEsc);
  };

  const handleSearch = () => {
    const input = elInput.value.trim();
    if (!input) return;

    // 🎯 觸發倉頡時空彩蛋
    if (input === '倉頡') {
      showCangjieModal();
      return;
    }

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
