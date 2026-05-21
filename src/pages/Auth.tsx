import React, { useState } from 'react';
import { Sparkles, ArrowLeft, Loader2, KeyRound, Mail, User, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onNavigate: (path: string) => void;
  onAuthSuccess: (token: string, user: any) => void;
}

type AuthMode = 'login' | 'register' | 'reset-request' | 'reset-confirm';

export default function Auth({ onNavigate, onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetCode, setResetCode] = useState('');
  
  // States for loaders and feedback alerts
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devPinCode, setDevPinCode] = useState<string | null>(null);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setDevPinCode(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please supply both your email address and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed.');
      }

      setSuccessMsg('Signed in successfully.');
      onAuthSuccess(data.token, data.user);
      setTimeout(() => onNavigate('/'), 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setErrorMsg('All registration fields are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Credentials safety: Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMsg('Your sanctuary space was built successfully!');
      onAuthSuccess(data.token, data.user);
      setTimeout(() => onNavigate('/'), 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Email might be registered already.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Email is required to verify identity.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setDevPinCode(null);
    try {
      const res = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trigger failed.');
      }

      setSuccessMsg('Temporary dynamic password reset request initialized!');
      if (data.devPinCode) {
        setDevPinCode(data.devPinCode);
      }
      setTimeout(() => {
        setMode('reset-confirm');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Try verifying again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !resetCode || !password) {
      setErrorMsg('All verification inputs are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Safety guidelines: Code password must exceed 6 letters.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword: password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'PIN confirmation failed.');
      }

      setSuccessMsg('Safely updated credentials code. Try signature log-in!');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setResetCode('');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect pin code provided.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] pb-24 text-[#3D3530]" id="auth-view-wrapper">
      {/* ━━━ HEADER CONTROLS ━━━ */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#C4A882]/15 shadow-xs" id="auth-custom-header">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#B8976A] hover:text-[#A38356] transition-colors cursor-pointer font-nunito"
          >
            <ArrowLeft size={16} /> Scroll to Feed
          </button>
          
          <div className="flex items-center gap-2 select-none" id="auth-logo-unit">
            <div className="w-5 h-5 bg-[#FAF0D7] border border-[#C4A882]/30 rounded-t-xs relative flex flex-col items-center justify-end">
              <div className="w-2 h-2.5 bg-amber-400 rounded-full blur-[0.6px] mb-0.5" />
            </div>
            <span className="font-nunito font-semibold tracking-wider text-base text-[#3D3530]" style={{ fontWeight: 700 }}>
              PrayWith.me
            </span>
          </div>
          <div className="w-16" /> {/* Balance spacer */}
        </div>
      </header>

      {/* ━━━ PAGE LAYOUT CONTAINER ━━━ */}
      <main className="max-w-md mx-auto px-4 mt-12 md:mt-20 flex flex-col items-center">
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif italic text-[#B8976A] mb-2 leading-tight">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Enter the Sanctuary'}
            {mode === 'reset-request' && 'Recover Sanctuary'}
            {mode === 'reset-confirm' && 'Verify Security PIN'}
          </h2>
          <p className="text-xs font-nunito text-[#3D3530]/65 max-w-sm leading-relaxed px-4">
            {mode === 'login' && 'Access notifications and track your historical prayers in a private sanctuary.'}
            {mode === 'register' && 'Creating an account grants access to notifications and tracks quiet solidarity metrics.'}
            {mode === 'reset-request' && 'Submit your registered email address below, and we will prepare a temporary PIN code.'}
            {mode === 'reset-confirm' && 'Submit the 6-digit credential code generated in your private browser below.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full bg-[#F0EBE1] border border-[#C4A882]/30 rounded-xl p-6 shadow-xs relative" id="auth-card-block">
          {/* Messages */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg text-xs font-nunito text-red-700 flex items-start gap-2">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-nunito text-emerald-800 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMsg}</p>
                {devPinCode && (
                  <div className="mt-2 p-2 bg-emerald-800 text-white rounded font-mono text-center tracking-widest text-sm font-bold">
                    PIN: {devPinCode}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode Switcher Form */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 font-nunito text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5 label-email">Sanctuary Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@sanctuary.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5 label-password">Private Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => handleModeChange('reset-request')}
                  className="text-[11px] underline text-[#B8976A] hover:text-[#A38356] transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#B8976A] hover:bg-[#A38356] disabled:bg-[#B8976A]/40 text-white font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Enter Sanctuary
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 font-nunito text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Sanctuary Profile Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Comfort Seeker"
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Sanctuary Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@sanctuary.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Private Password (min 6 chars)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#D4537E] hover:bg-[#C2436D] disabled:bg-[#D4537E]/40 text-white font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                Build Sanctuary Profile
              </button>
            </form>
          )}

          {mode === 'reset-request' && (
            <form onSubmit={handleResetRequestSubmit} className="space-y-4 font-nunito text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Sanctuary Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@sanctuary.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#B8976A] hover:bg-[#A38356] disabled:bg-[#B8976A]/40 text-white font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : 'Send Reset PIN'}
              </button>
            </form>
          )}

          {mode === 'reset-confirm' && (
            <form onSubmit={handleResetConfirmSubmit} className="space-y-4 font-nunito text-xs">
              <div className="p-2 bg-[#FAF8F5] border border-[#C4A882]/20 rounded text-[11px] text-[#3D3530]/75">
                We've simulated a security email delivery. Please copy the green PIN code shown above and paste it below to change your credentials instantly!
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Confirm Identity Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-[#FAF8F5]/50 border border-[#C4A882]/30 rounded-lg text-xs text-[#3D3530]/70 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">6-Digit Security PIN</label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.trim())}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-center tracking-widest font-bold text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3D3530]/80 mb-1.5">Enter New Sanctuary Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 text-[#C4A882]" size={15} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#C4A882]/45 rounded-lg text-xs text-[#3D3530] focus:outline-hidden focus:border-[#B8976A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#B8976A] hover:bg-[#A38356] disabled:bg-[#B8976A]/40 text-white font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                {isLoading ? <Loader2 size={15} className="animate-spin" /> : 'Confirm Password Update'}
              </button>
            </form>
          )}

          {/* Card Footer Switcher Links */}
          <div className="border-t border-[#C4A882]/20 mt-6 pt-4 text-center">
            {mode === 'login' && (
              <p className="text-[11px] text-[#3D3530]/75">
                New to the Sanctuary?{' '}
                <button
                  onClick={() => handleModeChange('register')}
                  className="font-semibold text-[#D4537E] hover:underline cursor-pointer ml-0.5"
                >
                  Create an account
                </button>
              </p>
            )}

            {mode === 'register' && (
              <p className="text-[11px] text-[#3D3530]/75">
                Already registered?{' '}
                <button
                  onClick={() => handleModeChange('login')}
                  className="font-semibold text-[#B8976A] hover:underline cursor-pointer ml-0.5"
                >
                  Sign in here
                </button>
              </p>
            )}

            {(mode === 'reset-request' || mode === 'reset-confirm') && (
              <button
                onClick={() => handleModeChange('login')}
                className="text-[11px] font-semibold text-[#B8976A] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                Return to Login
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
