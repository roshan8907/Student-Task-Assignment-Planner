import { PlannerRepository } from '../repositories/PlannerRepository.js';
import { AppError } from '../utils/errors.js';
import mongoose from 'mongoose';

export class PlannerService {
  constructor(private repo = new PlannerRepository()) {}

  private validateObjectId(id: string, resourceName: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, `Invalid ${resourceName} ID format`);
    }
  }

  // Assignments
  listAssignments(uid: string) {
    return this.repo.listAssignments(uid);
  }

  async getAssignment(uid: string, id: string) {
    this.validateObjectId(id, 'assignment');
    const item = await this.repo.findAssignment(uid, id);
    if (!item) throw new AppError(404, 'Assignment not found');
    return item;
  }

  async createAssignment(uid: string, data: any) {
    // Normalise fields (e.g. courseCode -> subject, deadline -> dueDate)
    const payload = {
      ...data,
      userId: uid,
      subject: data.subject || data.courseCode,
      dueDate: data.dueDate || data.deadline,
    };
    return this.repo.createAssignment(payload);
  }

  async updateAssignment(uid: string, id: string, data: any) {
    this.validateObjectId(id, 'assignment');
    const payload = { ...data };
    if (payload.courseCode && !payload.subject) payload.subject = payload.courseCode;
    if (payload.deadline && !payload.dueDate) payload.dueDate = payload.deadline;

    const item = await this.repo.updateAssignment(uid, id, payload);
    if (!item) throw new AppError(404, 'Assignment not found');
    return item;
  }

  async deleteAssignment(uid: string, id: string) {
    this.validateObjectId(id, 'assignment');
    const item = await this.repo.deleteAssignment(uid, id);
    if (!item) throw new AppError(404, 'Assignment not found');
    return { message: 'Assignment deleted successfully' };
  }

  // Study Tasks
  listTasks(uid: string) {
    return this.repo.listTasks(uid);
  }

  async getTask(uid: string, id: string) {
    this.validateObjectId(id, 'study task');
    const item = await this.repo.findTask(uid, id);
    if (!item) throw new AppError(404, 'Study task not found');
    return item;
  }

  async createTask(uid: string, data: any) {
    const payload = {
      ...data,
      userId: uid,
      completed: data.completed ?? false,
      status: data.status || (data.completed ? 'Completed' : 'Not Started'),
    };
    return this.repo.createTask(payload);
  }

  async updateTask(uid: string, id: string, data: any) {
    this.validateObjectId(id, 'study task');
    const payload = { ...data };
    if (typeof payload.completed === 'boolean') {
      payload.status = payload.completed ? 'Completed' : 'Not Started';
      payload.completedAt = payload.completed ? new Date() : null;
    } else if (payload.status === 'Completed') {
      payload.completed = true;
      payload.completedAt = new Date();
    } else if (payload.status && payload.status !== 'Completed') {
      payload.completed = false;
      payload.completedAt = null;
    }

    const item = await this.repo.updateTask(uid, id, payload);
    if (!item) throw new AppError(404, 'Study task not found');
    return item;
  }

  async completeTask(uid: string, id: string, completed: boolean) {
    return this.updateTask(uid, id, { completed });
  }

  async deleteTask(uid: string, id: string) {
    this.validateObjectId(id, 'study task');
    const item = await this.repo.deleteTask(uid, id);
    if (!item) throw new AppError(404, 'Study task not found');
    return { message: 'Study task deleted successfully' };
  }

  // Summary
  getDashboardSummary(uid: string) {
    return this.repo.getDashboardSummary(uid);
  }
}
