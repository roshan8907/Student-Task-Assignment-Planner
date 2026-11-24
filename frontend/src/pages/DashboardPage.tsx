import React from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import type { DashboardSummary } from '../types';
import { isItemOverdue } from '../lib/dateUtils';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  userName: string;
  onNavigate: (tab: 'assignments' | 'tasks') => void;
  onOpenNewAssignment: () => void;
  onOpenNewTask: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  userName,
  onNavigate,
  onOpenNewAssignment,
  onOpenNewTask,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const firstName = userName.split(' ')[0] || 'Student';

  // Completion calculations
  const totalTasks = summary?.tasks.total || 0;
  const completedTasks = summary?.tasks.completed || 0;
  const taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalAssignments = summary?.assignments.total || 0;
  const completedAssignments = summary?.assignments.completed || 0;
  const assignmentProgressPct =
    totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  const overdueCount = (summary?.assignments.overdue || 0) + (summary?.tasks.overdue || 0);

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <span className="welcome-date">{currentDate}</span>
          <h1>Welcome back, {firstName}!</h1>
          <p className="welcome-subtext">
            {overdueCount > 0 ? (
              <>
                You have <strong className="text-urgent">{overdueCount} overdue item{overdueCount > 1 ? 's' : ''}</strong>{' '}
                and <strong>{summary?.upcomingAssignments.length || 0} deadline{summary?.upcomingAssignments.length === 1 ? '' : 's'}</strong> coming up within 7 days.
              </>
            ) : (
              <>
                You are all caught up on overdue coursework with{' '}
                <strong>{summary?.upcomingAssignments.length || 0} deadline{summary?.upcomingAssignments.length === 1 ? '' : 's'}</strong> coming up within 7 days.
              </>
            )}
          </p>
        </div>
        <div className="welcome-actions">
          <button className="primary" onClick={onOpenNewAssignment}>
            <PlusCircle size={15} /> Add Assignment
          </button>
          <button className="secondary" onClick={onOpenNewTask}>
            <PlusCircle size={15} /> New Study Task
          </button>
        </div>
      </section>

      {/* KPI Stats Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue">
            <BookOpen size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Assignments</span>
            <strong className="stat-value">{summary?.assignments.total || 0}</strong>
            <span className="stat-sub">
              {summary?.assignments.pending || 0} pending · {summary?.assignments.completed || 0} done
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-amber">
            <Clock size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Deadlines</span>
            <strong className="stat-value">{summary?.assignments.pending || 0}</strong>
            <span className="stat-sub">Next 7 days: {summary?.upcomingAssignments.length || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-emerald">
            <CheckCircle2 size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Study Tasks Done</span>
            <strong className="stat-value">
              {completedTasks} / {totalTasks}
            </strong>
            <span className="stat-sub">{taskProgressPct}% completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-rose">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Overdue Items</span>
            <strong className={`stat-value ${overdueCount > 0 ? 'text-danger' : ''}`}>
              {overdueCount}
            </strong>
            <span className="stat-sub">
              {summary?.assignments.overdue || 0} assignments · {summary?.tasks.overdue || 0} tasks
            </span>
          </div>
        </div>
      </section>

      {/* Visual Progress Bar Section */}
      <section className="progress-section">
        <div className="progress-card">
          <div className="progress-head">
            <div className="progress-title">
              <TrendingUp size={16} />
              <span>Assignment Completion Progress</span>
            </div>
            <strong>{assignmentProgressPct}%</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill bg-indigo" style={{ width: `${assignmentProgressPct}%` }}></div>
          </div>
        </div>

        <div className="progress-card">
          <div className="progress-head">
            <div className="progress-title">
              <TrendingUp size={16} />
              <span>Daily Study Task Completion</span>
            </div>
            <strong>{taskProgressPct}%</strong>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill bg-emerald" style={{ width: `${taskProgressPct}%` }}></div>
          </div>
        </div>
      </section>

      {/* Dual Column Layout: Upcoming Deadlines & Today's Study Plan */}
      <div className="dashboard-columns">
        {/* Left Column: Upcoming Deadlines */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title-group">
              <CalendarDays size={16} />
              <h3>Upcoming Deadlines (Next 7 Days)</h3>
            </div>
            <button className="link" onClick={() => onNavigate('assignments')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body">
            {(!summary?.upcomingAssignments || summary.upcomingAssignments.length === 0) ? (
              <p className="empty-state">No assignment deadlines scheduled within the next 7 days.</p>
            ) : (
              <div className="list-stack">
                {summary.upcomingAssignments.map((a) => {
                  const overdue = isItemOverdue(a.dueDate, a.status === 'Completed');
                  return (
                    <div className="list-item-card" key={a._id}>
                      <div className="item-main">
                        <div className="item-title-row">
                          <span className="subject-pill">{a.subject}</span>
                          <span className={`priority-badge ${a.priority.toLowerCase()}`}>{a.priority}</span>
                          {overdue && <span className="overdue-tag">Overdue</span>}
                        </div>
                        <h4 className="item-name">{a.title}</h4>
                        <span className="item-date">
                          Due: {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Study Tasks */}
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title-group">
              <CheckCircle2 size={16} />
              <h3>Today's Study Schedule</h3>
            </div>
            <button className="link" onClick={() => onNavigate('tasks')}>
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div className="panel-body">
            {(!summary?.todaysTasks || summary.todaysTasks.length === 0) ? (
              <p className="empty-state">No study tasks scheduled for today. Create one to stay ahead!</p>
            ) : (
              <div className="list-stack">
                {summary.todaysTasks.map((t) => (
                  <div className={`list-item-card ${t.completed ? 'completed-item' : ''}`} key={t._id}>
                    <div className="item-main">
                      <div className="item-title-row">
                        <span className="subject-tag">{t.subject || 'General'}</span>
                        <span className="duration-tag">{t.estimatedDuration || 30} mins</span>
                      </div>
                      <h4 className="item-name">{t.title}</h4>
                      <span className="item-status">Status: {t.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
