// src/ui/canvas-trace.ts

export interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes?: number;
  radical?: string;      // 新增：部首
  jyutping?: string[];   // 新增：粵拼 (陣列，支援多音字)
  pinyin?: string[];     // 新增：普拼 (陣列，支援多音字)
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
  private strokeInterval: number = 1100;
  private isDrawing: boolean = false;

  private dpr: number = 1;
  private canvasWidth: number = 300; 
  private abortController = new AbortController();
  private resizeTimer: number | null = null;

  constructor(traceId: string, inkId: string, badgeId: string = 'stroke-badge') {
    const traceEl = document.getElementById(traceId) as HTMLCanvasElement;
    const inkEl = document.getElementById(inkId) as HTMLCanvasElement;
    
    if (!traceEl || !inkEl) throw new Error('找不到 Trace 或 Ink Canvas 容器');
    
    this.traceCanvas = traceEl;
    this.traceCtx = this.traceCanvas.getContext('2d')!;
    
    this.inkCanvas = inkEl;
    this.inkCtx = this.inkCanvas.getContext('2d')!;
    
    this.strokeBadge = document.getElementById(badgeId);

    this.initRetinaDisplay();
    this.bindEvents();

    window.addEventListener('resize', () => {
      if (this.resizeTimer) clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        // 保留學生筆跡，避免旋轉 iPad 導致心血白費
        const savedInk = this.inkCanvas.width > 0 && this.inkCanvas.height > 0
          ? this.inkCtx.getImageData(0, 0, this.inkCanvas.width, this.inkCanvas.height)
          : null;

        this.initRetinaDisplay();
        this.renderTrace();

        if (savedInk) {
          this.inkCtx.putImageData(savedInk, 0, 0);
        }
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
    
    const rect = this.inkCanvas.getBoundingClientRect();
    
    // 無條件捨去，確保 Canvas 的像素緩衝區絕對是整數，避免跨平台 Retina 亞像素模糊
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    
    this.canvasWidth = w;

    [this.traceCanvas, this.inkCanvas].forEach(canvas => {
      canvas.width = Math.floor(w * this.dpr);
      canvas.height = Math.floor(h * this.dpr);
    });

    this.traceCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.traceCtx.scale(this.dpr, this.dpr);
    
    this.inkCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.inkCtx.scale(this.dpr, this.dpr);

    this.inkCtx.lineCap = 'round';
    this.inkCtx.lineJoin = 'round';
    this.inkCtx.lineWidth = 16;
    this.inkCtx.strokeStyle = 'rgba(25, 118, 210, 0.85)';
  }

  public loadCharacter(data: StrokeData) {
    this.stopAutoPlay();
    this.isDrawing = false;
    this.currentData = data;
    this._currentStrokeIndex = 1;
    this.clearInk(); 
    this.renderTrace();
  }

  // 統一的狀態清除出口，解決 404 時的狀態洩漏 (State Leak)
  public clearData() {
    this.stopAutoPlay();
    this.currentData = null;
    this._currentStrokeIndex = 1;
    this.clearInk();
    
    if (this.strokeBadge) {
      this.strokeBadge.textContent = '- / -';
    }
    
    this.renderTrace(); // 確保重新繪製乾淨的米字格背景
  }

  private drawGrid() {
    this.traceCtx.save();
    // 加深網格線顏色，確保在白色背景上的清晰辨識度 (淡朱砂色)
    this.traceCtx.strokeStyle = '#E0A0A0';
    this.traceCtx.lineWidth = 3;
    
    this.traceCtx.beginPath();
    this.traceCtx.moveTo(0, 512); this.traceCtx.lineTo(1024, 512);
    this.traceCtx.moveTo(512, 0); this.traceCtx.lineTo(512, 1024);
    this.traceCtx.moveTo(0, 0); this.traceCtx.lineTo(1024, 1024);
    this.traceCtx.moveTo(1024, 0); this.traceCtx.lineTo(0, 1024);
    
    this.traceCtx.stroke();
    this.traceCtx.restore();
  }

  public renderTrace() {
    if (!this.canvasWidth) return;

    this.traceCtx.save();
    this.traceCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.traceCtx.clearRect(0, 0, this.traceCanvas.width, this.traceCanvas.height);
    this.traceCtx.restore();

    // 更新進度徽章
    if (this.strokeBadge && this.currentData) {
      const total = this.currentData.totalStrokes || this.currentData.strokes.length;
      this.strokeBadge.textContent = `${this._currentStrokeIndex} / ${total}`;
    }

    const scaleFactor = this.canvasWidth / 1024;
    
    this.traceCtx.save();
    this.traceCtx.scale(scaleFactor, scaleFactor);
    this.traceCtx.translate(0, 1024);
    this.traceCtx.scale(1, -1);

    // 任何狀態下都必須繪製米字格底圖
    this.drawGrid();

    // 無字元資料則直接返回，只留下乾淨的米字格
    if (!this.currentData) {
      this.traceCtx.restore();
      return;
    }

    this.currentData.strokes.forEach((strokePath, index) => {
      const strokeNumber = index + 1;
      
      try {
        const path = new Path2D(strokePath);

        if (strokeNumber < this._currentStrokeIndex) {
          this.traceCtx.fillStyle = '#424242'; 
        } else if (strokeNumber === this._currentStrokeIndex) {
          this.traceCtx.fillStyle = '#d32f2f'; 
        } else {
          this.traceCtx.fillStyle = '#e0e0e0'; 
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

  private bindEvents() {
    const opts = { signal: this.abortController.signal };
    this.inkCanvas.style.touchAction = 'none';

    const getPos = (e: PointerEvent) => {
      const rect = this.inkCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const start = (e: PointerEvent) => {
      e.preventDefault();
      this.inkCanvas.setPointerCapture(e.pointerId);
      this.isDrawing = true;
      const pos = getPos(e);
      this.inkCtx.beginPath();
      this.inkCtx.moveTo(pos.x, pos.y);
    };

    const move = (e: PointerEvent) => {
      e.preventDefault();
      if (!this.isDrawing) return;
      
      const pos = getPos(e);
      this.inkCtx.lineTo(pos.x, pos.y);
      this.inkCtx.stroke();
    };

    const stop = (e: PointerEvent) => {
      e.preventDefault();
      if (this.isDrawing) {
        this.inkCtx.closePath();
        this.isDrawing = false;
        
        // 強制中斷防呆 (Ghost Stroke 防護)
        try {
          if (this.inkCanvas.hasPointerCapture(e.pointerId)) {
            this.inkCanvas.releasePointerCapture(e.pointerId);
          }
        } catch {
          // 指標已遭系統隱式釋放，靜默忽略即可
        }
      }
    };

    this.inkCanvas.addEventListener('pointerdown', start, opts);
    this.inkCanvas.addEventListener('pointermove', move, opts);
    this.inkCanvas.addEventListener('pointerup', stop, opts);
    this.inkCanvas.addEventListener('pointercancel', stop, opts);
  }
}
