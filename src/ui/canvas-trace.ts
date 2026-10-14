// src/ui/canvas-trace.ts

export interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes?: number;
  strokes: string[]; 
  medians?: number[][][]; 
}

export class TraceCanvas {
  // 雙層畫布架構
  private traceCanvas: HTMLCanvasElement;
  private traceCtx: CanvasRenderingContext2D;
  private inkCanvas: HTMLCanvasElement;
  private inkCtx: CanvasRenderingContext2D;
  
  private strokeBadge: HTMLElement | null;
  private currentData: StrokeData | null = null;
  
  // 嚴格封裝狀態
  private _currentStrokeIndex: number = 1;
  public get currentStrokeIndex(): number {
    return this._currentStrokeIndex;
  }

  private isPlaying: boolean = false;
  private playTimer: number | null = null;
  private strokeInterval: number = 1100; // 可配置播放間隔
  private isDrawing: boolean = false;

  private dpr: number = 1;
  private cachedRect: DOMRect | null = null;
  private abortController = new AbortController();
  private resizeTimer: number | null = null;

  constructor(traceId: string, inkId: string, badgeId: string = 'stroke-badge') {
    const traceEl = document.getElementById(traceId) as HTMLCanvasElement;
    const inkEl = document.getElementById(inkId) as HTMLCanvasElement;
    
    if (!traceEl || !inkEl) throw new Error('找不到 Trace 或 Ink Canvas 容器');
    
    this.traceCanvas = traceEl;
    this.traceCtx = this.traceCanvas.getContext('2d')!;
    
    this.inkCanvas = inkEl;
    // 重啟 GPU 加速 (不使用 willReadFrequently)
    this.inkCtx = this.inkCanvas.getContext('2d')!;
    
    this.strokeBadge = document.getElementById(badgeId);

    this.initRetinaDisplay();
    this.bindEvents();

    // Resize 監聽與防抖 (Debounce)
    window.addEventListener('resize', () => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.initRetinaDisplay();
        if (this.currentData) this.renderTrace();
      }, 150);
    }, { signal: this.abortController.signal });
  }

  public destroy() {
    this.stopAutoPlay();
    this.abortController.abort();
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
  }

  public setStrokeInterval(ms: number) {
    this.strokeInterval = ms;
  }

  private initRetinaDisplay() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.inkCanvas.parentElement!.getBoundingClientRect();
    this.cachedRect = rect;

    const w = rect.width;
    const h = rect.height;

    [this.traceCanvas, this.inkCanvas].forEach(canvas => {
      canvas.width = w * this.dpr;
      canvas.height = h * this.dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    });

    // P0 修復：徹底清除任何歷史矩陣殘留，防止累積縮放
    this.traceCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.traceCtx.scale(this.dpr, this.dpr);
    
    this.inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.inkCtx.scale(this.dpr, this.dpr);

    // 重新註冊畫筆狀態
    this.inkCtx.lineCap = 'round';
    this.inkCtx.lineJoin = 'round';
    this.inkCtx.lineWidth = 16;
    this.inkCtx.strokeStyle = 'rgba(25, 118, 210, 0.85)'; // 學生筆跡深藍色
  }

  public loadCharacter(data: StrokeData) {
    this.stopAutoPlay();
    this.isDrawing = false;
    this.currentData = data;
    this._currentStrokeIndex = 1;
    this.clearInk(); 
    this.renderTrace();
  }

  private drawGrid() {
    this.traceCtx.save();
    this.traceCtx.strokeStyle = '#FFEBEE'; // 淡淡的粉紅色米字線
    this.traceCtx.lineWidth = 4; // 1024 座標系下的線寬
    
    this.traceCtx.beginPath();
    // 橫豎中線
    this.traceCtx.moveTo(0, 512); this.traceCtx.lineTo(1024, 512);
    this.traceCtx.moveTo(512, 0); this.traceCtx.lineTo(512, 1024);
    // 對角線
    this.traceCtx.moveTo(0, 0); this.traceCtx.lineTo(1024, 1024);
    this.traceCtx.moveTo(1024, 0); this.traceCtx.lineTo(0, 1024);
    
    this.traceCtx.stroke();
    this.traceCtx.restore();
  }

  public renderTrace() {
    if (!this.cachedRect) return;

    this.traceCtx.save();
    this.traceCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.traceCtx.clearRect(0, 0, this.traceCanvas.width, this.traceCanvas.height);
    this.traceCtx.restore();

    if (!this.currentData) return;

    const total = this.currentData.totalStrokes || this.currentData.strokes.length;
    if (this.strokeBadge) {
      this.strokeBadge.textContent = `${this._currentStrokeIndex} / ${total}`;
    }

    const scaleFactor = this.cachedRect.width / 1024;
    
    this.traceCtx.save();
    this.traceCtx.scale(scaleFactor, scaleFactor);
    this.traceCtx.translate(0, 1024);
    this.traceCtx.scale(1, -1);

    // 繪製背景米字格
    this.drawGrid();

    this.currentData.strokes.forEach((strokePath, index) => {
      const strokeNumber = index + 1;
      
      try {
        const path = new Path2D(strokePath);

        if (strokeNumber < this._currentStrokeIndex) {
          this.traceCtx.fillStyle = '#424242'; // 已完成筆劃：深灰
        } else if (strokeNumber === this._currentStrokeIndex) {
          this.traceCtx.fillStyle = '#d32f2f'; // 當前示範筆劃：硃砂紅
        } else {
          this.traceCtx.fillStyle = '#e0e0e0'; // 未來筆劃：淺灰提示
        }
        
        this.traceCtx.fill(path);
      } catch (err) {
        console.warn(`無效的 SVG Path 於第 ${strokeNumber} 劃`);
      }
    });

    this.traceCtx.restore();
  }

  public nextStroke() {
    if (!this.currentData) return;
    const total = this.currentData.totalStrokes || this.currentData.strokes.length;
    if (this._currentStrokeIndex < total) {
      this._currentStrokeIndex++;
      this.renderTrace();
    }
  }

  public prevStroke() {
    if (!this.currentData) return;
    if (this._currentStrokeIndex > 1) {
      this._currentStrokeIndex--;
      this.renderTrace();
    }
  }

  public toggleAutoPlay(onComplete?: () => void): boolean {
    if (this.isPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay(onComplete);
    }
    return this.isPlaying;
  }

  public startAutoPlay(onComplete?: () => void) {
    if (!this.currentData || this.isPlaying) return;
    this.isPlaying = true;
    
    const total = this.currentData.totalStrokes || this.currentData.strokes.length;
    
    if (this._currentStrokeIndex >= total) {
      this._currentStrokeIndex = 1;
      this.clearInk();
    }
    
    this.renderTrace();

    this.playTimer = window.setInterval(() => {
      if (!this.currentData) return;
      if (this._currentStrokeIndex < total) {
        this._currentStrokeIndex++;
        this.renderTrace();
      } else {
        this.stopAutoPlay();
        if (onComplete) onComplete();
      }
    }, this.strokeInterval);
  }

  public stopAutoPlay() {
    this.isPlaying = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  public clearInk() {
    this.inkCtx.save();
    this.inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.inkCtx.clearRect(0, 0, this.inkCanvas.width, this.inkCanvas.height);
    this.inkCtx.restore();
  }

  /**
   * P3 升級：全面採用 Pointer Events，天然支援觸控、滑鼠與 Apple Pencil
   */
  private bindEvents() {
    const opts = { signal: this.abortController.signal };
    this.inkCanvas.style.touchAction = 'none';

    const getPos = (e: PointerEvent) => {
      const rect = this.cachedRect || this.inkCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const start = (e: PointerEvent) => {
      e.preventDefault();
      this.inkCanvas.setPointerCapture(e.pointerId); // 鎖定游標
      this.isDrawing = true;
      const pos = getPos(e);
      this.inkCtx.beginPath();
      this.inkCtx.moveTo(pos.x, pos.y);
    };

    const move = (e: PointerEvent) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      
      // 預留 Apple Pencil 壓力判定 (未來擴展)
      // if (e.pointerType === 'pen') { this.inkCtx.lineWidth = 16 * e.pressure; }
      
      const pos = getPos(e);
      this.inkCtx.lineTo(pos.x, pos.y);
      this.inkCtx.stroke();
    };

    const stop = (e: PointerEvent) => {
      e.preventDefault();
      if (this.isDrawing) {
        this.inkCtx.closePath();
        this.isDrawing = false;
        this.inkCanvas.releasePointerCapture(e.pointerId);
      }
    };

    this.inkCanvas.addEventListener('pointerdown', start, opts);
    this.inkCanvas.addEventListener('pointermove', move, opts);
    this.inkCanvas.addEventListener('pointerup', stop, opts);
    this.inkCanvas.addEventListener('pointercancel', stop, opts);
  }
}
