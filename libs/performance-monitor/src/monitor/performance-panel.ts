import type { PerformancePanelJank, PerformancePanelMetrics } from '../types';

export class PanelJankPerformance {
  private panel: HTMLElement;
  private content: HTMLElement;
  private isExpanded: boolean = true;
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  private metrics: PerformancePanelMetrics = {
    fps: 0,
    jank: { small: 0, medium: 0, large: 0, stutterRate: 0, severeJankRate: 0 },
    frameTimes: [],
  };

  constructor() {
    this.createPanel();
    this.enableDrag();
  }

  private createPanel() {
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 8px;
      font-family: monospace;
      z-index: 10000;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      user-select: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    `;

    const title = document.createElement('div');
    title.textContent = '📊 Performance Metrics';

    const toggleBtn = document.createElement('div');
    toggleBtn.textContent = this.isExpanded ? '−' : '+';
    toggleBtn.style.cursor = 'pointer';
    toggleBtn.style.fontSize = '18px';

    header.appendChild(title);
    header.appendChild(toggleBtn);
    this.panel.appendChild(header);

    this.content = document.createElement('div');
    this.content.id = 'metrics-content';
    this.content.style.padding = '12px';
    this.panel.appendChild(this.content);

    document.body.appendChild(this.panel);

    toggleBtn.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      toggleBtn.textContent = this.isExpanded ? '−' : '+';
      this.content.style.display = this.isExpanded ? 'block' : 'none';
    });
  }

  private enableDrag() {
    const header = this.panel.querySelector('div');
    header?.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragOffset.x = e.clientX - this.panel.offsetLeft;
      this.dragOffset.y = e.clientY - this.panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panel.style.left = `${e.clientX - this.dragOffset.x}px`;
      this.panel.style.top = `${e.clientY - this.dragOffset.y}px`;
    });

    document.addEventListener('mouseup', () => (this.isDragging = false));
  }

  // 更新指标数据（由PerformanceJankStutter调用）
  updateMetrics(data: PerformancePanelJank) {
    this.metrics = {
      ...data,
      fps: 0,
      frameTimes: this.metrics.frameTimes?.slice?.(-60),
      jank: {
        small: data.small,
        medium: data.medium,
        large: data.large,
        stutterRate: data.stutterRate,
        severeJankRate: data.severeJankRate,
      },
    } as PerformancePanelMetrics;
    this.render();
  }

  private render() {
    if (!this.isExpanded) return;

    const { fps, jank, frameTimes } = this.metrics;
    const fpsColor = fps > 55 ? '#00ff00' : fps > 45 ? '#ffff00' : '#ff0000';

    this.content.innerHTML = `
      <div style="margin-bottom: 10px;">
        <div>FPS: <span style="color:${fpsColor}">${fps}</span></div>
        <div style="font-size: 12px; color: #aaa;">${frameTimes.length} frames</div>
      </div>

      <div style="margin-bottom: 10px;">
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <span style="background:#ffcc00; color:black; padding:2px 8px; border-radius:12px;">小卡顿: ${jank.small}</span>
          <span style="background:#ff9900; color:black; padding:2px 8px; border-radius:12px;">中卡顿: ${jank.medium}</span>
          <span style="background:#ff3300; color:black; padding:2px 8px; border-radius:12px;">大卡顿: ${jank.large}</span>
        </div>
        <div>卡顿率: ${(jank.stutterRate * 100).toFixed(1)}%</div>
      </div>

      <div style="height: 60px; margin-top: 10px;">
        <canvas id="frame-time-chart" width="200" height="60"></canvas>
      </div>
    `;

    this.drawFrameTimeChart();
  }

  private drawFrameTimeChart() {
    const canvas = this.content.querySelector('#frame-time-chart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 绘制16.7ms参考线（60FPS标准）
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    const yRef = height * (1 - 16.7 / 100); // 最大显示100ms帧耗时
    ctx.moveTo(0, yRef);
    ctx.lineTo(width, yRef);
    ctx.stroke();

    // 绘制帧耗时曲线
    ctx.strokeStyle = '#4dabf7';
    ctx.beginPath();
    this.metrics.frameTimes?.forEach?.((t, i) => {
      const x = (i / this.metrics.frameTimes?.length) * width;
      const y = height * (1 - Math.min(t, 100) / 100); // 限制最大100ms
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}
