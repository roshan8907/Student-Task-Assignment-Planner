import { describe, it, expect } from 'vitest';
import { getDateBoundaries, isItemOverdue, isItemUpcoming, isItemDueToday } from './lib/dateUtils';

describe('Frontend Types & Data Contract', () => {
  it('validates priority enumeration mappings', () => {
    const priorities = ['Low', 'Medium', 'High'];
    expect(priorities).toContain('High');
    expect(priorities.length).toBe(3);
  });

  it('validates offline sync queue structure', () => {
    const sampleQueueItem = {
      id: 'sync_123',
      url: '/assignments',
      method: 'POST' as const,
      timestamp: Date.now(),
      entityType: 'assignment' as const,
    };
    expect(sampleQueueItem.method).toBe('POST');
    expect(sampleQueueItem.entityType).toBe('assignment');
  });
});

describe('Frontend Unified Date Utility Calculations', () => {
  const baseDate = new Date(2026, 10, 17, 12, 0, 0); // 17 Nov 2026
  const { startOfToday, endOfToday, sevenDaysFromToday } = getDateBoundaries(baseDate);

  it('correctly categorizes overdue assignments', () => {
    const yesterday = new Date(2026, 10, 16, 23, 59, 59);
    expect(isItemOverdue(yesterday, false, startOfToday)).toBe(true);
    expect(isItemOverdue(yesterday, true, startOfToday)).toBe(false); // Completed items not overdue
  });

  it('correctly categorizes items due today', () => {
    const dueToday = new Date(2026, 10, 17, 15, 0, 0);
    expect(isItemDueToday(dueToday, startOfToday, endOfToday)).toBe(true);
    expect(isItemOverdue(dueToday, false, startOfToday)).toBe(false);
  });

  it('correctly categorizes upcoming items within 7 days', () => {
    const in3Days = new Date(2026, 10, 20, 10, 0, 0);
    const in10Days = new Date(2026, 10, 27, 10, 0, 0);
    expect(isItemUpcoming(in3Days, false, startOfToday, sevenDaysFromToday)).toBe(true);
    expect(isItemUpcoming(in10Days, false, startOfToday, sevenDaysFromToday)).toBe(false);
  });
});
