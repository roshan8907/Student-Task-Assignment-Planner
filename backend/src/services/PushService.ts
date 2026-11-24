import webpush from 'web-push';
import { env } from '../config/env.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { Assignment } from '../models/Assignment.js';
import { StudyTask } from '../models/StudyTask.js';
import { NotificationLog, type ReminderType } from '../models/NotificationLog.js';
import { AppError } from '../utils/errors.js';
import { getDateBoundaries } from '../utils/dateUtils.js';
import {
  UpcomingDeadlineStrategy,
  DueTodayStrategy,
  OverdueStrategy,
  StudyTaskStrategy,
  type IReminderStrategy,
  type EvaluationContext,
} from './ReminderStrategies.js';

export interface ReminderCandidate {
  userId: string;
  entityType: 'assignment' | 'study-task';
  entityId: string;
  reminderType: ReminderType;
  title: string;
  body: string;
  targetUrl: string;
  dedupKey: string;
}

export interface ReminderScanSummary {
  success: boolean;
  checked: number;
  eligible: number;
  dispatched: number;
  skipped: number;
  failed: number;
  details: string[];
}

export class PushService {
  configured(): boolean {
    return Boolean(env.vapidPublic && env.vapidPrivate);
  }

  async getSubscriptionStatus(userId: string) {
    const subs = await PushSubscription.find({ userId });
    return {
      isSubscribed: subs.length > 0,
      subscriptionCount: subs.length,
      subscriptions: subs.map((s) => ({
        id: s._id,
        endpoint: s.endpoint,
        createdAt: s.createdAt,
      })),
    };
  }

  async getNotificationHistory(userId: string, limit = 20) {
    return NotificationLog.find({ userId })
      .sort({ dispatchTime: -1 })
      .limit(limit)
      .lean();
  }

  async save(userId: string, subscriptionData: any) {
    if (!subscriptionData || typeof subscriptionData !== 'object') {
      throw new AppError(400, 'Invalid push subscription payload');
    }

    const { endpoint, keys } = subscriptionData;
    if (!endpoint || typeof endpoint !== 'string' || !endpoint.startsWith('https://')) {
      throw new AppError(400, 'Push subscription endpoint must be a valid secure HTTPS URL');
    }

    // Reject fake or placeholder sample endpoints
    if (
      endpoint.includes('sample-device-token') ||
      endpoint.includes('placeholder') ||
      endpoint.includes('test-endpoint')
    ) {
      throw new AppError(400, 'Placeholder or test push endpoints are not permitted in production registration');
    }

    if (!keys || typeof keys !== 'object' || !keys.p256dh || !keys.auth) {
      throw new AppError(400, 'Push subscription requires valid p256dh and auth cryptographic keys');
    }

    if (typeof keys.p256dh !== 'string' || keys.p256dh.length < 30) {
      throw new AppError(400, 'Invalid p256dh public key length');
    }

    if (typeof keys.auth !== 'string' || keys.auth.length < 10) {
      throw new AppError(400, 'Invalid auth secret key length');
    }

    // Safely remove any legacy sample/placeholder subscriptions for this user
    await PushSubscription.deleteMany({
      userId,
      $or: [
        { endpoint: /sample-device-token/ },
        { endpoint: /placeholder/ },
        { endpoint: /test-endpoint/ }
      ]
    });

    const sub = await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true }
    );

    return {
      message: 'Push subscription registered successfully in MongoDB',
      subscriptionId: sub._id,
      endpoint: sub.endpoint,
    };
  }

  async unsubscribe(userId: string, endpoint?: string) {
    if (endpoint) {
      await PushSubscription.findOneAndDelete({ userId, endpoint });
    } else {
      await PushSubscription.deleteMany({ userId });
    }
    return { message: 'Push subscription removed successfully' };
  }

  async sendTest(userId: string) {
    if (!this.configured()) {
      return { message: 'VAPID keys not configured on server', simulated: true };
    }

    webpush.setVapidDetails(env.vapidSubject, env.vapidPublic, env.vapidPrivate);
    const subs = await PushSubscription.find({ userId }).sort({ updatedAt: -1 });

    if (!subs || subs.length === 0) {
      throw new AppError(
        404,
        'No push subscription registered for your account in MongoDB. Please enable Web Push in Settings first.'
      );
    }

    const payload = JSON.stringify({
      title: 'Academic Reminder Test',
      body: 'Web Push alerts are connected to MongoDB and operational!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url: '/?tab=settings' },
    });

    let delivered = 0;
    let failed = 0;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          },
          payload
        );
        delivered++;
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
        failed++;
      }
    }

    const dedupKey = `test_alert_${Date.now()}`;
    await NotificationLog.create({
      userId,
      entityType: 'system',
      reminderType: 'test_alert',
      title: 'Academic Reminder Test',
      body: 'Web Push alerts are connected to MongoDB and operational!',
      targetUrl: '/?tab=settings',
      dispatchTime: new Date(),
      status: delivered > 0 ? 'delivered' : 'failed',
      dedupKey,
      errorMessage: failed > 0 ? 'Some endpoints failed or expired' : undefined,
    });

    if (delivered === 0 && failed > 0) {
      throw new AppError(500, 'Push service rejected all active subscriptions (endpoints expired or unsubscribed)');
    }

    return {
      message: 'Test notification submitted to browser push service',
      deliveredEndpoints: delivered,
      expiredRemoved: failed,
    };
  }

  /**
   * Evaluates pending reminders:
   * Can be scoped to a single user (Settings click) or run globally across all users (background scheduler)
   */
  async checkAndSendReminders(targetUserId?: string, referenceDate = new Date()): Promise<ReminderScanSummary> {
    const summary: ReminderScanSummary = {
      success: true,
      checked: 0,
      eligible: 0,
      dispatched: 0,
      skipped: 0,
      failed: 0,
      details: [],
    };

    if (!this.configured()) {
      summary.details.push('VAPID keys not configured');
      return summary;
    }

    webpush.setVapidDetails(env.vapidSubject, env.vapidPublic, env.vapidPrivate);

    const { startOfToday, endOfToday } = getDateBoundaries(referenceDate);
    const in24Hours = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);

    const assignmentQuery: any = { status: { $ne: 'Completed' } };
    const taskQuery: any = { completed: false };

    if (targetUserId) {
      assignmentQuery.userId = targetUserId;
      taskQuery.userId = targetUserId;
    }

    const [activeAssignments, activeTasks] = await Promise.all([
      Assignment.find(assignmentQuery).lean(),
      StudyTask.find(taskQuery).lean(),
    ]);

    summary.checked = activeAssignments.length + activeTasks.length;
    const candidates: ReminderCandidate[] = [];

    // Context & Strategies initialization (Strategy Pattern)
    const evalContext: EvaluationContext = {
      referenceDate,
      startOfToday,
      endOfToday,
      in24Hours,
    };

    const strategies: IReminderStrategy[] = [
      new OverdueStrategy(),
      new DueTodayStrategy(),
      new UpcomingDeadlineStrategy(),
      new StudyTaskStrategy(),
    ];

    // 1. Evaluate Incomplete Assignments using Strategies
    for (const a of activeAssignments) {
      if (!a.dueDate) continue;
      const uId = a.userId.toString();
      const aId = a._id.toString();

      for (const strat of strategies) {
        const res = strat.evaluate(a, 'assignment', evalContext);
        if (res) {
          candidates.push({
            userId: uId,
            entityType: 'assignment',
            entityId: aId,
            reminderType: res.reminderType,
            title: res.title,
            body: res.body,
            targetUrl: res.targetUrl,
            dedupKey: res.dedupKey,
          });
          break; // Match highest priority matching strategy
        }
      }
    }

    // 2. Evaluate Incomplete Study Tasks using Strategies
    for (const t of activeTasks) {
      if (!t.dueDate) continue;
      const uId = t.userId.toString();
      const tId = t._id.toString();

      for (const strat of strategies) {
        const res = strat.evaluate(t, 'study-task', evalContext);
        if (res) {
          candidates.push({
            userId: uId,
            entityType: 'study-task',
            entityId: tId,
            reminderType: res.reminderType,
            title: res.title,
            body: res.body,
            targetUrl: res.targetUrl,
            dedupKey: res.dedupKey,
          });
          break;
        }
      }
    }

    summary.eligible = candidates.length;

    // 3. Process candidate dispatch and MongoDB deduplication
    for (const item of candidates) {
      // Check MongoDB NotificationLog to guarantee zero duplicate dispatch across restarts
      const alreadySent = await NotificationLog.findOne({
        userId: item.userId,
        dedupKey: item.dedupKey,
        status: 'delivered',
      });

      if (alreadySent) {
        summary.skipped++;
        summary.details.push(`Skipped duplicate: "${item.title}"`);
        continue;
      }

      // Query active PushSubscriptions exclusively for this user
      const subscriptions = await PushSubscription.find({ userId: item.userId });
      if (!subscriptions.length) {
        summary.skipped++;
        summary.details.push(`No active subscription for user: ${item.userId}`);
        continue;
      }

      let deliveredToAny = false;
      let lastError = '';

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            JSON.stringify({
              title: item.title,
              body: item.body,
              icon: '/icon.svg',
              badge: '/icon.svg',
              data: { url: item.targetUrl },
            })
          );
          deliveredToAny = true;
        } catch (err: any) {
          lastError = err.message || 'Push dispatch failed';
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        }
      }

      if (deliveredToAny) {
        try {
          await NotificationLog.create({
            userId: item.userId,
            entityType: item.entityType,
            entityId: item.entityId,
            reminderType: item.reminderType,
            title: item.title,
            body: item.body,
            targetUrl: item.targetUrl,
            dispatchTime: new Date(),
            status: 'delivered',
            dedupKey: item.dedupKey,
          });
          summary.dispatched++;
          summary.details.push(`Dispatched: "${item.title}"`);
        } catch (err: any) {
          summary.skipped++;
        }
      } else {
        summary.failed++;
        summary.details.push(`Failed dispatch for "${item.title}": ${lastError}`);
        await NotificationLog.create({
          userId: item.userId,
          entityType: item.entityType,
          entityId: item.entityId,
          reminderType: item.reminderType,
          title: item.title,
          body: item.body,
          targetUrl: item.targetUrl,
          dispatchTime: new Date(),
          status: 'failed',
          dedupKey: item.dedupKey,
          errorMessage: lastError,
        });
      }
    }

    return summary;
  }
}
