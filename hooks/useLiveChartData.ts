'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface LiveChartPoint {
  time: string;
  label: string;
  close: number;
  volume: number;
}

export interface LiveQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChangePercent?: number;
}

interface LiveApiResponse {
  success: boolean;
  data?: LiveChartPoint[];
  quote?: LiveQuote;
  updatedAt?: string;
  volumeSource?: 'native' | 'proxy' | 'range';
  volumeNote?: string;
  error?: string;
}

interface UseLiveChartDataOptions {
  symbol: string;
  enabled?: boolean;
  intervalMs?: number;
  maxPoints?: number;
}

export function useLiveChartData({
  symbol,
  enabled = true,
  intervalMs = 3000,
  maxPoints = 78,
}: UseLiveChartDataOptions) {
  const [points, setPoints] = useState<LiveChartPoint[]>([]);
  const [quote, setQuote] = useState<LiveQuote | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [volumeNote, setVolumeNote] = useState<string | undefined>();
  const mountedRef = useRef(true);

  const fetchLive = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(
        `/api/market?type=live&symbol=${encodeURIComponent(symbol)}`,
        { cache: 'no-store' }
      );
      const json: LiveApiResponse = await res.json();
      if (!mountedRef.current || !json.success) return;

      const trimmed = (json.data || []).slice(-maxPoints);
      setPoints(trimmed);
      if (json.quote) setQuote(json.quote);
      setVolumeNote(json.volumeNote);
      setLastUpdated(json.updatedAt ? new Date(json.updatedAt) : new Date());
      setTick((t) => t + 1);
    } catch (e) {
      console.error('Live chart fetch failed:', e);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [symbol, maxPoints]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !symbol) return;
    setIsLoading(true);
    fetchLive();
    const id = setInterval(fetchLive, intervalMs);
    return () => clearInterval(id);
  }, [enabled, symbol, intervalMs, fetchLive]);

  return { points, quote, lastUpdated, isLoading, tick, volumeNote, refresh: fetchLive };
}