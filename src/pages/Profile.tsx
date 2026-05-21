import React, { useState, useEffect } from 'react';
import { Prayer, AppNotification } from '../types.js';
import { 
  ArrowLeft, User, Bell, Heart, MessageSquare, 
  Settings, Loader2, CheckCircle2, ShieldAlert, 
  Sparkles, ListCollapse, Radio, Trash2 
} from 'lucide-react';

interface ProfileProps {
  onNavigate: (path: string) => void;
  user: any;
  token: string | null;
  onUpdateUser: (newUser: any) => void;
  onLogout: () => void;
}

export default function Profile({ onNavigate, user, token, onUpdateUser, onLogout }: ProfileProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  // Settings modification fields
  const [name, setName] = useState(user?.name || '');
  const [notifyHearts, setNotifyHearts] = useState(user?.notify_hearts ?? true);
  const [notifyComments, setNotifyComments] = useState(user?.notify_comments ?? true);
  
  // Interactive UI loaders and notifications
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Push Permission helper state
  const [pushPermissionStatus, setPushPermissionStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const fetchUserData = async () => {
    if (!token) return;
    setIsDataLoading(true);
    try {
      // 1. Fetch user prayers
      const pRes = await fetch('/api/auth/prayers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPrayers(pData);
      }

      // 2. Fetch user notifications list
      const nRes = await fetch('/api/auth/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotifications(nData);
      }
    } catch (e) {
      console.error('Failed to load profile user logs:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  // Handle active settings mutation
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setFeedbackError(null);
    setFeedbackSuccess(null);

    try {
      const res = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          notify_hearts: notifyHearts,
          notify_comments: notifyComments
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preferences.');
      }

      onUpdateUser(data.user);
      setFeedbackSuccess('Your profile preferences have been successfully updated.');
    } catch (err: any) {
      setFeedbackError(err.message || 'Disconnect error. Retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark all notifications read
  const handleDismissNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setFeedbackSuccess('All sanctuary notifications marked read.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Standard Notification Permission
  const handleRequestPushPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setPushPermissionStatus(result);
      if (result === 'granted') {
        // Enforce push-subscription model simulation with server
        const mockSub = {
          endpoint: `https://fcm.googleapis.com/fcm/send/mock-simulated-device-${user?.id}-${Math.floor(Math.random() * 99999)}`,
          keys: {
            p256dh: 'BBPx98uNlZtW_q4gH36bE9RjXN3Yp-b8a7f...',
            auth: 'mockAuthSecretKeyString123'
          }
        };

        await fetch('/api/push-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mockSub)
        });

        setFeedbackSuccess('Standard Desktop Notifications link established successfully!');
      } else {
        setFeedbackError('Notification approvals were blocked. Please verify your browser site settings.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Triggering visual local notifications support sandbox
  const handleTestNotificationInstant = () => {
    const title = 'PrayWith.me Sanctuary ❤️';
    const body = 'Quiet solidarity lit. Another browser visitor stood in agreement with your recovery prayer!';
    
    // Web notifications
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else {
      // Inline state notification alert fallback
      alert(`${title}\n${body}`);
    }
  };

  // Safe prayer redirection
  const handlePrayerLaunch = (prayerId: string) => {
    onNavigate(`/prayer/${prayerId}`);
  };

  // Logout handler
  const handleExitClick = () => {
    onLogout();
    onNavigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-24 text-[#3D3530]" id="profile-view-wrapper">
      {/* ━━━ PEACEFUL HEADER ━━━ */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#C4A882]/15 shadow-xs" id="profile-site-header">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#B8976A] hover:text-[#A38356] transition-colors cursor-pointer font-nunito"
          >
            <ArrowLeft size={16} /> Return to Feed
          </button>
          
          <div className="flex items-center gap-2 select-none" id="profile-logo-group">
            <div className="w-5 h-5 bg-[#FAF0D7] border border-[#C4A882]/30 rounded-t-xs relative flex flex-col items-center justify-end">
              <div className="w-2.5 h-3 bg-amber-400 rounded-full blur-[0.6px] mb-0.5" />
            </div>
            <span className="font-nunito font-semibold tracking-wider text-base text-[#3D3530]" style={{ fontWeight: 700 }}>
              PrayWith.me
            </span>
          </div>

          <button
            onClick={handleExitClick}
            className="text-xs font-semibold font-nunito text-[#3D3530]/60 hover:text-red-600 transition-colors cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* ━━━ CORE BODY ━━━ */}
      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: PROFILE SETTINGS */}
        <div className="md:col-span-1 space-y-6">
          {/* Card */}
          <div className="bg-[#F0EBE1] border border-[#C4A882]/30 rounded-xl p-6 shadow-xs relative" id="profile-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#FAF8F5] border border-[#C4A882]/40 rounded-full flex items-center justify-center text-[#B8976A]">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-base font-nunito font-bold leading-tight">{user?.name}</h2>
                <p className="text-[11px] text-[#3D3530]/60 font-mono select-all shrink-0">{user?.email}</p>
              </div>
            </div>

            {/* Quick stats panel */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-[#FAF8F5]/60 rounded-lg text-center mb-6 border border-[#C4A882]/10 select-none">
              <div>
                <p className="text-xl font-serif italic text-[#B8976A]">{prayers.length}</p>
                <p className="text-[10px] uppercase tracking-wider font-semibold font-nunito text-[#3D3530]/65">My Prayers</p>
              </div>
              <div>
                <p className="text-xl font-serif italic text-red-500">
                  {prayers.reduce((sum, p) => sum + (p.heart_count || 0), 0)}
                </p>
                <p className="text-[10px] uppercase tracking-wider font-semibold font-nunito text-[#3D3530]/65">Lit Solidarity</p>
              </div>
            </div>

            {/* Save Form */}
            <form onSubmit={handleSavePreferences} className="space-y-4 font-nunito text-xs">
              <h3 className="font-bold border-b border-[#C4A882]/15 pb-1 flex items-center gap-1.5 text-[#B8976A]">
                <Settings size={14} /> Profile Preferences
              </h3>

              {feedbackError && (
                <div className="p-2 bg-red-100 border border-red-200 text-red-800 text-[11px] rounded flex gap-1 items-start">
                  <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {feedbackSuccess && (
                <div className="p-2 bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] rounded flex gap-1 items-start">
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                  <span>{feedbackSuccess}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1 text-[#3D3530]/75">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous comfort seeker"
                  maxLength={30}
                  className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#C4A882]/40 rounded focus:outline-hidden"
                />
              </div>

              {/* Toggle controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#3D3530]/85">Solidarity updates (Hearts)</p>
                    <p className="text-[10px] text-[#3D3530]/55">Notify me when someone lights a candle</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyHearts}
                    onChange={(e) => setNotifyHearts(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4537E] focus:ring-[#D4537E]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#3D3530]/85">Sanctuary Comment notifications</p>
                    <p className="text-[10px] text-[#3D3530]/55">Notify me of support comments left on my walls</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyComments}
                    onChange={(e) => setNotifyComments(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#D4537E] focus:ring-[#D4537E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2 bg-[#B8976A] hover:bg-[#A38356] disabled:bg-[#B8976A]/40 text-white font-semibold rounded cursor-pointer transition-colors flex items-center justify-center gap-1"
              >
                {isLoading && <Loader2 size={13} className="animate-spin" />}
                Save Private Setup
              </button>
            </form>
          </div>

          {/* Device Approvals Section */}
          <div className="bg-[#F0EBE1]/75 border border-[#C4A882]/20 rounded-xl p-4 font-nunito text-xs text-[#3D3530]/85 space-y-3">
            <h4 className="font-bold border-b border-[#C4A882]/10 pb-1 flex items-center gap-1.5 text-[#B8976A]">
              <Radio size={14} className="text-[#D4537E]" /> Push Notification Sandbox
            </h4>
            <p className="text-[11px] leading-relaxed text-[#3D3530]/70">
              Web Push allows dynamic background pop-ups even when PrayWith.me is minimized. Approve site standard requests, and try a test push alert!
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleRequestPushPermission}
                className={`py-1.5 px-3 rounded text-[11px] font-semibold text-white cursor-pointer transition-colors ${
                  pushPermissionStatus === 'granted' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-[#D4537E] hover:bg-[#C2436D]'
                }`}
              >
                {pushPermissionStatus === 'granted' ? 'Push Permissions: Active' : 'Enable Web Push Alerts'}
              </button>

              <button
                onClick={handleTestNotificationInstant}
                className="py-1.5 px-3 bg-[#FAF8F5] text-[#B8976A] border border-[#C4A882]/40 rounded hover:bg-[#F0EBE1] transition-colors cursor-pointer text-[11px]"
              >
                Test Simulated Push Notification
              </button>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL: MY SHARED PRAYERS */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="text-lg font-serif italic text-[#B8976A] flex items-center gap-2 font-semibold">
            <ListCollapse size={18} /> My Shared Prayers
          </h3>

          {isDataLoading ? (
            <div className="py-12 flex justify-center text-[#B8976A]">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : prayers.length === 0 ? (
            <div className="p-8 text-center bg-[#F0EBE1]/50 border border-[#C4A882]/20 rounded-xl text-xs text-[#3D3530]/60">
              You haven't posted any anonymous prayers with this registered account.
              <button
                onClick={() => onNavigate('/submit')}
                className="mt-3 block mx-auto px-4 py-1.5 bg-[#B8976A] text-white rounded hover:bg-[#A38356]"
              >
                Share a prayer now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {prayers.map((prayer) => (
                <div
                  key={prayer.id}
                  onClick={() => handlePrayerLaunch(prayer.id)}
                  className="p-4 bg-[#F0EBE1] hover:bg-[#E8E2D7] border border-[#C4A882]/30 rounded-xl cursor-pointer hover:shadow-xs transition-all relative font-nunito text-xs select-none"
                >
                  <p className="font-serif italic text-sm text-[#3D3530]/90 leading-relaxed mb-3 line-clamp-3">
                    "{prayer.text}"
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] text-[#3D3530]/55">
                    <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#C4A882]/25 rounded text-[#B8976A] font-semibold">
                      {prayer.category}
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-red-500">
                      <Heart size={10} fill="currentColor" /> {prayer.heart_count || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: ACTIVITY NOTIFICATIONS */}
        <div className="md:col-span-1 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-serif italic text-[#B8976A] flex items-center gap-2 font-semibold">
              <Bell size={18} /> Activity & Solidarity Feed
              {unreadCount > 0 && (
                <span className="text-[10px] font-nunito bg-[#D4537E] text-white px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={handleDismissNotifications}
                className="text-[10px] font-semibold text-[#B8976A] hover:underline cursor-pointer"
              >
                Mark as Read
              </button>
            )}
          </div>

          {isDataLoading ? (
            <div className="py-12 flex justify-center text-[#B8976A]">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center bg-[#F0EBE1]/50 border border-[#C4A882]/20 rounded-xl text-xs text-[#3D3530]/60 select-none">
              <Sparkles size={16} className="mx-auto text-[#B8976A]/50 mb-2 animate-pulse" />
              Nothing has logged in yet. Fresh interaction updates will light up here!
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => notif.prayer_id && handlePrayerLaunch(notif.prayer_id)}
                  className={`p-3 border rounded-xl flex gap-2.5 font-nunito text-xs cursor-pointer hover:bg-[#FAF8F5] hover:shadow-xs transition-shadow ${
                    notif.read 
                      ? 'bg-[#F0EBE1]/40 border-[#C4A882]/15 text-[#3D3530]/70' 
                      : 'bg-white border-[#B8976A]/40 text-[#3D3530] border-l-4 border-l-[#D4537E]'
                  }`}
                >
                  <div className="mt-0.5 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    {notif.type === 'heart' ? (
                      <Heart size={14} className="text-red-500 fill-red-500 shrink-0" />
                    ) : (
                      <MessageSquare size={14} className="text-indigo-600 fill-indigo-600/10 shrink-0" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold leading-tight flex items-center gap-1.5">
                      {notif.title}
                      {!notif.read && (
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
                      )}
                    </h5>
                    <p className="text-[11px] text-[#3D3530]/75 mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>
                    <p className="text-[9px] text-[#3D3530]/45 font-mono mt-1">
                      {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
