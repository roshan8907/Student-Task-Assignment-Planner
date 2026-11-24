import mongoose, { Schema, Document } from 'mongoose';

export type ReminderType = '24h_before' | 'due_today' | 'overdue' | 'study_task' | 'test_alert';
export type DeliveryStatus = 'delivered' | 'failed' | 'skipped';

export interface INotificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  entityType: 'assignment' | 'study-task' | 'system';
  entityId?: mongoose.Types.ObjectId;
  reminderType: ReminderType;
  title: string;
  body: string;
  targetUrl: string;
  scheduledTime?: Date;
  dispatchTime: Date;
  status: DeliveryStatus;
  errorMessage?: string;
  dedupKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, enum: ['assignment', 'study-task', 'system'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: false },
    reminderType: {
      type: String,
      enum: ['24h_before', 'due_today', 'overdue', 'study_task', 'test_alert'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    targetUrl: { type: String, default: '/' },
    scheduledTime: { type: Date },
    dispatchTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['delivered', 'failed', 'skipped'], default: 'delivered' },
    errorMessage: { type: String },
    dedupKey: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound unique index enforces strict deduplication across restarts for identical user+entity+type
notificationLogSchema.index({ userId: 1, dedupKey: 1 }, { unique: true });

export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', notificationLogSchema);
