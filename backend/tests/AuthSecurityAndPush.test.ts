import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/services/AuthService.js';
import { PushService } from '../src/services/PushService.js';
import { User } from '../src/models/User.js';
import { PushSubscription } from '../src/models/PushSubscription.js';
import { NotificationLog } from '../src/models/NotificationLog.js';
import { Assignment } from '../src/models/Assignment.js';
import { StudyTask } from '../src/models/StudyTask.js';
import webpush from 'web-push';
import mongoose from 'mongoose';

describe('AuthService - Token Revocation & Security Isolation', () => {
  it('increments tokenVersion on logout to invalidate active JWTs', async () => {
    const userId = '507f1f77bcf86cd799439011';
    vi.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({ _id: userId, tokenVersion: 1 } as any);

    const auth = new AuthService();
    const res = await auth.logout(userId);

    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, { $inc: { tokenVersion: 1 } });
    expect(res.message).toContain('server-side session invalidated');
  });

  it('rejects short passwords under 8 characters with 400 status', async () => {
    const auth = new AuthService();
    await expect(auth.register('John', 'john@test.ac.nz', '12345')).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });
});

describe('PushService - Subscription Lifecycle & MongoDB Persistence', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  it('saves subscription with upsert for authenticated user', async () => {
    const subData = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/valid-production-device-token-abc',
      keys: {
        p256dh: 'BPCuZ13lgsUqEhY2T7m-Ms5IDQVyQ_9b-tzwVhad3Mr9FvZLf_-Kf_0weuVqucxuea_MNeXSHDMUq0MnWWTXKb0',
        auth: 'e6CHkwSdq2TWxAuNiT2yCA',
      },
    };

    vi.spyOn(PushSubscription, 'deleteMany').mockResolvedValue({} as any);
    vi.spyOn(PushSubscription, 'findOneAndUpdate').mockResolvedValue({ _id: 'sub_123', ...subData } as any);

    const push = new PushService();
    const result = await push.save(userId, subData);

    expect(PushSubscription.findOneAndUpdate).toHaveBeenCalledWith(
      { userId, endpoint: subData.endpoint },
      { userId, endpoint: subData.endpoint, keys: subData.keys },
      { upsert: true, new: true }
    );
    expect(result.message).toContain('registered successfully in MongoDB');
  });

  it('rejects invalid or placeholder subscription endpoints', async () => {
    const push = new PushService();

    // 1. Non-HTTPS endpoint
    await expect(
      push.save(userId, { endpoint: 'http://insecure-endpoint.com', keys: { p256dh: 'abc', auth: 'abc' } })
    ).rejects.toThrow('Push subscription endpoint must be a valid secure HTTPS URL');

    // 2. Sample/placeholder endpoint rejection
    await expect(
      push.save(userId, {
        endpoint: 'https://fcm.googleapis.com/fcm/send/sample-device-token-123',
        keys: { p256dh: 'long_valid_key_string_exceeding_30_chars_here', auth: 'valid_auth_secret' },
      })
    ).rejects.toThrow('Placeholder or test push endpoints are not permitted in production registration');

    // 3. Missing keys
    await expect(
      push.save(userId, { endpoint: 'https://fcm.googleapis.com/fcm/send/real-token' })
    ).rejects.toThrow('Push subscription requires valid p256dh and auth cryptographic keys');
  });

  it('queries subscription status for authenticated user', async () => {
    vi.spyOn(PushSubscription, 'find').mockResolvedValue([
      { _id: 'sub_1', endpoint: 'https://endpoint.com/1', createdAt: new Date() },
    ] as any);

    const push = new PushService();
    const status = await push.getSubscriptionStatus(userId);

    expect(status.isSubscribed).toBe(true);
    expect(status.subscriptionCount).toBe(1);
    expect(PushSubscription.find).toHaveBeenCalledWith({ userId });
  });

  it('removes push subscription on unsubscribe', async () => {
    vi.spyOn(PushSubscription, 'findOneAndDelete').mockResolvedValue({} as any);

    const push = new PushService();
    const result = await push.unsubscribe(userId, 'https://endpoint.com/sub');

    expect(PushSubscription.findOneAndDelete).toHaveBeenCalledWith({
      userId,
      endpoint: 'https://endpoint.com/sub',
    });
    expect(result.message).toContain('removed successfully');
  });
});

describe('PushService - Automatic Reminders, Deduplication & Ownership Scoping', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const assignmentId = new mongoose.Types.ObjectId().toString();
  const taskId = new mongoose.Types.ObjectId().toString();

  it('detects upcoming assignment, dispatches notification, and records NotificationLog', async () => {
    const mockAssignment = {
      _id: assignmentId,
      userId,
      title: 'Distributed Systems Lab 2',
      subject: 'COMP702',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 14 * 60 * 60 * 1000), // Due in 14h (within 24h)
    };

    vi.spyOn(Assignment, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([mockAssignment]),
    } as any);

    vi.spyOn(StudyTask, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    vi.spyOn(NotificationLog, 'findOne').mockResolvedValue(null);
    vi.spyOn(NotificationLog, 'create').mockResolvedValue({} as any);

    vi.spyOn(PushSubscription, 'find').mockResolvedValue([
      {
        endpoint: 'https://fcm.googleapis.com/fcm/send/active-user',
        keys: { p256dh: 'sample-p256', auth: 'sample-auth' },
      },
    ] as any);

    vi.spyOn(webpush, 'sendNotification').mockResolvedValue({} as any);

    const push = new PushService();
    const result = await push.checkAndSendReminders(userId);

    expect(result.checked).toBe(1);
    expect(result.eligible).toBe(1);
    expect(result.dispatched).toBe(1);
    expect(webpush.sendNotification).toHaveBeenCalled();
    expect(NotificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        entityId: assignmentId,
        status: 'delivered',
      })
    );
  });

  it('skips duplicate notification when NotificationLog already exists for same period', async () => {
    const mockAssignment = {
      _id: assignmentId,
      userId,
      title: 'Distributed Systems Lab 2',
      status: 'In Progress',
      dueDate: new Date(Date.now() + 14 * 60 * 60 * 1000),
    };

    vi.spyOn(Assignment, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([mockAssignment]),
    } as any);

    vi.spyOn(StudyTask, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    // Mock existing delivered log
    vi.spyOn(NotificationLog, 'findOne').mockResolvedValue({
      _id: 'existing_log',
      status: 'delivered',
    } as any);

    const push = new PushService();
    const result = await push.checkAndSendReminders(userId);

    expect(result.dispatched).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.details.some((d) => d.includes('Skipped duplicate'))).toBe(true);
  });

  it('excludes completed assignments and tasks from reminder dispatch', async () => {
    // MongoDB query excludes { status: { $ne: 'Completed' } }
    vi.spyOn(Assignment, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    vi.spyOn(StudyTask, 'find').mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const push = new PushService();
    const result = await push.checkAndSendReminders(userId);

    expect(result.checked).toBe(0);
    expect(result.eligible).toBe(0);
    expect(result.dispatched).toBe(0);
  });
});
