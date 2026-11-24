import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as c from '../controllers/controllers.js';
import { env } from '../config/env.js';

const r = Router();

// Validation Schemas
const authBody = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const registerBody = authBody.extend({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
});

const priorityEnum = z.enum(['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH']).default('Medium').transform((val) => {
  const map: Record<string, 'Low' | 'Medium' | 'High'> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
  };
  return map[val] || 'Medium';
});

const statusEnum = z
  .enum(['Not Started', 'In Progress', 'Completed', 'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED'])
  .default('Not Started')
  .transform((val) => {
    const map: Record<string, 'Not Started' | 'In Progress' | 'Completed'> = {
      NOT_STARTED: 'Not Started',
      IN_PROGRESS: 'In Progress',
      SUBMITTED: 'Completed',
      'Not Started': 'Not Started',
      'In Progress': 'In Progress',
      Completed: 'Completed',
    };
    return map[val] || 'Not Started';
  });

const assignmentRawSchema = z.object({
  title: z.string().min(1, 'Title is required').max(140),
  subject: z.string().min(1, 'Subject is required').max(60).optional(),
  courseCode: z.string().min(1).max(60).optional(),
  description: z.string().max(2000).optional().default(''),
  dueDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  priority: priorityEnum,
  status: statusEnum,
  notes: z.string().max(2000).optional().default(''),
});

const assignmentBody = assignmentRawSchema
  .refine((data) => Boolean(data.subject || data.courseCode), {
    message: 'Subject or course code is required',
    path: ['subject'],
  })
  .refine((data) => Boolean(data.dueDate || data.deadline), {
    message: 'Due date is required',
    path: ['dueDate'],
  });

const assignmentUpdateBody = assignmentRawSchema.partial();

const studyTaskRawSchema = z.object({
  title: z.string().min(1, 'Title is required').max(140),
  description: z.string().max(2000).optional().default(''),
  subject: z.string().max(60).optional().default('General'),
  dueDate: z.coerce.date().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium').optional(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('Not Started').optional(),
  estimatedDuration: z.coerce.number().min(1).max(1440).optional().default(30),
  completed: z.boolean().optional().default(false),
});

const studyTaskBody = studyTaskRawSchema;
const studyTaskUpdateBody = studyTaskRawSchema.partial().extend({
  completedAt: z.coerce.date().nullable().optional(),
});

// Public Routes
r.get('/health', (_req, res) => res.json({ status: 'ok', service: 'student-planner-api' }));
r.get('/push/public-key', (_req, res) => res.json({ publicKey: env.vapidPublic }));
r.post('/auth/register', validateBody(registerBody), asyncHandler(c.register));
r.post('/auth/login', validateBody(authBody), asyncHandler(c.login));

// Protected Routes (Require JWT)
r.use(requireAuth);

// Auth Me & Logout
r.get('/auth/me', asyncHandler(c.getMe));
r.post('/auth/logout', asyncHandler(c.logout));

// Dashboard Summary
r.get('/dashboard/summary', asyncHandler(c.getDashboardSummary));

// Assignments CRUD
r.get('/assignments', asyncHandler(c.listAssignments));
r.get('/assignments/:id', asyncHandler(c.getAssignment));
r.post('/assignments', validateBody(assignmentBody), asyncHandler(c.createAssignment));
r.patch('/assignments/:id', validateBody(assignmentUpdateBody), asyncHandler(c.updateAssignment));
r.delete('/assignments/:id', asyncHandler(c.deleteAssignment));

// Study Tasks CRUD
r.get('/study-tasks', asyncHandler(c.listTasks));
r.get('/study-tasks/:id', asyncHandler(c.getTask));
r.post('/study-tasks', validateBody(studyTaskBody), asyncHandler(c.createTask));
r.patch('/study-tasks/:id', validateBody(studyTaskUpdateBody), asyncHandler(c.updateTask));
r.patch('/study-tasks/:id/complete', validateBody(z.object({ completed: z.boolean() })), asyncHandler(c.completeTask));
r.delete('/study-tasks/:id', asyncHandler(c.deleteTask));

// Push Notifications & Scheduler Endpoints
r.get('/notifications/status', asyncHandler(c.getPushStatus));
r.get('/notifications/history', asyncHandler(c.getNotificationHistory));
r.post('/notifications/subscribe', asyncHandler(c.savePush));
r.delete('/notifications/subscribe', asyncHandler(c.unsubscribePush));
r.post('/notifications/test', asyncHandler(c.testPush));
r.post('/notifications/trigger-reminders', asyncHandler(c.triggerReminders));

// Legacy Push compatibility
r.post('/push/subscribe', asyncHandler(c.savePush));
r.post('/push/test', asyncHandler(c.testPush));

export default r;
