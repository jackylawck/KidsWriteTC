// src/main.ts
import './style.css';
import { i18n } from './core/i18n';
import { TraceCanvas, StrokeData } from './ui/canvas-trace';

interface ManifestItem {
  char: string;
  unicode: string;
  totalStrokes: number;
}

function initApp() {
  const traceCanvas = new TraceCanvas('trace-canvas', 'stroke-badge');
  let charList: ManifestItem[] = [];
  let currentIndex = 0;
  const baseUrl = import.meta.env.BASE_URL;

  // 1. 根據 Unicode 載入字元分片
  const loadCharacterByUnicode = async (unicode: string) => {
    try {
      const res = await fetch(`${baseUrl}data/${unicode.toUpperCase()}.json`);
      if (!res.ok) throw new Error('找不到該字');
      const data: StrokeData = await res.json();
      traceCanvas.loadCharacter(data);
    } catch {
      alert(`暫無此字資料。目前支援內置示範字（如：中、大、小、人、一）`);
    }
  };

  // 2. 載入索引庫
  fetch(`${baseUrl}data/manifest.json`)
    .then(r => r.json())
    .then((list: ManifestItem[]) => {
      charList = list;
      // 預設載入「中」字 (4E2D)
      const defaultItem = charList.find(c => c.char === '中') || charList[0];
      if (defaultItem) loadCharacterByUnicode(defaultItem.unicode);
    })
    .catch(console.error);

  // 3. 輸入字查詢功能
  const inputChar = document.getElementById('input-char') as HTMLInputElement;
  const btnSearch = document.getElementById('btn-search');

  const handleSearch = () => {
    const val = inputChar.value.trim();
    if (!val) return;
    const unicode = val.charCodeAt(0).toString(16).toUpperCase();
    loadCharacterByUnicode(unicode);
  };

  btnSearch?.addEventListener('click', handleSearch);
  inputChar?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // 4. 筆順動畫播放器控制項
  const btnPlayPause = document.getElementById('btn-play-pause') as HTMLButtonElement;
  btnPlayPause?.addEventListener('click', () => {
    const isPlaying = traceCanvas.toggleAutoPlay(() => {
      btnPlayPause.textContent = '▶ 播放示範';
    });
    btnPlayPause.textContent = isPlaying ? '⏸ 暫停' : '▶ 播放示範';
  });

  document.getElementById('btn-prev-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    btnPlayPause.textContent = '▶ 播放示範';
    traceCanvas.prevStroke();
  });

  document.getElementById('btn-next-stroke')?.addEventListener('click', () => {
    traceCanvas.stopAutoPlay();
    btnPlayPause.textContent = '▶ 播放示範';
    traceCanvas.nextStroke();
  });

  document.getElementById('btn-replay')?.addEventListener('click', () => {
    btnPlayPause.textContent = '⏸ 暫停';
    traceCanvas.startAutoPlay(() => {
      btnPlayPause.textContent = '▶ 播放示範';
    });
  });

  // 5. 描紅練習控制
  document.getElementById('btn-clear')?.addEventListener('click', () => traceCanvas.clear());

  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (charList.length === 0) return;
    currentIndex = (currentIndex + 1) % charList.length;
    const item = charList[currentIndex];
    inputChar.value = item.char;
    loadCharacterByUnicode(item.unicode);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
