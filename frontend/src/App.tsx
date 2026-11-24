import { useEffect, useState, useCallback } from 'react';
import type { User, Assignment, StudyTask, DashboardSummary } from './types';
import { api, setToken } from './lib/api';
import { offlineStorage } from './lib/indexedDB';
import { flushSyncQueue } from './lib/sync';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { StudyTasksPage } from './pages/StudyTasksPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'assignments' | 'tasks' | 'settings'>('dashboard');

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState<boolean>(false);

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Update sync queue count
  const updateQueueCount = useCallback(async () => {
    const q = await offlineStorage.getSyncQueue();
    setSyncQueueCount(q.length);
  }, []);

  // Fetch or load offline data
  const loadData = useCallback(async () => {
    if (!user) return;

    if (navigator.onLine) {
      try {
        setIsSyncing(true);
        // Flush offline queue if returning online
        await flushSyncQueue();
        await updateQueueCount();

        const [a, t, s] = await Promise.all([
          api<Assignment[]>('/assignments'),
          api<StudyTask[]>('/study-tasks'),
          api<DashboardSummary>('/dashboard/summary'),
        ]);

        setAssignments(a);
        setTasks(t);
        setSummary(s);

        // Cache into IndexedDB for offline resilience
        await offlineStorage.saveAssignments(a);
        await offlineStorage.saveTasks(t);
      } catch (err: any) {
        console.warn('Network fetch failed, falling back to IndexedDB offline store:', err);
        const cachedA = await offlineStorage.getAssignments();
        const cachedT = await offlineStorage.getTasks();
        setAssignments(cachedA);
        setTasks(cachedT);
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Offline mode: load exclusively from IndexedDB
      const cachedA = await offlineStorage.getAssignments();
      const cachedT = await offlineStorage.getTasks();
      setAssignments(cachedA);
      setTasks(cachedT);
    }
  }, [user, updateQueueCount]);

  // Session verification on mount and handle deep-link query parameter from notifications
  useEffect(() => {
    // Check URL parameters (e.g. /?tab=assignments from clicking push notification)
    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get('tab');
    if (targetTab && ['dashboard', 'assignments', 'tasks', 'settings'].includes(targetTab)) {
      setTab(targetTab as any);
    }

    const savedUser = localStorage.getItem('planner_user');
    const token = localStorage.getItem('planner_token');
    if (savedUser && token) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch {
        localStorage.removeItem('planner_user');
        setToken(null);
      }
    }
  }, []);

  // Handle Online/Offline network events
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await loadData();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadData, updateQueueCount]);

  // Load data when user is present
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Check push subscription state verified against backend database
  useEffect(() => {
    if (!user) {
      setIsPushSubscribed(false);
      return;
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        try {
          const browserSub = await reg.pushManager.getSubscription();
          if (!browserSub) {
            setIsPushSubscribed(false);
            return;
          }

          // Verify with backend that this user actually has an active record in MongoDB
          const status = await api<{ isSubscribed: boolean }>('/notifications/status');
          setIsPushSubscribed(status.isSubscribed);
        } catch (err) {
          console.warn('Could not verify push status with backend:', err);
        }
      });
    }
  }, [user]);

  // Auth logout with macOS confirmation dialog and server revocation
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to sign out of your Student Planner session?');
    if (!confirmLogout) return;

    try {
      if (navigator.onLine) {
        await api('/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.warn('Backend logout failed or offline:', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('planner_user');
      localStorage.removeItem('planner_token');
      setAssignments([]);
      setTasks([]);
      setSummary(null);
      await offlineStorage.clearUserCache();
    }
  };

  // Push notifications toggle with detailed origin and security diagnostics
  const handleTogglePush = async () => {
    try {
      // 1. Check secure context
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!window.isSecureContext && !isLocalhost) {
        alert(
          'Web Push requires a Secure Context (HTTPS or localhost).\n\n' +
          `You are currently accessing this app via an insecure LAN IP (${window.location.origin}). ` +
          'Web browsers disable Service Workers and PushManager over plain HTTP on remote IP addresses.\n\n' +
          'To test Web Push, please open this app in your browser at:\nhttp://localhost:5173'
        );
        return;
      }

      // 2. Check ServiceWorker support
      if (!('serviceWorker' in navigator)) {
        alert('Service Workers are not supported or disabled in this browser.');
        return;
      }

      // 3. Check PushManager support
      if (!('PushManager' in window)) {
        alert(
          'PushManager is unavailable.\n\n' +
          'In Chromium/Safari, PushManager is disabled on non-secure origins (plain HTTP over LAN IP). ' +
          'Please access the application via http://localhost:5173 to enable Web Push.'
        );
        return;
      }

      // 4. Check Notification API
      if (!('Notification' in window)) {
        alert('Notification API is not supported in this browser environment.');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      if (!reg) {
        alert('Service Worker is not ready or registered yet. Please refresh the page and try again.');
        return;
      }

      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        // Unsubscribe
        await existingSub.unsubscribe();
        await api('/notifications/subscribe', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: existingSub.endpoint }),
        });
        setIsPushSubscribed(false);
        alert('Unsubscribed from push notifications.');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('Notification permission was denied or dismissed by the browser.');
          return;
        }

        // Get VAPID public key from backend or env
        let vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          const res = await api<{ publicKey: string }>('/push/public-key');
          vapidKey = res.publicKey;
        }

        if (!vapidKey) {
          alert('VAPID public key is not configured on the server yet.');
          return;
        }

        const rawData = atob(vapidKey.replace(/-/g, '+').replace(/_/g, '/'));
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray,
        });

        const subJson = sub.toJSON();
        if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
          throw new Error('Failed to extract valid cryptographic keys from browser push subscription');
        }

        const saveRes = await api<{ message: string; subscriptionId: string }>('/notifications/subscribe', {
          method: 'POST',
          body: JSON.stringify(subJson),
        });

        setIsPushSubscribed(true);
        alert(saveRes.message || 'Successfully subscribed to Web Push Notifications!');
      }
    } catch (err: any) {
      alert(`Notification setup failed: ${err.message}`);
    }
  };

  const handleSendTestPush = async () => {
    await api('/notifications/test', { method: 'POST' });
  };

  // --- Assignments CRUD Handlers ---
  const handleCreateAssignment = async (data: Partial<Assignment>) => {
    if (!navigator.onLine) {
      // Offline fallback: store in queue and optimistically update
      const tempId = `temp_${Date.now()}`;
      const tempAssignment: Assignment = {
        _id: tempId,
        title: data.title || '',
        subject: data.subject || '',
        description: data.description || '',
        dueDate: data.dueDate || new Date().toISOString(),
        priority: data.priority || 'Medium',
        status: data.status || 'Not Started',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [tempAssignment, ...assignments];
      setAssignments(updated);
      await offlineStorage.saveAssignments(updated);
      await offlineStorage.addToSyncQueue({
        url: '/assignments',
        method: 'POST',
        body: data,
        entityType: 'assignment',
      });
      await updateQueueCount();
      return;
    }

    await api('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await loadData();
  };

  const handleUpdateAssignment = async (id: string, data: Partial<Assignment>) => {
    if (!navigator.onLine) {
      const updated = assignments.map((a) => (a._id === id ? { ...a, ...data } : a));
      setAssignments(updated);
      await offlineStorage.saveAssignments(updated);
      await offlineStorage.addToSyncQueue({
        url: `/assignments/${id}`,
        method: 'PATCH',
        body: data,
        entityType: 'assignment',
      });
      await updateQueueCount();
      return;
    }

    await api(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    await loadData();
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!navigator.onLine) {
      const updated = assignments.filter((a) => a._id !== id);
      setAssignments(updated);
      await offlineStorage.saveAssignments(updated);
      await offlineStorage.addToSyncQueue({
        url: `/assignments/${id}`,
        method: 'DELETE',
        entityType: 'assignment',
      });
      await updateQueueCount();
      return;
    }

    await api(`/assignments/${id}`, {
      method: 'DELETE',
    });
    await loadData();
  };

  // --- Study Tasks CRUD Handlers ---
  const handleCreateTask = async (data: Partial<StudyTask>) => {
    if (!navigator.onLine) {
      const tempId = `temp_t_${Date.now()}`;
      const tempTask: StudyTask = {
        _id: tempId,
        title: data.title || '',
        description: data.description || '',
        subject: data.subject || 'General',
        dueDate: data.dueDate || null,
        priority: data.priority || 'Medium',
        status: data.status || 'Not Started',
        estimatedDuration: data.estimatedDuration || 30,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [tempTask, ...tasks];
      setTasks(updated);
      await offlineStorage.saveTasks(updated);
      await offlineStorage.addToSyncQueue({
        url: '/study-tasks',
        method: 'POST',
        body: data,
        entityType: 'study-task',
      });
      await updateQueueCount();
      return;
    }

    await api('/study-tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await loadData();
  };

  const handleUpdateTask = async (id: string, data: Partial<StudyTask>) => {
    if (!navigator.onLine) {
      const updated = tasks.map((t) => (t._id === id ? { ...t, ...data } : t));
      setTasks(updated);
      await offlineStorage.saveTasks(updated);
      await offlineStorage.addToSyncQueue({
        url: `/study-tasks/${id}`,
        method: 'PATCH',
        body: data,
        entityType: 'study-task',
      });
      await updateQueueCount();
      return;
    }

    await api(`/study-tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    await loadData();
  };

  const handleToggleCompleteTask = async (t: StudyTask) => {
    const nextCompleted = !t.completed;
    if (!navigator.onLine) {
      const updated = tasks.map((item) =>
        item._id === t._id
          ? {
              ...item,
              completed: nextCompleted,
              status: (nextCompleted ? 'Completed' : 'Not Started') as any,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            }
          : item
      );
      setTasks(updated);
      await offlineStorage.saveTasks(updated);
      await offlineStorage.addToSyncQueue({
        url: `/study-tasks/${t._id}/complete`,
        method: 'PATCH',
        body: { completed: nextCompleted },
        entityType: 'study-task',
      });
      await updateQueueCount();
      return;
    }

    await api(`/study-tasks/${t._id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: nextCompleted }),
    });
    await loadData();
  };

  const handleDeleteTask = async (id: string) => {
    if (!navigator.onLine) {
      const updated = tasks.filter((t) => t._id !== id);
      setTasks(updated);
      await offlineStorage.saveTasks(updated);
      await offlineStorage.addToSyncQueue({
        url: `/study-tasks/${id}`,
        method: 'DELETE',
        entityType: 'study-task',
      });
      await updateQueueCount();
      return;
    }

    await api(`/study-tasks/${id}`, {
      method: 'DELETE',
    });
    await loadData();
  };

  // If not logged in, show Auth Page
  if (!user) {
    return <AuthPage onSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        currentTab={tab}
        onSelectTab={setTab}
        user={user}
        onLogout={handleLogout}
        assignmentCount={assignments.length}
        taskCount={tasks.length}
      />

      <main className="main">
        <Header
          currentTab={tab}
          isOnline={isOnline}
          syncQueueCount={syncQueueCount}
          isSyncing={isSyncing}
          onRefresh={loadData}
          isPushSubscribed={isPushSubscribed}
          onTogglePush={handleTogglePush}
        />

        {globalError && (
          <div className="alert error-banner">
            <span>{globalError}</span>
            <button onClick={() => setGlobalError('')}>×</button>
          </div>
        )}

        {/* Tab Content */}
        {tab === 'dashboard' && (
          <DashboardPage
            summary={summary}
            userName={user.name}
            onNavigate={(newTab) => setTab(newTab)}
            onOpenNewAssignment={() => {
              setTab('assignments');
              setIsAssignmentModalOpen(true);
            }}
            onOpenNewTask={() => {
              setTab('tasks');
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {tab === 'assignments' && (
          <AssignmentsPage
            assignments={assignments}
            onCreate={handleCreateAssignment}
            onUpdate={handleUpdateAssignment}
            onDelete={handleDeleteAssignment}
            isModalOpen={isAssignmentModalOpen}
            setIsModalOpen={setIsAssignmentModalOpen}
          />
        )}

        {tab === 'tasks' && (
          <StudyTasksPage
            tasks={tasks}
            onCreate={handleCreateTask}
            onUpdate={handleUpdateTask}
            onToggleComplete={handleToggleCompleteTask}
            onDelete={handleDeleteTask}
            isModalOpen={isTaskModalOpen}
            setIsModalOpen={setIsTaskModalOpen}
          />
        )}

        {tab === 'settings' && (
          <SettingsPage
            user={user}
            onLogout={handleLogout}
            isPushSubscribed={isPushSubscribed}
            onTogglePush={handleTogglePush}
            onSendTestNotification={handleSendTestPush}
          />
        )}

        <footer className="app-footer">
          <span>Student Task & Assignment Planner · University Practice SaaS Platform</span>
          <span className="footer-meta">React 18 · TypeScript · Vite · Express · MongoDB</span>
        </footer>
      </main>
    </div>
  );
}
