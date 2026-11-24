import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  description: string;
  dueDate: Date;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Not Started' | 'In Progress' | 'Completed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    subject: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' },
    notes: { type: String, default: '', trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, dueDate: 1 });
assignmentSchema.index({ userId: 1, status: 1 });
assignmentSchema.index({ userId: 1, priority: 1 });

export const Assignment = mongoose.model<IAssignment>('Assignment', assignmentSchema);
