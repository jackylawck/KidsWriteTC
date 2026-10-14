// src/ui/canvas-trace.ts

export interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes: number;
  strokes: string[]; // 每一筆的向量幾何路徑
}

export class TraceCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokeBadge: HTMLElement | null;
  private dpr: number = 1;

  private currentData: StrokeData | null = null;
  public currentStrokeIndex: number = 0; // 當前教到第幾劃 (0 代表全部只出底字)
  private isPlaying: boolean = false;
  private playTimer: number | null = null;

  // 手寫筆跡圖層
  private isDrawing: boolean = false;

  constructor(canvasId: string, badgeId: string = 'stroke-badge') {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) throw new Error(`找不到 Canvas: ${canvasId}`);
    this.canvas = el;
    this.ctx = this.canvas.getContext('2d')!;
    this.strokeBadge = document.getElementById(badgeId);

    this.initRetinaDisplay();
    this.bindEvents();
  }

  private initRetinaDisplay() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  public loadCharacter(data: StrokeData) {
    this.stopAutoPlay();
    this.currentData = data;
    this.currentStrokeIndex = 1; // 預設直接從第 1 劃開始教
    this.render();
  }

  /**
   * 核心繪製邏輯：仿教育局視覺呈現
   */
  public render() {
    const rect = this.canvas.getBoundingClientRect();

    // 1. 清空畫布
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    if (!this.currentData) return;

    // 2. 更新左上角第幾劃指示標籤
    if (this.strokeBadge) {
      this.strokeBadge.textContent = `${this.currentStrokeIndex} / ${this.currentData.totalStrokes}`;
    }

    // 3. 繪製淺灰色全字底模（作為參照背景）
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.font = `${rect.width * 0.76}px "Kaiti TC", "STKaiti", "BiauKai", "DFKai-SB", serif`;
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentData.char, rect.width / 2, rect.height / 2 + 10);
    this.ctx.restore();

    // 4. 根據筆順進度繪製筆劃
    const scaleFactor = (rect.width / 1000) * this.dpr;

    this.currentData.strokes.forEach((strokePath, index) => {
      const strokeNumber = index + 1;
      const path = new Path2D(strokePath);

      this.ctx.save();
      this.ctx.scale(scaleFactor, scaleFactor);
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      if (strokeNumber < this.currentStrokeIndex) {
        // A. 以前已經教過/寫完的筆劃：深黑色實線
        this.ctx.strokeStyle = '#212121';
        this.ctx.lineWidth = 42;
        this.ctx.stroke(path);
      } else if (strokeNumber === this.currentStrokeIndex) {
        // B. 當前正在教學的筆劃（第 N 劃）：鮮明硃砂紅高亮
        this.ctx.strokeStyle = '#d32f2f';
        this.ctx.lineWidth = 48;
        this.ctx.stroke(path);
      } else {
        // C. 未來的筆劃：淡灰色虛線（不搶視覺焦點）
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 20;
        this.ctx.setLineDash([16, 12]);
        this.ctx.stroke(path);
      }

      this.ctx.restore();
    });
  }

  // 下一劃
  public nextStroke() {
    if (!this.currentData) return;
    if (this.currentStrokeIndex < this.currentData.totalStrokes) {
      this.currentStrokeIndex++;
      this.render();
    }
  }

  // 上一劃
  public prevStroke() {
    if (!this.currentData) return;
    if (this.currentStrokeIndex > 1) {
      this.currentStrokeIndex--;
      this.render();
    }
  }

  // 自動播放筆順示範 (如同教育局動態效果)
  public toggleAutoPlay(onComplete?: () => void) {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay(onComplete);
    }
    return this.isPlaying;
  }

  public startAutoPlay(onComplete?: () => void) {
    if (!this.currentData) return;
    this.isPlaying = true;
    this.currentStrokeIndex = 1;
    this.render();

    this.playTimer = window.setInterval(() => {
      if (!this.currentData) return;
      if (this.currentStrokeIndex < this.currentData.totalStrokes) {
        this.currentStrokeIndex++;
        this.render();
      } else {
        this.stopAutoPlay();
        if (onComplete) onComplete();
      }
    }, 1100); // 每 1.1 秒示範下一劃
  }

  public stopAutoPlay() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  public clear() {
    this.render();
  }

  // 自由描紅塗鴉事件
  private bindEvents() {
    this.canvas.style.touchAction = 'none';

    const getPos = (e: MouseEvent | Touch) => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * this.dpr,
        y: (e.clientY - rect.top) * this.dpr
      };
    };

    const start = (pos: { x: number; y: number }) => {
      this.isDrawing = true;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(pos.x, pos.y);
    };

    const move = (pos: { x: number; y: number }) => {
      if (!this.isDrawing) return;
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.strokeStyle = '#d32f2f';
      this.ctx.lineWidth = 14 * this.dpr;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.stroke();
    };

    const stop = () => {
      if (this.isDrawing) {
        this.ctx.closePath();
        this.ctx.restore();
        this.isDrawing = false;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => start(getPos(e)));
    this.canvas.addEventListener('mousemove', (e) => move(getPos(e)));
    window.addEventListener('mouseup', stop);

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      start(getPos(e.touches[0]));
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      move(getPos(e.touches[0]));
    }, { passive: false });

    window.addEventListener('touchend', stop);
  }
}
