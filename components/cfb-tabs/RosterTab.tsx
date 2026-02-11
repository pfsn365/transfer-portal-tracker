'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { fetcher } from '@/utils/swr';
import LoadingSpinner from '@/components/LoadingSpinner';
import { createPlayerSlug } from '@/utils/playerHelpers';

interface RosterTabProps {
  team: Team;
  teamColor: string;
}

interface Player {
  id: string;
  name: string;
  jersey: string;
  position: string;
  height: string;
  weight: string;
  class: string;
  hometown: string;
  headshot?: string;
}

// Position groupings for organizing players
const positionGroups: Record<string, string[]> = {
  'Quarterbacks': ['QB'],
  'Running Backs': ['RB', 'FB'],
  'Wide Receivers': ['WR'],
  'Tight Ends': ['TE'],
  'Offensive Line': ['OT', 'OG', 'OL', 'C', 'G', 'T', 'LT', 'RT', 'LG', 'RG'],
  'Defensive Line': ['DE', 'DT', 'NT', 'DL'],
  'Linebackers': ['LB', 'OLB', 'ILB', 'MLB', 'EDGE'],
  'Defensive Backs': ['CB', 'S', 'FS', 'SS', 'DB'],
  'Special Teams': ['K', 'P', 'LS', 'PK'],
};

function getPositionGroup(position: string): string {
  for (const [group, positions] of Object.entries(positionGroups)) {
    if (positions.includes(position.toUpperCase())) {
      return group;
    }
  }
  return 'Other';
}

const positionOrder = [
  'Quarterbacks',
  'Running Backs',
  'Wide Receivers',
  'Tight Ends',
  'Offensive Line',
  'Defensive Line',
  'Linebackers',
  'Defensive Backs',
  'Special Teams',
  'Other',
];

export default function RosterTab({ team, teamColor }: RosterTabProps) {
  // SWR for data fetching with caching
  const { data, error, isLoading: loading } = useSWR(
    `/cfb-hq/api/teams/roster/${team.slug}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  const roster: Player[] = data?.roster || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('All');

  // Filter and group roster
  const filteredRoster = useMemo(() => {
    let filtered = roster;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.position.toLowerCase().includes(query) ||
        player.jersey.includes(query)
      );
    }

    // Apply position filter
    if (selectedPosition !== 'All') {
      filtered = filtered.filter(player => getPositionGroup(player.position) === selectedPosition);
    }

    return filtered;
  }, [roster, searchQuery, selectedPosition]);

  // Group by position
  const groupedRoster = useMemo(() => {
    const groups: Record<string, Player[]> = {};

    filteredRoster.forEach(player => {
      const group = getPositionGroup(player.position);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(player);
    });

    // Sort within each group by jersey number
    Object.keys(groups).forEach(group => {
      groups[group].sort((a, b) => {
        const numA = parseInt(a.jersey) || 999;
        const numB = parseInt(b.jersey) || 999;
        return numA - numB;
      });
    });

    return groups;
  }, [filteredRoster]);

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
            />
          </div>
          {/* Position Filter */}
          <div>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white cursor-pointer"
            >
              <option value="All">All Positions</option>
              {positionOrder.filter(g => g !== 'Other').map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Showing {filteredRoster.length} of {roster.length} players
        </p>
      </div>

      {/* Roster by Position Group */}
      {positionOrder.map(group => {
        const players = groupedRoster[group];
        if (!players || players.length === 0) return null;

        return (
          <div key={group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
              <h3 className="text-lg font-bold text-white">{group} ({players.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Pos</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Height</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Weight</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell">Hometown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {players.map((player, idx) => (
                    <tr key={player.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{player.jersey}</td>
                      <td className="px-4 py-3">
                        <Link href={`/players/${createPlayerSlug(player.name)}`} className="flex items-center gap-3 group">
                          {player.headshot && (
                            <Image
                              src={player.headshot}
                              alt={player.name}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium text-gray-900 group-hover:text-[#800000] transition-colors">{player.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{player.position}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{player.class}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{player.height}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{player.weight}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{player.hometown}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {filteredRoster.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">No players found matching your search</p>
        </div>
      )}
    </div>
  );
}
