import React, { useEffect } from 'react'

export const useCytoscapePerformance = (cy: any) => {
  // 在GraphCytoscape组件中添加性能日志
  useEffect(() => {
    const startTime = performance.now();
    // ...初始化Cytoscape
    const renderTime = performance.now() - startTime;
    console.log(`[Perf] Graph rendered in ${renderTime.toFixed(2)}ms`);
    // 监控FPS
    const fpsMonitor = setInterval(() => {
      if (!cy) return;
      const fps = Math.round(cy?.fps?.() || 0);
      if (fps < 30) console.warn(`[Perf] Low FPS: ${fps}`);
    }, 5000);

    return () => clearInterval(fpsMonitor);
  }, []);

  return {
    fps: cy.fps()
  }
}
