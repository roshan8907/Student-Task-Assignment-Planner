import type { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { PlannerService } from '../services/PlannerService.js';
import { PushService } from '../services/PushService.js';

const auth = new AuthService();
const planner = new PlannerService();
const push = new PushService();

const getParamId = (req: Request): string => {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
};

// Auth Controllers
export const register = async (req: Request, res: Response) =>
  res.status(201).json(await auth.register(req.body.name, req.body.email, req.body.password));

export const login = async (req: Request, res: Response) =>
  res.json(await auth.login(req.body.email, req.body.password));

export const logout = async (req: Request, res: Response) =>
  res.json(await auth.logout(req.userId!));

export const getMe = async (req: Request, res: Response) =>
  res.json(await auth.getMe(req.userId!));

// Assignments Controllers
export const listAssignments = async (req: Request, res: Response) =>
  res.json(await planner.listAssignments(req.userId!));

export const getAssignment = async (req: Request, res: Response) =>
  res.json(await planner.getAssignment(req.userId!, getParamId(req)));

export const createAssignment = async (req: Request, res: Response) =>
  res.status(201).json(await planner.createAssignment(req.userId!, req.body));

export const updateAssignment = async (req: Request, res: Response) =>
  res.json(await planner.updateAssignment(req.userId!, getParamId(req), req.body));

export const deleteAssignment = async (req: Request, res: Response) =>
  res.json(await planner.deleteAssignment(req.userId!, getParamId(req)));

// Study Tasks Controllers
export const listTasks = async (req: Request, res: Response) =>
  res.json(await planner.listTasks(req.userId!));

export const getTask = async (req: Request, res: Response) =>
  res.json(await planner.getTask(req.userId!, getParamId(req)));

export const createTask = async (req: Request, res: Response) =>
  res.status(201).json(await planner.createTask(req.userId!, req.body));

export const updateTask = async (req: Request, res: Response) =>
  res.json(await planner.updateTask(req.userId!, getParamId(req), req.body));

export const completeTask = async (req: Request, res: Response) =>
  res.json(await planner.completeTask(req.userId!, getParamId(req), Boolean(req.body.completed)));

export const deleteTask = async (req: Request, res: Response) =>
  res.json(await planner.deleteTask(req.userId!, getParamId(req)));

// Dashboard Controller
export const getDashboardSummary = async (req: Request, res: Response) =>
  res.json(await planner.getDashboardSummary(req.userId!));

// Notifications Controllers
export const getPushStatus = async (req: Request, res: Response) =>
  res.json(await push.getSubscriptionStatus(req.userId!));

export const getNotificationHistory = async (req: Request, res: Response) =>
  res.json(await push.getNotificationHistory(req.userId!));

export const savePush = async (req: Request, res: Response) =>
  res.json(await push.save(req.userId!, req.body));

export const unsubscribePush = async (req: Request, res: Response) =>
  res.json(await push.unsubscribe(req.userId!, req.body?.endpoint));

export const testPush = async (req: Request, res: Response) =>
  res.json(await push.sendTest(req.userId!));

export const triggerReminders = async (req: Request, res: Response) => {
  const summary = await push.checkAndSendReminders(req.userId);
  res.json(summary);
};
