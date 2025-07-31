import Dexie from 'dexie';
import type { TabMemoryInfo, LeakDetectionConfig } from '../types';
import { DEFAULT_CONFIG } from './memoryAnalyzer';

/**
 * 内存监控数据库
 */
class MemoryMonitorDB extends Dexie {
  tabMemoryInfo: Dexie.Table<TabMemoryInfo, number>;
  config: Dexie.Table<{ id: number; value: LeakDetectionConfig }, number>;

  constructor() {
    super('MemoryMonitorDB');

    this.version(1).stores({
      tabMemoryInfo: '++id, tabId, timestamp',
      config: 'id'
    });

    this.tabMemoryInfo = this.table('tabMemoryInfo');
    this.config = this.table('config');
  }
}

const db = new MemoryMonitorDB();

/**
 * 存储服务 - 负责数据持久化
 */
export class StorageService {
  /**
   * 保存标签页内存信息
   */
  static async saveTabMemoryInfo(info: TabMemoryInfo): Promise<void> {
    await db.tabMemoryInfo.add(info);

    // 清理超过24小时的数据
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    await db.tabMemoryInfo.where('timestamp').below(oneDayAgo).delete();
  }

  /**
   * 获取标签页的内存历史数据
   */
  static async getTabMemoryHistory(tabId: number, limit = 100): Promise<TabMemoryInfo[]> {
    return await db.tabMemoryInfo
      .where('tabId')
      .equals(tabId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  /**
   * 获取所有标签页最新的内存信息
   */
  static async getLatestMemoryInfo(): Promise<TabMemoryInfo[]> {
    // 获取所有不同的tabId
    const tabIds = await db.tabMemoryInfo
      .orderBy('tabId')
      .uniqueKeys();

    const result: TabMemoryInfo[] = [];

    // 对每个tabId获取最新的记录
    for (const tabId of tabIds) {
      const latest = await db.tabMemoryInfo
        .where('tabId')
        .equals(tabId)
        .reverse()
        .first();

      if (latest) {
        result.push(latest);
      }
    }

    return result;
  }

  /**
   * 删除标签页的内存历史数据
   */
  static async deleteTabMemoryHistory(tabId: number): Promise<void> {
    await db.tabMemoryInfo
      .where('tabId')
      .equals(tabId)
      .delete();
  }

  /**
   * 保存配置
   */
  static async saveConfig(config: LeakDetectionConfig): Promise<void> {
    await db.config.put({ id: 1, value: config });
  }

  /**
   * 获取配置
   */
  static async getConfig(): Promise<LeakDetectionConfig> {
    const config = await db.config.get(1);
    return config?.value || DEFAULT_CONFIG;
  }
}