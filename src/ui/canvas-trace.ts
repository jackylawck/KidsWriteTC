// src/ui/canvas-trace.ts

/**
 * 漢字筆順資料介面（對應 scripts/build-data.ts 產出的 JSON）
 */
export interface StrokeData {
  char: string;
  unicode: string;
  totalStrokes: number;
  strokes: string[]; // SVG Path 向量路徑
}

/**
 * 描紅畫布內核 (Canvas Trace Core)
 * 負責處理 Retina 適配、底字字模繪製、筆順導引虛線以及硃砂紅描紅
 */
export class TraceCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;
  private currentData: StrokeData | null = null;
  private dpr: number = 1;

  constructor(canvasId: string) {
    const el = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!el) throw new Error(`找不到 Canvas 元素: ${canvasId}`);

    this.canvas = el;
    this.ctx = this.canvas.getContext('2d')!;

    this.initRetinaDisplay();
    this.bindEvents();
  }

  /**
   * 解決高解析度螢幕 (Retina) 畫布模糊與起格問題
   */
  private initRetinaDisplay() {
    this.dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    // 物理像素適配
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    
    // 設定邏輯繪圖尺寸
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.resetBrush();
  }

  /**
   * 重設小朋友書寫畫筆樣式
   */
  private resetBrush() {
    this.ctx.strokeStyle = '#E53935'; // 硃砂紅
    this.ctx.lineWidth = 14;          // 適合小朋友的筆觸粗度
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * 載入指定漢字並繪製底字筆順字模
   */
  public loadCharacter(data: StrokeData) {
    this.currentData = data;
    this.render();
  }

  /**
   * 渲染字模底圖與筆順導引骨架
   */
  private render() {
    const rect = this.canvas.getBoundingClientRect();

    // 1. 完全清空畫布（以真實像素為準）
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    if (!this.currentData) return;

    // 2. 繪製標準楷體淺灰色底字（描紅底模）
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.font = `${rect.width * 0.76}px "Kaiti TC", "STKaiti", "BiauKai", "DFKai-SB", serif`;
    this.ctx.fillStyle = '#E0E0E0'; // 淺灰色底字
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentData.char, rect.width / 2, rect.height / 2 + 10);
    this.ctx.restore();

    // 3. 繪製筆劃向量骨架（虛線指引）
    if (this.currentData.strokes && this.currentData.strokes.length > 0) {
      this.ctx.save();
      this.ctx.scale(this.dpr, this.dpr);

      // SVG Path 座標基準通常為 1000x1000，依照畫布實際大小縮放
      const scaleFactor = rect.width / 1000;
      this.ctx.scale(scaleFactor, scaleFactor);

      this.ctx.strokeStyle = '#BDBDBD';
      this.ctx.lineWidth = 8 / scaleFactor;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.setLineDash([12 / scaleFactor, 8 / scaleFactor]);

      this.currentData.strokes.forEach((strokePath) => {
        const path = new Path2D(strokePath);
        this.ctx.stroke(path);
      });

      this.ctx.restore();
    }

    // 重設筆刷給小朋友描寫
    this.resetBrush();
  }

  /**
   * 綁定滑鼠與觸控事件
   */
  private bindEvents() {
    this.canvas.style.touchAction = 'none';

    // 滑鼠事件 (電腦端)
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    window.addEventListener('mouseup', () => this.stopDrawing());

    // 觸控事件 (iPad / 手機)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startDrawing(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.draw(e.touches[0]);
    }, { passive: false });

    window.addEventListener('touchend', () => this.stopDrawing());
  }

  /**
   * 取得正規化後的邏輯座標（自動對應 dpr）
   */
  private getPointerPos(e: MouseEvent | Touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * this.dpr,
      y: (e.clientY - rect.top) * this.dpr
    };
  }

  private startDrawing(e: MouseEvent | Touch) {
    this.isDrawing = true;
    const pos = this.getPointerPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  private draw(e: MouseEvent | Touch) {
    if (!this.isDrawing) return;
    const pos = this.getPointerPos(e);
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
  }

  private stopDrawing() {
    if (this.isDrawing) {
      this.ctx.closePath();
      this.isDrawing = false;
    }
  }

  /**
   * 清除小朋友手寫筆跡（保留底字字模）
   */
  public clear() {
    this.render();
  }
}
