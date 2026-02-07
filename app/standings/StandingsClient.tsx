'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import StandingsSkeleton from '@/components/StandingsSkeleton';
import { getApiPath } from '@/utils/api';
import { getTeamById } from '@/data/teams';

interface StandingsTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  wins: number;
  losses: number;
  conferenceWins: number;
  conferenceLosses: number;
  rank?: number;
  streak?: string;
  homeRecord?: string;
  awayRecord?: string;
}

interface ConferenceStandings {
  id: string;
  name: string;
  shortName: string;
  teams: StandingsTeam[];
}

// Priority conferences to show first
const PRIORITY_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12'];

type SortOption = 'conference' | 'overall' | 'name';

export default function StandingsClient() {
  const [standings, setStandings] = useState<ConferenceStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [division, setDivision] = useState<'fbs' | 'fcs'>('fbs');
  const [teamSearch, setTeamSearch] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('conference');
  const [cfpRankings, setCfpRankings] = useState<Record<string, number>>({});

  // Fetch CFP rankings from rankings API
  useEffect(() => {
    async function fetchCfpRankings() {
      try {
        const response = await fetch(getApiPath('api/cfb/rankings'));
        if (!response.ok) return;
        const data = await response.json();

        const rankings: Record<string, number> = {};
        // Find CFP rankings (or AP Poll as fallback)
        const polls = data.rankings || [];
        let targetPoll = polls.find((p: { name?: string }) =>
          p.name?.toLowerCase().includes('playoff') || p.name?.toLowerCase().includes('cfp')
        );

        // Fallback to AP Poll if CFP not available
        if (!targetPoll) {
          targetPoll = polls.find((p: { name?: string }) => p.name?.toLowerCase().includes('ap'));
        }

        if (targetPoll?.ranks) {
          for (const rank of targetPoll.ranks) {
            if (rank.team?.id && rank.current <= 25) {
              rankings[rank.team.id] = rank.current;
            }
          }
        }
        setCfpRankings(rankings);
      } catch (err) {
        console.error('Failed to fetch CFP rankings:', err);
      }
    }
    fetchCfpRankings();
  }, []);


  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setSelectedConference('all');
        setTeamSearch('');
        const group = division === 'fbs' ? '80' : '81';
        const response = await fetch(getApiPath(`api/cfb/standings?group=${group}`), {
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        if (!response.ok) throw new Error('Failed to fetch standings');
        const data = await response.json();

        // Sort conferences: priority first (for FBS), then alphabetically
        const sorted = [...(data.conferences || [])].sort((a, b) => {
          if (division === 'fbs') {
            const aIndex = PRIORITY_CONFERENCES.indexOf(a.name);
            const bIndex = PRIORITY_CONFERENCES.indexOf(b.name);

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
          }
          return a.name.localeCompare(b.name);
        });

        if (!abortController.signal.aborted) {
          setStandings(sorted);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load standings');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [division]);

  // Sort teams within each conference based on sort option
  const sortTeams = (teams: StandingsTeam[]): StandingsTeam[] => {
    const sorted = [...teams];
    switch (sortOption) {
      case 'overall':
        sorted.sort((a, b) => {
          const aWinPct = a.wins / (a.wins + a.losses) || 0;
          const bWinPct = b.wins / (b.wins + b.losses) || 0;
          if (bWinPct !== aWinPct) return bWinPct - aWinPct;
          return b.wins - a.wins;
        });
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'conference':
      default:
        // Already sorted by conference record from API
        break;
    }
    return sorted;
  };

  // Filter and sort standings
  const filteredStandings = useMemo(() => {
    let filtered = selectedConference === 'all'
      ? standings
      : standings.filter(conf => conf.id === selectedConference || conf.name === selectedConference);

    // Apply team search filter
    if (teamSearch.trim()) {
      const searchLower = teamSearch.toLowerCase().trim();
      filtered = filtered.map(conf => ({
        ...conf,
        teams: conf.teams.filter(team =>
          team.name.toLowerCase().includes(searchLower) ||
          team.abbreviation.toLowerCase().includes(searchLower)
        ),
      })).filter(conf => conf.teams.length > 0);
    }

    // Apply sorting to each conference's teams
    return filtered.map(conf => ({
      ...conf,
      teams: sortTeams(conf.teams),
    }));
  }, [standings, selectedConference, teamSearch, sortOption]);

  // Get CFP rank for a team (by ID)
  const getCfpRank = (team: StandingsTeam): number | undefined => {
    return cfpRankings[team.id];
  };

  // Check if team is bowl eligible (6+ wins)
  const isBowlEligible = (team: StandingsTeam): boolean => {
    return team.wins >= 6;
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
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              CFB Standings
            </h1>
            <p className="text-lg opacity-90 font-medium">
              {(() => {
                const year = new Date().getMonth() < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                return `${year}-${(year + 1).toString().slice(-2)}`;
              })()} {division === 'fbs' ? 'FBS' : 'FCS'} conference standings
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Controls Row */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left side: Division Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setDivision('fbs')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                      division === 'fbs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                    }`}
                  >
                    FBS
                  </button>
                  <button
                    onClick={() => setDivision('fcs')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-[0.98] cursor-pointer ${
                      division === 'fcs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                    }`}
                  >
                    FCS
                  </button>
                </div>

                {/* Conference Filter */}
                <select
                  id="conference-filter"
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white text-gray-900 cursor-pointer text-sm"
                >
                  <option value="all">All Conferences</option>
                  {standings.map((conf) => (
                    <option key={conf.id} value={conf.id}>
                      {conf.name}
                    </option>
                  ))}
                </select>

                {/* Sort Option */}
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white text-gray-900 cursor-pointer text-sm"
                >
                  <option value="conference">Sort: Conference Record</option>
                  <option value="overall">Sort: Overall Record</option>
                  <option value="name">Sort: Alphabetical</option>
                </select>
              </div>

              {/* Right side: Team Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search team..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white text-gray-900 text-sm w-full lg:w-56"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {teamSearch && (
                  <button
                    onClick={() => setTeamSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && <StandingsSkeleton />}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Standings Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredStandings.map((conference) => (
                <div
                  key={conference.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
                >
                  {/* Conference Header */}
                  <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: '#800000' }}>
                    <h2 className="text-lg font-bold text-white">
                      {conference.name}
                    </h2>
                  </div>

                  {/* Standings Table with Sticky Header */}
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 bg-gray-50">
                            Team
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 bg-gray-50">
                            Conf
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 bg-gray-50">
                            Overall
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden md:table-cell bg-gray-50">
                            Home
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden md:table-cell bg-gray-50">
                            Away
                          </th>
                          <th className="px-2 py-3 text-center text-xs font-semibold text-gray-600 hidden sm:table-cell bg-gray-50">
                            Streak
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {conference.teams.map((team, index) => {
                          const cfpRank = getCfpRank(team);
                          const bowlEligible = isBowlEligible(team);

                          // Determine row background color
                          let rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50';
                          if (bowlEligible && division === 'fbs') {
                            rowBgClass = 'bg-green-50 border-l-4 border-l-green-400';
                          }

                          return (
                            <tr
                              key={team.id}
                              className={`hover:bg-gray-100 transition-colors ${rowBgClass}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-500 w-4 text-right">
                                    {index + 1}
                                  </span>
                                  <div className="relative w-7 h-7 flex-shrink-0">
                                    {team.logo ? (
                                      <Image
                                        src={team.logo}
                                        alt={team.name}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-500">
                                          {team.abbreviation.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex items-center gap-1.5">
                                    {cfpRank && (
                                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                        #{cfpRank}
                                      </span>
                                    )}
                                    {(() => {
                                      const teamData = getTeamById(team.name);
                                      return teamData ? (
                                        <Link href={`/teams/${teamData.slug}`} className="font-medium text-gray-900 truncate text-sm hover:text-[#800000] hover:underline">
                                          {team.name}
                                        </Link>
                                      ) : (
                                        <span className="font-medium text-gray-900 truncate text-sm">
                                          {team.name}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className="text-sm font-semibold text-gray-900">
                                  {team.conferenceWins}-{team.conferenceLosses}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className="text-sm text-gray-600">
                                  {team.wins}-{team.losses}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center hidden md:table-cell">
                                <span className="text-sm text-gray-600">
                                  {team.homeRecord || '-'}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center hidden md:table-cell">
                                <span className="text-sm text-gray-600">
                                  {team.awayRecord || '-'}
                                </span>
                              </td>
                              <td className="px-2 py-3 text-center hidden sm:table-cell">
                                {team.streak && (
                                  <span
                                    className={`text-sm font-medium ${
                                      team.streak.startsWith('W')
                                        ? 'text-green-600'
                                        : team.streak.startsWith('L')
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {team.streak}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredStandings.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {teamSearch ? `No teams found matching "${teamSearch}"` : 'No standings data available'}
            </div>
          )}

          {/* Legend */}
          {!loading && !error && filteredStandings.length > 0 && division === 'fbs' && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 bg-green-50 border-l-4 border-l-green-400 rounded-r"></div>
                  <span className="text-gray-600">Bowl Eligible (6+ wins)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">#1</span>
                  <span className="text-gray-600">CFP Ranking</span>
                </div>
              </div>
            </div>
          )}
        </div>

      <Footer currentPage="CFB" />
    </>
  );
}
