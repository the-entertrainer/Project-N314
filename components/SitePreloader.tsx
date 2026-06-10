'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThreeDOrb from './ThreeDOrb';
import { getRandomQuote, type PreloaderQuote } from '../lib/preloaderQuotes';

interface SitePreloaderProps {
  onComplete: () => void;
  durationMs?: number;
}

export default function SitePreloader({ onComplete, durationMs = 2200 }: SitePreloaderProps) {
  const [quote] = useState<PreloaderQuote>(() => getRandomQuote());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (elapsed < durationMs) {
        frame = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="preloader-aurora pointer-events-none" />
      <div className="preloader-grid pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 max-w-md w-full">
        <div className="relative mb-6">
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -inset-3 rounded-full border border-emerald-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -inset-6 rounded-full border border-dashed border-emerald-500/10"
            animate={{ rotate: -360 }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative flex justify-center"
          >
            <ThreeDOrb size="lg" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center"
        >
          <div className="text-4xl sm:text-5xl font-semibold tracking-tight preloader-shimmer">N314</div>
          <div className="text-emerald-400 text-[10px] tracking-[0.25em] mt-2 uppercase">Stock Intelligence</div>
        </motion.div>

        <motion.blockquote
          key={quote.text}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
          className="mt-8 text-center"
        >
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed italic">
            &ldquo;{quote.text}&rdquo;
          </p>
          <footer className="mt-3 text-[11px] text-zinc-500 tracking-wide">— {quote.author}</footer>
        </motion.blockquote>

        <div className="mt-8 w-full max-w-[220px]">
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 preloader-bar-glow"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 text-[10px] text-zinc-600 text-center tabular-nums">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}