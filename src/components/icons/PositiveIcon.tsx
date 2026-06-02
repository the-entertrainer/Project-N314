import React from 'react';

interface Props { className?: string }

export const PositiveIcon: React.FC<Props> = ({ className = 'h-6 w-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 13s1.5 3 4 3 4-3 4-3" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);
