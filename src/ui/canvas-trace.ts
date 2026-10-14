// src/ui/canvas-trace.ts

/**
 * 描紅畫布內核 (Canvas Trace Core)
 * 負責處理 Retina 適配、防滾動觸控、以及無判定的自由描紅繪圖
 */
export class TraceCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing: boolean = false;

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
    const dpr = window.devicePixelRatio || 1;
    // 取得 CSS 設定的實際顯示大小
    const rect = this.canvas.getBoundingClientRect();
    
    // 設定實際物理像素大小
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    // 正規化座標系，讓後續繪圖不用一直乘 dpr
    this.ctx.scale(dpr, dpr);
    
    // 設定畫筆樣式 (預設為紅色描紅)
    this.ctx.strokeStyle = '#E53935'; 
    this.ctx.lineWidth = 14; // 適合小朋友的粗筆觸
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * 綁定滑鼠與觸控事件
   */
  private bindEvents() {
    // 防止在畫布上滑動時觸發整個網頁的滾動 (iOS/Android 必備)
    this.canvas.style.touchAction = 'none';

    // 滑鼠事件 (電腦端測試用)
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // 觸控事件 (對應手機/iPad平板)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // 阻止預設點擊行為
      this.startDrawing(e.touches[0]);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault(); // 阻止畫面滾動
      this.draw(e.touches[0]);
    }, { passive: false });

    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  /**
   * 取得相對於 Canvas 的正確座標
   */
  private getPointerPos(e: MouseEvent | Touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
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
   * 清除畫布，讓小朋友重新寫過
   */
  public clear() {
    // 恢復畫布為全透明
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
