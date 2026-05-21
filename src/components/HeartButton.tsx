import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

interface HeartButtonProps {
  prayerId: string;
  initialCounts: number;
  onHeartAdded?: (newCount: number) => void;
}

export default function HeartButton({ prayerId, initialCounts, onHeartAdded }: HeartButtonProps) {
  const [hearts, setHearts] = useState(initialCounts);
  const [hasHearted, setHasHearted] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Sync initial hearts when props update
  useEffect(() => {
    setHearts(initialCounts);
  }, [initialCounts]);

  // Read local storage to see if this prayer was already hearted in this browser session
  useEffect(() => {
    try {
      const heartedList = JSON.parse(localStorage.getItem('pw_hearted_prayers') || '[]');
      if (heartedList.includes(prayerId)) {
        setHasHearted(true);
      }
    } catch (e) {
      console.error('Error reading localStorage for hearts:', e);
    }
  }, [prayerId]);

  const handleHeartClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasHearted || isLiking) return;

    setIsLiking(true);
    setAnimate(true);

    try {
      const response = await fetch('/api/hearts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prayerId }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        const nextHearts = resData.heart_count;
        setHearts(nextHearts);
        setHasHearted(true);

        // Record the hearted status locally in the browser
        const heartedList = JSON.parse(localStorage.getItem('pw_hearted_prayers') || '[]');
        if (!heartedList.includes(prayerId)) {
          heartedList.push(prayerId);
          localStorage.setItem('pw_hearted_prayers', JSON.stringify(heartedList));
        }

        if (onHeartAdded) {
          onHeartAdded(nextHearts);
        }
      } else {
        // Display fallback in UI or show rate error
        console.warn(resData.error || 'Failed to increment heart');
      }
    } catch (error) {
      console.error('Error liking prayer:', error);
    } finally {
      setIsLiking(false);
      // Wait for pulse animation to finish before resetting animation trigger
      setTimeout(() => setAnimate(false), 600);
    }
  };

  return (
    <button
      id={`heart-btn-${prayerId}`}
      onClick={handleHeartClick}
      disabled={hasHearted || isLiking}
      className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 touch-manipulation group select-none font-nunito text-sm font-semibold
        ${hasHearted 
          ? 'bg-[#D4537E]/10 text-[#D4537E]' 
          : 'bg-[#F0EBE1] text-[#3D3530]/70 hover:bg-[#D4537E]/5 hover:text-[#D4537E]'
        }
      `}
    >
      <motion.div
        animate={animate ? { scale: [1, 1.4, 0.9, 1.1, 1] } : {}}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="flex items-center justify-center"
      >
        <Heart
          size={16}
          id={`heart-icon-${prayerId}`}
          className={`transition-all duration-300 
            ${hasHearted 
              ? 'fill-[#D4537E] text-[#D4537E]' 
              : 'text-[#C4A882] group-hover:text-[#D4537E]'
            }
          `}
        />
      </motion.div>
      <span className="tabular-nums" id={`heart-count-${prayerId}`}>
        {hearts} {hearts === 1 ? 'praying' : 'prayed'}
      </span>
    </button>
  );
}
