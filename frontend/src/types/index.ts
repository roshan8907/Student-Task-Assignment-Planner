export type User = {
  id: string;
  name: string;
  email: string;
};

export type Priority = 'Low' | 'Medium' | 'High';
export type AssignmentStatus = 'Not Started' | 'In Progress' | 'Completed';
export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: Priority;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTask {
  _id: string;
  title: string;
  description: string;
  subject: string;
  dueDate?: string | null;
  priority: Priority;
  status: TaskStatus;
  estimatedDuration?: number | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  assignments: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
  tasks: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
  upcomingAssignments: Assignment[];
  todaysTasks: StudyTask[];
  recentAssignments: Assignment[];
}

export interface SyncQueueItem {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
  entityType: 'assignment' | 'study-task';
}
