import React from 'react';

interface ScoutyonGlyphProps {
  className?: string;
  active?: boolean;
}

export const ScoutyonGlyph: React.FC<ScoutyonGlyphProps> = ({ className = '', active = false }) => {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Scoutyon protocol icon"
    >
      <defs>
        <radialGradient id="scoutyon-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F6F6F5" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#D9D9D6" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#737373" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      <g
        className={active ? 'scoutyon-glyph active' : 'scoutyon-glyph'}
        style={{ transformOrigin: '50% 50%' }}
      >
        <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="24" fill="url(#scoutyon-core)" opacity={0.85} />

        <path d="M60 18 L60 102 M18 60 L102 60 M32 32 L88 88 M88 32 L32 88" fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="0.8" strokeDasharray="2 8" />

        <g fill="rgba(255,255,255,0.7)">
          <circle cx="60" cy="18" r="2.6" />
          <circle cx="102" cy="60" r="2.6" />
          <circle cx="60" cy="102" r="2.6" />
          <circle cx="18" cy="60" r="2.6" />
          <circle cx="88" cy="32" r="2.2" />
          <circle cx="88" cy="88" r="2.2" />
          <circle cx="32" cy="88" r="2.2" />
          <circle cx="32" cy="32" r="2.2" />
        </g>
      </g>
    </svg>
  );
};
