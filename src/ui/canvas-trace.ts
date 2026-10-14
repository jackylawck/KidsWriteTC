// src/ui/canvas-trace.ts

export interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes: number;
  strokes: string[]; // 開源真實毛筆 SVG 輪廓路徑
}

export class TraceCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private strokeBadge: HTMLElement | null;
  private dpr: number = 1;

  private currentData: StrokeData | null = null;
  public currentStrokeIndex: number = 1; // 預設第 1 劃
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
    this.currentStrokeIndex = 1; // 預設從第 1 劃開始
    this.render();
  }

  /**
   * 核心繪製邏輯：適配真實毛筆字形填充與座標轉換
   */
  public render() {
    const rect = this.canvas.getBoundingClientRect();

    // 1. 清空畫布
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    if (!this.currentData) return;

    // 2. 更新左上角第幾劃標籤 (仿 EDB: 顯示 1, 2, 3...)
    if (this.strokeBadge) {
      this.strokeBadge.textContent = `${this.currentStrokeIndex}`;
    }

    // 3. 繪製真實毛筆字形
    // hanzi-writer-data 基準座標系為 1024x1024，Y 軸為向上正向
    const scaleFactor = (rect.width / 1024) * this.dpr;

    this.currentData.strokes.forEach((strokePath, index) => {
      const strokeNumber = index + 1;
      const path = new Path2D(strokePath);

      this.ctx.save();
      // 適配 1024 倒轉座標系
      this.ctx.scale(scaleFactor, scaleFactor);
      this.ctx.translate(0, 1024);
      this.ctx.scale(1, -1);

      if (strokeNumber < this.currentStrokeIndex) {
        // A. 之前已經寫完的筆劃：深黑色毛筆實體
        this.ctx.fillStyle = '#212121';
        this.ctx.fill(path);
      } else if (strokeNumber === this.currentStrokeIndex) {
        // B. 當前正在教學的筆劃（第 N 劃）：硃砂紅高亮示範
        this.ctx.fillStyle = '#d32f2f';
        this.ctx.fill(path);
      } else {
        // C. 未來的筆劃：淺灰色毛筆底模（提示整體字形結構）
        this.ctx.fillStyle = '#e5e5e5';
        this.ctx.fill(path);
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

  // 播放 / 暫停
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
    }, 1100);
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

  // 自由描紅塗鴉（小朋友拿手或 Apple Pencil 描寫）
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
