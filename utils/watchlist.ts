// Watchlist utility for managing player favorites in localStorage

const WATCHLIST_KEY = 'cfb-transfer-portal-watchlist';

export function getWatchlist(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading watchlist:', error);
    return [];
  }
}

export function addToWatchlist(playerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const watchlist = getWatchlist();
    if (!watchlist.includes(playerId)) {
      watchlist.push(playerId);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
  }
}

export function removeFromWatchlist(playerId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(id => id !== playerId);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from watchlist:', error);
  }
}
