import React from 'react';
import {
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Settings,
  LogOut,
  BookOpen,
} from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  currentTab: 'dashboard' | 'assignments' | 'tasks' | 'settings';
  onSelectTab: (tab: 'dashboard' | 'assignments' | 'tasks' | 'settings') => void;
  user: User;
  onLogout: () => void;
  assignmentCount: number;
  taskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  assignmentCount,
  taskCount,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Logo */}
      <div className="brand" onClick={() => onSelectTab('dashboard')} style={{ cursor: 'pointer' }}>
        <span className="brand-mark small">
          <BookOpen size={20} />
        </span>
        <div className="brand-text">
          <span className="brand-name">
            Student<span className="brand-light">Planner</span>
          </span>
          <span className="brand-badge-sub">v1.2 SaaS</span>
        </div>
      </div>

      <div className="side-label">ACADEMIC WORKSPACE</div>

      <nav className="side-nav">
        <button
          className={currentTab === 'dashboard' ? 'nav active' : 'nav'}
          onClick={() => onSelectTab('dashboard')}
        >
          <ClipboardList size={18} />
          <span>Dashboard</span>
        </button>

        <button
          className={currentTab === 'assignments' ? 'nav active' : 'nav'}
          onClick={() => onSelectTab('assignments')}
        >
          <CalendarDays size={18} />
          <span>Assignments</span>
          {assignmentCount > 0 && <span className="nav-badge">{assignmentCount}</span>}
        </button>

        <button
          className={currentTab === 'tasks' ? 'nav active' : 'nav'}
          onClick={() => onSelectTab('tasks')}
        >
          <CheckCircle2 size={18} />
          <span>Study Tasks</span>
          {taskCount > 0 && <span className="nav-badge">{taskCount}</span>}
        </button>

        <button
          className={currentTab === 'settings' ? 'nav active' : 'nav'}
          onClick={() => onSelectTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </nav>

      {/* User Info & Logout at Bottom */}
      <div className="side-bottom">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="user-meta">
          <b className="user-name-text">{user.name}</b>
          <small className="user-email-text">{user.email}</small>
        </div>
        <button
          className="icon-btn"
          title="Sign out"
          onClick={onLogout}
          aria-label="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
