import React, { useState, useEffect } from 'react';
import { Prayer, Comment } from '../types.js';
import HeartButton from '../components/HeartButton.js';
import GradientFallback from '../components/GradientFallback.js';
import { formatRelativeTime } from '../components/PrayerCard.js';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Copy, Check, Twitter, Facebook, MessageSquare, 
  Flag, AlertTriangle, Send, ShieldAlert, Sparkles 
} from 'lucide-react';

interface DetailProps {
  prayerId: string;
  onNavigate: (path: string) => void;
}

export default function Detail({ prayerId, onNavigate }: DetailProps) {
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copied indicator state
  const [copied, setCopied] = useState(false);
  
  // Reporting state
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('Offensive Content');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Comment submission state
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchPrayerAndComments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch Prayer
      const prRes = await fetch(`/api/prayers/${prayerId}`);
      if (!prRes.ok) {
        throw new Error('This prayer request is no longer visible or does not exist.');
      }
      const prData = await prRes.json();
      setPrayer(prData);

      // 2. Fetch Comments
      const cmRes = await fetch(`/api/prayers/${prayerId}/comments`);
      if (cmRes.ok) {
        const cmData = await cmRes.json();
        setComments(cmData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error connecting to the sanctuary database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayerAndComments();
    
    // Refresh comments periodically
    const interval = setInterval(async () => {
      try {
        const cmRes = await fetch(`/api/prayers/${prayerId}/comments`);
        if (cmRes.ok) {
          const cmData = await cmRes.json();
          setComments(cmData);
        }
      } catch (e) {
        console.warn('Silent comment refresh failed:', e);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [prayerId]);

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/prayer/${prayerId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleSocialShare = (platform: 'twitter' | 'facebook') => {
    const shareUrl = encodeURIComponent(`${window.location.origin}/prayer/${prayerId}`);
    const text = encodeURIComponent('Stand in solidarity with this anonymous prayer request on PrayWith.me: ');
    
    let url = '';
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    }
    
    // In full-screen environment, open new window, in sandboxed fallback, copy to clipboard instead
    try {
      window.open(url, '_blank', 'width=600,height=400');
    } catch (e) {
      handleCopyLink();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isCommenting) return;

    setIsCommenting(true);
    setCommentError(null);

    try {
      const response = await fetch(`/api/prayers/${prayerId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newCommentText }),
      });

      const resData = await response.json();

      if (response.ok) {
        // Optimistic UI updates
        setComments(prev => [...prev, resData]);
        setNewCommentText('');
      } else {
        setCommentError(resData.error || 'Failed to submit comment.');
      }
    } catch (error) {
      setCommentError('Server connection timed out.');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prayerId,
          reason: reportReason,
        }),
      });

      if (response.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReporting(false);
          setReportSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to register report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-40 text-[#C4A882]" id="detail-loader">
        <svg className="animate-spin h-8 w-8 mr-3 text-[#B8976A]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="font-semibold font-nunito">Opening prayer sanctuary...</span>
      </div>
    );
  }

  if (error || !prayer) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4" id="detail-not-found">
        <ShieldAlert className="text-[#D4537E] mx-auto mb-4" size={48} />
        <h3 className="text-xl font-semibold text-[#3D3530] mb-2">Sanctuary Closed</h3>
        <p className="text-sm text-[#3D3530]/60 mb-6">{error || 'This prayer request has been filtered out or deleted.'}</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-6 py-2.5 bg-[#B8976A] hover:bg-[#A38356] text-white rounded-full font-semibold max-w-xs transition-transform hover:scale-101"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pb-32" id="detail-view-container">
      {/* ━━━ Header ━━━ */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#C4A882]/15 shadow-xs" id="site-header-detail">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            id="back-btn-detail"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#B8976A] hover:text-[#3D3530] transition-colors duration-300 cursor-pointer font-nunito"
          >
            <ArrowLeft size={16} /> All prayers
          </button>
          
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => onNavigate('/')}>
            <span className="font-nunito font-semibold tracking-wider text-base text-[#3D3530]">
              PrayWith.me
            </span>
          </div>
        </div>
      </header>

      {/* ━━━ Full-width gradient or image header ━━━ */}
      <section className="w-full relative h-64 md:h-80 overflow-hidden" id="detail-banner-stage">
        {prayer.image_url ? (
          <img
            src={prayer.image_url}
            alt="Prayer focal canvas fallback"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <GradientFallback seed={prayer.id} className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5]/40 to-transparent" />
      </section>

      {/* ━━━ Prayer Card Detail body ━━━ */}
      <main className="max-w-3xl mx-auto px-4 -mt-24 relative z-10" id="detail-main-layout">
        <div className="bg-[#F0EBE1] border border-[#C4A882]/30 rounded-[24px] p-8 md:p-12 shadow-lg" id="detail-card-panel">
          
          {/* Metadata */}
          <div className="flex justify-between items-center mb-8" id="detail-metadata">
            <span className="px-3.5 py-1.5 bg-[#B8976A]/15 text-[#B8976A] rounded-full text-xs font-bold tracking-wider uppercase font-nunito">
              {prayer.category}
            </span>
            <span className="text-xs font-semibold text-[#3D3530]/60 font-nunito">
              Shared {formatRelativeTime(prayer.created_at)}
            </span>
          </div>

          {/* Full Prayer Text (Centered Display) */}
          <div className="text-center my-10 md:my-14" id="detail-prayer-text-container">
            <h2 className="font-cormorant italic text-2xl md:text-4xl text-[#3D3530] leading-relaxed tracking-wide text-center select-all">
              “ {prayer.text} ”
            </h2>
          </div>

          {/* Heart button & Share center */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-[#C4A882]/25 pt-8" id="detail-actions-panel">
            
            {/* Pulsing heart button */}
            <HeartButton
              prayerId={prayer.id}
              initialCounts={prayer.heart_count}
              onHeartAdded={(nextCount) => {
                setPrayer(prev => prev ? { ...prev, heart_count: nextCount } : prev);
              }}
            />

            {/* Sharing Utilities */}
            <div className="flex items-center gap-3" id="detail-share-box">
              <span className="text-xs text-[#3D3530]/60 font-bold uppercase font-nunito">Share request:</span>
              
              {/* Copy URL */}
              <button
                id="copy-link-btn"
                onClick={handleCopyLink}
                className={`p-2 rounded-full cursor-pointer transition-colors duration-300 hover:scale-102
                    ${copied ? 'bg-emerald-500/10 text-emerald-600' : 'bg-white hover:bg-white/80 border border-[#C4A882]/20 text-[#B8976A]'}
                `}
                title="Copy link to clipboard"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>

              {/* Twitter share */}
              <button
                id="share-twitter-btn"
                onClick={() => handleSocialShare('twitter')}
                className="p-1.5 rounded-full bg-white hover:bg-neutral-100 border border-[#C4A882]/20 text-[#B8976A] cursor-pointer"
                title="Share on X / Twitter"
              >
                <Twitter size={15} fill="currentColor" />
              </button>

              {/* Facebook share */}
              <button
                id="share-facebook-btn"
                onClick={() => handleSocialShare('facebook')}
                className="p-1.5 rounded-full bg-white hover:bg-neutral-100 border border-[#C4A882]/20 text-[#B8976A] cursor-pointer"
                title="Share on Facebook"
              >
                <Facebook size={15} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>

        {/* ━━━ Anonymous Comments Section ━━━ */}
        <section className="mt-12 bg-white/55 backdrop-blur-xs border border-[#C4A882]/20 rounded-[20px] p-6 md:p-8" id="comments-section">
          <h3 className="text-lg font-semibold font-nunito text-[#3D3530] mb-6 flex items-center gap-2">
            <MessageSquare size={18} className="text-[#C4A882]" /> 
            Quiet Agreement ({comments.length})
          </h3>

          {/* Comment Thread List */}
          <div className="space-y-4 mb-8" id="comments-thread-list">
            {comments.length === 0 ? (
              <div className="text-center py-6 text-[#3D3530]/50 italic text-sm" id="empty-comments-warning">
                No words of agreement have been spoken yet. Be the first to leave a word of hope.
              </div>
            ) : (
              comments.map((comm) => (
                <div
                  key={comm.id}
                  id={`comment-bubble-${comm.id}`}
                  className="p-4 rounded-[14px] bg-[#FAF8F5] border border-[#C4A882]/15 text-[#3D3530]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8976A]">
                      Anonymous Companion
                    </span>
                    <span className="text-[10px] text-[#3D3530]/50">
                      {formatRelativeTime(comm.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-sans leading-relaxed text-left">
                    {comm.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment Input Box */}
          <form onSubmit={handleCommentSubmit} className="space-y-4 pt-4 border-t border-[#C4A882]/15" id="write-comment-form">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="comment-textarea" className="text-xs font-semibold uppercase tracking-wider text-[#3D3530]/75 flex justify-between">
                <span>Add words of solidarity</span>
                <span className={`text-[10px] font-mono ${newCommentText.length > 200 ? 'text-[#D4537E]' : 'text-[#3D3530]/40'}`}>
                  {newCommentText.length} / 200
                </span>
              </label>
              <textarea
                id="comment-textarea"
                rows={2}
                placeholder="Comfort with truth, keep the conversation respectful... (max 200 chars)"
                value={newCommentText}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setNewCommentText(e.target.value);
                  }
                }}
                required
                className="w-full p-3 bg-[#FAF8F5]/80 placeholder-[#3D3530]/40 text-[#3D3530] border border-[#C4A882]/30 rounded-[12px] outline-none text-xs focus:border-[#B8976A] focus:ring-1 focus:ring-[#B8976A] resize-none"
              />
            </div>

            {commentError && (
              <div className="text-xs text-[#D4537E] font-medium" id="comment-validation-feedback">
                {commentError}
              </div>
            )}

            <button
              id="submit-comment-button"
              type="submit"
              disabled={isCommenting || !newCommentText.trim()}
              className="px-5 py-2.5 bg-[#B8976A] text-white disabled:bg-[#B8976A]/40 text-xs font-semibold rounded-full hover:bg-[#A38356] transition-colors flex items-center justify-center gap-1.5 cursor-pointer ml-auto touch-manipulation uppercase tracking-wider"
            >
              <Send size={11} /> Speak words
            </button>
          </form>
        </section>

        {/* ━━━ Moderation Report Section ━━━ */}
        <section className="mt-14 pt-8 text-center" id="moderation-controls">
          {!isReporting ? (
            <button
              id="show-report-panel-button"
              onClick={() => setIsReporting(true)}
              className="text-xs text-[#3D3530]/40 hover:text-[#D4537E] font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer tracking-wider"
            >
              <Flag size={12} /> Report this prayer request
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleReportSubmit}
              className="max-w-md mx-auto p-5 rounded-[16px] bg-[#D4537E]/5 border border-[#D4537E]/20 text-left space-y-4"
              id="report-moderation-form"
            >
              <h4 className="text-xs font-bold text-[#D4537E] flex items-center gap-1">
                <AlertTriangle size={14} /> Safety Moderation Check
              </h4>
              <p className="text-[11px] text-[#3D3530]/75 leading-relaxed">
                We strive to keep the sanctuary of PrayWith.me safe. Please report content featuring hate, graphic details, spam, or targeted abuse.
              </p>

              {reportSuccess ? (
                <div className="text-xs text-emerald-600 font-semibold p-2 bg-emerald-50 rounded-md" id="report-success-banner">
                  Thank you. Your report has been submitted to moderators.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#3D3530]/70">
                      Reason for report
                    </label>
                    <select
                      id="report-reason-select"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full p-2 bg-white text-xs border border-[#C4A882]/30 rounded-md outline-none"
                    >
                      <option value="Offensive Content">Offensive or abusive speech</option>
                      <option value="Spam">Spam or soliciting</option>
                      <option value="Self-harm trigger">Triggers self-harm concern</option>
                      <option value="Inappropriate picture">Inappropriate visual photo</option>
                      <option value="Other">Other security issue</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      id="cancel-report-button"
                      onClick={() => setIsReporting(false)}
                      className="px-3 py-1.5 rounded-full text-[10px] text-[#3D3530]/60 hover:text-[#3D3530] font-semibold bg-gray-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="confirm-report-button"
                      className="px-3 py-1.5 rounded-full text-[10px] text-white font-bold bg-[#D4537E] hover:bg-[#C2436D] cursor-pointer"
                    >
                      Submit Report
                    </button>
                  </div>
                </div>
              )}
            </motion.form>
          )}
        </section>
      </main>
    </div>
  );
}
