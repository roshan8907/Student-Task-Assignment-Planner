import React, { useState } from 'react';
import { User, Bell, Shield, LogOut, CheckCircle, Smartphone, AlertTriangle, Send } from 'lucide-react';
import type { User as UserType } from '../types';
import { api } from '../lib/api';

interface SettingsPageProps {
  user: UserType;
  onLogout: () => void;
  isPushSubscribed: boolean;
  onTogglePush: () => Promise<void>;
  onSendTestNotification: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onLogout,
  isPushSubscribed,
  onTogglePush,
  onSendTestNotification,
}) => {
  const [testStatus, setTestStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTestNotice = async () => {
    setLoading(true);
    setTestStatus('');
    try {
      await onSendTestNotification();
      setTestStatus('Test notification sent successfully!');
    } catch (err: any) {
      setTestStatus(`Failed to send test: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Account & Preferences</h2>
          <p className="page-subtitle">Manage your student profile, notifications, and security</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card">
          <div className="card-header-row">
            <User className="card-icon" size={20} />
            <h3>Student Profile</h3>
          </div>
          <div className="profile-details">
            <div className="avatar-large">{user.name.charAt(0).toUpperCase()}</div>
            <div className="profile-fields">
              <div className="field-group">
                <span className="field-label">Full Name</span>
                <span className="field-value">{user.name}</span>
              </div>
              <div className="field-group">
                <span className="field-label">Registered Email</span>
                <span className="field-value">{user.email}</span>
              </div>
              <div className="field-group">
                <span className="field-label">Student ID</span>
                <span className="field-value font-mono">{user.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Web Push & Notifications */}
        <div className="settings-card">
          <div className="card-header-row">
            <Bell className="card-icon" size={20} />
            <h3>Web Push Notifications</h3>
          </div>
          <p className="card-hint">
            Receive automated background alerts for upcoming assignment deadlines and urgent study tasks.
          </p>

          <div className="notification-status-box">
            <div className="status-indicator">
              <span className={`status-dot ${isPushSubscribed ? 'dot-active' : 'dot-inactive'}`}></span>
              <span>
                Status: <strong>{isPushSubscribed ? 'Subscribed & Active' : 'Not Subscribed'}</strong>
              </span>
            </div>

            <div className="settings-button-group">
              <button
                className={isPushSubscribed ? 'secondary danger-text' : 'primary'}
                onClick={onTogglePush}
              >
                {isPushSubscribed ? 'Unsubscribe from Push' : 'Enable Web Push Alerts'}
              </button>

              {isPushSubscribed && (
                <>
                  <button
                    className="secondary"
                    onClick={handleTestNotice}
                    disabled={loading}
                    title="Send a sample push notification to test browser permissions"
                  >
                    <Send size={14} /> Send Test Alert
                  </button>

                  <button
                    className="secondary"
                    onClick={async () => {
                      setLoading(true);
                      setTestStatus('Scanning database for qualifying deadlines...');
                      try {
                        const res = await api<{
                          success: boolean;
                          checked: number;
                          eligible: number;
                          dispatched: number;
                          skipped: number;
                          failed: number;
                        }>('/notifications/trigger-reminders', { method: 'POST' });
                        
                        setTestStatus(
                          `Scan completed: ${res.checked} items checked, ` +
                          `${res.eligible} eligible, ${res.dispatched} dispatched, ` +
                          `${res.skipped} skipped (duplicates/no sub), ${res.failed} failed.`
                        );
                      } catch (err: any) {
                        setTestStatus(`Failed to trigger scan: ${err.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    title="Manually trigger the deadline reminder scanner immediately"
                  >
                    <Bell size={14} /> Scan & Dispatch Deadlines Now
                  </button>
                </>
              )}
            </div>

            {testStatus && (
              <p className={`status-message ${testStatus.includes('Fail') ? 'text-danger' : 'text-success'}`}>
                {testStatus}
              </p>
            )}
          </div>
        </div>

        {/* Security & Offline Information */}
        <div className="settings-card">
          <div className="card-header-row">
            <Shield className="card-icon" size={20} />
            <h3>Offline & Data Protection</h3>
          </div>
          <ul className="security-features-list">
            <li>
              <CheckCircle size={15} className="text-success" />
              <span>
                <strong>IndexedDB Local Cache:</strong> Previously loaded assignments and study tasks remain viewable without an active internet connection.
              </span>
            </li>
            <li>
              <CheckCircle size={15} className="text-success" />
              <span>
                <strong>Offline Mutation Queue:</strong> Changes made offline are queued and automatically synchronized when your connection resumes.
              </span>
            </li>
            <li>
              <CheckCircle size={15} className="text-success" />
              <span>
                <strong>User Data Isolation:</strong> All database queries strictly enforce <code>userId</code> ownership on the backend.
              </span>
            </li>
            <li>
              <CheckCircle size={15} className="text-success" />
              <span>
                <strong>Password Protection:</strong> Passwords hashed with salted bcrypt (12 rounds) and never stored in plain text.
              </span>
            </li>
          </ul>
        </div>

        {/* Account Actions */}
        <div className="settings-card card-danger-zone">
          <div className="card-header-row">
            <LogOut className="card-icon text-danger" size={20} />
            <h3>Session Management</h3>
          </div>
          <p className="card-hint">
            Sign out of your account on this device. Your offline cache will be securely cleared.
          </p>
          <button className="secondary danger-btn" onClick={onLogout}>
            <LogOut size={16} /> Sign Out of Planner
          </button>
        </div>
      </div>
    </div>
  );
};
