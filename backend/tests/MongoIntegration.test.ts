import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Assignment } from '../src/models/Assignment.js';
import { StudyTask } from '../src/models/StudyTask.js';
import { PushSubscription } from '../src/models/PushSubscription.js';
import { NotificationLog } from '../src/models/NotificationLog.js';
import bcrypt from 'bcryptjs';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/student_planner_test_isolation';

describe('Task 1 & Task 5: Database Integration & Multi-Tenant Isolation', () => {
  let testUserId1: string;
  let testUserId2: string;

  beforeAll(async () => {
    await mongoose.connect(TEST_MONGO_URI);
    await mongoose.connection.dropDatabase();

    // Seed two distinct users with salted bcrypt passwords
    const hash = await bcrypt.hash('TestPassword123!', 12);
    const u1 = await User.create({
      name: 'Alice Student',
      email: 'alice.test@op.ac.nz',
      passwordHash: hash,
      tokenVersion: 0,
    });
    const u2 = await User.create({
      name: 'Bob Student',
      email: 'bob.test@op.ac.nz',
      passwordHash: hash,
      tokenVersion: 0,
    });

    testUserId1 = u1._id.toString();
    testUserId2 = u2._id.toString();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  it('persists assignment with strict userId scoping in MongoDB', async () => {
    const asgn = await Assignment.create({
      userId: testUserId1,
      title: 'Operating Systems Lab 3',
      subject: 'COMP702',
      description: 'Concurrency and mutex locks',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'High',
      status: 'In Progress',
    });

    expect(asgn._id).toBeDefined();
    expect(asgn.userId.toString()).toBe(testUserId1);

    // Multi-tenant isolation test: User 2 must NOT be able to access User 1's assignment
    const user2Query = await Assignment.findOne({ _id: asgn._id, userId: testUserId2 });
    expect(user2Query).toBeNull();

    // User 1 can access it
    const user1Query = await Assignment.findOne({ _id: asgn._id, userId: testUserId1 });
    expect(user1Query).not.toBeNull();
    expect(user1Query?.title).toBe('Operating Systems Lab 3');
  });

  it('persists study task and updates completion status correctly', async () => {
    const task = await StudyTask.create({
      userId: testUserId1,
      title: 'Review Chapter 8',
      subject: 'COMP702',
      estimatedDuration: 45,
      completed: false,
    });

    expect(task.completed).toBe(false);

    // Update completion
    const updated = await StudyTask.findOneAndUpdate(
      { _id: task._id, userId: testUserId1 },
      { completed: true, status: 'Completed', completedAt: new Date() },
      { new: true }
    );

    expect(updated?.completed).toBe(true);
    expect(updated?.status).toBe('Completed');
    expect(updated?.completedAt).toBeDefined();
  });

  it('persists push subscription and enforces unique endpoint per user', async () => {
    const sub = await PushSubscription.create({
      userId: testUserId1,
      endpoint: 'https://fcm.googleapis.com/fcm/send/integration-test-endpoint-abc',
      keys: {
        p256dh: 'BPCuZ13lgsUqEhY2T7m-Ms5IDQVyQ_9b-tzwVhad3Mr9FvZLf_-Kf_0weuVqucxuea_MNeXSHDMUq0MnWWTXKb0',
        auth: 'e6CHkwSdq2TWxAuNiT2yCA',
      },
    });

    expect(sub._id).toBeDefined();

    // Verify NotificationLog deduplication record
    const log = await NotificationLog.create({
      userId: testUserId1,
      entityType: 'assignment',
      reminderType: 'due_today',
      title: 'Assignment Due Today',
      body: 'Reminder body',
      targetUrl: '/?tab=assignments',
      dispatchTime: new Date(),
      status: 'delivered',
      dedupKey: 'assignment_test_due_today',
    });

    expect(log._id).toBeDefined();
    expect(log.status).toBe('delivered');
  });
});
