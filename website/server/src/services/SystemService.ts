import os from 'os';

export class SystemService {
  /**
   * 获取系统状态信息
   */
  getSystemStatus() {
    return {
      cpu: {
        loadAvg: os.loadavg(),
        cpus: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: (1 - os.freemem() / os.totalmem()) * 100
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname()
    };
  }
}