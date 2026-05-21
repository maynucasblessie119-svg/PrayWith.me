import React from 'react';

interface GradientFallbackProps {
  seed: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Generates an elegant, warm soft gradient (beige-to-gold/warm-tan)
 * derived deterministically from a text seed.
 */
export default function GradientFallback({ seed, className = '', children }: GradientFallbackProps) {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) {
    sum += seed.charCodeAt(i);
  }

  // Curated list of spiritually warm pastel/beige soft gradients
  const gradients = [
    'from-[#FAF8F5] via-[#F4EFE6] to-[#ECE3D4]',
    'from-[#F3EDE2] via-[#E8DEC9] to-[#DFD0B8]',
    'from-[#FAF8F5] via-[#EFE8DC] to-[#E5D5C0]',
    'from-[#ECE3D4] via-[#E5D9C4] to-[#DCCEB5]',
    'from-[#FDFBF7] via-[#FAF6EE] to-[#EFEAE0]',
    'from-[#FAF8F5] via-[#F0EBE1] to-[#E6DCBF]'
  ];

  const selectedGradient = gradients[sum % gradients.length];

  return (
    <div className={`bg-gradient-to-br ${selectedGradient} text-[#3D3530] transition-all duration-300 relative overflow-hidden ${className}`}>
      {/* Subtle organic light flare in top-right */}
      <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-radial from-white/30 to-transparent pointer-events-none rounded-full" />
      {children}
    </div>
  );
}
