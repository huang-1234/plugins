/**
 * 后台服务脚本 - 管理内存监控和泄漏检测
 */

import { MemoryAnalyzer, DEFAULT_CONFIG } from './services/memoryAnalyzer';
import { StorageService } from './services/storageService';
import type { TabMemoryInfo, LeakDetectionConfig, MessageType } from './types';

// 初始化内存分析器
const memoryAnalyzer = new MemoryAnalyzer();

// 标签页信息缓存
const tabInfoCache: Map<number, Partial<TabMemoryInfo>> = new Map();

// 已通知的泄漏标签页（避免重复通知）
const notifiedTabs: Set<number> = new Set();

/**
 * 初始化扩展
 */
async function initExtension() {
  // 加载配置
  const config = await StorageService.getConfig();
  memoryAnalyzer.updateConfig(config);

  // 设置定期检查
  chrome.alarms.create('memoryCheck', {
    periodInMinutes: 1
  });

  // 设置定期清理
  chrome.alarms.create('dataCleanup', {
    periodInMinutes: 60
  });
}

/**
 * 更新标签页信息
 */
async function updateTabInfo(tabId: number, data: Partial<TabMemoryInfo>) {
  // 获取标签页信息
  let tabInfo = tabInfoCache.get(tabId) || {};

  // 如果是新标签页，获取标题和URL
  if (!tabInfo.title || !tabInfo.url) {
    try {
      const tab = await chrome.tabs.get(tabId);
      tabInfo.title = tab.title || '未知标签页';
      tabInfo.url = tab.url || '';
    } catch (error) {
      tabInfo.title = '已关闭标签页';
      tabInfo.url = '';
      console.error('获取标签页信息失败:', error);
    }
  }

  // 更新数据
  tabInfo = { ...tabInfo, ...data };
  tabInfoCache.set(tabId, tabInfo);

  // 分析内存使用情况
  if (tabInfo.heapSize && tabInfo.timestamp) {
    const fullTabInfo: TabMemoryInfo = {
      tabId,
      title: tabInfo.title || '未知标签页',
      url: tabInfo.url || '',
      heapSize: tabInfo.heapSize,
      totalHeapSize: tabInfo.totalHeapSize || tabInfo.heapSize,
      domNodeCount: tabInfo.domNodeCount || 0,
      eventListenerCount: tabInfo.eventListenerCount,
      timestamp: tabInfo.timestamp,
      leakStatus: 'normal'
    };

    // 检测泄漏
    const leakResult = memoryAnalyzer.detectLeak(tabId);
    fullTabInfo.leakStatus = leakResult.status;

    // 添加样本到分析器
    memoryAnalyzer.addSample(fullTabInfo);

    // 保存到数据库
    await StorageService.saveTabMemoryInfo(fullTabInfo);

    // 如果检测到泄漏且未通知过，发送通知
    if (leakResult.status !== 'normal' && !notifiedTabs.has(tabId)) {
      notifyLeakDetected(tabId, fullTabInfo.title, leakResult.status, leakResult.details);
      notifiedTabs.add(tabId);
    }
  }
}

/**
 * 发送泄漏通知
 */
function notifyLeakDetected(tabId: number, tabTitle: string, severity: 'warning' | 'critical', details: string) {
  chrome.notifications.create(`leak-${tabId}`, {
    type: 'basic',
    iconUrl: '/public/icons/icon128.png',
    title: severity === 'critical' ? '检测到严重内存泄漏' : '内存使用异常警告',
    message: `标签页 "${tabTitle}" ${details}`,
    priority: 2
  });
}

/**
 * 清理已关闭标签页的数据
 */
async function cleanupClosedTabs() {
  const tabs = await chrome.tabs.query({});
  const activeTabIds = new Set(tabs.map(tab => tab.id).filter(Boolean) as number[]);

  // 清理缓存
  for (const tabId of tabInfoCache.keys()) {
    if (!activeTabIds.has(tabId)) {
      tabInfoCache.delete(tabId);
      notifiedTabs.delete(tabId);
      await StorageService.deleteTabMemoryHistory(tabId);
      memoryAnalyzer.clearTabHistory(tabId);
    }
  }
}

/**
 * 消息处理
 */
chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === 'memoryUpdate') {
        const tabId = message.tabId === -1 && sender.tab?.id
          ? sender.tab.id
          : message.tabId;

        await updateTabInfo(tabId, message.data);
        sendResponse({ success: true });
      }
      else if (message.type === 'configUpdate') {
        await StorageService.saveConfig(message.config);
        memoryAnalyzer.updateConfig(message.config);

        // 通知所有内容脚本配置已更新
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id) {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                type: 'configUpdate',
                config: message.config
              });
            } catch (error) {
              console.error('发送消息失败:', error);
              // 忽略无法发送消息的标签页
            }
          }
        }

        sendResponse({ success: true });
      }
      else if (message.type === 'requestMemoryData') {
        const tabId = message.tabId;
        let tabs: TabMemoryInfo[] = [];

        if (tabId) {
          // 获取特定标签页的数据
          const history = await StorageService.getTabMemoryHistory(tabId, 100);
          tabs = history;
        } else {
          // 获取所有标签页的最新数据
          tabs = await StorageService.getLatestMemoryInfo();
        }

        sendResponse({ tabs });
      }
      else if (message.type === 'memoryDataResponse') {
        sendResponse({ tabs: message.tabs });
      }
      else if (message.type === 'requestConfig') {
        const config = await StorageService.getConfig();
        sendResponse({ config });
      }
    } catch (error) {
      console.error('消息处理错误:', error);
      sendResponse({ error: String(error) });
    }
  })();

  return true; // 保持消息通道开放
});

/**
 * 定时任务处理
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'memoryCheck') {
    // 对所有标签页执行内存检查
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          // 触发内容脚本收集数据
          await chrome.tabs.sendMessage(tab.id, { type: 'collectMemory' });
        } catch (error) {
          // 忽略无法发送消息的标签页
        }
      }
    }
  }
  else if (alarm.name === 'dataCleanup') {
    await cleanupClosedTabs();
  }
});

/**
 * 标签页关闭处理
 */
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // 标记为已关闭，但不立即删除数据
  const tabInfo = tabInfoCache.get(tabId);
  if (tabInfo) {
    tabInfo.title = '已关闭标签页';
  }
});

// 初始化扩展
initExtension();