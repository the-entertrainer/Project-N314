'use client';

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import SitePreloader from './SitePreloader';

interface AppRootProps {
  children: ReactNode;
}

export default function AppRoot({ children }: AppRootProps) {
  const pathname = usePathname();
  const isFirstVisit = useRef(true);
  const [visitKey, setVisitKey] = useState(() => `${pathname}-${Date.now()}`);
  const [showPreloader, setShowPreloader] = useState(true);

  useEffect(() => {
    if (isFirstVisit.current) {
      isFirstVisit.current = false;
      return;
    }
    setVisitKey(`${pathname}-${Date.now()}`);
    setShowPreloader(true);
  }, [pathname]);

  const handleComplete = useCallback(() => {
    setShowPreloader(false);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showPreloader && (
          <SitePreloader key={visitKey} onComplete={handleComplete} />
        )}
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