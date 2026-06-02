import React from 'react';

interface Props { className?: string }

export const TelegramIcon: React.FC<Props> = ({ className = 'h-6 w-6' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.31 13.67l-2.98-.924c-.647-.204-.66-.647.136-.958l11.645-4.49c.537-.194 1.007.131.783.923z" />
  </svg>
);
