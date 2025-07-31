/**
 * 内容脚本 - 在页面中运行，收集内存使用数据
 */

// 采样间隔（毫秒）
let sampleInterval = 5000;
// 是否启用
let enabled = true;
// 定时器ID
let timerId: number | null = null;

/**
 * 收集内存使用数据
 */
function collectMemoryData() {
  if (!enabled) return;

  try {
    // 获取内存信息
    const memory = (performance as any).memory;
    if (!memory) return;

    // 获取DOM节点数量
    const domNodeCount = document.querySelectorAll('*').length;

    // 发送数据到后台脚本
    chrome.runtime.sendMessage({
      type: 'memoryUpdate',
      tabId: -1, // 后台脚本会替换为实际的tabId
      data: {
        heapSize: memory.usedJSHeapSize,
        totalHeapSize: memory.totalJSHeapSize,
        domNodeCount,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('内存数据收集错误:', error);
  }
}

/**
 * 启动内存监控
 */
function startMonitoring(interval: number) {
  stopMonitoring();
  sampleInterval = interval;
  timerId = window.setInterval(collectMemoryData, interval);
  collectMemoryData(); // 立即采集一次数据
}

/**
 * 停止内存监控
 */
function stopMonitoring() {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

/**
 * 监听来自后台脚本的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'configUpdate') {
    enabled = message.config.enabled;

    if (enabled) {
      startMonitoring(message.config.sampleInterval);
    } else {
      stopMonitoring();
    }

    sendResponse({ success: true });
  }

  return true; // 保持消息通道开放
});

// 初始化
chrome.runtime.sendMessage({ type: 'requestConfig' }, (response) => {
  if (response && response.config) {
    enabled = response.config.enabled;
    sampleInterval = response.config.sampleInterval;

    if (enabled) {
      startMonitoring(sampleInterval);
    }
  } else {
    // 使用默认配置启动
    startMonitoring(sampleInterval);
  }
});

// 页面卸载时清理
window.addEventListener('unload', () => {
  stopMonitoring();
});