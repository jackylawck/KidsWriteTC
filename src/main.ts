// src/main.ts
import './style.css';
import { TraceCanvas } from './ui/canvas-trace';
import { FullCharData } from '../scripts/build-data';

function initApp() {
  const traceCanvas = new TraceCanvas('trace-canvas', 'stroke-badge');
  const baseUrl = import.meta.env.BASE_URL;

  // DOM 元素
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
    utterance.rate = 0.85; // 語速微調慢，適合小學生跟讀
    window.speechSynthesis.speak(utterance);
  };

  // 更新右側屬性卡片
  const updateMetaCard = (data: FullCharData) => {
    currentCharData = data;
    if (elRadical) elRadical.textContent = data.radical;
    if (elTotalStrokes) elTotalStrokes.textContent = `${data.totalStrokes} 畫`;
    if (elJyutping) elJyutping.textContent = data.cantonese.jyutping;
    if (elHomophone) elHomophone.textContent = `〔${data.cantonese.homophone}〕`;
    if (elPinyin) elPinyin.textContent = data.mandarin.pinyin;
  };

  // 查詢漢字並載入
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
      alert(`「${char}」字庫分片準備中。目前可查詢示範字：中、一、人、大、小`);
    }
  };

  // 1. 綁定搜尋輸入
  btnSearch?.addEventListener('click', () => searchAndLoad(inputChar.value.trim()));
  inputChar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchAndLoad(inputChar.value.trim());
  });

  // 2. 仿 EDB 圓形播放按鈕
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

  // 4. 讀音發音按鈕
  document.getElementById('btn-audio-cantonese')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-HK');
  });

  document.getElementById('btn-audio-mandarin')?.addEventListener('click', () => {
    if (currentCharData) speakText(currentCharData.char, 'zh-CN');
  });

  // 初始化載入「中」字
  searchAndLoad('中');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
