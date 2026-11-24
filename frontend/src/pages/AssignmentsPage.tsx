import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { Assignment, Priority, AssignmentStatus } from '../types';

interface AssignmentsPageProps {
  assignments: Assignment[];
  onCreate: (data: Partial<Assignment>) => Promise<void>;
  onUpdate: (id: string, data: Partial<Assignment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({
  assignments,
  onCreate,
  onUpdate,
  onDelete,
  isModalOpen,
  setIsModalOpen,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  // Edit / Details State
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('Medium');
  const [formStatus, setFormStatus] = useState<AssignmentStatus>('Not Started');
  const [formNotes, setFormNotes] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Extract unique subjects for dropdown
  const uniqueSubjects = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      if (a.subject) set.add(a.subject);
    });
    return Array.from(set);
  }, [assignments]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setFormTitle('');
    setFormSubject('COMP101');
    setFormDescription('');
    setFormDueDate(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    setFormPriority('Medium');
    setFormStatus('Not Started');
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (a: Assignment) => {
    setEditingAssignment(a);
    setFormTitle(a.title);
    setFormSubject(a.subject);
    setFormDescription(a.description || '');
    setFormDueDate(a.dueDate ? new Date(a.dueDate).toISOString().split('T')[0] : '');
    setFormPriority(a.priority);
    setFormStatus(a.status);
    setFormNotes(a.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim() || !formSubject.trim() || !formDueDate) {
      setFormError('Please fill in title, subject and due date');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: Partial<Assignment> = {
        title: formTitle.trim(),
        subject: formSubject.trim(),
        description: formDescription.trim(),
        dueDate: formDueDate,
        priority: formPriority,
        status: formStatus,
        notes: formNotes.trim(),
      };

      if (editingAssignment) {
        await onUpdate(editingAssignment._id, payload);
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

  // Filter & Sort Logic
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        const matchesSearch =
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
        const matchesSubject = subjectFilter === 'ALL' || a.subject === subjectFilter;

        return matchesSearch && matchesStatus && matchesPriority && matchesSubject;
      })
      .sort((a, b) => {
        if (sortBy === 'dueDate') {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortBy === 'priority') {
          const map: Record<Priority, number> = { High: 3, Medium: 2, Low: 1 };
          return map[b.priority] - map[a.priority];
        }
        return a.title.localeCompare(b.title);
      });
  }, [assignments, searchTerm, statusFilter, priorityFilter, subjectFilter, sortBy]);

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2>Assignments</h2>
          <p className="page-subtitle">Track, prioritize, and manage course assignments</p>
        </div>
        <button className="primary" onClick={handleOpenCreate}>
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="controls-bar">
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search assignments by title, course, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-group">
          <div className="filter-select-wrap">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="ALL">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          <div className="filter-select-wrap">
            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
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

      {/* Assignments List */}
      <div className="content-panel">
        {filteredAssignments.length === 0 ? (
          <div className="empty-state-large">
            <FileText size={48} className="empty-icon" />
            <h3>No assignments found</h3>
            <p>Try adjusting your search filters or create a new assignment.</p>
            <button className="primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Assignment
            </button>
          </div>
        ) : (
          <div className="assignment-cards-grid">
            {filteredAssignments.map((a) => {
              const isOverdue = new Date(a.dueDate) < new Date() && a.status !== 'Completed';
              const isCompleted = a.status === 'Completed';

              return (
                <div className={`assignment-card ${isCompleted ? 'card-completed' : ''}`} key={a._id}>
                  <div className="card-top">
                    <span className="subject-pill">{a.subject}</span>
                    <div className="badge-row">
                      <span className={`priority-badge ${a.priority.toLowerCase()}`}>{a.priority}</span>
                      <span className={`status-badge status-${a.status.toLowerCase().replace(' ', '-')}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="card-title" onClick={() => setDetailAssignment(a)}>
                    {a.title}
                  </h3>

                  {a.description && <p className="card-desc">{a.description}</p>}

                  <div className="card-meta">
                    <div className="date-info">
                      <Calendar size={14} />
                      <span className={isOverdue ? 'text-danger font-bold' : ''}>
                        Due: {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                      {isOverdue && <span className="overdue-tag">Overdue</span>}
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-text"
                      onClick={() => setDetailAssignment(a)}
                      title="View Details & Notes"
                    >
                      Details
                    </button>
                    <div className="action-buttons-right">
                      <button
                        className="icon-btn-edit"
                        onClick={() => handleOpenEdit(a)}
                        title="Edit Assignment"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="icon-btn-delete"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete assignment "${a.title}"?`)) {
                            onDelete(a._id);
                          }
                        }}
                        title="Delete Assignment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Assignment */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
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
                <label>Assignment Title *</label>
                <input
                  required
                  placeholder="e.g. Distributed Systems Lab 3"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Subject / Course Code *</label>
                  <input
                    required
                    placeholder="e.g. CS302"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    required
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
                    onChange={(e) => setFormStatus(e.target.value as AssignmentStatus)}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Details, rubric criteria, or instructions..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Private Notes & References (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Links, textbook pages, submission portals..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
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
                    : editingAssignment
                    ? 'Update Assignment'
                    : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Details */}
      {detailAssignment && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3>Assignment Details</h3>
              <button className="modal-close" onClick={() => setDetailAssignment(null)}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <h2>{detailAssignment.title}</h2>
              <div className="details-tags">
                <span className="subject-pill">{detailAssignment.subject}</span>
                <span className={`priority-badge ${detailAssignment.priority.toLowerCase()}`}>
                  {detailAssignment.priority} Priority
                </span>
                <span className="status-badge">{detailAssignment.status}</span>
              </div>

              <div className="details-section">
                <strong>Due Date:</strong>{' '}
                {new Date(detailAssignment.dueDate).toLocaleDateString()}
              </div>

              {detailAssignment.description && (
                <div className="details-section">
                  <strong>Description:</strong>
                  <p>{detailAssignment.description}</p>
                </div>
              )}

              {detailAssignment.notes && (
                <div className="details-section">
                  <strong>Study Notes:</strong>
                  <p>{detailAssignment.notes}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="primary" onClick={() => setDetailAssignment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
