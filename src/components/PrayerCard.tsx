import React from 'react';
import { Prayer } from '../types.js';
import HeartButton from './HeartButton.js';
import GradientFallback from './GradientFallback.js';

interface PrayerCardProps {
  prayer: Prayer;
  onNavigate: (path: string) => void;
  onHeartUpdated?: (prayerId: string, nextCount: number) => void;
}

/**
 * Utility to generate relative time strings
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (diffMs < 0) return 'Just now'; // safety edge case
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PrayerCard({ prayer, onNavigate, onHeartUpdated }: PrayerCardProps) {
  const { id, text, category, image_url, heart_count, created_at } = prayer;

  const handleCardClick = () => {
    onNavigate(`/prayer/${id}`);
  };

  return (
    <div
      id={`prayer-card-${id}`}
      onClick={handleCardClick}
      className="bg-[#F0EBE1] hover:bg-[#EAE2D4] border border-[#C4A882]/20 hover:border-[#C4A882]/50 hover:shadow-md rounded-[20px] p-6 md:p-8 flex flex-col justify-between transition-all duration-300 relative cursor-pointer group group/card content-box h-full select-none"
    >
      {/* Visual Header: Category & Time */}
      <div className="flex justify-between items-center mb-6 w-full" id={`card-header-${id}`}>
        <span 
          id={`card-category-${id}`}
          className="px-3 py-1 bg-[#B8976A]/10 text-[#B8976A] rounded-full text-xs font-semibold tracking-wider font-nunito"
        >
          {category}
        </span>
        <span 
          id={`card-time-${id}`}
          className="text-xs text-[#3D3530]/60 font-medium font-nunito"
        >
          {formatRelativeTime(created_at)}
        </span>
      </div>

      {/* Main Prayer Text (Cormorant Garamond italic, large) */}
      <div className="flex-grow mb-6 w-full" id={`card-body-${id}`}>
        <p 
          id={`card-text-${id}`}
          className="font-cormorant italic text-xl md:text-2xl text-[#3D3530] leading-relaxed tracking-wide text-left"
        >
          “ {text} ”
        </p>
      </div>

      {/* Card Visual Background Panel (if image is uploaded) */}
      {image_url ? (
        <div className="w-full h-40 mb-6 overflow-hidden rounded-[14px] relative" id={`card-img-container-${id}`}>
          <img
            id={`card-img-${id}`}
            src={image_url}
            alt="Prayer visual background"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      ) : (
        // Subtle design layout indicator if no image is present - nice soft background accent
        <div className="w-full h-1.5 mb-6 overflow-hidden rounded-full self-start relative" id={`card-gradient-indicator-${id}`}>
          <GradientFallback seed={id || text} className="w-full h-full" />
        </div>
      )}

      {/* Card Footer: Action Center */}
      <div className="flex justify-between items-center mt-auto w-full pt-2" id={`card-footer-${id}`} onClick={(e) => e.stopPropagation()}>
        <HeartButton
          prayerId={id}
          initialCounts={heart_count}
          onHeartAdded={(newCount) => {
            if (onHeartUpdated) {
              onHeartUpdated(id, newCount);
            }
          }}
        />
        <button
          onClick={handleCardClick}
          className="text-xs text-[#C4A882] hover:text-[#3D3530] font-bold group-hover/card:translate-x-1 transition-all duration-300 font-nunito"
        >
          Pray with them →
        </button>
      </div>
    </div>
  );
}
