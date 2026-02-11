'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { fetcher } from '@/utils/swr';

interface DraftTabProps {
  team: Team;
  teamColor: string;
}

interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
}

interface DraftStats {
  totalPicks: number;
  firstRoundPicks: number;
  topTenPicks: number;
  recentPicks: number;
  picksByRound: Record<number, number>;
  picksByPosition: Record<string, number>;
  picksByDecade: Record<string, number>;
}

interface DraftApiResponse {
  team: string;
  teamId: string;
  slug: string;
  conference: string;
  draftPicks: DraftPick[];
  stats: DraftStats;
  lastUpdated: string;
}

// Skeleton component for loading state
function DraftSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  );
}

// Stats card component
function StatCard({ label, value, subtext, teamColor }: { label: string; value: number | string; subtext?: string; teamColor: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: teamColor }}>{value}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

// Sort indicator component
function SortIndicator({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return null;
  return direction === 'asc'
    ? <svg className="w-3 h-3 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    : <svg className="w-3 h-3 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
}

type SortColumn = 'year' | 'round' | 'pick' | 'name' | 'position' | 'nflTeam';
type SortDirection = 'asc' | 'desc';

export default function DraftTab({ team, teamColor }: DraftTabProps) {
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterRound, setFilterRound] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('year');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      // Default directions: year desc, pick/round asc, others asc
      setSortDirection(column === 'year' ? 'desc' : 'asc');
    }
  };

  // Fetch draft data
  const { data, error, isLoading } = useSWR<DraftApiResponse>(
    `/cfb-hq/api/cfb/teams/draft/${team.slug}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    if (!data?.draftPicks) return { years: [], rounds: [], positions: [] };

    const years = [...new Set(data.draftPicks.map(p => p.year))].sort((a, b) => b - a);
    const rounds = [...new Set(data.draftPicks.map(p => p.round))].sort((a, b) => a - b);
    const positions = [...new Set(data.draftPicks.map(p => p.position))].sort();

    return { years, rounds, positions };
  }, [data?.draftPicks]);

  // Filter and sort draft picks
  const filteredPicks = useMemo(() => {
    if (!data?.draftPicks) return [];

    const filtered = data.draftPicks.filter(pick => {
      if (filterYear !== 'all' && pick.year !== parseInt(filterYear)) return false;
      if (filterRound !== 'all' && pick.round !== parseInt(filterRound)) return false;
      if (filterPosition !== 'all' && pick.position !== filterPosition) return false;
      return true;
    });

    // Sort picks
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'round':
          comparison = a.round - b.round;
          break;
        case 'pick':
          comparison = a.pick - b.pick;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'nflTeam':
          comparison = a.nflTeam.localeCompare(b.nflTeam);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.draftPicks, filterYear, filterRound, filterPosition, sortColumn, sortDirection]);

  // Calculate most common NFL team
  const mostCommonNFLTeam = useMemo(() => {
    if (!data?.draftPicks || data.draftPicks.length === 0) return null;

    const teamCounts: Record<string, number> = {};
    data.draftPicks.forEach(pick => {
      teamCounts[pick.nflTeam] = (teamCounts[pick.nflTeam] || 0) + 1;
    });

    let maxTeam = '';
    let maxCount = 0;
    Object.entries(teamCounts).forEach(([nflTeam, count]) => {
      if (count > maxCount) {
        maxTeam = nflTeam;
        maxCount = count;
      }
    });

    return { team: maxTeam, count: maxCount };
  }, [data?.draftPicks]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <DraftSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Failed to load draft history</p>
          <p className="text-gray-500 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
          <h3 className="text-lg font-bold text-white">NFL Draft History (Since 2020)</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Total Drafted"
              value={stats?.totalPicks || 0}
              subtext="Since 2020"
              teamColor={teamColor}
            />
            <StatCard
              label="1st Round Picks"
              value={stats?.firstRoundPicks || 0}
              subtext={stats?.topTenPicks ? `${stats.topTenPicks} Top 10` : undefined}
              teamColor={teamColor}
            />
            <StatCard
              label="Favorite NFL Team"
              value={mostCommonNFLTeam?.team || '-'}
              subtext={mostCommonNFLTeam ? `${mostCommonNFLTeam.count} players` : undefined}
              teamColor={teamColor}
            />
          </div>
        </div>
      </div>

      {/* All Draft Picks */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">All Draft Picks</h3>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Years</option>
              {filterOptions.years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Rounds</option>
              {filterOptions.rounds.map(round => (
                <option key={round} value={round}>Round {round}</option>
              ))}
            </select>

            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Positions</option>
              {filterOptions.positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            {(filterYear !== 'all' || filterRound !== 'all' || filterPosition !== 'all') && (
              <button
                onClick={() => {
                  setFilterYear('all');
                  setFilterRound('all');
                  setFilterPosition('all');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Showing {filteredPicks.length} of {data?.draftPicks?.length || 0} picks
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs font-semibold text-gray-600 border-b border-gray-200 bg-gray-50">
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('year')}
                >
                  Year
                  <SortIndicator active={sortColumn === 'year'} direction={sortColumn === 'year' ? sortDirection : 'desc'} />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('round')}
                >
                  Round
                  <SortIndicator active={sortColumn === 'round'} direction={sortColumn === 'round' ? sortDirection : 'asc'} />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('pick')}
                >
                  Pick
                  <SortIndicator active={sortColumn === 'pick'} direction={sortColumn === 'pick' ? sortDirection : 'asc'} />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('name')}
                >
                  Player
                  <SortIndicator active={sortColumn === 'name'} direction={sortColumn === 'name' ? sortDirection : 'asc'} />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('position')}
                >
                  Pos
                  <SortIndicator active={sortColumn === 'position'} direction={sortColumn === 'position' ? sortDirection : 'asc'} />
                </th>
                <th
                  className="text-left py-3 px-4 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('nflTeam')}
                >
                  NFL Team
                  <SortIndicator active={sortColumn === 'nflTeam'} direction={sortColumn === 'nflTeam' ? sortDirection : 'asc'} />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPicks.map((pick, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${pick.round === 1 ? 'bg-yellow-50' : ''}`}
                >
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">{pick.year}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${pick.round === 1 ? 'font-bold' : ''}`} style={pick.round === 1 ? { color: teamColor } : {}}>
                      {pick.round}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700">#{pick.pick}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-900">{pick.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{pick.position}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-700">{pick.nflTeam}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPicks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No draft picks found matching your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
