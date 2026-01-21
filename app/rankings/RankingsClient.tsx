'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';
import { hasCFPRankings, getHistoricalCFPPoll } from '@/data/cfp-historical';

interface RankedTeam {
  current: number;
  previous?: number;
  team: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    logo?: string;
    nickname?: string;
  };
  record?: string;
}

interface Poll {
  name: string;
  shortName?: string;
  type?: string;
  ranks: RankedTeam[];
}

interface RankingsData {
  rankings: Poll[];
}

export default function RankingsClient() {
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<string>('');

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchRankings() {
      try {
        setLoading(true);
        const response = await fetch(getApiPath('api/cfb/rankings'), {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;
        if (!response.ok) throw new Error('Failed to fetch rankings');

        const result: RankingsData = await response.json();

        if (!abortController.signal.aborted) {
          // Add historical CFP rankings if not present in API response
          let rankings = result.rankings || [];
          if (!hasCFPRankings(rankings)) {
            const historicalCFP = getHistoricalCFPPoll();
            // Add CFP at the beginning of the list
            rankings = [historicalCFP, ...rankings];
          }

          setData({ rankings });
          // Set default poll to first available
          if (rankings.length > 0 && !selectedPoll) {
            setSelectedPoll(rankings[0].name);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load rankings');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRankings();

    return () => {
      abortController.abort();
    };
  }, []);

  // Get the currently selected poll
  const currentPoll = data?.rankings?.find(p => p.name === selectedPoll);

  // Calculate movement for a team
  const getMovement = (team: RankedTeam): { direction: 'up' | 'down' | 'same' | 'new'; amount: number } => {
    if (team.previous === undefined || team.previous === 0) {
      return { direction: 'new', amount: 0 };
    }
    const diff = team.previous - team.current;
    if (diff > 0) return { direction: 'up', amount: diff };
    if (diff < 0) return { direction: 'down', amount: Math.abs(diff) };
    return { direction: 'same', amount: 0 };
  };

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

      <main className="flex-1 lg:ml-64 min-w-0 mt-[52px] lg:mt-0">
        {/* Hero Section */}
        <div className="bg-[#800000] text-white pb-4 lg:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3">
              CFB Rankings
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-200">
              {(() => {
                const year = new Date().getMonth() < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                return `${year}-${(year + 1).toString().slice(-2)}`;
              })()} College Football Rankings
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Poll Tabs */}
          {!loading && data?.rankings && data.rankings.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {data.rankings.map((poll) => (
                  <button
                    key={poll.name}
                    onClick={() => setSelectedPoll(poll.name)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      selectedPoll === poll.name
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                    }`}
                  >
                    {poll.shortName || poll.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-[#800000]">
                <div className="h-6 bg-white/20 rounded w-32 animate-pulse"></div>
              </div>
              <div className="divide-y divide-gray-100">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Rankings Table */}
          {!loading && !error && currentPoll && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              {/* Poll Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                <h2 className="text-lg font-bold text-white">
                  {currentPoll.name}
                </h2>
              </div>

              {/* Rankings List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        Record
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {currentPoll.ranks.map((team, index) => {
                      const movement = getMovement(team);

                      return (
                        <tr
                          key={team.team.id || index}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-lg font-bold text-gray-900">
                              {team.current}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 flex-shrink-0">
                                {team.team.logo ? (
                                  <Image
                                    src={team.team.logo}
                                    alt={team.team.displayName || 'Team'}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-500">
                                      {(team.team.shortDisplayName || team.team.displayName || '?').charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <span className="font-medium text-gray-900">
                                {team.team.displayName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">
                              {team.record || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {movement.direction === 'new' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                                NEW
                              </span>
                            ) : movement.direction === 'up' ? (
                              <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                {movement.amount}
                              </span>
                            ) : movement.direction === 'down' ? (
                              <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {movement.amount}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Rankings Available */}
          {!loading && !error && (!data?.rankings || data.rankings.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              No rankings data available at this time.
            </div>
          )}

          {/* Legend */}
          {!loading && !error && currentPoll && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-600">Moved up from previous ranking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-gray-600">Moved down from previous ranking</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                    NEW
                  </span>
                  <span className="text-gray-600">Newly ranked</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer currentPage="CFB" />
      </main>
    </div>
  );
}
