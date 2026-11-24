import { Assignment } from '../models/Assignment.js';
import { StudyTask } from '../models/StudyTask.js';
import { getDateBoundaries } from '../utils/dateUtils.js';

export class PlannerRepository {
  // Assignments
  listAssignments(userId: string) {
    return Assignment.find({ userId }).sort({ dueDate: 1 });
  }

  findAssignment(userId: string, id: string) {
    return Assignment.findOne({ _id: id, userId });
  }

  createAssignment(data: Record<string, unknown>) {
    return Assignment.create(data);
  }

  updateAssignment(userId: string, id: string, data: Record<string, unknown>) {
    return Assignment.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true });
  }

  deleteAssignment(userId: string, id: string) {
    return Assignment.findOneAndDelete({ _id: id, userId });
  }

  // Study Tasks
  listTasks(userId: string) {
    return StudyTask.find({ userId }).sort({ dueDate: 1, createdAt: -1 });
  }

  findTask(userId: string, id: string) {
    return StudyTask.findOne({ _id: id, userId });
  }

  createTask(data: Record<string, unknown>) {
    return StudyTask.create(data);
  }

  updateTask(userId: string, id: string, data: Record<string, unknown>) {
    return StudyTask.findOneAndUpdate({ _id: id, userId }, data, { new: true, runValidators: true });
  }

  deleteTask(userId: string, id: string) {
    return StudyTask.findOneAndDelete({ _id: id, userId });
  }

  // Consistent Aggregated Summary Statistics
  async getDashboardSummary(userId: string) {
    const { startOfToday, endOfToday, sevenDaysFromToday } = getDateBoundaries();

    const [assignments, tasks] = await Promise.all([
      Assignment.find({ userId }).lean(),
      StudyTask.find({ userId }).lean(),
    ]);

    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter((a) => a.status === 'Completed').length;
    const pendingAssignments = assignments.filter((a) => a.status !== 'Completed').length;
    
    // An assignment is overdue if not completed AND its due date is strictly before start of today
    const overdueAssignments = assignments.filter(
      (a) => a.status !== 'Completed' && a.dueDate && new Date(a.dueDate).getTime() < startOfToday.getTime()
    ).length;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed || t.status === 'Completed').length;
    const pendingTasks = tasks.filter((t) => !t.completed && t.status !== 'Completed').length;
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.status !== 'Completed' && t.dueDate && new Date(t.dueDate).getTime() < startOfToday.getTime()
    ).length;

    // Upcoming deadlines: non-completed assignments due between startOfToday and sevenDaysFromToday
    const upcomingAssignments = assignments
      .filter((a) => {
        if (a.status === 'Completed' || !a.dueDate) return false;
        const due = new Date(a.dueDate).getTime();
        return due >= startOfToday.getTime() && due <= sevenDaysFromToday.getTime();
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Today's tasks: tasks scheduled on today's calendar date
    const todaysTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate).getTime();
      return due >= startOfToday.getTime() && due <= endOfToday.getTime();
    });

    return {
      assignments: {
        total: totalAssignments,
        pending: pendingAssignments,
        completed: completedAssignments,
        overdue: overdueAssignments,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
      upcomingAssignments,
      todaysTasks,
      recentAssignments: assignments.slice(0, 5),
    };
  }
}
