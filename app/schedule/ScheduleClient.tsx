'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';
import { useLiveScores } from '@/hooks/useLiveScores';

interface GameLeader {
  name: string;
  displayValue: string;
  value: number;
  headshot?: string;
  position?: string;
  teamId?: string;
}

interface ScheduleGame {
  id: string;
  date: string;
  name: string;
  shortName: string;
  venue?: {
    name: string;
    city?: string;
    state?: string;
  };
  broadcasts?: string[];
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    score?: number;
    rank?: number;
    record?: string;
  };
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
    score?: number;
    rank?: number;
    record?: string;
  };
  status: {
    state: 'pre' | 'in' | 'post';
    detail: string;
    shortDetail: string;
    completed: boolean;
  };
  leaders?: {
    passing?: GameLeader;
    rushing?: GameLeader;
    receiving?: GameLeader;
  };
  note?: string;
}

// Get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get start and end of week for a given date (Sunday to Saturday)
const getWeekRange = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return {
    start: getLocalDateString(startDate),
    end: getLocalDateString(endDate),
    days: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      return getLocalDateString(d);
    })
  };
};

// Get all days in a month
const getMonthDays = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(getLocalDateString(new Date(d)));
  }
  return days;
};

// Format time for display
function formatGameTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get game date in YYYY-MM-DD format
function getGameDateKey(isoDate: string): string {
  const date = new Date(isoDate);
  return getLocalDateString(date);
}

// Shorten bowl name for compact display
function shortenBowlName(fullName: string): string {
  if (!fullName) return '';

  // Remove "Presented by X" and similar sponsor suffixes
  let name = fullName
    .replace(/\s+Presented by\s+.+$/i, '')
    .replace(/\s+Sponsored by\s+.+$/i, '')
    .replace(/\s+Powered by\s+.+$/i, '');

  // Handle CFP games - extract the bowl name
  // e.g., "College Football Playoff Quarterfinal at the Rose Bowl" → "Rose Bowl"
  const cfpMatch = name.match(/College Football Playoff\s+\w+\s+at the\s+(.+)$/i);
  if (cfpMatch) {
    return cfpMatch[1]; // Return just the bowl name (e.g., "Rose Bowl")
  }

  // Handle "College Football Playoff National Championship"
  if (name.toLowerCase().includes('national championship')) {
    return 'CFP Championship';
  }

  // Handle "College Football Playoff First Round"
  if (name.toLowerCase().includes('college football playoff first round')) {
    return 'CFP First Round';
  }

  // For regular bowls, just return the cleaned name
  return name;
}

// FBS Conferences
const FBS_CONFERENCES = [
  'All Games',
  'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12',
  'American', 'Mountain West', 'Conference USA', 'MAC', 'Sun Belt',
];

// FCS Conferences
const FCS_CONFERENCES = [
  'All Games',
  'Big Sky', 'Big South-OVC', 'CAA', 'Ivy', 'MEAC',
  'Missouri Valley', 'Northeast', 'Patriot', 'Pioneer', 'SoCon',
  'Southland', 'SWAC', 'United',
];

type ViewMode = 'daily' | 'weekly' | 'monthly';

function ScheduleClientInner() {
  const searchParams = useSearchParams();

  // Initialize state from URL parameters
  const urlView = searchParams.get('view') as ViewMode | null;
  const urlDate = searchParams.get('date');

  const [viewMode, setViewMode] = useState<ViewMode>(
    urlView && ['daily', 'weekly', 'monthly'].includes(urlView) ? urlView : 'monthly'
  );
  const [selectedDate, setSelectedDate] = useState<string>(urlDate || getLocalDateString());
  const [allGamesCache, setAllGamesCache] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [division, setDivision] = useState<'fbs' | 'fcs'>('fbs');
  const [selectedConference, setSelectedConference] = useState('All Games');
  const [teamSearch, setTeamSearch] = useState('');
  const [expandedGame, setExpandedGame] = useState<string | null>(null);

  const currentConferences = division === 'fbs' ? FBS_CONFERENCES : FCS_CONFERENCES;
  const isToday = selectedDate === getLocalDateString();

  // Use shared live scores hook (synced with ticker)
  const { games: liveGames, lastUpdated: liveScoresLastUpdated } = useLiveScores();

  // Check if there are any live games in cache
  const hasLiveGames = useMemo(() => {
    return allGamesCache.some(game => game.status.state === 'in');
  }, [allGamesCache]);

  // Reset conference and team search when division changes
  useEffect(() => {
    setSelectedConference('All Games');
    setTeamSearch('');
  }, [division]);

  // Sync cache with shared live scores (keeps ticker and schedule in sync)
  useEffect(() => {
    if (!liveGames.length || loading) return;

    setAllGamesCache(prevCache => {
      const updatedCache = [...prevCache];
      let hasChanges = false;

      for (const liveGame of liveGames) {
        const index = updatedCache.findIndex(g => g.id === liveGame.id);
        if (index !== -1) {
          const cached = updatedCache[index];
          // Only update if scores changed
          if (cached.awayTeam.score !== liveGame.awayTeam?.score ||
              cached.homeTeam.score !== liveGame.homeTeam?.score) {
            hasChanges = true;
            // Map TickerGame status fields to ScheduleGame status
            const newStatus = {
              state: liveGame.isLive ? 'in' as const : liveGame.isFinal ? 'post' as const : 'pre' as const,
              detail: liveGame.statusDetail,
              shortDetail: liveGame.statusDetail,
              completed: liveGame.isFinal,
            };
            updatedCache[index] = {
              ...cached,
              awayTeam: {
                ...cached.awayTeam,
                score: liveGame.awayTeam?.score,
              },
              homeTeam: {
                ...cached.homeTeam,
                score: liveGame.homeTeam?.score,
              },
              status: newStatus,
            };
          }
        }
      }

      return hasChanges ? updatedCache : prevCache;
    });
  }, [liveGames, liveScoresLastUpdated, loading]);

  // Fetch ALL schedule data once when division changes (single API call)
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchAllScheduleData() {
      setLoading(true);
      setError(null);
      setExpandedGame(null);

      const group = division === 'fbs' ? '80' : '81';

      try {
        // Single API call to fetch all season games (server handles batching)
        const response = await fetch(
          getApiPath(`api/cfb/schedule?fetchAll=true&group=${group}`),
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }

        const data = await response.json();

        if (!abortController.signal.aborted) {
          setAllGamesCache(data.games || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching schedule:', err);
        setError('Failed to load schedule. Please try again.');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchAllScheduleData();

    return () => {
      abortController.abort();
    };
  }, [division]); // Only re-fetch when division changes

  // Derive daily games from cache (memoized)
  const dailyGames = useMemo(() => {
    return allGamesCache.filter(game => getGameDateKey(game.date) === selectedDate);
  }, [allGamesCache, selectedDate]);

  // Derive weekly games from cache (memoized)
  const weeklyGames = useMemo(() => {
    const weekRange = getWeekRange(selectedDate);
    const gamesMap: Record<string, ScheduleGame[]> = {};
    for (const day of weekRange.days) {
      gamesMap[day] = allGamesCache.filter(game => getGameDateKey(game.date) === day);
    }
    return gamesMap;
  }, [allGamesCache, selectedDate]);

  // Derive monthly games from cache (memoized)
  const monthlyGames = useMemo(() => {
    const monthDays = getMonthDays(selectedDate);
    const gamesMap: Record<string, ScheduleGame[]> = {};
    for (const day of monthDays) {
      gamesMap[day] = allGamesCache.filter(game => getGameDateKey(game.date) === day);
    }
    return gamesMap;
  }, [allGamesCache, selectedDate]);

  // Filter games by conference and team search
  const filterGames = (gamesList: ScheduleGame[]) => {
    let filtered = gamesList;

    // Filter by conference
    if (selectedConference !== 'All Games') {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(selectedConference.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(selectedConference.toLowerCase()) ||
        game.homeTeam.name.toLowerCase().includes(selectedConference.toLowerCase())
      );
    }

    // Filter by team search
    if (teamSearch.trim()) {
      const searchLower = teamSearch.toLowerCase().trim();
      filtered = filtered.filter(game =>
        game.awayTeam.name.toLowerCase().includes(searchLower) ||
        game.awayTeam.abbreviation.toLowerCase().includes(searchLower) ||
        game.homeTeam.name.toLowerCase().includes(searchLower) ||
        game.homeTeam.abbreviation.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  // Go to today helper
  const goToToday = () => {
    setSelectedDate(getLocalDateString());
  };

  // Navigate dates
  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(getLocalDateString(date));
  };

  const goToPreviousWeek = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() - 7);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextWeek = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + 7);
    setSelectedDate(getLocalDateString(date));
  };

  const goToPreviousMonth = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(getLocalDateString(date));
  };

  const goToNextMonth = () => {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setMonth(date.getMonth() + 1);
    setSelectedDate(getLocalDateString(date));
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const toggleGameExpand = (gameId: string) => {
    setExpandedGame(expandedGame === gameId ? null : gameId);
  };

  // Render a game card
  const renderGameCard = (game: ScheduleGame, compact: boolean = false) => {
    const isLive = game.status.state === 'in';
    const isFinal = game.status.completed;
    const isExpanded = expandedGame === game.id;
    const hasLeaders = game.leaders && (game.leaders.passing || game.leaders.rushing || game.leaders.receiving);
    const hasDetails = game.venue || (game.broadcasts && game.broadcasts.length > 0) || hasLeaders;

    if (compact) {
      return (
        <div
          key={game.id}
          className={`border rounded-lg overflow-hidden ${isLive ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}
        >
          {/* Bowl Game Name (shortened for compact view) */}
          {game.note && (
            <div className="bg-[#800000] text-white px-2 py-1 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wide">{shortenBowlName(game.note)}</span>
            </div>
          )}

          <button
            onClick={() => toggleGameExpand(game.id)}
            className={`w-full text-xs p-2 hover:bg-gray-50 transition-colors relative ${isLive ? 'pt-5' : ''}`}
          >
            {isLive && (
              <div className="absolute top-0.5 right-1 flex items-center gap-0.5 bg-green-100 px-1 rounded">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[8px] font-bold text-green-600 uppercase">Live</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-1">
              <div className="w-5 h-5 relative flex-shrink-0">
                <Image src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} fill className="object-contain" unoptimized />
              </div>
              <span className="font-semibold flex-1 text-left truncate">
                {game.awayTeam.rank && game.awayTeam.rank <= 25 && <span className="text-gray-500">#{game.awayTeam.rank} </span>}
                {game.awayTeam.abbreviation}
                {game.awayTeam.record && <span className="text-gray-400 font-normal ml-1">({game.awayTeam.record})</span>}
              </span>
              {game.awayTeam.score !== undefined ? (
                <span className={isFinal && game.awayTeam.score > (game.homeTeam.score || 0) ? 'font-bold' : ''}>{game.awayTeam.score}</span>
              ) : (
                <span className="text-gray-600 text-xs">{formatGameTime(game.date)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-gray-400 text-xs">@</span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="w-5 h-5 relative flex-shrink-0">
                <Image src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} fill className="object-contain" unoptimized />
              </div>
              <span className="font-semibold flex-1 text-left truncate">
                {game.homeTeam.rank && game.homeTeam.rank <= 25 && <span className="text-gray-500">#{game.homeTeam.rank} </span>}
                {game.homeTeam.abbreviation}
                {game.homeTeam.record && <span className="text-gray-400 font-normal ml-1">({game.homeTeam.record})</span>}
              </span>
              {game.homeTeam.score !== undefined && (
                <span className={isFinal && game.homeTeam.score > (game.awayTeam.score || 0) ? 'font-bold' : ''}>{game.homeTeam.score}</span>
              )}
            </div>
          </button>

          {/* Expanded Details */}
          {isExpanded && hasDetails && (
            <div className="border-t border-gray-200 bg-gray-50 p-3 text-xs">
              {/* Game Leaders */}
              {hasLeaders && (
                <div className="mb-3">
                  <div className="font-bold text-gray-600 uppercase text-[10px] tracking-wide mb-2">Game Leaders</div>
                  <div className="space-y-2">
                    {game.leaders?.passing && (
                      <div className="flex items-center gap-2 bg-white rounded p-1.5 border border-gray-200">
                        {game.leaders.passing.headshot && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                            <Image
                              src={game.leaders.passing.headshot}
                              alt={game.leaders.passing.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-[#800000] uppercase">Passing</div>
                          <div className="font-semibold text-gray-900 truncate">{game.leaders.passing.name}</div>
                          <div className="text-gray-500">{game.leaders.passing.displayValue}</div>
                        </div>
                      </div>
                    )}
                    {game.leaders?.rushing && (
                      <div className="flex items-center gap-2 bg-white rounded p-1.5 border border-gray-200">
                        {game.leaders.rushing.headshot && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                            <Image
                              src={game.leaders.rushing.headshot}
                              alt={game.leaders.rushing.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-[#800000] uppercase">Rushing</div>
                          <div className="font-semibold text-gray-900 truncate">{game.leaders.rushing.name}</div>
                          <div className="text-gray-500">{game.leaders.rushing.displayValue}</div>
                        </div>
                      </div>
                    )}
                    {game.leaders?.receiving && (
                      <div className="flex items-center gap-2 bg-white rounded p-1.5 border border-gray-200">
                        {game.leaders.receiving.headshot && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                            <Image
                              src={game.leaders.receiving.headshot}
                              alt={game.leaders.receiving.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] font-bold text-[#800000] uppercase">Receiving</div>
                          <div className="font-semibold text-gray-900 truncate">{game.leaders.receiving.name}</div>
                          <div className="text-gray-500">{game.leaders.receiving.displayValue}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {game.venue && (
                <div className="mb-2">
                  <div className="font-semibold text-gray-900">{game.venue.name}</div>
                  <div className="text-gray-600">
                    {game.venue.city}{game.venue.state && `, ${game.venue.state}`}
                  </div>
                </div>
              )}
              {game.broadcasts && game.broadcasts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {game.broadcasts.map((broadcast, idx) => (
                    <span key={idx} className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                      {broadcast}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Full game card for daily view
    return (
      <div
        key={game.id}
        className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
          isLive ? 'border-green-400 ring-2 ring-green-100' : 'border-gray-200'
        }`}
      >
        {/* Bowl Game / Event Name Banner */}
        {game.note && (
          <div className="bg-gradient-to-r from-[#800000] to-[#a00000] text-white px-5 py-2 text-center">
            <span className="text-sm font-bold uppercase tracking-wide">{game.note}</span>
          </div>
        )}

        <div
          role={hasDetails ? 'button' : undefined}
          tabIndex={hasDetails ? 0 : undefined}
          onClick={() => hasDetails && toggleGameExpand(game.id)}
          onKeyDown={(e) => { if (hasDetails && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleGameExpand(game.id); } }}
          className={`p-5 ${hasDetails ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        >
          <div className="flex items-center gap-6">
            {/* Teams */}
            <div className="flex-1 space-y-3">
              {/* Away Team */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image src={game.awayTeam.logo} alt={game.awayTeam.name} fill className="object-contain" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    {game.awayTeam.rank && game.awayTeam.rank <= 25 && (
                      <span className="text-sm text-gray-500">#{game.awayTeam.rank}</span>
                    )}
                    <span className="truncate">{game.awayTeam.name}</span>
                    {game.awayTeam.record && (
                      <span className="text-sm font-normal text-gray-500">({game.awayTeam.record})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 relative flex-shrink-0">
                  <Image src={game.homeTeam.logo} alt={game.homeTeam.name} fill className="object-contain" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 flex items-center gap-2">
                    {game.homeTeam.rank && game.homeTeam.rank <= 25 && (
                      <span className="text-sm text-gray-500">#{game.homeTeam.rank}</span>
                    )}
                    <span className="truncate">{game.homeTeam.name}</span>
                    {game.homeTeam.record && (
                      <span className="text-sm font-normal text-gray-500">({game.homeTeam.record})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center min-w-[100px]">
              {game.status.state === 'pre' ? (
                <div className="text-base text-gray-700 font-medium text-center">{formatGameTime(game.date)}</div>
              ) : (
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                  isLive ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'
                }`}>
                  {game.status.shortDetail}
                </span>
              )}
            </div>

            {/* Scores */}
            <div className="flex flex-col gap-3 min-w-[60px] items-end">
              {game.awayTeam.score !== undefined ? (
                <div className={`text-3xl font-bold ${
                  isFinal && game.awayTeam.score > (game.homeTeam.score || 0) ? 'text-green-600' :
                  isFinal ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {game.awayTeam.score}
                </div>
              ) : (
                <div className="h-9"></div>
              )}
              {game.homeTeam.score !== undefined ? (
                <div className={`text-3xl font-bold ${
                  isFinal && game.homeTeam.score > (game.awayTeam.score || 0) ? 'text-green-600' :
                  isFinal ? 'text-gray-400' : 'text-gray-900'
                }`}>
                  {game.homeTeam.score}
                </div>
              ) : (
                <div className="h-9"></div>
              )}
            </div>

            {/* Expand Arrow */}
            {hasDetails && (
              <div className="hidden md:flex items-center pl-4">
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {hasDetails && !isExpanded && (
            <div className="md:hidden mt-3 text-center">
              <span className="text-xs text-gray-400">Tap for more details</span>
            </div>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && hasDetails && (
          <div className="border-t border-gray-200 bg-gray-50 p-5">
            {/* Game Leaders */}
            {hasLeaders && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Game Leaders</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {game.leaders?.passing && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                      {game.leaders.passing.headshot && (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          <Image
                            src={game.leaders.passing.headshot}
                            alt={game.leaders.passing.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#800000] uppercase">Passing</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{game.leaders.passing.name}</div>
                        <div className="text-xs text-gray-600">{game.leaders.passing.displayValue}</div>
                      </div>
                    </div>
                  )}
                  {game.leaders?.rushing && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                      {game.leaders.rushing.headshot && (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          <Image
                            src={game.leaders.rushing.headshot}
                            alt={game.leaders.rushing.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#800000] uppercase">Rushing</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{game.leaders.rushing.name}</div>
                        <div className="text-xs text-gray-600">{game.leaders.rushing.displayValue}</div>
                      </div>
                    </div>
                  )}
                  {game.leaders?.receiving && (
                    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-200">
                      {game.leaders.receiving.headshot && (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 relative">
                          <Image
                            src={game.leaders.receiving.headshot}
                            alt={game.leaders.receiving.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-[#800000] uppercase">Receiving</div>
                        <div className="font-semibold text-gray-900 text-sm truncate">{game.leaders.receiving.name}</div>
                        <div className="text-xs text-gray-600">{game.leaders.receiving.displayValue}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {game.venue && (
                <div>
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Stadium</h4>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="text-base font-semibold text-gray-900">{game.venue.name}</div>
                      <div className="text-xs text-gray-600">
                        {game.venue.city}{game.venue.state && `, ${game.venue.state}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {game.broadcasts && game.broadcasts.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Broadcast</h4>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex flex-wrap gap-2">
                      {game.broadcasts.map((station, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                          {station}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredDailyGames = filterGames(dailyGames);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <CFBSidebar />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <CFBSidebar isMobile={true} />
      </div>

      <main id="main-content" className="flex-1 lg:ml-64 min-w-0 mt-[48px] lg:mt-0">
        {/* Header */}
        <div className="bg-[#800000] text-white pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              CFB Schedule
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              View all College Football games, scores, and game details
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        {/* View Mode and Filters */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                    viewMode === 'daily'
                      ? 'bg-white text-[#800000] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setViewMode('weekly')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                    viewMode === 'weekly'
                      ? 'bg-white text-[#800000] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-colors cursor-pointer ${
                    viewMode === 'monthly'
                      ? 'bg-white text-[#800000] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
              </div>

              {/* Division, Conference Filters, and Search */}
              <div className="flex flex-wrap items-center gap-2">
                {/* FBS/FCS Toggle */}
                <div className="flex gap-1">
                  <button
                    onClick={() => setDivision('fbs')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      division === 'fbs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000]'
                    }`}
                  >
                    FBS
                  </button>
                  <button
                    onClick={() => setDivision('fcs')}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      division === 'fcs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000]'
                    }`}
                  >
                    FCS
                  </button>
                </div>

                {/* Conference Filter */}
                <select
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] text-gray-900 bg-white cursor-pointer text-sm"
                >
                  {currentConferences.map((conf) => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>

                {/* Team Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search team..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] text-gray-900 bg-white text-sm w-36 sm:w-44"
                  />
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {teamSearch && (
                    <button
                      onClick={() => setTeamSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Go to Today Button */}
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="px-3 py-2 bg-[#800000] text-white rounded-lg font-medium text-sm hover:bg-[#600000] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Today
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date Navigation - Daily */}
          {viewMode === 'daily' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 justify-center">
                  <button
                    onClick={goToPreviousDay}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Previous day"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] text-gray-900 text-sm sm:text-base flex-1 max-w-[200px] min-h-[44px] ${
                      isToday ? 'border-[#800000] bg-red-50 ring-2 ring-[#800000]' : 'border-gray-300'
                    }`}
                  />

                  <button
                    onClick={goToNextDay}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                    aria-label="Next day"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatDisplayDate(selectedDate)}
                    </h2>
                    {isToday && (
                      <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        Today
                      </span>
                    )}
                  </div>
                  {!loading && !error && filteredDailyGames.length > 0 && (
                    <div className="mt-1 text-xs sm:text-sm text-gray-600">
                      {filteredDailyGames.length} game{filteredDailyGames.length !== 1 ? 's' : ''} scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date Navigation - Weekly */}
          {viewMode === 'weekly' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <button
                  onClick={goToPreviousWeek}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-[44px] cursor-pointer"
                  aria-label="Previous week"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Previous</span>
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-gray-900">
                    {(() => {
                      const weekRange = getWeekRange(selectedDate);
                      const startDate = new Date(weekRange.start + 'T12:00:00');
                      const endDate = new Date(weekRange.end + 'T12:00:00');
                      return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                    })()}
                  </h2>
                </div>

                <button
                  onClick={goToNextWeek}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-[44px] cursor-pointer"
                  aria-label="Next week"
                >
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Next</span>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Date Navigation - Monthly */}
          {viewMode === 'monthly' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <button
                  onClick={goToPreviousMonth}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-[44px] cursor-pointer"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Previous</span>
                </button>

                <div className="text-center flex-1 min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-gray-900">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h2>
                </div>

                <button
                  onClick={goToNextMonth}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors min-h-[44px] cursor-pointer"
                  aria-label="Next month"
                >
                  <span className="hidden md:inline text-sm font-medium text-gray-700">Next</span>
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Daily View Content */}
          {viewMode === 'daily' && (
            <>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-gray-600">Loading schedule...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : filteredDailyGames.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Games Scheduled</h3>
                  <p className="text-gray-600">There are no CFB games scheduled for this date.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDailyGames.map((game) => renderGameCard(game, false))}
                </div>
              )}
            </>
          )}

          {/* Weekly View Content */}
          {viewMode === 'weekly' && (
            <>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4" style={{ minHeight: '500px' }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
                      <div className="p-3 bg-gray-200 h-16"></div>
                      <div className="p-2 space-y-2">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="grid grid-flow-col auto-cols-[minmax(240px,1fr)] sm:auto-cols-[minmax(260px,1fr)] md:grid-cols-7 md:auto-cols-auto gap-2 sm:gap-3 md:gap-4 min-w-min md:min-w-0">
                    {getWeekRange(selectedDate).days.map((day) => {
                      const dayDate = new Date(day + 'T12:00:00');
                      const dayGames = filterGames(weeklyGames[day] || []);
                      const isDayToday = day === getLocalDateString();

                      return (
                        <div key={day} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isDayToday ? 'border-[#800000] ring-2 ring-[#800000]' : 'border-gray-200'}`}>
                          <div className={`p-3 text-center border-b ${isDayToday ? 'bg-red-50 border-[#800000]' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="text-xs font-semibold text-gray-600 uppercase">
                              {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {dayDate.getDate()}
                            </div>
                          </div>
                          <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                            {dayGames.length === 0 ? (
                              <div className="text-center py-4 text-xs text-gray-400">No games</div>
                            ) : (
                              dayGames.map((game) => renderGameCard(game, true))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Monthly View Content */}
          {viewMode === 'monthly' && (
            <>
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse" style={{ minHeight: '600px' }}>
                  <div className="grid grid-cols-7 bg-gray-200 border-b border-gray-300">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-3 h-12"></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div key={i} className="aspect-square border-r border-b border-gray-200 p-3">
                        <div className="h-6 w-6 bg-gray-200 rounded mb-2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7">
                    {(() => {
                      const monthDays = getMonthDays(selectedDate);
                      const firstDay = new Date(monthDays[0] + 'T12:00:00');
                      const startPadding = firstDay.getDay();

                      const allCells = [
                        ...Array(startPadding).fill(null),
                        ...monthDays
                      ];

                      return allCells.map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="aspect-square border-r border-b border-gray-200 bg-gray-50" />;
                        }

                        const date = new Date(day + 'T12:00:00');
                        const dayGames = filterGames(monthlyGames[day] || []);
                        const gameCount = dayGames.length;
                        const isDayToday = day === getLocalDateString();

                        const getGameCountStyle = (count: number) => {
                          if (count === 0) return null;
                          if (count <= 5) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
                          if (count <= 20) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
                          return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
                        };

                        const gameStyle = getGameCountStyle(gameCount);

                        return (
                          <button
                            key={day}
                            onClick={() => {
                              setSelectedDate(day);
                              setViewMode('daily');
                            }}
                            className={`aspect-square border-r border-b p-1 sm:p-2 md:p-3 hover:shadow-md transition-all cursor-pointer ${
                              gameCount > 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                            } ${isDayToday ? 'ring-2 ring-[#800000] ring-inset' : 'border-gray-200'}`}
                          >
                            <div className="h-full flex flex-col">
                              <div className={`text-sm sm:text-base md:text-lg font-bold mb-1 sm:mb-2 ${
                                isDayToday ? 'text-[#800000]' :
                                gameCount > 0 ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {date.getDate()}
                              </div>

                              {gameCount > 0 && (
                                <div className="mt-auto space-y-1">
                                  {gameCount <= 3 ? (
                                    // Show team matchups for 1-3 games
                                    <div className="space-y-1">
                                      {dayGames.map((game) => (
                                        <div key={game.id} className="flex items-center justify-center gap-0.5 sm:gap-1">
                                          <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative flex-shrink-0">
                                            <Image
                                              src={game.awayTeam.logo}
                                              alt={game.awayTeam.abbreviation}
                                              fill
                                              className="object-contain"
                                              unoptimized
                                            />
                                          </div>
                                          <span className="text-[10px] sm:text-xs text-gray-400 font-bold">@</span>
                                          <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 relative flex-shrink-0">
                                            <Image
                                              src={game.homeTeam.logo}
                                              alt={game.homeTeam.abbreviation}
                                              fill
                                              className="object-contain"
                                              unoptimized
                                            />
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    // Show game count badge for 4+ games
                                    gameStyle && (
                                      <div className={`inline-flex items-center justify-center px-2 py-1 ${gameStyle.bg} ${gameStyle.text} border ${gameStyle.border} text-xs font-bold rounded whitespace-nowrap`}>
                                        <span className="hidden sm:inline">{gameCount} games</span>
                                        <span className="sm:hidden">{gameCount}</span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Footer currentPage="CFB" />
      </main>
    </div>
  );
}

// Wrapper component with Suspense boundary
export default function ScheduleClient() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading schedule...</p>
          </div>
        </div>
      </div>
    }>
      <ScheduleClientInner />
    </Suspense>
  );
}
