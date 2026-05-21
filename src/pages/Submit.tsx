import React from 'react';
import PrayerForm from '../components/PrayerForm.js';
import { ArrowLeft } from 'lucide-react';

interface SubmitProps {
  onNavigate: (path: string) => void;
  token?: string | null;
}

export default function Submit({ onNavigate, token }: SubmitProps) {
  return (
    <div className="w-full min-h-screen pb-24" id="submit-view-container">
      {/* ━━━ PEACEFUL HEADER ━━━ */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#C4A882]/15" id="site-header-submit">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            id="back-to-feed-link"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#B8976A] hover:text-[#3D3530] transition-colors duration-300 cursor-pointer font-nunito"
          >
            <ArrowLeft size={16} /> Back to feed
          </button>
          
          <div className="flex items-center gap-1.5 select-none cursor-pointer" onClick={() => onNavigate('/')} id="header-logo-group">
            <span className="font-nunito font-semibold tracking-wider text-lg text-[#3D3530]">
              PrayWith.me
            </span>
          </div>
        </div>
      </header>

      {/* ━━━ CENTRED EXPLAINER ━━━ */}
      <main className="max-w-5xl mx-auto px-4 py-12" id="submit-form-main">
        <div className="text-center mb-10 max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-nunito font-semibold text-[#3D3530] tracking-tight mb-2">
            Share Your Request
          </h1>
          <p className="text-xs md:text-sm text-[#3D3530]/60 font-nunito leading-relaxed">
            Your prayer request is completely anonymous. IP hashes are compiled unidirectionally to protect your safety and avoid tracking. Speak freely.
          </p>
        </div>

        {/* Dynamic Prayer Posting Form Widget */}
        <PrayerForm 
          onSuccess={() => {
            console.log('Success state shown');
          }} 
          onNavigate={onNavigate} 
          token={token}
        />
      </main>
    </div>
  );
}
