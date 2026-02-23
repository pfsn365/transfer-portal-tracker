'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';
import { fetcher, swrConfig } from '@/utils/swr';
import { hasCFPRankings, getHistoricalCFPPoll } from '@/data/cfp-historical';
import { getTeamById } from '@/data/teams';
import RaptiveHeaderAd from '@/components/RaptiveHeaderAd';

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
  const { data: rankingsRaw, error: swrError, isLoading: loading, mutate } = useSWR<RankingsData>(
    getApiPath('api/cfb/rankings'),
    fetcher,
    swrConfig.stable
  );

  const [selectedPoll, setSelectedPoll] = useState<string>('');

  // Process data - add historical CFP if not present
  const data = useMemo<RankingsData | null>(() => {
    if (!rankingsRaw) return null;
    let rankings = rankingsRaw.rankings || [];
    if (!hasCFPRankings(rankings)) {
      const historicalCFP = getHistoricalCFPPoll();
      rankings = [historicalCFP, ...rankings];
    }
    return { rankings };
  }, [rankingsRaw]);

  const error = swrError ? 'Failed to load rankings' : null;

  // Set default poll when data first loads
  useEffect(() => {
    if (data?.rankings?.length && !selectedPoll) {
      setSelectedPoll(data.rankings[0].name);
    }
  }, [data, selectedPoll]);

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
    <>
        {/* Hero Section */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              CFB Rankings
            </h1>
            <p className="text-lg opacity-90 font-medium">
              {(() => {
                const year = new Date().getMonth() < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                return `${year}-${(year + 1).toString().slice(-2)}`;
              })()} College Football Rankings
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <RaptiveHeaderAd />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Poll Tabs */}
          {!loading && data?.rankings && data.rankings.length > 0 && (
            <div className="sticky top-[48px] z-20 bg-white border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 lg:static lg:mx-0 lg:px-0 lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm lg:p-4">
              <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5 lg:py-0 lg:flex-wrap">
                {data.rankings.map((poll) => (
                  <button
                    key={poll.name}
                    onClick={() => setSelectedPoll(poll.name)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer lg:rounded-lg lg:py-2 lg:font-semibold ${
                      selectedPoll === poll.name
                        ? 'bg-[#800000] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 lg:bg-white lg:text-gray-700 lg:border lg:border-gray-300 lg:hover:border-[#800000] lg:hover:text-[#800000]'
                    }`}
                  >
                    {poll.shortName || poll.name}
                  </button>
                ))}
              </nav>
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-700 mb-3">{error}</p>
              <button
                onClick={() => mutate()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium cursor-pointer"
              >
                Try Again
              </button>
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-16">
                        Rank
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-24">
                        Record
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-20">
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
                              {(() => {
                                const teamData = getTeamById(team.team.displayName || '');
                                return teamData ? (
                                  <Link href={`/teams/${teamData.slug}`} className="font-medium text-gray-900 hover:text-[#800000] hover:underline">
                                    {team.team.displayName}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-gray-900">
                                    {team.team.displayName}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-600">
                              {team.record || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {movement.direction === 'new' ? (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
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
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                    NEW
                  </span>
                  <span className="text-gray-600">Newly ranked</span>
                </div>
              </div>
            </div>
          )}
        </div>

      <Footer currentPage="CFB" />
    </>
  );
}
