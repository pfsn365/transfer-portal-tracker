'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';
import { getTeamById } from '@/data/teams';
import { teamSlugToEspnId } from '@/utils/espnTeamIds';

interface SpringGame {
  program: string;
  conference: string;
  date: string;
}

const CONFERENCE_ORDER = ['SEC', 'B1G', 'Big 12', 'ACC', 'Pac-12', 'American', 'Sun Belt', 'MAC', 'MWC', 'CUSA', 'Ind.'];

const CONFERENCE_DISPLAY: Record<string, string> = {
  'SEC': 'SEC',
  'B1G': 'Big Ten',
  'Big 12': 'Big 12',
  'ACC': 'ACC',
  'Pac-12': 'Pac-12',
  'American': 'American',
  'Sun Belt': 'Sun Belt',
  'MAC': 'MAC',
  'MWC': 'Mountain West',
  'CUSA': 'Conference USA',
  'Ind.': 'Independent',
};

type ViewMode = 'all' | 'dated' | 'tbd';

export default function SpringGamesClient() {
  const [games, setGames] = useState<SpringGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [teamSearch, setTeamSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(getApiPath('api/cfb/spring-games'), {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;
        if (!response.ok) throw new Error('Failed to fetch spring game schedule');

        const data = await response.json();
        if (!abortController.signal.aborted) {
          setGames(data.games || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load spring game schedule');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { abortController.abort(); };
  }, []);

  const conferences = useMemo(() => {
    const unique = [...new Set(games.map((g) => g.conference))];
    return unique.sort((a, b) => {
      const aIdx = CONFERENCE_ORDER.indexOf(a);
      const bIdx = CONFERENCE_ORDER.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [games]);

  const filteredGames = useMemo(() => {
    let filtered = games;

    if (selectedConference !== 'all') {
      filtered = filtered.filter((g) => g.conference === selectedConference);
    }

    if (teamSearch.trim()) {
      const searchLower = teamSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (g) =>
          g.program.toLowerCase().includes(searchLower) ||
          g.conference.toLowerCase().includes(searchLower)
      );
    }

    if (viewMode === 'dated') {
      filtered = filtered.filter((g) => g.date);
    } else if (viewMode === 'tbd') {
      filtered = filtered.filter((g) => !g.date);
    }

    return filtered;
  }, [games, selectedConference, teamSearch, viewMode]);

  // Group by conference for the conference view
  const groupedByConference = useMemo(() => {
    const groups: Record<string, SpringGame[]> = {};
    for (const game of filteredGames) {
      if (!groups[game.conference]) {
        groups[game.conference] = [];
      }
      groups[game.conference].push(game);
    }

    // Sort conferences
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      const aIdx = CONFERENCE_ORDER.indexOf(a);
      const bIdx = CONFERENCE_ORDER.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [filteredGames]);

  const stats = useMemo(() => {
    const total = games.length;
    const dated = games.filter((g) => g.date).length;
    const tbd = total - dated;
    return { total, dated, tbd };
  }, [games]);

  return (
    <>
      {/* Hero Section */}
      <header
        className="text-white shadow-lg"
        style={{
          background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
        }}
      >
        <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
            Spring Game Schedule
          </h1>
          <p className="text-lg opacity-90 font-medium">
            2025 college football spring games, showcases &amp; scrimmages
          </p>
        </div>
      </header>

      {/* Ad Slot */}
      <div className="container mx-auto px-4 min-h-[110px]">
        <div className="raptive-pfn-header-90"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        {!loading && !error && (
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Total Teams</span>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Dates Set</span>
              <p className="text-xl font-bold text-green-700">{stats.dated}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 shadow-sm">
              <span className="text-xs text-gray-500 uppercase tracking-wider">TBD</span>
              <p className="text-xl font-bold text-amber-600">{stats.tbd}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="sticky top-[48px] lg:top-0 z-20 bg-gray-50/95 backdrop-blur-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-3 border-b border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex gap-1">
                {([
                  ['all', 'All'],
                  ['dated', 'Date Set'],
                  ['tbd', 'TBD'],
                ] as [ViewMode, string][]).map(([mode, label]) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
                      viewMode === mode
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000] hover:text-[#800000]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Conference Filter */}
              <select
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white text-gray-900 cursor-pointer text-sm"
              >
                <option value="all">All Conferences</option>
                {conferences.map((conf) => (
                  <option key={conf} value={conf}>
                    {CONFERENCE_DISPLAY[conf] || conf}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md border border-gray-200 animate-pulse">
                <div className="px-4 py-3 bg-gray-200 rounded-t-xl">
                  <div className="h-5 bg-gray-300 rounded w-32"></div>
                </div>
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-40"></div>
                      <div className="ml-auto h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Content - grouped by conference */}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupedByConference.map(([conference, confGames]) => (
              <div
                key={conference}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200"
              >
                {/* Conference Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000] flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    {CONFERENCE_DISPLAY[conference] || conference}
                  </h2>
                  <span className="text-sm text-white/70">
                    {confGames.filter((g) => g.date).length}/{confGames.length} dates set
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                          Program
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                          Spring Game Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {confGames
                        .sort((a, b) => {
                          // Dated games first, then alphabetical
                          if (a.date && !b.date) return -1;
                          if (!a.date && b.date) return 1;
                          return a.program.localeCompare(b.program);
                        })
                        .map((game) => {
                          const teamData = getTeamById(game.program);
                          const espnId = teamData ? teamSlugToEspnId[teamData.slug] : undefined;
                          const logo = espnId ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png` : undefined;

                          return (
                            <tr
                              key={game.program}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="relative w-7 h-7 flex-shrink-0">
                                    {logo ? (
                                      <img
                                        src={logo}
                                        alt={game.program}
                                        className="absolute inset-0 w-full h-full object-contain"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-xs text-gray-500">
                                          {game.program.charAt(0)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {teamData ? (
                                    <Link
                                      href={`/teams/${teamData.slug}`}
                                      className="font-medium text-gray-900 text-sm hover:text-[#800000] hover:underline"
                                    >
                                      {game.program}
                                    </Link>
                                  ) : (
                                    <span className="font-medium text-gray-900 text-sm">
                                      {game.program}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {game.date ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    {game.date}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">
                                    TBD
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
        {!loading && !error && filteredGames.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {teamSearch
              ? `No teams found matching "${teamSearch}"`
              : 'No spring game data available'}
          </div>
        )}
      </div>

      <Footer currentPage="CFB" />
    </>
  );
}
