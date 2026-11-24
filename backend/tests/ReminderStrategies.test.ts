import { describe, it, expect } from 'vitest';
import {
  UpcomingDeadlineStrategy,
  DueTodayStrategy,
  OverdueStrategy,
  StudyTaskStrategy,
  type EvaluationContext,
} from '../src/services/ReminderStrategies.js';

describe('Strategy Pattern - Academic Reminder Strategies', () => {
  const referenceDate = new Date('2026-11-23T12:00:00.000Z');
  const startOfToday = new Date('2026-11-23T00:00:00.000Z');
  const endOfToday = new Date('2026-11-23T23:59:59.999Z');
  const in24Hours = new Date('2026-11-24T12:00:00.000Z');

  const context: EvaluationContext = {
    referenceDate,
    startOfToday,
    endOfToday,
    in24Hours,
  };

  it('OverdueStrategy triggers strictly for deadlines before start of today', () => {
    const strategy = new OverdueStrategy();
    const pastItem = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Lab 1',
      subject: 'COMP702',
      dueDate: new Date('2026-11-20T10:00:00.000Z'),
    };
    const res = strategy.evaluate(pastItem, 'assignment', context);
    expect(res).not.toBeNull();
    expect(res?.reminderType).toBe('overdue');
    expect(res?.title).toContain('⚠️ Overdue Assignment');

    // Should return null for items due today or in the future
    const todayItem = { ...pastItem, dueDate: new Date('2026-11-23T15:00:00.000Z') };
    expect(strategy.evaluate(todayItem, 'assignment', context)).toBeNull();
  });

  it('DueTodayStrategy triggers strictly for deadlines within today', () => {
    const strategy = new DueTodayStrategy();
    const todayItem = {
      _id: '507f1f77bcf86cd799439012',
      title: 'Design Report',
      subject: 'COMP702',
      dueDate: new Date('2026-11-23T18:00:00.000Z'),
    };
    const res = strategy.evaluate(todayItem, 'assignment', context);
    expect(res).not.toBeNull();
    expect(res?.reminderType).toBe('due_today');
    expect(res?.title).toContain('📅 Assignment Due Today');

    // Should return null for items due tomorrow
    const tomorrowItem = { ...todayItem, dueDate: new Date('2026-11-24T09:00:00.000Z') };
    expect(strategy.evaluate(tomorrowItem, 'assignment', context)).toBeNull();
  });

  it('UpcomingDeadlineStrategy triggers for assignments due in 24 hours', () => {
    const strategy = new UpcomingDeadlineStrategy();
    const tomorrowItem = {
      _id: '507f1f77bcf86cd799439013',
      title: 'Final Exam Submission',
      subject: 'COMP702',
      dueDate: new Date('2026-11-24T09:00:00.000Z'),
    };
    const res = strategy.evaluate(tomorrowItem, 'assignment', context);
    expect(res).not.toBeNull();
    expect(res?.reminderType).toBe('24h_before');
    expect(res?.title).toContain('⏳ Due in 24 Hours');
  });

  it('StudyTaskStrategy triggers for study tasks due within 24 hours', () => {
    const strategy = new StudyTaskStrategy();
    const taskItem = {
      _id: '507f1f77bcf86cd799439014',
      title: 'Review Chapter 5',
      subject: 'COMP702',
      dueDate: new Date('2026-11-23T20:00:00.000Z'),
    };
    const res = strategy.evaluate(taskItem, 'study-task', context);
    expect(res).not.toBeNull();
    expect(res?.reminderType).toBe('study_task');
    expect(res?.title).toContain('📚 Study Task Reminder');

    // Does not trigger for assignment entityType
    expect(strategy.evaluate(taskItem, 'assignment', context)).toBeNull();
  });
});
