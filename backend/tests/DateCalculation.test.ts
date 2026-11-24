import { describe, it, expect } from 'vitest';
import {
  getDateBoundaries,
  isItemOverdue,
  isItemUpcoming,
  isItemDueToday,
} from '../src/utils/dateUtils.js';

describe('Date Boundary & Dashboard Calculation Suite', () => {
  // Use a fixed reference timestamp for deterministic tests: 2026-11-20 12:00:00
  const fixedNow = new Date(2026, 10, 20, 12, 0, 0); // Month is 0-indexed: 10 = Nov
  const boundaries = getDateBoundaries(fixedNow);

  it('calculates startOfToday, endOfToday and sevenDaysFromToday correctly', () => {
    expect(boundaries.startOfToday.getFullYear()).toBe(2026);
    expect(boundaries.startOfToday.getMonth()).toBe(10);
    expect(boundaries.startOfToday.getDate()).toBe(20);
    expect(boundaries.startOfToday.getHours()).toBe(0);

    expect(boundaries.endOfToday.getDate()).toBe(20);
    expect(boundaries.endOfToday.getHours()).toBe(23);

    // exactly 7 days from today = Nov 27
    expect(boundaries.sevenDaysFromToday.getDate()).toBe(27);
  });

  it('detects overdue items accurately (yesterday deadline, incomplete)', () => {
    const yesterday = new Date(2026, 10, 19, 18, 0, 0);
    expect(isItemOverdue(yesterday, false, boundaries.startOfToday)).toBe(true);
    // If completed, never overdue
    expect(isItemOverdue(yesterday, true, boundaries.startOfToday)).toBe(false);
  });

  it('treats item due today as not yet overdue', () => {
    const dueTodayLater = new Date(2026, 10, 20, 23, 59, 0);
    expect(isItemOverdue(dueTodayLater, false, boundaries.startOfToday)).toBe(false);
  });

  it('identifies upcoming item due tomorrow', () => {
    const tomorrow = new Date(2026, 10, 21, 14, 0, 0);
    expect(isItemUpcoming(tomorrow, false, boundaries.startOfToday, boundaries.sevenDaysFromToday)).toBe(true);
  });

  it('identifies upcoming item due exactly seven days from today', () => {
    const exactlySevenDays = new Date(2026, 10, 27, 23, 59, 0);
    expect(isItemUpcoming(exactlySevenDays, false, boundaries.startOfToday, boundaries.sevenDaysFromToday)).toBe(true);
  });

  it('excludes item due 8 days from today from 7-day upcoming list', () => {
    const eightDays = new Date(2026, 10, 28, 10, 0, 0);
    expect(isItemUpcoming(eightDays, false, boundaries.startOfToday, boundaries.sevenDaysFromToday)).toBe(false);
  });

  it('identifies item due today', () => {
    const dueTodayMorning = new Date(2026, 10, 20, 9, 30, 0);
    expect(isItemDueToday(dueTodayMorning, boundaries.startOfToday, boundaries.endOfToday)).toBe(true);
    const dueTomorrow = new Date(2026, 10, 21, 9, 30, 0);
    expect(isItemDueToday(dueTomorrow, boundaries.startOfToday, boundaries.endOfToday)).toBe(false);
  });

  it('safely handles empty or null data', () => {
    expect(isItemOverdue(null, false, boundaries.startOfToday)).toBe(false);
    expect(isItemUpcoming(undefined, false, boundaries.startOfToday, boundaries.sevenDaysFromToday)).toBe(false);
    expect(isItemDueToday(null, boundaries.startOfToday, boundaries.endOfToday)).toBe(false);
  });
});
