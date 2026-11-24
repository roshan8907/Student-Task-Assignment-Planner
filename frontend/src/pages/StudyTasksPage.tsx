import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ListTodo,
} from 'lucide-react';
import type { StudyTask, Priority, TaskStatus } from '../types';

interface StudyTasksPageProps {
  tasks: StudyTask[];
  onCreate: (data: Partial<StudyTask>) => Promise<void>;
  onUpdate: (id: string, data: Partial<StudyTask>) => Promise<void>;
  onToggleComplete: (task: StudyTask) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const StudyTasksPage: React.FC<StudyTasksPageProps> = ({
  tasks,
  onCreate,
  onUpdate,
  onToggleComplete,
  onDelete,
  isModalOpen,
  setIsModalOpen,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  // Modal & Form state
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('General');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('Medium');
  const [formStatus, setFormStatus] = useState<TaskStatus>('Not Started');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract unique subjects
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set);
  }, [tasks]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormSubject('General');
    setFormDescription('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormPriority('Medium');
    setFormStatus('Not Started');
    setFormDuration(45);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: StudyTask) => {
    setEditingTask(t);
    setFormTitle(t.title);
    setFormSubject(t.subject || 'General');
    setFormDescription(t.description || '');
    setFormDueDate(t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '');
    setFormPriority(t.priority);
    setFormStatus(t.status);
    setFormDuration(t.estimatedDuration || 30);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Task title is required');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: Partial<StudyTask> = {
        title: formTitle.trim(),
        subject: formSubject.trim() || 'General',
        description: formDescription.trim(),
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
        priority: formPriority,
        status: formStatus,
        estimatedDuration: Number(formDuration) || 30,
      };

      if (editingTask) {
        await onUpdate(editingTask._id, payload);
      } else {
        await onCreate(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const isCompleted = t.completed || t.status === 'Completed';
        const matchesStatus =
          statusFilter === 'ALL' ||
          (statusFilter === 'COMPLETED' && isCompleted) ||
          (statusFilter === 'PENDING' && !isCompleted);

        const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
        const matchesSubject = subjectFilter === 'ALL' || t.subject === subjectFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesSubject;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const map: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
          return map[b.priority] - map[a.priority];
        }
        return a.title.localeCompare(b.title);
      });
  }, [tasks, searchTerm, statusFilter, priorityFilter, subjectFilter, sortBy]);

  const completedCount = tasks.filter((t) => t.completed || t.status === 'Completed').length;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Daily Study Tasks</h2>
          <p className="page-subtitle">
            Manage focused revision, reading, and problem sets ({completedCount} of {tasks.length} done)
          </p>
        </div>
        <button className="primary" onClick={handleOpenCreate}>
          <Plus size={16} /> New Study Task
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="controls-bar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search study tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-select-wrap">
            <Filter size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Tasks</option>
              <option value="COMPLETED">Completed Tasks</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-wrap">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Priority</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="content-panel">
        {filteredTasks.length === 0 ? (
          <div className="empty-state-large">
            <ListTodo size={48} className="empty-icon" />
            <h3>No study tasks found</h3>
            <p>Your task list is clear or no tasks matched your filter criteria.</p>
            <button className="primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Study Task
            </button>
          </div>
        ) : (
          <div className="task-items-list">
            {filteredTasks.map((t) => {
              const isOverdue =
                !t.completed &&
                t.status !== 'Completed' &&
                t.dueDate &&
                new Date(t.dueDate) < new Date();
              const isDone = t.completed || t.status === 'Completed';

              return (
                <div className={`task-card-item ${isDone ? 'task-done' : ''}`} key={t._id}>
                  <div className="task-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => onToggleComplete(t)}
                      aria-label="Mark task complete"
                    />
                  </div>

                  <div className="task-content">
                    <div className="task-tags-row">
                      <span className="subject-pill">{t.subject || 'General'}</span>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                      <span className="duration-tag">
                        <Clock size={12} /> {t.estimatedDuration || 30} mins
                      </span>
                      {isOverdue && <span className="overdue-tag">Overdue</span>}
                    </div>

                    <h4 className={`task-title-text ${isDone ? 'done-text' : ''}`}>
                      {t.title}
                    </h4>

                    {t.description && <p className="task-desc-text">{t.description}</p>}

                    <div className="task-footer-meta">
                      <span className="task-due-info">
                        <Calendar size={13} />
                        {t.dueDate
                          ? `Due: ${new Date(t.dueDate).toLocaleDateString()}`
                          : 'No specific due date'}
                      </span>
                    </div>
                  </div>

                  <div className="task-item-actions">
                    <button
                      className="icon-btn-edit"
                      onClick={() => handleOpenEdit(t)}
                      title="Edit Task"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      className="icon-btn-delete"
                      onClick={() => {
                        if (confirm(`Delete study task "${t.title}"?`)) {
                          onDelete(t._id);
                        }
                      }}
                      title="Delete Task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Study Task */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingTask ? 'Edit Study Task' : 'New Study Task'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            {formError && (
              <div className="alert error-banner">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  required
                  placeholder="e.g. Read Chapters 4-5 of Algorithm Analysis"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Subject / Module</label>
                  <input
                    placeholder="e.g. Math201"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Target Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as Priority)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>Est. Duration (mins)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Task Description / Checklist (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Notes, problem set numbers, or key definitions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary" disabled={formSubmitting}>
                  {formSubmitting
                    ? 'Saving...'
                    : editingTask
                    ? 'Update Task'
                    : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
