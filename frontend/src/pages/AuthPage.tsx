import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { api, setToken } from '../lib/api';
import type { User } from '../types';

interface AuthProps {
  onSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = mode === 'register' ? { name, email, password } : { email, password };
      const data = await api<{ token: string; user: User }>(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setToken(data.token);
      localStorage.setItem('planner_user', JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <div className="brand-header">
          <div className="brand-mark">
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="brand-title">Student Planner</h2>
            <span className="brand-badge">Academic SaaS</span>
          </div>
        </div>

        <div className="auth-intro">
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Student Account'}</h1>
          <p className="muted">
            {mode === 'login'
              ? 'Organize deadlines, assignments, and study sessions in one central hub.'
              : 'Sign up to start organizing your university coursework and deadlines.'}
          </p>
        </div>

        {error && (
          <div className="alert error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">University / Student Email</label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@university.ac.nz"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input-wrap">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
              />
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="primary full btn-submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating Account...'}
              </>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <p className="switch">
          {mode === 'login' ? "Don't have an account yet?" : 'Already registered?'}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </main>
  );
};
