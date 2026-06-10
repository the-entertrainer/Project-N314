'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface LivePriceTickerProps {
  price?: number;
  className?: string;
}

export default function LivePriceTicker({ price, className = '' }: LivePriceTickerProps) {
  if (price == null) return <span className={className}>—</span>;

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={price}
        initial={{ opacity: 0.5, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className={className}
      >
        {price.toLocaleString('en-IN')}
      </motion.span>
    </AnimatePresence>
  );
}