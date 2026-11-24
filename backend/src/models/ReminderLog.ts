import mongoose, { Schema, Document } from 'mongoose';

export type ReminderType = '24h_before' | 'due_today' | 'overdue' | 'study_task';

export interface IReminderLog extends Document {
  userId: mongoose.Types.ObjectId;
  entityType: 'assignment' | 'study-task';
  entityId: mongoose.Types.ObjectId;
  reminderType: ReminderType;
  sentAt: Date;
}

const reminderLogSchema = new Schema<IReminderLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    entityType: { type: String, enum: ['assignment', 'study-task'], required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    reminderType: { 
      type: String, 
      enum: ['24h_before', 'due_today', 'overdue', 'study_task'], 
      required: true 
    },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique compound index guarantees zero duplicate notifications across restarts for the same period
reminderLogSchema.index({ userId: 1, entityId: 1, reminderType: 1 }, { unique: true });

export const ReminderLog = mongoose.model<IReminderLog>('ReminderLog', reminderLogSchema);
