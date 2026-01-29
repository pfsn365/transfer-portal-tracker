'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { fetcher } from '@/utils/swr';

// Generate player slug from name
const getPlayerSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

interface StatsTabProps {
  team: Team;
  teamColor: string;
}

interface TeamStat {
  name: string;
  displayName: string;
  abbreviation: string;
  value: number;
  displayValue: string;
  perGameValue?: number;
  perGameDisplayValue?: string;
}

interface PlayerStat {
  playerId: string;
  name: string;
  position: string;
  headshot?: string;
  displayValue: string;
  value: number;
}

interface StatsApiResponse {
  team: string;
  teamStats: {
    passing: TeamStat[];
    rushing: TeamStat[];
    receiving: TeamStat[];
    defense: TeamStat[];
    scoring: TeamStat[];
    kicking: TeamStat[];
    punting: TeamStat[];
    returning: TeamStat[];
    general: TeamStat[];
  };
  playerStats: {
    passing: PlayerStat[];
    rushing: PlayerStat[];
    receiving: PlayerStat[];
    tackles: PlayerStat[];
    sacks: PlayerStat[];
    interceptions: PlayerStat[];
  };
  season: number;
  lastUpdated: string;
}

// Skeleton component for loading state
function StatsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2 mb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 rounded" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function StatsTab({ team, teamColor }: StatsTabProps) {
  const [viewType, setViewType] = useState<'team' | 'players'>('team');
  const [selectedCategory, setSelectedCategory] = useState('passing');

  // Fetch stats data
  const { data, error, isLoading } = useSWR<StatsApiResponse>(
    `/cfb-hq/api/cfb/teams/stats/${team.slug}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Team stat categories
  const teamCategories = useMemo(() => {
    if (!data?.teamStats) return [];
    return [
      { key: 'passing', name: 'Passing', data: data.teamStats.passing },
      { key: 'rushing', name: 'Rushing', data: data.teamStats.rushing },
      { key: 'receiving', name: 'Receiving', data: data.teamStats.receiving },
      { key: 'defense', name: 'Defense', data: data.teamStats.defense },
      { key: 'scoring', name: 'Scoring', data: data.teamStats.scoring },
      { key: 'kicking', name: 'Kicking', data: data.teamStats.kicking },
      { key: 'punting', name: 'Punting', data: data.teamStats.punting },
      { key: 'returning', name: 'Returns', data: data.teamStats.returning },
    ].filter(cat => cat.data && cat.data.length > 0);
  }, [data?.teamStats]);

  // Player stat categories
  const playerCategories = useMemo(() => {
    if (!data?.playerStats) return [];
    return [
      { key: 'passing', name: 'Passing', data: data.playerStats.passing },
      { key: 'rushing', name: 'Rushing', data: data.playerStats.rushing },
      { key: 'receiving', name: 'Receiving', data: data.playerStats.receiving },
      { key: 'tackles', name: 'Tackles', data: data.playerStats.tackles },
      { key: 'sacks', name: 'Sacks', data: data.playerStats.sacks },
      { key: 'interceptions', name: 'INTs', data: data.playerStats.interceptions },
    ].filter(cat => cat.data && cat.data.length > 0);
  }, [data?.playerStats]);

  const availableCategories = viewType === 'team' ? teamCategories : playerCategories;

  // Reset category when switching views if needed
  useEffect(() => {
    if (availableCategories.length > 0) {
      const exists = availableCategories.some(cat => cat.key === selectedCategory);
      if (!exists) {
        setSelectedCategory(availableCategories[0].key);
      }
    }
  }, [viewType, availableCategories, selectedCategory]);

  // Get current category data
  const currentCategory = availableCategories.find(cat => cat.key === selectedCategory);
  const currentData = currentCategory?.data || [];

  // Get player initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <StatsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load stats</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
        <h3 className="text-lg font-bold text-white">Team Statistics</h3>
      </div>

      <div className="p-4">
        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewType('team')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'team'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={viewType === 'team' ? { backgroundColor: teamColor } : {}}
          >
            Team Stats
          </button>
          <button
            onClick={() => setViewType('players')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewType === 'players'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={viewType === 'players' ? { backgroundColor: teamColor } : {}}
          >
            Player Stats
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-200">
          {availableCategories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Data Display */}
        {viewType === 'team' ? (
          // Team Stats Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                  <th className="text-left py-2 px-2">Statistic</th>
                  <th className="text-right py-2 px-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((stat: TeamStat, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <span className="text-sm font-medium text-gray-900">{stat.displayName}</span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-sm text-gray-700">{stat.displayValue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentData.length === 0 && (
              <p className="text-center text-gray-500 py-8">No stats available</p>
            )}
          </div>
        ) : (
          // Player Stats Table
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-200">
                  <th className="text-left py-2 px-2">Player</th>
                  <th className="text-left py-2 px-2">Pos</th>
                  <th className="text-right py-2 px-2">{currentCategory?.name || 'Value'}</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((player: PlayerStat, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        {player.headshot ? (
                          <Image
                            src={player.headshot}
                            alt={player.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: teamColor }}
                          >
                            {getInitials(player.name)}
                          </div>
                        )}
                        <Link
                          href={`/players/${getPlayerSlug(player.name)}`}
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          {player.name}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-sm text-gray-500">{player.position}</span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-sm font-semibold text-gray-900">{player.displayValue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {currentData.length === 0 && (
              <p className="text-center text-gray-500 py-8">No player stats available</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
