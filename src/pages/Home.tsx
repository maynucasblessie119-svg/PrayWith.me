import React, { useState, useEffect } from 'react';
import { Prayer } from '../types.js';
import CategoryFilter from '../components/CategoryFilter.js';
import PrayerCard from '../components/PrayerCard.js';
import { Sparkles, Loader2, ArrowRight, BookOpen, HeartHandshake } from 'lucide-react';

interface HomeProps {
  onNavigate: (path: string) => void;
  user?: any;
  onLogout?: () => void;
}

export default function Home({ onNavigate, user, onLogout }: HomeProps) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const fetchPrayers = async (category: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = category === 'All' ? '/api/prayers' : `/api/prayers?category=${category}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Could not fetch prayers');
      }
      const data = await res.json();
      setPrayers(data);
    } catch (err) {
      console.error(err);
      setError('A momentary disruption in connecting. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers(selectedCategory);
    
    // Set up continuous polling (realtime count sync fallback) every 5 seconds
    const interval = setInterval(() => {
      fetchPrayers(selectedCategory);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedCategory]);

  const handleHeartUpdated = (prayerId: string, nextCount: number) => {
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, heart_count: nextCount } : p));
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const displayedPrayers = prayers.slice(0, visibleCount);

  return (
    <div className="w-full min-h-screen pb-24" id="home-view-container">
      {/* ━━━ PEACEFUL HEADER ━━━ */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#C4A882]/15 shadow-xs" id="site-header">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => onNavigate('/')} id="header-logo-group">
            {/* Candle Lit flame icon in SVG */}
            <div className="w-6 h-6 bg-[#FAF0D7] border border-[#C4A882]/30 rounded-t-xs relative flex flex-col items-center justify-end shadow-xs">
              <div className="w-2.5 h-3.5 bg-amber-400 rounded-full blur-[0.8px] animate-pulse mb-0.5" />
            </div>
            <span className="font-nunito font-semibold tracking-wider text-xl text-[#3D3530]" style={{ fontWeight: 700 }}>
              PrayWith.me
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => onNavigate('/profile')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F0EBE1] hover:bg-[#E8E2D7] border border-[#C4A882]/35 rounded-full text-xs font-semibold font-nunito text-[#3D3530]/80 cursor-pointer transition duration-300"
                id="my-sanctuary-profile-button"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Sanctuary Profile
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/auth')}
                className="px-4 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EBE1] border border-[#C4A882]/45 rounded-full text-xs font-semibold font-nunito text-[#B8976A] cursor-pointer transition duration-300"
                id="auth-sign-in-link"
              >
                Sign In
              </button>
            )}

            <button
              id="share-new-prayer-header-button"
              onClick={() => onNavigate('/submit')}
              className="px-4.5 py-1.5 bg-[#D4537E] hover:bg-[#C2436D] text-white rounded-full text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-300 transform active:scale-97 cursor-pointer font-nunito"
            >
              Share Prayer
            </button>
          </div>
        </div>
      </header>

      {/* ━━━ HERO SECTION ━━━ */}
      <section className="text-center py-12 px-4 max-w-2xl mx-auto" id="spiritual-hero">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0EBE1] border border-[#C4A882]/30 rounded-full text-xs font-semibold text-[#B8976A] mb-4">
          <HeartHandshake size={14} /> 100% Anonymous Prayer Wall
        </div>
        <h1 className="text-2xl md:text-3xl font-nunito font-semibold text-[#3D3530] tracking-tight leading-tight mb-3">
          A digital candle wall for quiet solidarity
        </h1>
        <p className="text-sm md:text-base text-[#3D3530]/70 font-nunito leading-relaxed max-w-lg mx-auto">
          Post an anonymous prayer request, stand in quiet agreement with others, and light a candle of hope. No accounts. No noise. Just prayer.
        </p>
      </section>

      {/* ━━━ CATEGORY SELECTION ━━━ */}
      <div className="max-w-5xl mx-auto mb-8" id="category-filter-strip">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setVisibleCount(6); // reset pagination
          }}
        />
      </div>

      {/* ━━━ THE PRAYER CARD GRID ━━━ */}
      <main className="max-w-5xl mx-auto px-4" id="prayer-feed-grid">
        {isLoading && prayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#C4A882]" id="feed-loader">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-sm font-medium font-nunito">Entering peaceful space...</p>
          </div>
        ) : error && prayers.length === 0 ? (
          <div className="text-center py-20 px-4 bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[20px] max-w-md mx-auto" id="feed-error">
            <p className="text-sm font-semibold text-[#D4537E] mb-3">{error}</p>
            <button
              onClick={() => fetchPrayers(selectedCategory)}
              className="text-xs px-4 py-2 bg-[#B8976A] text-white rounded-full font-bold hover:bg-[#A38356]"
            >
              Retry Connection
            </button>
          </div>
        ) : prayers.length === 0 ? (
          <div className="text-center py-24 bg-[#F0EBE1]/40 border border-dashed border-[#C4A882]/50 rounded-[20px] max-w-md mx-auto px-6" id="feed-empty">
            <BookOpen className="text-[#C4A882] mx-auto mb-4" size={40} />
            <h3 className="text-lg font-semibold text-[#3D3530] mb-1">No requests here yet</h3>
            <p className="text-sm text-[#3D3530]/60 leading-relaxed mb-6">
              Be the first to step forward and light a digital candle of prayer for {selectedCategory.toLowerCase()}.
            </p>
            <button
              onClick={() => onNavigate('/submit')}
              className="px-5 py-2.5 bg-[#D4537E] text-white text-xs font-semibold rounded-full uppercase tracking-wider shadow-sm hover:bg-[#C2436D]"
            >
              Share your request
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8" id="cards-grid">
              {displayedPrayers.map((prayer) => {
                const ActivePrayerCard: any = PrayerCard;
                return (
                  <ActivePrayerCard
                    key={prayer.id}
                    prayer={prayer}
                    onNavigate={onNavigate}
                    onHeartUpdated={handleHeartUpdated}
                  />
                );
              })}
            </div>

            {/* Load More Trigger */}
            {prayers.length > visibleCount && (
              <div className="text-center pt-4" id="feed-load-more">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-[#F0EBE1] hover:bg-[#E4DBCB] text-[#B8976A] hover:text-[#3D3530] rounded-full text-sm font-semibold border border-[#C4A882]/30 transition-all duration-300 shadow-3xs cursor-pointer inline-flex items-center gap-1.5 font-nunito"
                >
                  View more prayers <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ━━━ FLOATING SHARE BUTTON FOR MOBILE ━━━ */}
      <button
        id="floating-submit-button"
        onClick={() => onNavigate('/submit')}
        className="md:hidden fixed bottom-6 right-6 p-4 bg-[#D4537E] hover:bg-[#C2436D] text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 z-50 flex items-center justify-center cursor-pointer group"
        title="Share your prayer"
      >
        <span className="sr-only">Share prayer</span>
        {/* Soft custom lit candle markup in svg inside float */}
        <div className="w-5 h-5 flex flex-col items-center justify-end bg-transparent relative">
          <div className="w-1.5 h-2.5 bg-amber-200 rounded-full blur-[0.2px] animate-pulse mb-0.5 group-hover:scale-110" />
          <div className="w-3 h-4 bg-white/94 border border-[#FAF8F5]/30 rounded-t-[1px]" />
        </div>
      </button>
    </div>
  );
}
