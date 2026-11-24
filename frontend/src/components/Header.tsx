import React from 'react';
import { RefreshCw, Wifi, WifiOff, Bell, BellOff, Loader2 } from 'lucide-react';

interface HeaderProps {
  currentTab: 'dashboard' | 'assignments' | 'tasks' | 'settings';
  isOnline: boolean;
  syncQueueCount: number;
  isSyncing: boolean;
  onRefresh: () => void;
  isPushSubscribed: boolean;
  onTogglePush: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  isOnline,
  syncQueueCount,
  isSyncing,
  onRefresh,
  isPushSubscribed,
  onTogglePush,
}) => {
  const titles: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    assignments: 'Assignment Manager',
    tasks: 'Daily Study Planner',
    settings: 'Settings & Security',
  };

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">ACADEMIC WORKSPACE</span>
        <h2>{titles[currentTab]}</h2>
      </div>

      <div className="top-actions">
        {/* Network & Sync indicator */}
        <div className={`network-pill ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
        </div>

        {syncQueueCount > 0 && (
          <div className="sync-badge">
            {isSyncing ? <Loader2 size={13} className="spin" /> : null}
            <span>{syncQueueCount} pending sync</span>
          </div>
        )}

        <button className="secondary" onClick={onRefresh} title="Sync data with server">
          <RefreshCw size={15} className={isSyncing ? 'spin' : ''} />
          <span>Refresh</span>
        </button>

        <button
          className={isPushSubscribed ? 'secondary' : 'secondary highlight-btn'}
          onClick={onTogglePush}
          title={isPushSubscribed ? 'Web Push Active' : 'Enable Web Push Alerts'}
        >
          {isPushSubscribed ? <Bell size={15} className="text-success" /> : <BellOff size={15} />}
          <span>{isPushSubscribed ? 'Alerts On' : 'Enable Alerts'}</span>
        </button>
      </div>
    </header>
  );
};
