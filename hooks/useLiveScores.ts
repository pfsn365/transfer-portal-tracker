'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiPath } from '@/utils/api';
import type { TickerGame } from '@/lib/espn';

interface LiveScoresState {
  games: TickerGame[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Singleton state shared across all hook instances
let globalState: LiveScoresState = {
  games: [],
  loading: true,
  error: null,
  lastUpdated: null,
};

let listeners: Set<() => void> = new Set();
let fetchInterval: NodeJS.Timeout | null = null;
let subscriberCount = 0;

const REFRESH_INTERVAL = 30000; // 30 seconds

async function fetchLiveScores() {
  try {
    const response = await fetch(getApiPath('api/cfb/espn-scoreboard?ticker=true'));
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();

    globalState = {
      games: data.games || [],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error fetching live scores:', error);
    globalState = {
      ...globalState,
      loading: false,
      error: 'Failed to load scores',
    };
  }

  // Notify all subscribers
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount++;

  // Start fetching if this is the first subscriber
  if (subscriberCount === 1) {
    fetchLiveScores();
    fetchInterval = setInterval(fetchLiveScores, REFRESH_INTERVAL);
  }

  return () => {
    listeners.delete(listener);
    subscriberCount--;

    // Stop fetching if no more subscribers
    if (subscriberCount === 0 && fetchInterval) {
      clearInterval(fetchInterval);
      fetchInterval = null;
    }
  };
}

export function useLiveScores() {
  const [state, setState] = useState<LiveScoresState>(globalState);

  useEffect(() => {
    // Update local state when global state changes
    const handleUpdate = () => {
      setState({ ...globalState });
    };

    const unsubscribe = subscribe(handleUpdate);

    // Sync with current global state on mount
    setState({ ...globalState });

    return unsubscribe;
  }, []);

  const refresh = useCallback(() => {
    fetchLiveScores();
  }, []);

  return {
    games: state.games,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    refresh,
  };
}
