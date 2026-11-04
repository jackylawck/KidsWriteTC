// src/easter-egg.ts
/**
 * 童寫繁體字 KidsWriteTC - 家長暖心陪伴與正向練字心法指南
 * 專為在檯燈旁耐心陪伴學童的爸爸媽媽而設
 */

const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang HK", "Microsoft JhengHei", sans-serif';
const FONT_MONO = '"SFMono-Regular", Consolas, Menlo, monospace';

const STYLES = {
  header: `background: #8c2d19; color: #ffffff; font-family: ${FONT_SANS}; font-size: 13px; font-weight: bold; padding: 6px 12px; border-radius: 4px; display: block;`,
  sub: `background: #fdfaf2; color: #8c2d19; font-family: ${FONT_SANS}; font-size: 11.5px; line-height: 1.6; padding: 8px 12px; border-left: 4px solid #b78a38; border-bottom: 1px solid #ebd9b5; display: block;`,
  tipBox: `background: #f4efe6; color: #3b2219; font-family: ${FONT_SANS}; font-size: 12px; line-height: 1.8; padding: 12px 16px; border-radius: 6px; border-left: 5px solid #00796b; display: block;`,
  cmdKey: `background: #00796b; color: #ffffff; font-weight: bold; font-family: ${FONT_MONO}; padding: 2px 8px; border-radius: 3px; font-size: 11px;`,
  cmdDesc: `background: transparent; color: #555555; font-family: ${FONT_SANS}; padding: 2px 6px; font-size: 11.5px;`,
  goldBadge: `background: #b78a38; color: #ffffff; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
  warmLetter: `background: #2b1d0c; color: #faecd5; font-family: ${FONT_SANS}; font-size: 12.5px; line-height: 1.85; padding: 14px 18px; border-left: 6px solid #b78a38; border-radius: 4px; display: block;`
};

function renderWelcomeBanner() {
  console.log('%c🌱【童寫繁體字 KidsWriteTC // 給默默陪伴的家長】', STYLES.header);
  console.log(
    '%c繁體字結構嚴謹，筆畫多而考工夫。\n' +
    '初小孩子手指小肌肉仍在發育，空間知覺（米字格重心）也需要時間建立。\n' +
    '看著橡皮擦把本子擦破、孩子寫得慢又急，陪伴寫字的你辛苦了。\n\n' +
    '這裡不是冷冰冰的代碼終端，是為檯燈下每位家長準備的心靈充電站與實用拆彈指南。',
    STYLES.sub
  );
  console.log('');
  console.log('%c💡 專屬家長指令集（在 Console 輸入以下指令按 Enter 即可調用）：', 'color: #8c2d19; font-weight: bold;');
  console.log('%cparent.calm()%c    - 當自己或孩子快要發脾氣時：30 秒降溫急救法', STYLES.cmdKey, STYLES.cmdDesc);
  console.log('%cparent.tips()%c    - 實戰心法：告別橡皮擦地獄的 5 個正向技巧', STYLES.cmdKey, STYLES.cmdDesc);
  console.log('%cparent.letter()%c  - 深夜溫柔信：寫字只是過程，愛與安全感才是答案', STYLES.cmdKey, STYLES.cmdDesc);
  console.log('%ccangjie.story()%c - 倉頡阿叔穿越故事：講給孩子聽的放鬆睡前故事', STYLES.cmdKey, STYLES.cmdDesc);
  console.log('');
}

// 註冊 window.parent 陪伴工具集
(window as unknown as { parentGuide: unknown }).parentGuide = Object.freeze({
  calm: function () {
    console.log('%c🍵【家長 30 秒降溫急救法 // 深呼吸，放下橡皮擦】', STYLES.header);
    console.log(
      '%c1. 【立即暫停】放下手中的橡皮擦，不要連續擦第三次。孩子越被擦，手指越僵硬。\n' +
      '2. 【轉換焦點】同孩子飲一啖水，做 10 秒「小烏龜縮頭」或十指抓放操，放鬆前臂張力。\n' +
      '3. 【認知重塑】記住：字寫得歪，不是孩子懶或不認真，而是小腦袋正在努力協調手眼。\n' +
      '4. 【降低標準】今晚的功課，只挑選其中「最想寫好的一個字」當代表作，其餘及格即可。',
      STYLES.tipBox
    );
    return '深呼吸一次。你的平靜，是孩子敢於下筆的最大底氣。';
  },

  tips: function () {
    console.log('%c⭐【初小學童繁體字練字：5 大正向拆彈心法】', STYLES.header);
    console.log(
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

  letter: function () {
    console.log('%c💌【給檯燈旁默默守護的家長的一封信】', STYLES.header);
    console.log(
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
  }
});

// 為方便輸入，將指令掛載至 window.parentGuide 以及通用別名
(window as unknown as { p: unknown }).p = (window as unknown as { parentGuide: unknown }).parentGuide;

// 倉頡親子故事模組
(window as unknown as { cangjie: unknown }).cangjie = Object.freeze({
  story: function () {
    console.log('%c📜【倉頡大叔的穿越童話：我和小鳥腳印的故事】', STYLES.header);
    console.log(
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
  tips: function () {
    return (window as unknown as { parentGuide: { tips: () => string } }).parentGuide.tips();
  },
  letter: function () {
    return (window as unknown as { parentGuide: { letter: () => string } }).parentGuide.letter();
  }
});

// 頁面載入完成後自動呈現溫暖橫幅
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(renderWelcomeBanner, 300);
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(renderWelcomeBanner, 300));
}
