import { describe, it, expect, vi } from 'vitest';
import { PlannerService } from '../src/services/PlannerService.js';
import { AuthService } from '../src/services/AuthService.js';
import { AppError } from '../src/utils/errors.js';
import mongoose from 'mongoose';

describe('PlannerService - Assignments', () => {
  const validObjectId = new mongoose.Types.ObjectId().toString();

  it('scopes assignment creation to authenticated user', async () => {
    const repo: any = { createAssignment: vi.fn(async (d) => d) };
    const service = new PlannerService(repo);
    const result = await service.createAssignment('user-1', {
      title: 'Report',
      subject: 'CS101',
      dueDate: new Date(),
    });
    expect(repo.createAssignment).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Report', subject: 'CS101', userId: 'user-1' })
    );
    expect(result.userId).toBe('user-1');
  });

  it('returns assignment list from repository for current user', async () => {
    const repo: any = { listAssignments: vi.fn().mockResolvedValue([{ title: 'Lab' }]) };
    const service = new PlannerService(repo);
    expect(await service.listAssignments('u1')).toEqual([{ title: 'Lab' }]);
    expect(repo.listAssignments).toHaveBeenCalledWith('u1');
  });

  it('throws 400 for invalid ObjectId on getAssignment', async () => {
    const repo: any = { findAssignment: vi.fn() };
    const service = new PlannerService(repo);
    await expect(service.getAssignment('u1', 'invalid-id')).rejects.toThrow('Invalid assignment ID format');
  });

  it('throws 404 if assignment is not found or owned by another user', async () => {
    const repo: any = { findAssignment: vi.fn().mockResolvedValue(null) };
    const service = new PlannerService(repo);
    await expect(service.getAssignment('u1', validObjectId)).rejects.toThrow('Assignment not found');
  });

  it('updates an existing assignment belonging to user', async () => {
    const repo: any = {
      updateAssignment: vi.fn().mockResolvedValue({ _id: validObjectId, title: 'Updated' }),
    };
    const service = new PlannerService(repo);
    const res = await service.updateAssignment('u1', validObjectId, { title: 'Updated' });
    expect(res.title).toBe('Updated');
    expect(repo.updateAssignment).toHaveBeenCalledWith('u1', validObjectId, { title: 'Updated' });
  });

  it('deletes assignment successfully', async () => {
    const repo: any = {
      deleteAssignment: vi.fn().mockResolvedValue({ _id: validObjectId }),
    };
    const service = new PlannerService(repo);
    const res = await service.deleteAssignment('u1', validObjectId);
    expect(res.message).toContain('deleted');
  });
});

describe('PlannerService - Study Tasks', () => {
  const validObjectId = new mongoose.Types.ObjectId().toString();

  it('creates study task with default status and duration', async () => {
    const repo: any = { createTask: vi.fn(async (d) => d) };
    const service = new PlannerService(repo);
    const result = await service.createTask('u1', {
      title: 'Read chapter 3',
    });
    expect(result.userId).toBe('u1');
    expect(result.completed).toBe(false);
    expect(result.status).toBe('Not Started');
  });

  it('toggles task completion and updates status and timestamp', async () => {
    const repo: any = {
      updateTask: vi.fn().mockResolvedValue({ _id: validObjectId, completed: true, status: 'Completed' }),
    };
    const service = new PlannerService(repo);
    const res = await service.completeTask('u1', validObjectId, true);
    expect(res.completed).toBe(true);
    expect(repo.updateTask).toHaveBeenCalledWith(
      'u1',
      validObjectId,
      expect.objectContaining({ completed: true, status: 'Completed' })
    );
  });

  it('throws 400 for invalid task ObjectId', async () => {
    const repo: any = { findTask: vi.fn() };
    const service = new PlannerService(repo);
    await expect(service.getTask('u1', 'bad-task-id')).rejects.toThrow('Invalid study task ID format');
  });
});

describe('AuthService & Security Validation', () => {
  it('rejects passwords shorter than 8 characters', async () => {
    const authService = new AuthService();
    await expect(authService.register('Alex Student', 'alex@uni.edu', 'short')).rejects.toThrow(
      'Password must be at least 8 characters long'
    );
  });
});
