import type { PerformancePanelMetrics } from '../types';

export interface PanelJankOps {
  title?: string;
  left?: number;
  width?: number;
  height?: number;
  isExpanded?: boolean;
}

// 记录一个间隔时间
const lastInterval = {
  // 间隔
  interval: 3000,
  // 上次间隔时间
  lastInterval: performance.now(),
  // 上次间隔时间
  lastJank: 0,
};

export class PanelJank {
  private panel: HTMLElement | null = null;
  /** 是否展开 */
  private isExpanded: boolean = true;
  private metrics: { fps: number; jank: { small: number; medium: number; large: number } } = {
    fps: 0,
    jank: { small: 0, medium: 0, large: 0 },
  };
  // private isDragging: boolean = false;
  // private dragOffset = { x: 0, y: 0 };
  private panelInfo?: {
    title: string;
    left: number;
    width: number;
    height: number;
    isExpanded: boolean;
  };
  constructor(ops: PanelJankOps = {}) {
    this.panel = null;
    this.isExpanded = true;
    this.panelInfo = {
      title: ops.title || 'Page',
      left: ops.left || 10,
      width: ops.width || 200,
      height: ops.height || 200,
      isExpanded: ops.isExpanded || true,
    };
    this.initPanel();
    this.metrics = { fps: 0, jank: { small: 0, medium: 0, large: 0 } };
  }

  initPanel() {
    // 1. 创建看板容器

    this.panel = document.createElement('div');
    this.panel.id = 'perf-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      border-radius: 4px;
      padding: 2px;
      z-index: 9999;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      user-select: none;
      width: 200px;
      transition: transform 0.3s;
    `;

    // 2. 添加标题栏（支持拖拽）
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2px;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      cursor: move;
    `;
    header.innerHTML = `
      <span>📊 ${'Jank Frame'}</span>
      <span>${this.panelInfo?.title || 'Page'}</span>
      <button id="toggle-panel" style="background:none; border:none; color:white; font-size:18px;">
        ${this.isExpanded ? '−' : '+'}
      </button>
    `;
    this.panel.appendChild(header);

    // 3. 内容区域
    const content = document.createElement('div');
    content.id = 'perf-content';
    content.style.cssText = `
      padding: 2px;
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.2);
    `;
    content.style.display = this.isExpanded ? 'block' : 'none';
    this.panel.appendChild(content);

    // 4. 挂载到DOM
    document.body.appendChild(this.panel);

    // 5. 绑定事件
    this.bindEvents();
  }

  bindEvents() {
    // 折叠/展开按钮
    this.panel?.querySelector('#toggle-panel')?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      const toggleButton = this.panel?.querySelector('#toggle-panel') as HTMLElement;
      const content = this.panel?.querySelector('#perf-content') as HTMLElement;

      if (toggleButton) {
        toggleButton.textContent = this.isExpanded ? '−' : '+';
      }
      if (content) {
        content.style.display = this.isExpanded ? 'block' : 'none';
      }
    });

    // 拖拽逻辑
    let offset = { x: 0, y: 0 };
    const onMouseMove = (e: any) => {
      if (this.panel) {
        this.panel.style.left = `${e.clientX - offset.x}px`;
        this.panel.style.top = `${e.clientY - offset.y}px`;
      }
    };

    this.panel?.querySelector('div')?.addEventListener('mousedown', (e) => {
      offset = {
        x: e.clientX - (this.panel?.offsetLeft || 0),
        y: e.clientY - (this.panel?.offsetTop || 0),
      };
      document.addEventListener('mousemove', onMouseMove);
    });

    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMouseMove);
    });
  }

  updateMetrics(data: PerformancePanelMetrics) {
    this.metrics = data;
    this.render();
  }

  render() {
    const content = this.panel?.querySelector('#perf-content');
    // 每隔 1000ms 输出一次
    if (performance.now() - lastInterval.lastInterval < lastInterval.interval) {
      // console.log('metrics', this.metrics);
    }
    lastInterval.lastInterval = performance.now();
    if (!content) return;

    const { fps, jank } = this.metrics;
    const fpsColor = fps > 55 ? '#4CAF50' : fps > 45 ? '#FFC107' : '#F44336';

    const styleFont = `
      font-size: 10px;
      padding:2px 8px;
      border-radius:12px;
    `;

    content.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div>FPS: <span style="color:${fpsColor}">${fps}</span></div>
      </div>
      <div>
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <span style="background:#FF9800; ${styleFont}">small: ${jank.small}</span>
          <span style="background:#FF5722; ${styleFont}">middle: ${jank.medium}</span>
          <span style="background:#D32F2F; ${styleFont}">large: ${jank.large}</span>
        </div>
      </div>
    `;
  }

  destroy() {
    if (this.panel && document.body.contains(this.panel)) {
      document.body.removeChild(this.panel);
    }
  }
}

// 看板挂载入口
export function initPanelJank() {
  // 仅非生产环境启用
  // if (process.env.NODE_ENV === 'production') return null;

  const panel = new PanelJank();

  // 监听性能数据（示例：通过EventBus或WebWorker）
  // window.addEventListener('perf-metrics', (e) => {
  //   panel.updateMetrics(e.detail);
  //   console.log('perf-metrics', e.detail);
  // });

  // 页面关闭时自动销毁
  window.addEventListener('beforeunload', () => panel.destroy());

  return panel;
}
