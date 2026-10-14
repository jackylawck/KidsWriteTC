// src/main.ts
import './style.css';
import { i18n, Locale } from './core/i18n';
import { TraceCanvas } from './ui/canvas-trace';

function initApp() {
  // 1. 初始化描紅畫布
  const traceCanvas = new TraceCanvas('trace-canvas');

  // 2. 綁定清除按鈕
  const btnClear = document.getElementById('btn-clear');
  if (btnClear) {
    btnClear.addEventListener('click', () => traceCanvas.clear());
  }

  // 3. 綁定語系切換按鈕
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

  // 4. 定義畫面更新邏輯 (當語系切換時觸發)
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

  // 5. 訂閱語系管理器並執行初次渲染
  i18n.subscribe(updateUIText);
  updateUIText();
}

// 防禦性啟動：確保無論事件何時觸發都能正常掛載
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
