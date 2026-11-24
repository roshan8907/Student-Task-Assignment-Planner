import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyTask extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  dueDate?: Date | null;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Not Started' | 'In Progress' | 'Completed';
  estimatedDuration?: number | null; // in minutes
  completed: boolean;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const studyTaskSchema = new Schema<IStudyTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    subject: { type: String, default: 'General', trim: true, maxlength: 60 },
    dueDate: { type: Date, default: null },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    estimatedDuration: { type: Number, default: 30, min: 1, max: 1440 }, // max 24h
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

studyTaskSchema.index({ userId: 1, dueDate: 1 });
studyTaskSchema.index({ userId: 1, completed: 1 });
studyTaskSchema.index({ userId: 1, status: 1 });

export const StudyTask = mongoose.model<IStudyTask>('StudyTask', studyTaskSchema);
