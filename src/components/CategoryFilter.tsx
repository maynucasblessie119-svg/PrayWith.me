import React from 'react';
import { PrayerCategory } from '../types.js';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const categories = ['All', 'Healing', 'Family', 'Peace', 'Gratitude', 'Protection', 'Other'];

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none" id="category-filter-container">
      <div className="flex space-x-2 md:justify-center px-4" id="category-pills-row">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`filter-pill-${cat.toLowerCase()}`}
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 whitespace-nowrap cursor-pointer touch-manipulation hover:scale-102
                ${isActive 
                  ? 'bg-[#B8976A] text-white shadow-xs border border-[#B8976A]' 
                  : 'bg-[#F0EBE1] text-[#3D3530] hover:bg-[#E2D9CB] border border-[#CBD5E1]/10'
                }
              `}
              style={{ fontFamily: 'var(--font-nunito)' }}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
