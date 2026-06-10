'use client';

import { ReactNode, useCallback, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SitePreloader from './SitePreloader';

interface AppRootProps {
  children: ReactNode;
}

export default function AppRoot({ children }: AppRootProps) {
  const [showPreloader, setShowPreloader] = useState(true);

  const handleComplete = useCallback(() => {
    setShowPreloader(false);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showPreloader && <SitePreloader onComplete={handleComplete} />}
      </AnimatePresence>
      <div
        className={`h-full w-full transition-opacity duration-500 ${
          showPreloader ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {children}
      </div>
    </>
  );
}