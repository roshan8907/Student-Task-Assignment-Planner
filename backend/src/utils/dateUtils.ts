export interface DateBoundaries {
  startOfToday: Date;
  endOfToday: Date;
  sevenDaysFromToday: Date;
}

export function getDateBoundaries(now = new Date()): DateBoundaries {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const sevenDaysFromToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

  return { startOfToday, endOfToday, sevenDaysFromToday };
}

export function isItemOverdue(dueDate: Date | string | null | undefined, isCompleted: boolean, startOfToday: Date): boolean {
  if (isCompleted || !dueDate) return false;
  return new Date(dueDate).getTime() < startOfToday.getTime();
}

export function isItemUpcoming(dueDate: Date | string | null | undefined, isCompleted: boolean, startOfToday: Date, sevenDaysFromToday: Date): boolean {
  if (isCompleted || !dueDate) return false;
  const due = new Date(dueDate).getTime();
  return due >= startOfToday.getTime() && due <= sevenDaysFromToday.getTime();
}

export function isItemDueToday(dueDate: Date | string | null | undefined, startOfToday: Date, endOfToday: Date): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  return due >= startOfToday.getTime() && due <= endOfToday.getTime();
}
