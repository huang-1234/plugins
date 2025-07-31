/**
 * RadarReport - Enhanced frontend monitoring data reporting class
 * Handles reliable data transmission with queue management, batching, and retry mechanisms
 */
export class RadarReport<T extends unknown = {}> {
  private queue: T[] = [];
  private sending = false;
  private retryQueue: T[] = [];
  private retryAttempts = new Map<string, number>();

  // Configurable parameters
  private maxRetries = 3;
  private maxQueueSize = 1000;
  private maxRetryQueueSize = 500;
  private batchSize = 5;
  private processingTimeout: number | null = null;

  // Storage keys for offline persistence
  private readonly STORAGE_KEY = 'radar_offline_data';

  // Configuration options
  reportUrl: string = '/api/radar';

  constructor(config?: {
    reportUrl?: string;
    maxRetries?: number;
    maxQueueSize?: number;
    maxRetryQueueSize?: number;
    batchSize?: number;
  }) {
    if (config) {
      this.reportUrl = config.reportUrl || this.reportUrl;
      this.maxRetries = config.maxRetries || this.maxRetries;
      this.maxQueueSize = config.maxQueueSize || this.maxQueueSize;
      this.maxRetryQueueSize = config.maxRetryQueueSize || this.maxRetryQueueSize;
      this.batchSize = config.batchSize || this.batchSize;
    }

    // Recover data from local storage on initialization
    this.recoverOfflineData();

    // Add unload event listener to ensure data is saved when page closes
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', () => this.persistOfflineData());
    }
  }

  /**
   * Public method to report monitoring data
   * @param data The data to report
   * @param priority Optional priority level (higher = more important)
   */
  report(data: T, priority = 0) {
    // Add priority field for queue management
    const prioritizedData = { ...data, __priority: priority } as T;

    if (this.queue.length >= this.maxQueueSize) {
      // Find lowest priority item to remove if queue is full
      const lowestPriorityIndex = this.findLowestPriorityItemIndex();
      if (lowestPriorityIndex >= 0 && (data as any).__priority > (this.queue[lowestPriorityIndex] as any).__priority) {
        // Replace lowest priority item with current one
        this.queue.splice(lowestPriorityIndex, 1);
        this.queue.push(prioritizedData);
      } else {
        console.warn('Report queue full, discarding new data due to lower priority');
        return; // Don't add the data
      }
    } else {
      this.queue.push(prioritizedData);
    }

    // Schedule queue processing with debounce
    this.scheduleQueueProcessing();
  }

  /**
   * Schedule queue processing with debounce to avoid frequent processing
   */
  private scheduleQueueProcessing() {
    if (this.sending) return;

    if (this.processingTimeout === null) {
      this.processingTimeout = window.setTimeout(() => {
        this.processingTimeout = null;
        this.processQueue();
      }, 0); // Use microtask timing for immediate but non-blocking execution
    }
  }

  /**
   * Process the queue in chunks to avoid blocking the main thread
   */
  private async processQueue() {
    if (this.sending) return;
    this.sending = true;

    try {
      // Process retry queue first with higher priority
      await this.processQueueChunk(this.retryQueue, true);

      // Then process main queue
      await this.processQueueChunk(this.queue, false);
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.sending = false;

      // If there are still items, schedule another processing round
      if (this.queue.length > 0 || this.retryQueue.length > 0) {
        this.scheduleQueueProcessing();
      }
    }
  }

  /**
   * Process a chunk of the queue to avoid long-running operations
   */
  private async processQueueChunk(sourceQueue: T[], isRetry: boolean) {
    // Process only a limited number of items per cycle
    const itemsToProcess = Math.min(this.batchSize, sourceQueue.length);
    if (itemsToProcess === 0) return;

    const batch = sourceQueue.splice(0, itemsToProcess);
    await this.sendBatch(batch, isRetry);
  }

  /**
   * Send a batch of data with error handling
   */
  private async sendBatch(batch: T[], isRetry = false): Promise<void> {
    if (batch.length === 0) return;

    // Generate a truly unique batch ID
    const batchId = this.generateUniqueId();

    try {
      const reportUrl = this.reportUrl;
      const payload = JSON.stringify(batch);

      // Check payload size for sendBeacon compatibility (64KB limit)
      const isPayloadTooLarge = payload.length > 60000; // Leave some margin

      // Use sendBeacon for small payloads if available and page is unloading
      if (navigator.sendBeacon && !isPayloadTooLarge && (document.visibilityState === 'hidden' || document.hidden)) {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(reportUrl, blob);

        if (!success) throw new Error('Beacon failed');
      } else {
        // Use fetch with timeout for normal operation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
          const response = await fetch(reportUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      }

      // Clean up retry tracking on success
      if (isRetry) {
        this.retryAttempts.delete(batchId);
      }
    } catch (error) {
      this.handleSendError(batch, batchId, error as Error);
    }
  }

  /**
   * Handle send errors with progressive retry and fallback strategies
   */
  private handleSendError(batch: T[], batchId: string, error: Error) {
    const attempts = this.retryAttempts.get(batchId) || 0;

    if (attempts < this.maxRetries) {
      // Implement exponential backoff for retries
      const retryDelay = Math.min(1000 * Math.pow(2, attempts), 30000); // Max 30s

      console.warn(`Send failed, retrying (${attempts + 1}/${this.maxRetries}) in ${retryDelay}ms: ${error.message}`);
      this.retryAttempts.set(batchId, attempts + 1);

      // Check retry queue size limit
      if (this.retryQueue.length >= this.maxRetryQueueSize) {
        // Remove oldest items if queue is full
        this.retryQueue.splice(0, batch.length);
      }

      // Add to retry queue after delay
      setTimeout(() => {
        this.retryQueue.push(...batch);
        this.scheduleQueueProcessing();
      }, retryDelay);
    } else {
      console.error(`Permanent send failure: ${error.message}`, batch);

      // Implement fallback strategy - store in localStorage
      this.storeOfflineData(batch);

      // Clean up retry tracking for failed items
      this.retryAttempts.delete(batchId);
    }
  }

  /**
   * Store data offline when network requests fail permanently
   */
  private storeOfflineData(batch: T[]): void {
    try {
      const offlineData = this.getOfflineData();

      // Limit stored data to prevent localStorage overflow
      const maxOfflineItems = 200;
      if (offlineData.length > maxOfflineItems) {
        offlineData.splice(0, offlineData.length - maxOfflineItems + batch.length);
      }

      offlineData.push(...batch);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(offlineData));
    } catch (e) {
      console.error('Failed to store offline data:', e);
    }
  }

  /**
   * Get offline data from localStorage
   */
  private getOfflineData(): T[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to retrieve offline data:', e);
      return [];
    }
  }

  /**
   * Recover offline data on initialization
   */
  private recoverOfflineData(): void {
    try {
      const offlineData = this.getOfflineData();
      if (offlineData.length > 0) {
        // Clear storage to prevent duplicate processing
        localStorage.removeItem(this.STORAGE_KEY);

        // Add recovered data to retry queue with high priority
        const highPriorityData = offlineData.map(item => ({ ...item, __priority: 999 })) as T[];

        // Limit the amount of data we recover to avoid overwhelming the queue
        const dataToRecover = highPriorityData.slice(-Math.min(highPriorityData.length, this.maxRetryQueueSize));
        this.retryQueue.push(...dataToRecover);

        console.log(`Recovered ${dataToRecover.length} offline data items`);
        this.scheduleQueueProcessing();
      }
    } catch (e) {
      console.error('Failed to recover offline data:', e);
    }
  }

  /**
   * Persist any pending data when page unloads
   */
  private persistOfflineData(): void {
    if (this.queue.length === 0 && this.retryQueue.length === 0) return;

    try {
      const allPendingData = [...this.queue, ...this.retryQueue];
      const existingData = this.getOfflineData();
      const combinedData = [...existingData, ...allPendingData];

      // Limit total items to prevent localStorage overflow
      const maxItems = 500;
      const dataToStore = combinedData.slice(-maxItems);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
    } catch (e) {
      console.error('Failed to persist offline data:', e);
    }
  }

  /**
   * Find the index of the lowest priority item in the queue
   */
  private findLowestPriorityItemIndex(): number {
    if (this.queue.length === 0) return -1;

    let lowestPriority = Number.MAX_SAFE_INTEGER;
    let lowestIndex = -1;

    for (let i = 0; i < this.queue.length; i++) {
      const priority = (this.queue[i] as any).__priority || 0;
      if (priority < lowestPriority) {
        lowestPriority = priority;
        lowestIndex = i;
      }
    }

    return lowestIndex;
  }

  /**
   * Generate a truly unique ID for batch tracking
   */
  private generateUniqueId(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older browsers
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}-${this.queue.length}`;
  }

  /**
   * Get current queue statistics for monitoring
   */
  getQueueStats() {
    return {
      mainQueue: this.queue.length,
      retryQueue: this.retryQueue.length,
      activeSending: this.sending,
      offlineData: this.getOfflineDataCount(),
      configuration: {
        batchSize: this.batchSize,
        maxQueueSize: this.maxQueueSize,
        maxRetryQueueSize: this.maxRetryQueueSize,
        maxRetries: this.maxRetries
      }
    };
  }

  /**
   * Get count of offline data items
   */
  private getOfflineDataCount(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data).length : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Manually flush all queues (useful for testing or before page unload)
   */
  async flush(): Promise<void> {
    // Process all queues immediately
    this.sending = false;
    await this.processQueue();
    return;
  }

  /**
   * Clear all queues and offline data (useful for testing or user opt-out)
   */
  clear(): void {
    this.queue = [];
    this.retryQueue = [];
    this.retryAttempts.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
