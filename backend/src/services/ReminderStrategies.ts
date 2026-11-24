import type { ReminderType } from '../models/NotificationLog.js';

export interface EvaluationContext {
  referenceDate: Date;
  startOfToday: Date;
  endOfToday: Date;
  in24Hours: Date;
}

export interface CandidateResult {
  reminderType: ReminderType;
  title: string;
  body: string;
  targetUrl: string;
  dedupKey: string;
}

/**
 * Strategy Pattern Interface for Academic Reminders
 */
export interface IReminderStrategy {
  readonly reminderType: ReminderType;
  evaluate(item: any, entityType: 'assignment' | 'study-task', context: EvaluationContext): CandidateResult | null;
}

/**
 * Strategy 1: Due in 24 Hours
 */
export class UpcomingDeadlineStrategy implements IReminderStrategy {
  readonly reminderType: ReminderType = '24h_before';

  evaluate(item: any, entityType: 'assignment' | 'study-task', context: EvaluationContext): CandidateResult | null {
    if (entityType !== 'assignment' || !item.dueDate) return null;
    const dueTime = new Date(item.dueDate).getTime();

    if (dueTime > context.referenceDate.getTime() && dueTime <= context.in24Hours.getTime()) {
      const formattedDate = new Date(item.dueDate).toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const aId = item._id.toString();
      return {
        reminderType: this.reminderType,
        title: `⏳ Due in 24 Hours: ${item.title}`,
        body: `"${item.title}" (${item.subject || 'Coursework'}) is due tomorrow (${formattedDate}).`,
        targetUrl: '/?tab=assignments',
        dedupKey: `assignment_${aId}_24h_before`,
      };
    }
    return null;
  }
}

/**
 * Strategy 2: Due Today
 */
export class DueTodayStrategy implements IReminderStrategy {
  readonly reminderType: ReminderType = 'due_today';

  evaluate(item: any, entityType: 'assignment' | 'study-task', context: EvaluationContext): CandidateResult | null {
    if (entityType !== 'assignment' || !item.dueDate) return null;
    const dueTime = new Date(item.dueDate).getTime();

    if (dueTime >= context.startOfToday.getTime() && dueTime <= context.endOfToday.getTime()) {
      const formattedDate = new Date(item.dueDate).toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const aId = item._id.toString();
      return {
        reminderType: this.reminderType,
        title: `📅 Assignment Due Today: ${item.title}`,
        body: `"${item.title}" (${item.subject || 'Coursework'}) is due today (${formattedDate}). Finalize submission!`,
        targetUrl: '/?tab=assignments',
        dedupKey: `assignment_${aId}_due_today`,
      };
    }
    return null;
  }
}

/**
 * Strategy 3: Overdue Assignment
 */
export class OverdueStrategy implements IReminderStrategy {
  readonly reminderType: ReminderType = 'overdue';

  evaluate(item: any, entityType: 'assignment' | 'study-task', context: EvaluationContext): CandidateResult | null {
    if (entityType !== 'assignment' || !item.dueDate) return null;
    const dueTime = new Date(item.dueDate).getTime();

    if (dueTime < context.startOfToday.getTime()) {
      const formattedDate = new Date(item.dueDate).toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const aId = item._id.toString();
      return {
        reminderType: this.reminderType,
        title: `⚠️ Overdue Assignment: ${item.title}`,
        body: `"${item.title}" (${item.subject || 'Coursework'}) was due on ${formattedDate}. Submit immediately!`,
        targetUrl: '/?tab=assignments',
        dedupKey: `assignment_${aId}_overdue`,
      };
    }
    return null;
  }
}

/**
 * Strategy 4: Study Task Reminder
 */
export class StudyTaskStrategy implements IReminderStrategy {
  readonly reminderType: ReminderType = 'study_task';

  evaluate(item: any, entityType: 'assignment' | 'study-task', context: EvaluationContext): CandidateResult | null {
    if (entityType !== 'study-task' || !item.dueDate) return null;
    const dueTime = new Date(item.dueDate).getTime();

    if (dueTime <= context.in24Hours.getTime()) {
      const tId = item._id.toString();
      return {
        reminderType: this.reminderType,
        title: `📚 Study Task Reminder: ${item.title}`,
        body: `Study session for "${item.title}" (${item.subject || 'General'}) is scheduled for today.`,
        targetUrl: '/?tab=tasks',
        dedupKey: `task_${tId}_due_soon`,
      };
    }
    return null;
  }
}
