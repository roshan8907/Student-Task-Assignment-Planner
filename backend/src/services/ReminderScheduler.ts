import { PushService } from '../services/PushService.js';

export class ReminderScheduler {
  private timer: NodeJS.Timeout | null = null;
  private pushService = new PushService();
  private intervalMs: number;
  private isRunning = false;

  /**
   * Automatic background scheduler: runs every 30 minutes in production
   */
  constructor(intervalMinutes = 30) {
    this.intervalMs = intervalMinutes * 60 * 1000;
  }

  start() {
    if (this.timer) return;
    console.log(`[Scheduler] Deadline reminder background scheduler initiated (interval: ${this.intervalMs / 60000}m)`);
    
    // Initial evaluation 5 seconds after startup
    setTimeout(() => this.runCheck(), 5000);

    // Schedule recurring evaluation
    this.timer = setInterval(() => this.runCheck(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[Scheduler] Deadline reminder scheduler stopped');
    }
  }

  async runCheck() {
    if (this.isRunning) return; // Prevent overlapping runs
    this.isRunning = true;

    try {
      const summary = await this.pushService.checkAndSendReminders();
      if (summary.dispatched > 0) {
        console.log(`[Scheduler] Dispatched ${summary.dispatched} automated reminder notifications via Web Push`);
      }
    } catch (err: any) {
      console.error('[Scheduler] Automatic reminder check error:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}
