'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import { getApiPath } from '@/utils/api';

// Helper to create player image slug from name
function createPlayerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper to get player initials
function getPlayerInitials(name: string): string {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '??';
}

// Player headshot component with local image fallback
function PlayerHeadshot({ name, className = "w-10 h-10" }: { name: string; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const slug = createPlayerSlug(name);

  if (imageError) {
    return (
      <div className={`${className} rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0`}>
        <span className="text-xs font-bold text-gray-500">
          {getPlayerInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`/cfb-hq/player-images/${slug}.png`}
      alt={`${name} headshot`}
      className={`${className} rounded-full object-cover bg-gray-100 border border-gray-200 flex-shrink-0`}
      onError={() => setImageError(true)}
    />
  );
}

interface StatLeader {
  playerId: string;
  name: string;
  value: string;
  numericValue: number;
  position: string;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  conference: string;
  conferenceId: string;
  gamesPlayed: number;
  classYear: string;
}

interface CategoryData {
  name: string;
  displayName: string;
  group: string;
  leaders: StatLeader[];
}

// Position color helper based on position groups
const getPositionStyle = (position: string): string => {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'bg-purple-100 text-purple-700';
  if (['RB', 'FB', 'HB'].includes(pos)) return 'bg-green-100 text-green-700';
  if (['WR', 'TE'].includes(pos)) return 'bg-blue-100 text-blue-700';
  if (['OL', 'OT', 'OG', 'OC', 'IOL', 'T', 'G', 'C'].includes(pos)) return 'bg-amber-100 text-amber-700';
  if (['K', 'P', 'LS', 'PK'].includes(pos)) return 'bg-slate-200 text-slate-700';
  if (['DE', 'EDGE', 'OLB'].includes(pos)) return 'bg-red-100 text-red-700';
  if (['DT', 'NT', 'DL'].includes(pos)) return 'bg-rose-100 text-rose-700';
  if (['LB', 'ILB', 'MLB'].includes(pos)) return 'bg-orange-100 text-orange-700';
  if (['CB'].includes(pos)) return 'bg-cyan-100 text-cyan-700';
  if (['S', 'SAF', 'DB', 'FS', 'SS'].includes(pos)) return 'bg-teal-100 text-teal-700';
  return 'bg-gray-100 text-gray-700';
};

const CATEGORY_LABELS: Record<string, { short: string; color: string }> = {
  // Passing
  passingYards: { short: 'PASS YDS', color: 'bg-purple-100 text-purple-800' },
  passingTouchdowns: { short: 'PASS TD', color: 'bg-purple-100 text-purple-800' },
  completionPct: { short: 'COMP %', color: 'bg-purple-100 text-purple-800' },
  yardsPerPassAttempt: { short: 'YDS/ATT', color: 'bg-purple-100 text-purple-800' },
  // Rushing
  rushingYards: { short: 'RUSH YDS', color: 'bg-green-100 text-green-800' },
  rushingTouchdowns: { short: 'RUSH TD', color: 'bg-green-100 text-green-800' },
  yardsPerRushAttempt: { short: 'YDS/CAR', color: 'bg-green-100 text-green-800' },
  longRushing: { short: 'LONG', color: 'bg-green-100 text-green-800' },
  // Receiving
  receivingYards: { short: 'REC YDS', color: 'bg-blue-100 text-blue-800' },
  receivingTouchdowns: { short: 'REC TD', color: 'bg-blue-100 text-blue-800' },
  receptions: { short: 'REC', color: 'bg-blue-100 text-blue-800' },
  yardsPerReception: { short: 'YDS/REC', color: 'bg-blue-100 text-blue-800' },
  longReception: { short: 'LONG', color: 'bg-blue-100 text-blue-800' },
  // Defense
  totalTackles: { short: 'TACK', color: 'bg-red-100 text-red-800' },
  sacks: { short: 'SACK', color: 'bg-red-100 text-red-800' },
  defensiveInterceptions: { short: 'INT', color: 'bg-red-100 text-red-800' },
  tacklesForLoss: { short: 'TFL', color: 'bg-red-100 text-red-800' },
  forcedFumbles: { short: 'FF', color: 'bg-red-100 text-red-800' },
  passesDefended: { short: 'PD', color: 'bg-red-100 text-red-800' },
  // Special Teams
  puntReturnYards: { short: 'PR YDS', color: 'bg-orange-100 text-orange-800' },
  kickReturnYards: { short: 'KR YDS', color: 'bg-orange-100 text-orange-800' },
  puntReturnTouchdowns: { short: 'PR TD', color: 'bg-orange-100 text-orange-800' },
  kickReturnTouchdowns: { short: 'KR TD', color: 'bg-orange-100 text-orange-800' },
  fieldGoalPct: { short: 'FG %', color: 'bg-orange-100 text-orange-800' },
};

// Stat groups for tabs
const STAT_GROUPS = [
  { key: 'passing', name: 'Passing', color: 'purple' },
  { key: 'rushing', name: 'Rushing', color: 'green' },
  { key: 'receiving', name: 'Receiving', color: 'blue' },
  { key: 'defense', name: 'Defense', color: 'red' },
];

// FBS Conferences
const FBS_CONFERENCES = [
  'SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12',
  'American', 'Mountain West', 'Sun Belt', 'MAC', 'C-USA',
  'Independent'
];

type SortField = 'rank' | 'name' | 'position' | 'team' | 'class' | 'gp' | 'value';
type SortDirection = 'asc' | 'desc';

export default function StatLeadersClient() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('passing');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);
  const [division, setDivision] = useState<'fbs' | 'fcs'>('fbs');
  const [statType, setStatType] = useState<'total' | 'perGame'>('total');
  const [conferenceFilter, setConferenceFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setSelectedCategory(null);
        const group = division === 'fbs' ? '80' : '81';
        const response = await fetch(getApiPath(`api/cfb/stat-leaders?group=${group}&statType=total`), {
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        if (!response.ok) throw new Error('Failed to fetch stat leaders');

        const data = await response.json();
        if (!abortController.signal.aborted) {
          setCategories(data.categories || []);
          // Set first category of selected group
          const groupCategories = (data.categories || []).filter((c: CategoryData) => c.group === selectedGroup);
          if (groupCategories.length > 0) {
            setSelectedCategory(groupCategories[0].name);
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load stat leaders');
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

  // Update selected category when group changes
  useEffect(() => {
    const groupCategories = categories.filter(c => c.group === selectedGroup);
    if (groupCategories.length > 0 && !groupCategories.find(c => c.name === selectedCategory)) {
      setSelectedCategory(groupCategories[0].name);
      setDisplayCount(25);
    }
  }, [selectedGroup, categories]);

  // Get categories for the selected group
  const groupCategories = useMemo(() => {
    return categories.filter(c => c.group === selectedGroup);
  }, [categories, selectedGroup]);

  // Calculate per-game value
  const calculatePerGame = (value: string, gamesPlayed: number): string => {
    if (gamesPlayed === 0) return '0.0';
    const numValue = parseFloat(value);
    const perGame = numValue / gamesPlayed;
    return perGame.toFixed(1);
  };

  // Get display value based on per-game toggle
  const getDisplayValue = (player: StatLeader): string => {
    if (statType === 'total') return player.value;
    return calculatePerGame(player.value, player.gamesPlayed);
  };

  // Get numeric value for sorting
  const getNumericValue = (player: StatLeader): number => {
    if (statType === 'total') return player.numericValue;
    return player.gamesPlayed > 0 ? player.numericValue / player.gamesPlayed : 0;
  };

  // Get the selected category data
  const selectedCategoryData = categories.find(c => c.name === selectedCategory);

  // Calculate displayed leaders with filtering and sorting
  const displayedLeaders = useMemo(() => {
    if (!selectedCategoryData) return [];

    let leaders = [...selectedCategoryData.leaders];

    // Filter by conference
    if (conferenceFilter !== 'all') {
      leaders = leaders.filter(l => l.conference === conferenceFilter);
    }

    // Sort based on current sort field and direction
    leaders.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'position':
          comparison = a.position.localeCompare(b.position);
          break;
        case 'team':
          comparison = a.teamName.localeCompare(b.teamName);
          break;
        case 'class':
          const classOrder = { 'FR': 1, 'SO': 2, 'JR': 3, 'SR': 4 };
          comparison = (classOrder[a.classYear as keyof typeof classOrder] || 5) - (classOrder[b.classYear as keyof typeof classOrder] || 5);
          break;
        case 'gp':
          comparison = a.gamesPlayed - b.gamesPlayed;
          break;
        case 'value':
        case 'rank':
        default:
          comparison = getNumericValue(b) - getNumericValue(a);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return leaders.slice(0, displayCount);
  }, [selectedCategoryData, conferenceFilter, sortField, sortDirection, displayCount, statType]);

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'value' || field === 'rank' ? 'desc' : 'asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-700';
    if (rank === 3) return 'bg-amber-600 text-amber-100';
    return 'bg-gray-100 text-gray-800';
  };

  // Get unique conferences from current leaders
  const availableConferences = useMemo(() => {
    const confs = new Set<string>();
    categories.forEach(cat => {
      cat.leaders.forEach(leader => {
        if (leader.conference) confs.add(leader.conference);
      });
    });
    return Array.from(confs).sort();
  }, [categories]);

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
              CFB Stat Leaders
            </h1>
            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl opacity-90">
              2025 {division === 'fbs' ? 'FBS' : 'FCS'} statistical leaders
            </p>
          </div>
        </div>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Controls Row */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left side: Division Toggle & Conference Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-lg overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setDivision('fbs')}
                    className={`px-4 py-2 font-semibold text-sm transition-all cursor-pointer ${
                      division === 'fbs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    FBS
                  </button>
                  <button
                    onClick={() => setDivision('fcs')}
                    className={`px-4 py-2 font-semibold text-sm transition-all cursor-pointer border-l border-gray-300 ${
                      division === 'fcs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    FCS
                  </button>
                </div>

                {/* Conference Filter */}
                <select
                  value={conferenceFilter}
                  onChange={(e) => setConferenceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white text-gray-900 cursor-pointer text-sm"
                >
                  <option value="all">All Conferences</option>
                  {availableConferences.map((conf) => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              </div>

              {/* Right side: Per-Game Toggle */}
              <button
                onClick={() => setStatType(statType === 'total' ? 'perGame' : 'total')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  statType === 'perGame'
                    ? 'bg-[#800000] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-[#800000]'
                }`}
              >
                {statType === 'perGame' ? 'Per Game' : 'Total Stats'}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-600">Loading stat leaders...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Stat Group Tabs */}
              <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-200">
                  {STAT_GROUPS.map((group) => {
                    const isSelected = selectedGroup === group.key;
                    const hasCategories = categories.some(c => c.group === group.key);
                    return (
                      <button
                        key={group.key}
                        onClick={() => setSelectedGroup(group.key)}
                        disabled={!hasCategories}
                        className={`flex-shrink-0 px-6 py-3 font-semibold text-sm transition-all cursor-pointer border-b-2 ${
                          isSelected
                            ? 'border-[#800000] text-[#800000] bg-gray-50'
                            : hasCategories
                            ? 'border-transparent text-gray-600 hover:text-[#800000] hover:bg-gray-50'
                            : 'border-transparent text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {group.name}
                      </button>
                    );
                  })}
                </div>

                {/* Category Selection within group */}
                <div className="p-4 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {groupCategories.map((category) => {
                      const label = CATEGORY_LABELS[category.name] || { short: category.displayName, color: 'bg-gray-100 text-gray-800' };
                      const isSelected = selectedCategory === category.name;
                      return (
                        <button
                          key={category.name}
                          onClick={() => {
                            setSelectedCategory(category.name);
                            setDisplayCount(25);
                            setSortField('rank');
                            setSortDirection('asc');
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#800000] text-white'
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-[#800000] hover:text-[#800000]'
                          }`}
                        >
                          {label.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leaders Table */}
              {selectedCategoryData && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="bg-[#800000] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                      {selectedCategoryData.displayName}
                      {conferenceFilter !== 'all' && (
                        <span className="ml-2 text-sm font-normal opacity-80">({conferenceFilter})</span>
                      )}
                    </h2>
                  </div>

                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th
                            onClick={() => handleSort('rank')}
                            className="pl-6 pr-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            Rank <SortIndicator field="rank" />
                          </th>
                          <th
                            onClick={() => handleSort('name')}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            Player <SortIndicator field="name" />
                          </th>
                          <th
                            onClick={() => handleSort('position')}
                            className="hidden sm:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-20 cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            Pos <SortIndicator field="position" />
                          </th>
                          <th
                            onClick={() => handleSort('team')}
                            className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            Team <SortIndicator field="team" />
                          </th>
                          <th
                            onClick={() => handleSort('class')}
                            className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            Class <SortIndicator field="class" />
                          </th>
                          <th
                            onClick={() => handleSort('gp')}
                            className="hidden lg:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            GP <SortIndicator field="gp" />
                          </th>
                          <th
                            onClick={() => handleSort('value')}
                            className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24 cursor-pointer hover:bg-gray-100 bg-gray-50"
                          >
                            {CATEGORY_LABELS[selectedCategoryData.name]?.short || 'Value'} <SortIndicator field="value" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedLeaders.map((leader, index) => (
                            <tr
                              key={leader.playerId || index}
                              className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <td className="pl-6 pr-4 py-4">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getMedalColor(index + 1)}`}>
                                  {index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <PlayerHeadshot name={leader.name} />
                                  <div>
                                    <div className="font-semibold text-gray-900">{leader.name}</div>
                                    <div className="text-sm text-gray-500 sm:hidden">{leader.position}</div>
                                    <div className="text-xs text-gray-400 md:hidden">{leader.teamAbbreviation || leader.teamName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden sm:table-cell px-4 py-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold ${getPositionStyle(leader.position)}`}>
                                  {leader.position}
                                </span>
                              </td>
                              <td className="hidden md:table-cell px-4 py-4">
                                <div className="flex items-center gap-2">
                                  {leader.teamLogo && (
                                    <div className="w-6 h-6 relative flex-shrink-0">
                                      <Image
                                        src={leader.teamLogo}
                                        alt={leader.teamName}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                  )}
                                  <span className="text-gray-700 truncate">{leader.teamName}</span>
                                </div>
                              </td>
                              <td className="hidden lg:table-cell px-4 py-4 text-center">
                                <span className="text-gray-600 text-sm">{leader.classYear || '-'}</span>
                              </td>
                              <td className="hidden lg:table-cell px-4 py-4 text-center">
                                <span className="text-gray-600">{leader.gamesPlayed}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-lg font-bold text-[#800000]">{getDisplayValue(leader)}</span>
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Show Top N Buttons */}
                  {selectedCategoryData.leaders.length > 25 && (
                    <div className="p-4 border-t border-gray-200 flex justify-center gap-3">
                      {displayCount < 50 && selectedCategoryData.leaders.length >= 26 && (
                        <button
                          onClick={() => setDisplayCount(50)}
                          className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-all bg-white border border-gray-300 hover:border-[#800000] hover:text-[#800000] text-gray-700"
                        >
                          Show Top 50
                        </button>
                      )}
                      {displayCount < 100 && selectedCategoryData.leaders.length >= 51 && (
                        <button
                          onClick={() => setDisplayCount(100)}
                          className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-all bg-white border border-gray-300 hover:border-[#800000] hover:text-[#800000] text-gray-700"
                        >
                          Show Top 100
                        </button>
                      )}
                      {displayCount > 25 && (
                        <button
                          onClick={() => setDisplayCount(25)}
                          className="px-4 py-2 rounded-lg font-medium cursor-pointer transition-all bg-gray-100 hover:bg-gray-200 text-gray-600"
                        >
                          Show Less
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* No Data */}
              {categories.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No stat leaders data available</p>
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
