import React, { useId } from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className }) => {
  const uid = useId().replace(/:/g, '');
  const top = `cap-top-${uid}`;
  const edge = `cap-edge-${uid}`;
  const base = `cap-base-${uid}`;
  const gold = `cap-gold-${uid}`;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={top} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#aecbfa" />
          <stop offset="45%" stopColor="#4285f4" />
          <stop offset="100%" stopColor="#174ea6" />
        </linearGradient>
        <linearGradient id={edge} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1967d2" />
          <stop offset="100%" stopColor="#0d3a85" />
        </linearGradient>
        <linearGradient id={base} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285f4" />
          <stop offset="100%" stopColor="#0b2f6e" />
        </linearGradient>
        <linearGradient id={gold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde293" />
          <stop offset="100%" stopColor="#e37400" />
        </linearGradient>
      </defs>

      <path d="M32 4 A28 28 0 0 1 60 32" fill="none" stroke="#4285f4" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M60 32 A28 28 0 0 1 32 60" fill="none" stroke="#34a853" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 60 A28 28 0 0 1 4 32" fill="none" stroke="#fbbc04" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M4 32 A28 28 0 0 1 32 4" fill="none" stroke="#ea4335" strokeWidth="3.5" strokeLinecap="round" />

      <g transform="translate(12.2 16.3) scale(0.62)">
        <path d="M15 28 V41 Q32 51 49 41 V28 L32 36 Z" fill={`url(#${base})`} />
        <path d="M4 22 L32 35 L60 22 V25.5 L32 38.5 L4 25.5 Z" fill={`url(#${edge})`} />
        <path d="M32 9 L60 22 L32 35 L4 22 Z" fill={`url(#${top})`} />
        <path d="M12 21 L32 11.5 L41 15.7 L21 25.2 Z" fill="#ffffff" opacity="0.28" />

        <path d="M32 22 L53 25 V40" fill="none" stroke={`url(#${gold})`} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="32" cy="22" r="2.2" fill={`url(#${gold})`} />
        <path d="M51 39.5 H55 L56.5 48 Q53 50 49.5 48 Z" fill={`url(#${gold})`} />

        <path
          d="M45 4 Q45.8 9.2 51 10 Q45.8 10.8 45 16 Q44.2 10.8 39 10 Q44.2 9.2 45 4 Z"
          fill="#ffffff"
          stroke="#8ab4f8"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
