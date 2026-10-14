// src/main.ts
import './style.css';
import { i18n, Locale } from './core/i18n';
import { TraceCanvas, StrokeData } from './ui/canvas-trace';

interface ManifestItem {
  char: string;
  unicode: string;
  totalStrokes: number;
}

function initApp() {
  // 1. 初始化描紅畫布
  const traceCanvas = new TraceCanvas('trace-canvas');
  let charList: ManifestItem[] = [];
  let currentIndex = 0;

  // 取得 Vite 設定的 base 路徑（支援本機與 GitHub Pages）
  const baseUrl = import.meta.env.BASE_URL;

  // 載入指定索引的漢字分片資料
  const loadCharacterByIndex = async (index: number) => {
    if (charList.length === 0) return;
    const item = charList[index];
    try {
      const res = await fetch(`${baseUrl}data/${item.unicode}.json`);
      if (!res.ok) throw new Error(`載入失敗: ${res.statusText}`);
      const data: StrokeData = await res.json();
      traceCanvas.loadCharacter(data);
    } catch (err) {
      console.error('無法載入字詞分片:', err);
    }
  };

  // 2. 初始化載入字庫索引清單
  fetch(`${baseUrl}data/manifest.json`)
    .then(res => {
      if (!res.ok) throw new Error(`無法載入 manifest: ${res.statusText}`);
      return res.json();
    })
    .then((list: ManifestItem[]) => {
      charList = list;
      if (charList.length > 0) {
        loadCharacterByIndex(0); // 預設顯示第一個字（例如「一」）
      }
    })
    .catch(err => console.error('無法取得字庫清單:', err));

  // 3. 綁定清除畫布按鈕
  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => traceCanvas.clear());
  }

  // 4. 綁定「下一個字」切換按鈕
  const btnNext = document.getElementById('btn-next');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (charList.length === 0) return;
      currentIndex = (currentIndex + 1) % charList.length;
      loadCharacterByIndex(currentIndex);
    });
  }

  // 5. 綁定語系切換按鈕
  const langButtons = document.querySelectorAll('.lang-selector button');
  langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      const lang = target.getAttribute('data-lang') as Locale;
      if (lang) {
        i18n.setLocale(lang);
      }
    });
  });

  // 6. 畫面文字多國語言同步
  const updateUIText = () => {
    document.title = i18n.t('app.title');
    const uiTitle = document.getElementById('ui-title');
    const uiDesc = document.getElementById('ui-desc');
    const uiBtnClear = document.getElementById('btn-clear');
    const uiBtnNext = document.getElementById('btn-next');

    if (uiTitle) uiTitle.textContent = i18n.t('app.title');
    if (uiDesc) uiDesc.textContent = i18n.t('app.description');
    if (uiBtnClear) uiBtnClear.textContent = i18n.t('ui.button.clear');
    if (uiBtnNext) uiBtnNext.textContent = i18n.t('ui.button.next');
  };

  i18n.subscribe(updateUIText);
  updateUIText();
}

// 防禦性 DOM 掛載
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
