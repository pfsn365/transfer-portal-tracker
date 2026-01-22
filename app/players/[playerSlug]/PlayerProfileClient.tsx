'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';

interface PlayerProfile {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  lastName: string;
  jersey: string;
  position: string;
  positionName: string;
  height: string;
  weight: string;
  class: string;
  hometown: string;
  highSchool: string;
  birthDate: string;
  headshot: string;
  team: {
    id: string;
    slug: string;
    name: string;
    abbreviation: string;
    logo: string;
    primaryColor: string;
  };
  currentSeasonStats: Record<string, {
    categories: string[];
    values: number[];
    labels: string[];
  }> | null;
  careerStats: Array<{
    category: string;
    displayName: string;
    seasons: Array<{
      season: string;
      team: string;
      teamAbbr: string;
      stats: {
        categories: string[];
        values: number[];
        labels: string[];
      };
    }>;
  }>;
  gameLog: Array<{
    gameId: string;
    date: string;
    opponent: string;
    opponentAbbr: string;
    opponentLogo: string;
    homeAway: string;
    result: string;
    score: string;
    stats: {
      categories: string[];
      values: number[];
      labels: string[];
    };
  }>;
  availableSeasons: Array<{
    value: string;
    displayValue: string;
  }>;
}

interface Props {
  playerSlug: string;
}

// Get local player headshot URL
function getLocalHeadshotUrl(playerSlug: string): string {
  return `/cfb-hq/player-images/${playerSlug}.png`;
}

export default function PlayerProfileClient({ playerSlug }: Props) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [gameLogLoading, setGameLogLoading] = useState(false);
  const [currentGameLog, setCurrentGameLog] = useState<PlayerProfile['gameLog']>([]);
  const [selectedStatCategory, setSelectedStatCategory] = useState<string>('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/cfb-hq/api/players/${playerSlug}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Player not found');
          }
          throw new Error('Failed to fetch player data');
        }

        const playerData = await response.json();
        setPlayer(playerData);
        setCurrentGameLog(playerData.gameLog || []);

        // Set default season to the first available one
        if (playerData.availableSeasons?.length > 0) {
          setSelectedSeason(playerData.availableSeasons[0].value);
        }

        // Set default stat category
        if (playerData.careerStats?.length > 0) {
          setSelectedStatCategory(playerData.careerStats[0].category);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [playerSlug]);

  // Fetch game log when season changes
  useEffect(() => {
    if (!player || !selectedSeason) return;

    // If it's the default (current) season, use the already-loaded data
    const currentSeasonValue = player.availableSeasons?.[0]?.value;
    if (selectedSeason === currentSeasonValue) {
      setCurrentGameLog(player.gameLog);
      return;
    }

    const controller = new AbortController();

    async function fetchGameLog() {
      setGameLogLoading(true);
      try {
        const response = await fetch(
          `/cfb-hq/api/players/${playerSlug}?season=${selectedSeason}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          setCurrentGameLog(data.gameLog || []);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching game log:', err);
        }
      } finally {
        setGameLogLoading(false);
      }
    }

    fetchGameLog();

    return () => controller.abort();
  }, [selectedSeason, player, playerSlug]);

  // Sidebar layout wrapper
  const SidebarLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 w-64 h-screen z-10">
          <CFBSidebar />
        </div>
      </div>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20">
        <CFBSidebar isMobile={true} />
      </div>
      <main className="flex-1 lg:ml-64 min-w-0">
        {children}
        <Footer />
      </main>
    </div>
  );

  if (loading) {
    return (
      <SidebarLayout>
        <div className="pt-[57px] lg:pt-0">
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <svg
                className="animate-spin h-12 w-12 mx-auto mb-4 text-[#800000]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-gray-600 font-medium">Loading player profile...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !player) {
    return (
      <SidebarLayout>
        <div className="pt-[57px] lg:pt-0">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-red-800 font-semibold mb-1">
                    {error === 'Player not found' ? 'Player Not Found' : 'Error Loading Player'}
                  </h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  <Link
                    href="/players"
                    className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Browse All Players
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Get the selected stat category data
  const selectedCategoryData = player.careerStats.find(c => c.category === selectedStatCategory);

  return (
    <SidebarLayout>
      {/* Hero Section with Team Primary Color */}
      <div className="text-white pt-[57px] lg:pt-0" style={{ backgroundColor: player.team?.primaryColor || '#800000' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Player Headshot with circular white background */}
            <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
              <img
                src={getLocalHeadshotUrl(playerSlug)}
                alt={player.name}
                className="w-full h-full object-cover object-[center_15%] scale-[1.4]"
                onError={(e) => {
                  // Fallback to ESPN headshot if local image doesn't exist
                  (e.target as HTMLImageElement).src = player.headshot;
                }}
              />
            </div>

            {/* Player Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {player.name}
                {player.jersey && <span className="text-white/70 ml-3">#{player.jersey}</span>}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-white/80">
                {player.team.logo && (
                  <img
                    src={player.team.logo}
                    alt={player.team.name}
                    className="w-6 h-6"
                  />
                )}
                <Link
                  href={`/teams/${player.team.slug}`}
                  className="font-medium hover:text-white transition-colors"
                >
                  {player.team.name}
                </Link>
                <span className="text-white/50">|</span>
                <span>{player.positionName || player.position}</span>
                {player.class && (
                  <>
                    <span className="text-white/50">|</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20">
                      {player.class}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 h-[120px] flex items-center justify-center">
        <div className="raptive-pfn-header-90 w-full h-full"></div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* Player Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Information</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Height</dt>
              <dd className="font-medium text-gray-900">{player.height || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Weight</dt>
              <dd className="font-medium text-gray-900">{player.weight || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Class</dt>
              <dd className="font-medium text-gray-900">{player.class || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Position</dt>
              <dd className="font-medium text-gray-900">{player.position || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Hometown</dt>
              <dd className="font-medium text-gray-900">{player.hometown || '—'}</dd>
            </div>
            {player.highSchool && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">High School</dt>
                <dd className="font-medium text-gray-900">{player.highSchool}</dd>
              </div>
            )}
            {player.birthDate && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Birth Date</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(player.birthDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </dd>
              </div>
            )}
          </div>
        </div>

        {/* Game Log Section */}
        {(currentGameLog.length > 0 || player.availableSeasons.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Game Log</h2>
              {player.availableSeasons.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="season-select" className="text-sm text-gray-600">Season:</label>
                  <select
                    id="season-select"
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  >
                    {player.availableSeasons.map((season) => (
                      <option key={season.value} value={season.value}>
                        {season.displayValue}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {gameLogLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="animate-spin h-8 w-8 text-[#800000]"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            ) : currentGameLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No game data available for this season
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">OPP</th>
                      <th className="text-center py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">Result</th>
                      {currentGameLog[0]?.stats.categories.slice(0, 8).map((cat) => (
                        <th key={cat} className="text-center py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">
                          {cat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentGameLog.map((game, idx) => {
                      const gameDate = new Date(game.date);
                      return (
                        <tr
                          key={game.gameId}
                          className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                        >
                          <td className="py-3 px-2 font-medium text-gray-900 whitespace-nowrap">
                            {gameDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-2 text-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{game.homeAway === 'away' ? '@' : 'vs'}</span>
                              {game.opponentLogo && (
                                <Image
                                  src={game.opponentLogo}
                                  alt={game.opponentAbbr}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5 object-contain"
                                  unoptimized
                                />
                              )}
                              <span>{game.opponentAbbr || game.opponent}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center whitespace-nowrap">
                            <span className={`font-medium ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                              {game.result} {game.score}
                            </span>
                          </td>
                          {game.stats.values.slice(0, 8).map((value, colIdx) => (
                            <td key={colIdx} className="py-3 px-2 text-center text-gray-700 whitespace-nowrap">
                              {typeof value === 'number' ? value.toFixed(0) : value}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Career Stats Section */}
        {player.careerStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Career Stats</h2>
              {player.careerStats.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {player.careerStats.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedStatCategory(cat.category)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedStatCategory === cat.category
                          ? 'bg-[#800000] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.displayName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCategoryData && selectedCategoryData.seasons.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">Season</th>
                      <th className="text-left py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">Team</th>
                      {selectedCategoryData.seasons[0]?.stats.categories.map((cat) => (
                        <th key={cat} className="text-center py-3 px-2 font-semibold text-gray-600 bg-gray-50 whitespace-nowrap">
                          {cat}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCategoryData.seasons.map((season, idx) => (
                      <tr
                        key={`${season.season}-${idx}`}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="py-3 px-2 font-medium text-gray-900 whitespace-nowrap">{season.season}</td>
                        <td className="py-3 px-2 text-gray-700 whitespace-nowrap">{season.teamAbbr || season.team}</td>
                        {season.stats.values.map((value, colIdx) => (
                          <td key={colIdx} className="py-3 px-2 text-center text-gray-700 whitespace-nowrap">
                            {typeof value === 'number'
                              ? Number.isInteger(value) ? value : value.toFixed(1)
                              : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Back to Players Link */}
        <div className="mt-6">
          <Link
            href="/players"
            className="inline-flex items-center gap-2 text-[#800000] hover:text-[#600000] font-medium"
          >
            ← Back to All Players
          </Link>
        </div>
      </div>
    </SidebarLayout>
  );
}
