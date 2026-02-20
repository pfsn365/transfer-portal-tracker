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

const LIVE_INTERVAL = 30000; // 30 seconds when games are live
const IDLE_INTERVAL = 300000; // 5 minutes when no live games

function hasLiveGames(): boolean {
  return globalState.games.some(g => g.isLive);
}

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

  // Adjust polling interval based on live game status
  if (subscriberCount > 0) {
    const desiredInterval = hasLiveGames() ? LIVE_INTERVAL : IDLE_INTERVAL;
    if (fetchInterval) clearInterval(fetchInterval);
    fetchInterval = setInterval(fetchLiveScores, desiredInterval);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  subscriberCount++;

  // Start fetching if this is the first subscriber
  if (subscriberCount === 1) {
    fetchLiveScores();
    fetchInterval = setInterval(fetchLiveScores, IDLE_INTERVAL);
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
