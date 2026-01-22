'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PlayerProfile {
  id: string;
  name: string;
  slug: string;
  team: {
    id: string;
    name: string;
    slug: string;
    abbreviation: string;
    logo: string;
    primaryColor: string;
  };
  position: string;
  positionFull: string;
  jerseyNumber: string;
  class: string;
  height: string;
  weight: string;
  hometown: string;
  highSchool?: string;
  headshot?: string;
  stats?: {
    season: string;
    categories: Array<{
      name: string;
      stats: Record<string, string | number>;
    }>;
  };
  transferHistory?: Array<{
    fromSchool: string;
    toSchool: string;
    date: string;
  }>;
}

interface Props {
  playerSlug: string;
}

function getPositionFullName(pos: string): string {
  const positionMap: Record<string, string> = {
    'QB': 'Quarterback',
    'RB': 'Running Back',
    'FB': 'Fullback',
    'WR': 'Wide Receiver',
    'TE': 'Tight End',
    'OL': 'Offensive Line',
    'OT': 'Offensive Tackle',
    'OG': 'Offensive Guard',
    'C': 'Center',
    'DL': 'Defensive Line',
    'DE': 'Defensive End',
    'DT': 'Defensive Tackle',
    'NT': 'Nose Tackle',
    'LB': 'Linebacker',
    'ILB': 'Inside Linebacker',
    'OLB': 'Outside Linebacker',
    'MLB': 'Middle Linebacker',
    'CB': 'Cornerback',
    'S': 'Safety',
    'FS': 'Free Safety',
    'SS': 'Strong Safety',
    'K': 'Kicker',
    'P': 'Punter',
    'LS': 'Long Snapper',
    'ATH': 'Athlete',
  };
  return positionMap[pos.toUpperCase()] || pos;
}

export default function PlayerProfileClient({ playerSlug }: Props) {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function fetchPlayerData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/cfb-hq/api/players/${playerSlug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Player not found');
          } else {
            throw new Error('Failed to fetch player');
          }
          return;
        }
        const data = await response.json();
        setPlayer(data.player);
      } catch (err) {
        console.error('Error fetching player:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (playerSlug) {
      fetchPlayerData();
    }
  }, [playerSlug]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

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
      <main id="main-content" className="flex-1 lg:ml-64 min-w-0">
        {children}
        <Footer />
      </main>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <SidebarLayout>
        <div className="bg-gray-400 text-white pt-[57px] lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <LoadingSpinner />
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Error state
  if (error || !player) {
    return (
      <SidebarLayout>
        <div className="bg-gray-600 text-white pt-[57px] lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <Link href="/players" className="text-white/80 hover:text-white mb-4 inline-flex items-center gap-1">
              ← Back to Players
            </Link>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-xl mx-auto">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              {error === 'Player not found' ? 'Player Not Found' : 'Error Loading Player'}
            </h2>
            <p className="text-red-600 mb-4">
              {error === 'Player not found'
                ? 'The player you are looking for does not exist or has been moved.'
                : error}
            </p>
            <Link
              href="/players"
              className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Browse All Players
            </Link>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      {/* Hero Section with Team Primary Color */}
      <div
        className="text-white pt-[57px] lg:pt-3 lg:pb-3"
        style={{ backgroundColor: player.team?.primaryColor || '#800000' }}
      >
        <div className="container mx-auto px-4 py-3 lg:py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            {/* Player Info */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 mb-4 lg:mb-0">
              {/* Headshot */}
              <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 bg-white">
                {player.headshot && !imageError ? (
                  <img
                    src={player.headshot}
                    alt={player.name}
                    className="w-full h-full object-cover object-[center_15%] scale-[1.4]"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-3xl lg:text-4xl font-bold bg-gray-200 text-gray-600"
                  >
                    {getInitials(player.name)}
                  </div>
                )}
              </div>

              {/* Name and Details */}
              <div className="text-center sm:text-left">
                <h1 className="text-2xl lg:text-4xl font-bold">
                  {player.name} {player.jerseyNumber && <span className="font-normal opacity-60">#{player.jerseyNumber}</span>}
                </h1>

                <div className="flex items-center justify-center sm:justify-start gap-2 text-base lg:text-lg mt-2">
                  <Link href={`/teams/${player.team.slug}`} className="flex items-center gap-2 hover:opacity-80">
                    {player.team.logo && (
                      <img
                        src={player.team.logo}
                        alt={player.team.name}
                        className="w-6 h-6"
                      />
                    )}
                    <span className="font-medium">{player.team.name}</span>
                  </Link>
                  <span className="opacity-60">|</span>
                  <span className="opacity-90">{getPositionFullName(player.position)}</span>
                </div>

                {/* Class Badge */}
                {player.class && (
                  <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                    {player.class}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-6">
        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Player Information
          </h2>
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
          </div>
        </div>

        {/* Season Stats Section - Placeholder for future implementation */}
        {player.stats && player.stats.categories.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {player.stats.season} Stats
            </h2>
            <div className="space-y-4">
              {player.stats.categories.map((category) => (
                <div key={category.name} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                    {Object.entries(category.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <dt className="text-xs text-gray-500 uppercase">{key}</dt>
                        <dd className="font-semibold text-gray-900">{value}</dd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfer History Section */}
        {player.transferHistory && player.transferHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transfer History
            </h2>
            <div className="space-y-3">
              {player.transferHistory.map((transfer, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="text-gray-600">{transfer.fromSchool}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{transfer.toSchool}</span>
                  </div>
                  <span className="text-sm text-gray-500">{transfer.date}</span>
                </div>
              ))}
            </div>
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
