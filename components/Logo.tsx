import React from 'react';

interface LogoProps {
  className?: string;
  opacity?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", opacity = 0.05 }) => {
  // Logo colors are fixed as per requirements (neutral, distinct from theme)
  // The requirement says "between #FFFFFF and #F7F7F7" which is extremely light/white.
  // To make it visible as a watermark on a white/off-white background, we use a very light grey/neutral palette
  // but keep the specific colored details (red spot) desaturated or subtle if needed, 
  // but the prompt implies the logo design itself has these colors ("white breast, black/white head with red spot").
  // However, it also says "Logo has a soft grey tint... and fits subtly". 
  // We will render the illustrative elements but keep the main opacity very low in usage.
  
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      style={{ opacity: opacity }} // Enforce subtle opacity
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Light Grey Circle Background */}
      <circle cx="100" cy="100" r="90" fill="#F3F4F6" />
      
      {/* Watercolor-style Tree Trunk */}
      <path d="M140 190 C 130 150, 150 100, 140 10" stroke="#E5E7EB" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d="M135 180 C 125 140, 145 90, 135 20" stroke="#D1D5DB" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.5" />
      
      {/* Woodpecker Body - Simplified Artistic Representation */}
      <g transform="translate(60, 60) scale(0.8)">
        {/* Dark Wings/Back */}
        <path d="M60 40 Q 90 40 80 100 L 70 120 L 50 100 Z" fill="#374151" />
        
        {/* White Breast */}
        <path d="M60 40 Q 30 50 40 90 L 50 100 Z" fill="#FFFFFF" />
        
        {/* Head Black/White */}
        <circle cx="60" cy="30" r="15" fill="#1F2937" />
        <path d="M60 30 L 75 30 L 70 45 Z" fill="#FFFFFF" />
        
        {/* Red Spot behind eye */}
        <circle cx="52" cy="25" r="4" fill="#EF4444" opacity="0.8" />
        
        {/* Beak */}
        <path d="M48 30 L 30 35 L 48 38 Z" fill="#9CA3AF" />
      </g>
    </svg>
  );
};

export default Logo;
