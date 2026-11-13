// src/easter-egg.ts
/**
 * 童寫繁體字 KidsWriteTC - 家長暖心陪伴與正向練字心法指南
 * 架構特性：
 * 1. Bundler-Proof Logger：動態綁定原生 console，免疫正式環境 drop_console 清除
 * 2. Zero-Paren Getter CLI：Object.defineProperty 攔截大小寫指令 + DevTools 預覽防抖
 * 3. Deterministic DOM Lifecycle：強制重繪 (Forced Reflow) + 競態清理 + 零記憶體洩漏自毀
 */

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang HK", "Microsoft JhengHei", sans-serif';
const FONT_MONO = '"SFMono-Regular", Consolas, Menlo, monospace';

// 1. 防止 Vite / Terser / esbuild 上線編譯時誤刪日誌的原生綁定保護
const rawConsole = window['console'];
const print: (...args: unknown[]) => void =
  rawConsole && typeof rawConsole['log'] === 'function'
    ? rawConsole['log'].bind(rawConsole)
    : () => {};

const STYLES = {
  header: `background: #8c2d19; color: #ffffff; font-family: ${FONT_SANS}; font-size: 13px; font-weight: bold; padding: 6px 12px; border-radius: 4px; display: block;`,
  sub: `background: #fdfaf2; color: #8c2d19; font-family: ${FONT_SANS}; font-size: 11.5px; line-height: 1.6; padding: 8px 12px; border-left: 4px solid #b78a38; border-bottom: 1px solid #ebd9b5; display: block;`,
  tipBox: `background: #f4efe6; color: #3b2219; font-family: ${FONT_SANS}; font-size: 12px; line-height: 1.8; padding: 12px 16px; border-radius: 6px; border-left: 5px solid #00796b; display: block;`,
  cmdKey: `background: #00796b; color: #ffffff; font-weight: bold; font-family: ${FONT_MONO}; padding: 2px 8px; border-radius: 3px; font-size: 11px;`,
  cmdDesc: `background: transparent; color: #555555; font-family: ${FONT_SANS}; padding: 2px 6px; font-size: 11.5px;`,
  warmLetter: `background: #2b1d0c; color: #faecd5; font-family: ${FONT_SANS}; font-size: 12.5px; line-height: 1.85; padding: 14px 18px; border-left: 6px solid #b78a38; border-radius: 4px; display: block;`,
  securityNote: `background: #f8fafc; color: #64748b; font-family: ${FONT_SANS}; font-size: 11px; line-height: 1.5; padding: 6px 10px; border-left: 3px solid #94a3b8; display: block;`
};

// 2. 內容渲染核心模組
const Actions = {
  welcome(): string {
    print('%c🌱【童寫繁體字 KidsWriteTC // 給默默陪伴的家長】', STYLES.header);
    print(
      '%c繁體字結構嚴謹，筆畫多而考工夫。\n' +
      '初小孩子手指小肌肉仍在發育，空間知覺（米字格重心）也需要時間建立。\n' +
      '看著橡皮擦把本子擦破、孩子寫得慢又急，陪伴寫字的你辛苦了。\n\n' +
      '這裡是為檯燈下每位家長準備的心靈充電站與實用拆彈指南。',
      STYLES.sub
    );
    print('');
    print('%c💡 免括號快捷指令（直接輸入英文單字按 Enter 即可，大小寫皆可）：', 'color: #8c2d19; font-weight: bold;');
    print('%ccalm%c    - 當自己或孩子快要發脾氣時：30 秒降溫急救法', STYLES.cmdKey, STYLES.cmdDesc);
    print('%cbreathe%c - 啟動「檯燈護眼・15 秒親子深呼吸光暈」放鬆畫面', STYLES.cmdKey, STYLES.cmdDesc);
    print('%ctips%c    - 實戰心法：告別橡皮擦地獄的 5 個正向技巧', STYLES.cmdKey, STYLES.cmdDesc);
    print('%cletter%c  - 深夜溫柔信：寫字只是過程，愛與安全感才是答案', STYLES.cmdKey, STYLES.cmdDesc);
    print('%cstory%c   - 倉頡阿叔穿越故事：講給孩子聽的放鬆睡前故事', STYLES.cmdKey, STYLES.cmdDesc);
    print('');
    print(
      '%c🛡️ 私隱與安全承諾：本站 100% 純本機運算、零資料留存（ZDR）。請勿在此貼上任何來歷不明的第三方腳本。',
      STYLES.securityNote
    );
    return '輸入 calm、breathe、tips、letter 或 story 即可開啟對應指南。';
  },

  calm(): string {
    print('%c🍵【家長 30 秒降溫急救法 // 深呼吸，放下橡皮擦】', STYLES.header);
    print(
      '%c1. 【立即暫停】放下手中的橡皮擦，不要連續擦第三次。孩子越被擦，手指越僵硬。\n' +
      '2. 【轉換焦點】同孩子飲一啖水，做 10 秒「小烏龜縮頭」或十指抓放操，放鬆前臂張力。\n' +
      '3. 【認知重塑】記住：字寫得歪，不是孩子懶或不認真，而是小腦袋正在努力協調手眼。\n' +
      '4. 【降低標準】今晚的功課，只挑選其中「最想寫好的一個字」當代表作，其餘及格即可。\n\n' +
      '👉 提示：直接輸入 breathe 按 Enter，可啟動 15 秒親子護眼呼吸燈。',
      STYLES.tipBox
    );
    return '深呼吸一次。你的平靜，是孩子敢於下筆的最大底氣。';
  },

  tips(): string {
    print('%c⭐【初小學童繁體字練字：5 大正向拆彈心法】', STYLES.header);
    print(
      '%c① 【亮點放大鏡（絕不只捉錯）】\n' +
      '   不要一開口就講「呢一橫太斜」。先拿鉛筆圈出他今天寫得最直的一筆或最端正的部件：\n' +
      '   「嘩！你呢個『言』字底下一橫好似大樹咁穩陣，好有氣勢！」孩子有成就感先會想練。\n\n' +
      '② 【繁體字是樂高積木，不是死記筆畫】\n' +
      '   「警」字 19 劃好嚇人，但拆開只不過是「艹＋敬＋言」。認清部件，恐懼減半。\n\n' +
      '③ 【15 分鐘小肌肉生理極限】\n' +
      '   6-8 歲學童的手指肌耐力只有 15-20 分鐘。超過時間筆跡必定崩壞，請強制休息 3 分鐘。\n\n' +
      '④ 【米字格的「呼吸空間」】\n' +
      '   字心（十字交叉點）坐穩，外圍留少少白，字就不會撞牆被切邊。這也是畫布縮放的初心。\n\n' +
      '⑤ 【接納出界】\n' +
      '   剛起步的孩子，出界是必然的探索。筆順對、部件對，結構自然會隨年齡慢慢收窄。',
      STYLES.tipBox
    );
    return '試下今晚用「亮點放大鏡」，只讚一個寫得靚嘅筆劃！';
  },

  letter(): string {
    print('%c💌【給檯燈旁默默守護的家長的一封信】', STYLES.header);
    print(
      '%c親愛的爸爸媽媽：\n\n' +
      '每天放工回家，拖著疲憊的身軀打開手冊，看著一本本生字簿與默書，\n' +
      '有時真的會忍不住急躁、心酸，甚至懷疑自己是不是不夠耐心。\n\n' +
      '請放輕鬆一點。\n' +
      '二十年後，孩子不會記得小一那次生字簿有沒有拿滿分，\n' +
      '但他會深深記得：當他寫得手軟心慌的時候，身邊的爸爸媽媽是皺著眉頭嘆氣，\n' +
      '還是拍拍他的肩膀說：「唔緊要，慢慢寫，我陪你一齊寫好佢。」\n\n' +
      '字會隨著長大慢慢工整，\n' +
      '但在檯燈下你遞給他的一杯水、一句肯定，會成為陪伴他一生的安全感。\n\n' +
      '今晚辛苦了，你們已經做得很棒了。',
      STYLES.warmLetter
    );
    return '字寫得慢沒關係，陪伴的溫度才是最珍貴的童年記憶。';
  },

  story(): string {
    print('%c📜【倉頡大叔的穿越童話：我和小鳥腳印的故事】', STYLES.header);
    print(
      '%c（可以讀給身邊的孩子聽）：\n\n' +
      '很久很久以前，還沒有學校，也沒有紙和筆。\n' +
      '倉頡大叔走在雪地和泥土上，看見小鳥走過留下的三叉腳印、小鹿踩出的小坑。\n' +
      '他就想：「如果我把腳印畫在泥地上，大家不就知道今天有鳥兒和小鹿來過了嗎？」\n\n' +
      '這就是最早的文字！\n' +
      '後來人們把這些圖畫慢慢整齊地疊起來，就變成了今天你們寫的繁體字。\n' +
      '所以每一個字，本來都是大自然裡的一隻小動物、一棵樹、或是一條河流。\n' +
      '你現在寫的每一筆，就像在紙上蓋下屬於你自己的漂亮腳印一樣神奇喔！',
      STYLES.tipBox
    );
    return '讀完故事，同孩子一齊睇下畫布入面嘅字似唔似積木啦！';
  },

  breathe(): string {
    triggerBreathingOverlay();
    return '🕯️ 已開啟「檯燈護眼・15 秒親子深呼吸光暈」（點擊畫面或按 ESC 隨時返回練字）。';
  }
};

// 3. 防呆、強制重繪與零記憶體洩漏 DOM 特效引擎
let activeBreathingCleanup: (() => void) | null = null;

function triggerBreathingOverlay(): void {
  // 競態保護：若使用者連續瘋狂輸入 breathe，先徹底回收上一個實例的計時器與 DOM
  if (activeBreathingCleanup) {
    activeBreathingCleanup();
    activeBreathingCleanup = null;
  }

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const overlay = document.createElement('div');
  overlay.id = 'kidswritetc-breathing-hud';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '親子 15 秒護眼深呼吸休息時間');
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 999999',
    'background: rgba(38, 26, 16, 0.86)',
    'backdrop-filter: blur(6px)',
    '-webkit-backdrop-filter: blur(6px)',
    'display: flex',
    'flex-direction: column',
    'align-items: center',
    'justify-content: center',
    'padding: 24px',
    'cursor: pointer',
    'opacity: 0',
    'transition: opacity 0.45s ease',
    `font-family: ${FONT_SANS}`
  ].join(';');

  const orb = document.createElement('div');
  orb.style.cssText = [
    'width: 140px',
    'height: 140px',
    'border-radius: 50%',
    'background: radial-gradient(circle, #fde68a 0%, #d97706 70%, rgba(217,119,6,0) 100%)',
    'box-shadow: 0 0 50px rgba(251, 191, 36, 0.45)',
    'margin-bottom: 28px',
    'transform: scale(0.85)',
    'transition: transform 3.5s ease-in-out, opacity 3.5s ease-in-out'
  ].join(';');

  const title = document.createElement('div');
  title.textContent = '🍵 放下橡皮擦，陪孩子一起深呼吸';
  title.style.cssText = 'color: #fef3c7; font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 10px;';

  const guide = document.createElement('div');
  guide.textContent = '吸氣 4 秒…… 慢慢吐氣 4 秒…… 放鬆小手指';
  guide.style.cssText = 'color: #fde68a; font-size: 15px; text-align: center; margin-bottom: 20px; opacity: 0.9;';

  const hint = document.createElement('div');
  hint.textContent = '（15 秒後自動返回，或點擊畫面 / 按 ESC 立即結束）';
  hint.style.cssText = 'color: #a8a29e; font-size: 12px; text-align: center;';

  overlay.appendChild(orb);
  overlay.appendChild(title);
  overlay.appendChild(guide);
  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  // 強制瀏覽器同步重繪 (Forced Reflow)，確保初始 opacity: 0 與 scale(0.85) 已被計算，過渡動畫 100% 觸發
  void overlay.offsetWidth;
  overlay.style.opacity = '1';

  let expanded = true;
  let breathInterval: number | undefined;

  if (!reduceMotion) {
    orb.style.transform = 'scale(1.18)';
    breathInterval = window.setInterval(() => {
      expanded = !expanded;
      orb.style.transform = expanded ? 'scale(1.18)' : 'scale(0.85)';
      guide.textContent = expanded
        ? '慢慢吸氣…… 感受肩膀放鬆……'
        : '緩緩吐氣…… 寫字慢慢來沒關係……';
    }, 3600);
  } else {
    orb.style.transform = 'scale(1)';
  }

  let isCleaned = false;
  const cleanup = () => {
    if (isCleaned) return;
    isCleaned = true;

    window.clearTimeout(autoCloseTimer);
    if (breathInterval !== undefined) window.clearInterval(breathInterval);
    window.removeEventListener('keydown', onKeyDown);
    overlay.removeEventListener('click', cleanup);

    overlay.style.opacity = '0';
    window.setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (activeBreathingCleanup === cleanup) activeBreathingCleanup = null;
    }, 450);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cleanup();
  };

  overlay.addEventListener('click', cleanup);
  window.addEventListener('keydown', onKeyDown);

  // 15 秒後自動清理並卸載 DOM，確保零記憶體洩漏
  const autoCloseTimer = window.setTimeout(cleanup, 15000);
  activeBreathingCleanup = cleanup;
}

// 4. 透過 Object.defineProperty 註冊免括號全域指令（含 DevTools 預覽防抖保護）
function registerGlobalGetter(name: string, handler: () => string): void {
  let lastInvokedAt = 0;

  const descriptor: PropertyDescriptor = {
    configurable: true, // 支援開發期 Vite HMR 熱重載而不報錯
    enumerable: false,  // 保持 window 物件整潔，不污染 for..in 遍歷
    get() {
      const now = Date.now();
      // 400ms 防抖：避免 Chrome DevTools Eager Evaluation 預覽求值時重複觸發兩次
      if (now - lastInvokedAt < 400) {
        return '（指令已執行）';
      }
      lastInvokedAt = now;
      return handler();
    }
  };

  Object.defineProperty(window, name.toLowerCase(), descriptor);
  Object.defineProperty(window, name.toUpperCase(), descriptor);
}

registerGlobalGetter('calm', Actions.calm);
registerGlobalGetter('tips', Actions.tips);
registerGlobalGetter('letter', Actions.letter);
registerGlobalGetter('story', Actions.story);
registerGlobalGetter('breathe', Actions.breathe);

// 5. 同時保留凍結的物件命名空間（相容傳統括號呼叫 p.calm() / cangjie.story()）
const parentSuite = Object.freeze({
  calm: Actions.calm,
  tips: Actions.tips,
  letter: Actions.letter,
  breathe: Actions.breathe,
  help: Actions.welcome
});

const cangjieSuite = Object.freeze({
  story: Actions.story,
  tips: Actions.tips,
  letter: Actions.letter
});

Object.defineProperties(window, {
  parentGuide: { value: parentSuite, writable: false, configurable: true },
  p: { value: parentSuite, writable: false, configurable: true },
  cangjie: { value: cangjieSuite, writable: false, configurable: true }
});

// 頁面就緒後呈現歡迎橫幅
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  window.setTimeout(Actions.welcome, 300);
} else {
  window.addEventListener('DOMContentLoaded', () => window.setTimeout(Actions.welcome, 300));
}
