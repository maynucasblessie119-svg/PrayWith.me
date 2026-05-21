import React, { useState, useEffect } from 'react';
import Home from './pages/Home.js';
import Submit from './pages/Submit.js';
import Detail from './pages/Detail.js';
import Admin from './pages/Admin.js';
import Auth from './pages/Auth.js';
import Profile from './pages/Profile.js';
import { Bell, Heart, MessageSquare, Flame } from 'lucide-react';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  
  // Auth state persistent fallbacks
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pw_token'));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('pw_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Local notifications polling & visual alerts trigger
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  const [knownNotifIds, setKnownNotifIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  /**
   * Safe path navigation dispatcher
   */
  const navigate = (newPath: string) => {
    window.history.pushState(null, '', newPath);
    setPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('pw_token', newToken);
    localStorage.setItem('pw_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pw_token');
    localStorage.removeItem('pw_user');
  };

  const handleUpdateUser = (newUser: any) => {
    setUser(newUser);
    localStorage.setItem('pw_user', JSON.stringify(newUser));
  };

  // Continuous background tracking for Solidarity updates (push simulation)
  useEffect(() => {
    if (!token) return;

    const checkFeed = async () => {
      try {
        const res = await fetch('/api/auth/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          // Identify brand new unread notifications
          const unread = data.filter((n: any) => !n.read);
          
          unread.forEach((n: any) => {
            if (!knownNotifIds.has(n.id)) {
              // Mark as known
              setKnownNotifIds(prev => {
                const copy = new Set(prev);
                copy.add(n.id);
                return copy;
              });

              // Slide-down in-app visual toast
              setLatestNotification(n);

              // Standard OS/Desktop notification
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification(n.title, {
                  body: n.body,
                  icon: '/favicon.ico'
                });
              }

              // Auto dismiss toast after 9 seconds
              setTimeout(() => {
                setLatestNotification((current: any) => current?.id === n.id ? null : current);
              }, 9000);
            }
          });
        }
      } catch (err) {
        console.error('Quiet notifications feedback poll failed:', err);
      }
    };

    // Run immediately on boot
    checkFeed();

    // Check periodically
    const interval = setInterval(checkFeed, 7000);
    return () => clearInterval(interval);
  }, [token, knownNotifIds]);

  // ━━━ PATH DISPATCH ROUTER ━━━
  const renderRoute = () => {
    if (path === '/') {
      return <Home onNavigate={navigate} user={user} onLogout={handleLogout} />;
    }

    if (path === '/submit') {
      return <Submit onNavigate={navigate} token={token} />;
    }

    if (path.startsWith('/prayer/')) {
      const segments = path.split('/prayer/');
      const id = segments[1];
      
      if (id && id.trim().length > 0) {
        return <Detail prayerId={id} onNavigate={navigate} />;
      }
    }

    if (path === '/admin') {
      return <Admin onNavigate={navigate} />;
    }

    if (path === '/auth') {
      return <Auth onNavigate={navigate} onAuthSuccess={handleAuthSuccess} />;
    }

    if (path === '/profile') {
      return (
        <Profile 
          onNavigate={navigate} 
          user={user} 
          token={token} 
          onUpdateUser={handleUpdateUser} 
          onLogout={handleLogout} 
        />
      );
    }

    // Fallback 404 handler
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 text-center select-none bg-[#FAF8F5]" id="404-view">
        <div className="w-16 h-16 bg-[#F0EBE1] border border-[#C4A882]/30 rounded-full flex items-center justify-center mb-6 text-[#B8976A]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h2 className="text-xl font-nunito font-bold text-[#3D3530] mb-2">
          Sanctuary Page Not Found
        </h2>
        <p className="text-xs text-[#3D3530]/60 max-w-sm ml-auto mr-auto mb-6 leading-relaxed">
          The prayer request page you are searching for might have been archived by our administrators or moved to another sanctuary section.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-[#B8976A] hover:bg-[#A38356] text-white text-xs font-semibold rounded-full font-nunito cursor-pointer"
        >
          Go back to Feed
        </button>
      </div>
    );
  };

  return (
    <>
      {renderRoute()}

      {/* ━━━ TRANSLUCENT SLIDE-DOWN PUSH NOTIFICATION POPUP ━━━ */}
      {latestNotification && (
        <div 
          onClick={() => {
            if (latestNotification.prayer_id) {
              navigate(`/prayer/${latestNotification.prayer_id}`);
            }
            setLatestNotification(null);
          }}
          className="fixed bottom-6 right-6 z-100 max-w-sm w-96 bg-white/95 backdrop-blur-md border border-[#B8976A]/40 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform translate-y-0 animate-bounce select-none"
          id="custom-push-toast"
        >
          <div className="flex gap-3">
            <div className="w-9 h-9 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center text-amber-600 shadow-xs">
              <Flame size={18} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold font-nunito text-[#3D3530] flex items-center gap-1">
                {latestNotification.title}
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </h4>
              <p className="text-[11px] text-[#3D3530]/75 font-nunito mt-1 leading-relaxed">
                {latestNotification.body}
              </p>
              <p className="text-[9px] text-[#C4A882] font-mono mt-1 font-semibold">
                Tap to view Sanctuary Card details
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
