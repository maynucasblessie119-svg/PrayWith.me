import React, { useState } from 'react';
import { PrayerCategory } from '../types.js';
import ImageUpload from './ImageUpload.js';
import GradientFallback from './GradientFallback.js';
import { Sparkles, Calendar, Heart } from 'lucide-react';

interface PrayerFormProps {
  onSuccess: () => void;
  onNavigate: (path: string) => void;
  token?: string | null;
}

export default function PrayerForm({ onSuccess, onNavigate, token }: PrayerFormProps) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('Healing');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const categories: PrayerCategory[] = ['Healing', 'Family', 'Peace', 'Gratitude', 'Protection', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Guard rails
    if (text.trim().length === 0) {
      setFormError('Please speak your heart. Prayer text cannot be empty.');
      return;
    }
    if (text.length > 280) {
      setFormError('Prayers must be kept short and peaceful (under 280 characters).');
      return;
    }

    setIsSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/prayers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: text.trim(),
          category,
          image_url: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setFormError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Error sharing prayer request:', err);
      setFormError('Could not connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div 
        id="success-confirmation" 
        className="max-w-md mx-auto text-center px-6 py-12 bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[20px] transition-all duration-500 flex flex-col items-center"
      >
        {/* Animated Candle Icon */}
        <div className="relative w-24 h-24 mb-6 flex flex-col items-center justify-end" id="success-candle-container">
          {/* Flame */}
          <div className="absolute top-4 w-4 h-7 bg-amber-400 hover:bg-amber-300 rounded-full blur-[1px] animate-pulse origin-bottom animate-bounce shadow-xl" style={{ animationDuration: '2s' }}>
            <div className="w-1.5 h-3 bg-red-500 rounded-full mx-auto mt-2 opacity-80" />
          </div>
          {/* Flame Halo Glow */}
          <div className="absolute top-2 w-10 h-10 bg-amber-300/30 rounded-full blur-md animate-pulse" />
          {/* Wick */}
          <div className="w-0.5 h-3 bg-amber-950/80 mb-0.5" />
          {/* Candle Body */}
          <div className="w-8 h-12 bg-[#FAF8F5] border border-[#C4A882]/30 rounded-t-sm shadow-inner relative flex flex-col justify-start">
            {/* Wax drip */}
            <div className="absolute top-0 left-2 w-1.5 h-3 bg-neutral-100 rounded-b-full opacity-90" />
            <div className="absolute top-0 right-1.5 w-1 h-5 bg-neutral-100 rounded-b-full opacity-75" />
          </div>
          {/* Golden base holder */}
          <div className="w-16 h-1.5 bg-[#B8976A] rounded-full shadow-md" />
        </div>

        <h3 className="text-2xl font-nunito font-semibold text-[#3D3530] mb-4" id="success-heading">
          Your prayer has been shared
        </h3>
        
        <p className="text-sm md:text-base text-[#3D3530]/80 font-nunito leading-relaxed mb-8 max-w-xs" id="success-paragraph">
          Someone may be standing with you and praying for you right now. Remain in peace.
        </p>

        <button
          id="confirm-return-button"
          onClick={() => onNavigate('/')}
          className="w-full py-3.5 bg-[#D4537E] hover:bg-[#C2436D] text-white font-semibold rounded-full shadow-lg transition-all duration-300 transform active:scale-98 cursor-pointer font-nunito uppercase tracking-wider text-xs"
        >
          Return to feed
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start p-4" id="prayer-form-grid">
      
      {/* LEFT COLUMN: Input Form Controls */}
      <div className="lg:col-span-7 bg-[#F0EBE1] border border-[#C4A882]/20 rounded-[20px] p-6 md:p-8" id="prayer-form-card">
        <h2 className="text-xl md:text-2xl font-nunito font-semibold text-[#3D3530] mb-6 flex items-center gap-2">
          <Sparkles size={18} className="text-[#B8976A]" /> Write Your Prayer Request
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6" id="write-prayer-form">
          
          {/* Text Area Input */}
          <div className="flex flex-col gap-1 w-full" id="form-group-text">
            <label htmlFor="prayer-textarea" className="text-xs font-semibold uppercase tracking-wider text-[#3D3530]/75 mb-1 flex justify-between">
              <span>Your prayer request</span>
              <span className={`text-[11px] font-mono tracking-normal lower ${text.length > 280 ? 'text-[#D4537E]' : 'text-[#3D3530]/50'}`}>
                {text.length} / 280
              </span>
            </label>
            <textarea
              id="prayer-textarea"
              rows={4}
              placeholder="What would you like prayer for? Speak your heart anonymously..."
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 280) {
                  setText(e.target.value);
                }
              }}
              required
              className="w-full p-4 rounded-[14px] bg-[#FAF8F5] border border-[#C4A882]/30 text-[#3D3530] placeholder-[#3D3530]/40 outline-none focus:border-[#B8976A] focus:ring-1 focus:ring-[#B8976A] transition-all duration-300 text-sm font-sans resize-none leading-relaxed"
            />
          </div>

          {/* Category Selector Pills */}
          <div className="flex flex-col gap-1.5 w-full" id="form-group-category">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#3D3530]/75 mb-1.5">
              Select category
            </label>
            <div className="flex flex-wrap gap-2" id="form-category-pills">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    id={`form-pill-${cat.toLowerCase()}`}
                    onClick={() => setCategory(cat)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer touch-manipulation
                      ${isSelected
                        ? 'bg-[#B8976A] text-white border border-[#B8976A] shadow-xs'
                        : 'bg-[#FAF8F5] text-[#3D3530]/80 hover:bg-[#FAF8F5]/80 border border-[#C4A882]/20'
                      }
                    `}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Picture Upload Component */}
          <div className="flex flex-col gap-1 w-full" id="form-group-upload">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#3D3530]/75 mb-1.5">
              Add a background image (optional)
            </label>
            <ImageUpload onImageSelected={(base64) => setImageUrl(base64)} />
          </div>

          {/* Error Message */}
          {formError && (
            <div className="p-3.5 rounded-[10px] bg-[#D4537E]/10 border border-[#D4537E]/30 text-[#D4537E] text-xs font-medium" id="form-submission-error">
              {formError}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            id="share-prayer-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-[#D4537E] disabled:bg-[#D4537E]/50 text-white font-semibold rounded-full shadow-md transition-all duration-300 hover:bg-[#C2436D] transform active:scale-99 flex justify-center items-center gap-2 cursor-pointer font-nunito uppercase tracking-wider text-xs"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Lighting your candle...
              </span>
            ) : (
              'Share your prayer'
            )}
          </button>
        </form>
      </div>

      {/* RIGHT COLUMN: Live Interactive Realistic Card Preview */}
      <div className="lg:col-span-5 sticky top-24" id="prayer-live-preview-box">
        <div className="text-center mb-3">
          <span className="text-[11px] font-semibold text-[#B8976A] uppercase tracking-widest font-nunito">
            Live Card Preview
          </span>
        </div>

        {/* The Card Component Simulator */}
        <div
          id="mockup-card-body"
          className="bg-gradient-to-b from-[#F0EBE1] to-[#EAE0D5] border border-[#C4A882]/40 rounded-[20px] p-6 md:p-8 shadow-lg max-w-sm mx-auto flex flex-col justify-between transition-all duration-300 h-96 relative"
        >
          {/* Preview Background Color Layer */}
          {!imageUrl && (
            <GradientFallback seed={text || 'Preview'} className="absolute inset-0 rounded-[20px] opacity-10" />
          )}

          <div className="relative z-10 flex flex-col justify-between h-full w-full">
            {/* Header */}
            <div className="flex justify-between items-center w-full">
              <span className="px-3 py-1 bg-[#B8976A]/20 text-[#B8976A] rounded-full text-[10px] font-bold tracking-wider uppercase">
                {category}
              </span>
              <span className="text-[10px] text-[#3D3530]/50 font-medium flex items-center gap-1 font-mono">
                <Calendar size={10} /> Just now
              </span>
            </div>

            {/* Inner text preview */}
            <div className="my-auto py-4">
              <p className="font-cormorant italic text-[#3D3530] text-xl md:text-2xl leading-relaxed tracking-wide text-center">
                {text.trim().length > 0 ? `“ ${text} ”` : "“ What would you like prayer for? ”"}
              </p>
            </div>

            {/* If uploaded image, show miniature banner */}
            {imageUrl && (
              <div className="w-full h-24 mb-4 overflow-hidden rounded-[10px] relative">
                <img
                  src={imageUrl}
                  alt="Live upload mockup"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Heart count and fake like control */}
            <div className="flex justify-between items-center w-full pt-2">
              <span className="flex items-center gap-1 bg-[#FAF8F5]/80 px-2.5 py-1 rounded-full text-xs font-semibold text-[#3D3530]/60 font-mono">
                <Heart size={12} className="text-[#C4A882]" /> 0 prayed
              </span>
              <span className="text-[11px] text-[#C4A882] font-semibold italic">
                pw.me/preview
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
