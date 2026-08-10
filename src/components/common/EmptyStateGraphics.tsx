import React from 'react';

export const DocumentMagnifierGraphic: React.FC<{ className?: string }> = ({
  className = 'w-24 h-24'
}) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="28" y="18" width="48" height="64" rx="4" fill="#0C2A43" />
    <rect x="32" y="24" width="40" height="52" rx="2" fill="#F8FAFC" />
    <path d="M40 38h24M40 48h20M40 58h16" stroke="#0C2A43" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="72" cy="72" r="18" fill="#0C2A43" />
    <circle cx="72" cy="72" r="12" fill="none" stroke="#F8FAFC" strokeWidth="3.5" />
    <path d="M84 84 L98 100" stroke="#0C2A43" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

export const HandBuildingBlocksGraphic: React.FC<{ className?: string }> = ({
  className = 'w-24 h-24'
}) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="34" y="72" width="22" height="18" rx="2" fill="#0C2A43" />
    <rect x="60" y="72" width="22" height="18" rx="2" fill="#0C2A43" />
    <rect x="47" y="50" width="22" height="18" rx="2" fill="#0C2A43" />
    <path
      d="M22 48 C28 34 40 28 54 28 C58 28 64 32 64 38 C64 44 58 48 52 48 L44 48"
      stroke="#0C2A43"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export const CalendarClocksGraphic: React.FC<{ className?: string }> = ({
  className = 'w-28 h-28'
}) => (
  <svg viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="28" y="28" width="70" height="58" rx="6" fill="#0C2A43" />
    <rect x="34" y="40" width="58" height="40" rx="2" fill="#F8FAFC" />
    <path d="M42 22v12M84 22v12" stroke="#0C2A43" strokeWidth="5" strokeLinecap="round" />
    <circle cx="90" cy="78" r="18" fill="#0C2A43" />
    <circle cx="90" cy="78" r="12" fill="#F8FAFC" />
    <path d="M90 72v8l5 3" stroke="#0C2A43" strokeWidth="2" strokeLinecap="round" />
    <circle cx="52" cy="88" r="14" fill="#0C2A43" />
    <circle cx="52" cy="88" r="9" fill="#F8FAFC" />
    <path d="M52 84v5l3 2" stroke="#0C2A43" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="112" cy="52" r="12" fill="#0C2A43" />
    <circle cx="112" cy="52" r="7.5" fill="#F8FAFC" />
    <path d="M112 48v5l3 2" stroke="#0C2A43" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
