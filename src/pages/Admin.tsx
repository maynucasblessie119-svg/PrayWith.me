import React, { useState, useEffect } from 'react';
import { DbPrayerWithReportCount } from '../../lib/db.js';
import { AppStats } from '../types.js';
import { 
  Lock, Unlock, ShieldCheck, Heart, FileText, AlertOctagon, 
  Trash2, Eye, EyeOff, CheckCircle2, RefreshCw, KeyRound 
} from 'lucide-react';

interface AdminProps {
  onNavigate: (path: string) => void;
}

export default function Admin({ onNavigate }: AdminProps) {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Loaded admin state
  const [stats, setStats] = useState<AppStats | null>(null);
  const [prayers, setPrayers] = useState<DbPrayerWithReportCount[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'flagged'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState<string | null>(null);

  // Auto-restore admin session if saved in sessionStorage
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('pw_admin_secret');
    if (savedPassword) {
      setPassword(savedPassword);
      checkAndFetch(savedPassword);
    }
  }, []);

  const checkAndFetch = async (adminSecret: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin', {
        headers: {
          'x-admin-password': adminSecret,
        }
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthorized(true);
        sessionStorage.setItem('pw_admin_secret', adminSecret);
        setStats(data.stats);
        setPrayers(data.prayers);
      } else {
        setAuthError(data.error || 'Access denied.');
        sessionStorage.removeItem('pw_admin_secret');
      }
    } catch (e) {
      setAuthError('Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    checkAndFetch(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pw_admin_secret');
    setIsAuthorized(false);
    setPassword('');
    setPrayers([]);
    setStats(null);
  };

  const executeAction = async (prayerId: string, action: 'approve' | 'hide' | 'delete') => {
    if (window.confirm(`Are you sure you want to ${action} this prayer?`)) {
      setIsActioning(prayerId);
      try {
        const response = await fetch('/api/admin', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': password,
          },
          body: JSON.stringify({ prayerId, action }),
        });

        if (response.ok) {
          // Re-fetch to update state
          await checkAndFetch(password);
        } else {
          alert('Failed to execute moderator command');
        }
      } catch (e) {
        console.error(e);
        alert('Server connectivity issue.');
      } finally {
        setIsActioning(null);
      }
    }
  };

  const filteredPrayers = activeTab === 'all' 
    ? prayers 
    : prayers.filter(p => p.report_count >= 3);

  // ━━━ Auth Portal View ━━━
  if (!isAuthorized) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center px-4 py-16" id="admin-auth-container">
        <div className="bg-[#F0EBE1] border border-[#C4A882]/30 rounded-[20px] p-8 max-w-sm w-full text-center shadow-lg" id="auth-portal-card">
          <div className="p-4 bg-[#B8976A]/10 text-[#B8976A] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <KeyRound size={28} />
          </div>

          <h1 className="text-xl font-nunito font-bold text-[#3D3530] mb-2" id="auth-portal-title">
            Sanctuary Admin Secure Gate
          </h1>
          <p className="text-xs text-[#3D3530]/60 mb-6 font-medium">
            Please present your authentication key to enter the Moderation Board.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4" id="admin-password-form">
            <div className="flex flex-col text-left">
              <label htmlFor="admin-pass-field" className="text-[10px] font-bold uppercase tracking-widest text-[#3D3530]/70 mb-1.5">
                Admin Password
              </label>
              <input
                id="admin-pass-field"
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 font-mono bg-white text-[#3D3530] border border-[#C4A882]/40 rounded-[10px] outline-none text-xs focus:border-[#B8976A] text-center"
              />
            </div>

            {authError && (
              <div className="text-xs text-[#D4537E] font-medium py-1.5" id="auth-error-feedback">
                {authError}
              </div>
            )}

            <button
              id="admin-auth-submit-btn"
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-[#B8976A] hover:bg-[#A38356] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md transition-all duration-300 transform active:scale-99 flex justify-center items-center gap-1.5 cursor-pointer"
            >
              {isLoading ? 'Decrypting...' : 'Authorize Vault'}
            </button>
          </form>

          <button
            id="auth-return-home"
            onClick={() => onNavigate('/')}
            className="mt-6 text-xs text-[#C4A882] hover:text-[#3D3530] font-semibold transition-colors cursor-pointer"
          >
            ← Back to prayers
          </button>
        </div>
      </div>
    );
  }

  // ━━━ Primary Admin Dashboard View ━━━
  return (
    <div className="w-full min-h-screen pb-24" id="admin-dashboard-container">
      {/* Admin header */}
      <header className="sticky top-0 z-50 bg-[#3D3530] text-white border-b border-[#FAF8F5]/10 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 select-none">
            <ShieldCheck className="text-[#C4A882]" size={20} />
            <span className="font-nunito font-semibold tracking-wider text-base uppercase">
              PrayWith.me Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => checkAndFetch(password)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => onNavigate('/')}
              className="text-xs font-semibold text-[#FAF8F5]/70 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/5 font-nunito"
            >
              Feed view
            </button>

            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-[#D4537E]/20 hover:bg-[#D4537E]/45 text-[#FFF] border border-[#D4537E]/30 rounded-full text-xs font-bold transition-all cursor-pointer font-nunito flex items-center gap-1"
            >
              <Lock size={11} /> Lock Gate
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        
        {/* ━━━ STATS BAR ━━━ */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10" id="admin-stats-strip">
          <div className="bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[14px] p-6 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3D3530]/50 mb-1">
                Total Shared Prayers
              </p>
              <h3 className="text-3xl font-semibold text-[#3D3530] font-sans">
                {stats?.totalPrayers ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-white/70 rounded-full text-[#B8976A]">
              <FileText size={22} />
            </div>
          </div>

          <div className="bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[14px] p-6 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3D3530]/50 mb-1">
                Active Hearts Today
              </p>
              <h3 className="text-3xl font-semibold text-[#3D3530] font-sans">
                {stats?.totalHeartsToday ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-white/70 rounded-full text-[#D4537E]">
              <Heart size={21} fill="currentColor" />
            </div>
          </div>

          <div className="bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[14px] p-6 flex items-center justify-between shadow-xs md:col-span-2 lg:col-span-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#3D3530]/50 mb-1">
                Flag Queue Attention
              </p>
              <h3 className="text-3xl font-semibold text-[#3D3530] font-sans">
                {prayers.filter(p => p.report_count >= 3).length}
              </h3>
            </div>
            <div className="p-3 bg-white/70 rounded-full text-amber-600">
              <AlertOctagon size={22} />
            </div>
          </div>
        </section>

        {/* ━━━ TABLE CONTROLS ━━━ */}
        <section className="bg-white border border-[#C4A882]/25 rounded-[16px] overflow-hidden shadow-sm">
          {/* Navigation Tab strip */}
          <div className="flex border-b border-[#C4A882]/20 bg-neutral-50 px-4 pt-3 flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 border-b-2 font-semibold text-xs font-nunito flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider
                  ${activeTab === 'all' 
                    ? 'border-[#B8976A] text-[#3D3530]' 
                    : 'border-transparent text-[#3D3530]/50 hover:text-[#3D3530]/80'
                  }
                `}
              >
                All Prayers ({prayers.length})
              </button>
              <button
                onClick={() => setActiveTab('flagged')}
                className={`px-4 py-2 border-b-2 font-semibold text-xs font-nunito flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider
                  ${activeTab === 'flagged' 
                    ? 'border-[#D4537E] text-[#D4537E]' 
                    : 'border-transparent text-[#3D3530]/50 hover:text-[#D4537E]/70'
                  }
                `}
              >
                Flag Queue (3+ reports) ({prayers.filter(p => p.report_count >= 3).length})
              </button>
            </div>
            <span className="text-[11px] text-[#3D3530]/40 font-semibold italic p-2 hidden sm:inline">
              Secure authorization confirmed
            </span>
          </div>

          {/* Table display */}
          <div className="w-full overflow-x-auto min-h-60" id="admin-table-scroll-container">
            {isLoading ? (
              <div className="flex justify-center items-center py-24 text-[#C4A882]" id="table-loader">
                <svg className="animate-spin h-6 w-6 mr-3 text-[#B8976A]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-semibold">Syncing records...</span>
              </div>
            ) : filteredPrayers.length === 0 ? (
              <div className="text-center py-20 text-[#3D3530]/50 italic text-sm">
                No prayer requests found matching this tab filter.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs md:text-sm font-sans" id="admin-prayers-table">
                <thead>
                  <tr className="bg-neutral-50/60 font-bold uppercase tracking-wider border-b border-[#C4A882]/20 text-[#3D3530]/70 text-[10px]">
                    <th className="p-4 pl-6">Prayer Content Preview</th>
                    <th className="p-4 text-center">Category</th>
                    <th className="p-4 text-center">Hearts</th>
                    <th className="p-4 text-center">Reports</th>
                    <th className="p-4 text-center col-span-1">Status</th>
                    <th className="p-4 pr-6 text-right">Moderator Decisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPrayers.map((pray) => {
                    return (
                      <tr key={pray.id} className="hover:bg-neutral-50/40 transition-colors" id={`admin-row-${pray.id}`}>
                        {/* Text Preview */}
                        <td className="p-4 pl-6 max-w-sm md:max-w-md">
                          <div className="font-cormorant italic font-medium text-base text-[#3D3530] leading-snug line-clamp-2">
                            “ {pray.text} ”
                          </div>
                          <div className="text-[10px] text-[#3D3530]/40 font-mono mt-1">
                            Shared on {new Date(pray.created_at).toLocaleString()} | ID: {pray.id}
                          </div>
                        </td>
                        
                        {/* Category */}
                        <td className="p-4 text-center font-semibold font-nunito text-[#B8976A]">
                          {pray.category}
                        </td>

                        {/* Heart count */}
                        <td className="p-4 text-center font-bold font-mono">
                          {pray.heart_count}
                        </td>

                        {/* Report count */}
                        <td className="p-4 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-full font-bold
                            ${pray.report_count > 0 
                              ? 'bg-rose-50 text-[#D4537E]' 
                              : 'text-gray-300'
                            }
                          `}>
                            {pray.report_count}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="p-4 text-center font-nunito font-semibold">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold
                            ${pray.status === 'visible' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : 'bg-amber-50 text-amber-600'
                            }
                          `}>
                            {pray.status}
                          </span>
                        </td>

                        {/* Modifier Actions column */}
                        <td className="p-4 pr-6 text-right" id={`row-actions-${pray.id}`}>
                          <div className="flex gap-2 justify-end">
                            {pray.status === 'hidden' && (
                              <button
                                id={`approve-btn-${pray.id}`}
                                onClick={() => executeAction(pray.id, 'approve')}
                                disabled={isActioning === pray.id}
                                className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-nunito font-bold text-[10px] uppercase"
                                title="Approve and make visible on feed"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                            )}

                            {pray.status === 'visible' && (
                              <button
                                id={`hide-btn-${pray.id}`}
                                onClick={() => executeAction(pray.id, 'hide')}
                                disabled={isActioning === pray.id}
                                className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-nunito font-bold text-[10px] uppercase"
                                title="Hide from public feed list"
                              >
                                <EyeOff size={12} /> Hide
                              </button>
                            )}

                            <button
                              id={`delete-btn-${pray.id}`}
                              onClick={() => executeAction(pray.id, 'delete')}
                              disabled={isActioning === pray.id}
                              className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-[#D4537E] border border-rose-200 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-nunito font-bold text-[10px] uppercase"
                              title="Delete permanently from the database"
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
