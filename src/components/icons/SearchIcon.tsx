import React from 'react';

interface Props { className?: string }

export const SearchIcon: React.FC<Props> = ({ className = 'h-6 w-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
