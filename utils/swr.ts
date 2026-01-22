// SWR fetcher and configuration utilities

// Default fetcher for SWR - handles JSON responses
export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }

  return res.json();
};

// SWR configuration options for different use cases
export const swrConfig = {
  // Default config - cache for 5 minutes, revalidate on focus
  default: {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // Dedupe requests within 1 minute
  },

  // For data that changes infrequently (standings, schedules)
  stable: {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    dedupingInterval: 300000, // 5 minutes
  },

  // For data that should always be fresh
  fresh: {
    revalidateOnFocus: true,
    refreshInterval: 60000, // Refresh every minute
  },
};
