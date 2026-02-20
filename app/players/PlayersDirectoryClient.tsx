'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { getAllConferences, getTeamsByConference } from '@/data/teams';
import { Conference } from '@/types/player';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

interface Player {
  id: string;
  name: string;
  slug: string;
  jerseyNumber: string;
  position: string;
  class: string;
  height: string;
  weight: string;
  hometown: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogo: string;
  headshot?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPlayers: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const POSITIONS = [
  { value: 'all', label: 'All Positions' },
  { value: 'QB', label: 'QB' },
  { value: 'RB', label: 'RB' },
  { value: 'WR', label: 'WR' },
  { value: 'TE', label: 'TE' },
  { value: 'OL', label: 'OL' },
  { value: 'DT', label: 'DT' },
  { value: 'EDGE', label: 'EDGE' },
  { value: 'LB', label: 'LB' },
  { value: 'CB', label: 'CB' },
  { value: 'SAF', label: 'SAF' },
  { value: 'K', label: 'K' },
  { value: 'P', label: 'P' },
];

function getPositionColor(position: string): string {
  const pos = position.toUpperCase();
  if (pos === 'QB') return 'bg-purple-100 text-purple-700';
  if (pos === 'RB' || pos === 'FB') return 'bg-green-100 text-green-700';
  if (pos === 'WR') return 'bg-blue-100 text-blue-700';
  if (pos === 'TE') return 'bg-orange-100 text-orange-700';
  if (['OT', 'OG', 'C', 'T', 'G', 'OL', 'OC', 'IOL'].includes(pos)) return 'bg-yellow-100 text-yellow-700';
  if (['DE', 'DT', 'NT', 'EDGE', 'DL'].includes(pos)) return 'bg-red-100 text-red-700';
  if (pos === 'LB' || pos === 'ILB' || pos === 'MLB' || pos === 'OLB') return 'bg-indigo-100 text-indigo-700';
  if (pos === 'CB') return 'bg-teal-100 text-teal-700';
  if (['S', 'FS', 'SS', 'SAF'].includes(pos)) return 'bg-cyan-100 text-cyan-700';
  if (pos === 'K' || pos === 'P') return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

// Custom School Dropdown Component (same as transfer portal tracker)
function CustomSchoolDropdown({
  selectedSchool,
  onSchoolChange
}: {
  selectedSchool: string;
  onSchoolChange: (school: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConference, setSelectedConference] = useState<Conference | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedConference(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConferenceClick = (conference: Conference) => {
    setSelectedConference(conference);
  };

  const handleTeamClick = (teamSlug: string) => {
    onSchoolChange(teamSlug);
    setIsOpen(false);
    setSelectedConference(null);
  };

  const handleAllClick = () => {
    onSchoolChange('all');
    setIsOpen(false);
    setSelectedConference(null);
  };

  const handleBackClick = () => {
    setSelectedConference(null);
  };

  // Find the team name if a team is selected
  let displayText = 'All Teams';
  if (selectedSchool !== 'all') {
    const allConfs = getAllConferences();
    for (const conf of allConfs) {
      const teams = getTeamsByConference(conf);
      const team = teams.find(t => t.slug === selectedSchool);
      if (team) {
        displayText = team.name;
        break;
      }
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#800000] focus:border-[#800000] bg-white text-gray-900 text-left flex items-center justify-between cursor-pointer"
      >
        <span className="truncate">{displayText}</span>
        <svg className="w-4 h-4 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {!selectedConference ? (
            // Conference Selection
            <>
              <button
                type="button"
                onClick={handleAllClick}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-base text-gray-900 font-medium transition-colors cursor-pointer border-b border-gray-200"
              >
                All Teams
              </button>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50 sticky top-0">
                Select Conference
              </div>
              {getAllConferences().map(conference => (
                <button
                  key={conference}
                  type="button"
                  onClick={() => handleConferenceClick(conference)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-base text-gray-900 transition-colors cursor-pointer"
                >
                  {conference}
                </button>
              ))}
            </>
          ) : (
            // Team Selection
            <>
              <button
                type="button"
                onClick={handleBackClick}
                className="w-full text-left px-3 py-2 text-base font-semibold text-[#800000] hover:bg-gray-100 sticky top-0 bg-white border-b border-gray-200 cursor-pointer"
              >
                ← Back to Conferences
              </button>
              <div className="px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50">
                {selectedConference} Teams
              </div>
              {getTeamsByConference(selectedConference).map(team => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleTeamClick(team.slug)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-base text-gray-900 transition-colors cursor-pointer"
                >
                  {team.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PlayersDirectoryClient() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cfb-items-per-page');
      if (saved) return Number(saved);
    }
    return 24;
  });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef({ team: 'all', position: 'all', search: '', itemsPerPage });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch players from API - single unified fetch effect
  useEffect(() => {
    const controller = new AbortController();
    const prevFilters = prevFiltersRef.current;

    // Check if filters changed (not just page)
    const filtersChanged =
      prevFilters.team !== selectedTeam ||
      prevFilters.position !== selectedPosition ||
      prevFilters.search !== debouncedSearch ||
      prevFilters.itemsPerPage !== itemsPerPage;

    // Update ref for next comparison
    prevFiltersRef.current = {
      team: selectedTeam,
      position: selectedPosition,
      search: debouncedSearch,
      itemsPerPage
    };

    // If filters changed, reset to page 1
    const pageToFetch = filtersChanged ? 1 : currentPage;
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
      return; // Let the next render handle the fetch with page 1
    }

    async function fetchPlayers() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: pageToFetch.toString(),
          limit: itemsPerPage.toString(),
        });

        if (debouncedSearch) params.set('search', debouncedSearch);
        if (selectedTeam !== 'all') params.set('team', selectedTeam);
        if (selectedPosition !== 'all') params.set('position', selectedPosition);

        const response = await fetch(`/cfb-hq/api/players?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to fetch players');
        }

        const data = await response.json();
        setPlayers(data.players || []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching players:', err);
        setError('Failed to load player data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();

    return () => controller.abort();
  }, [currentPage, itemsPerPage, debouncedSearch, selectedTeam, selectedPosition]);

  const handleImageError = (slug: string) => {
    setImageErrors(prev => new Set(prev).add(slug));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cfb-items-per-page', String(items));
    }
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <>
      {/* Header */}
      <header
        className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-3 sm:pb-4 md:pb-5 lg:pb-6">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              CFB Players
            </h1>
            <p className="text-lg opacity-90 font-medium">
              Browse college football player profiles and stats
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Player Directory</h2>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                  Search Players
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, team, or position..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                />
              </div>

              {/* Team Filter - Custom Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team
                </label>
                <CustomSchoolDropdown
                  selectedSchool={selectedTeam}
                  onSchoolChange={setSelectedTeam}
                />
              </div>

              {/* Position Filter */}
              <div>
                <label htmlFor="position" className="block text-sm font-semibold text-gray-700 mb-2">
                  Position
                </label>
                <select
                  id="position"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#800000] focus:border-[#800000] cursor-pointer"
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>{pos.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Players Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-8">
                <LoadingSpinner />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 inline-block">
                  {error}
                </div>
              </div>
            )}

            {/* Players Grid */}
            {!loading && !error && (
              <>
                {players.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    No players found matching your criteria
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {players.map((player) => (
                        <Link
                          key={`${player.teamId}-${player.slug}`}
                          href={`/players/${player.slug}`}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-[#800000] hover:bg-white hover:shadow-md transition-all cursor-pointer"
                        >
                          {/* Headshot */}
                          <div className="flex justify-center mb-3">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {player.headshot && !imageErrors.has(player.slug) ? (
                                <img
                                  src={player.headshot}
                                  alt={player.name}
                                  className="w-full h-full object-cover scale-125 translate-y-1"
                                  onError={() => handleImageError(player.slug)}
                                />
                              ) : (
                                <span className="text-gray-500 font-semibold text-lg">
                                  {getInitials(player.name)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Name and Jersey */}
                          <div className="text-center">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {player.name}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPositionColor(player.position)}`}>
                                {player.position}
                              </span>
                              {player.jerseyNumber && (
                                <span className="text-gray-500 text-sm">#{player.jerseyNumber}</span>
                              )}
                            </div>
                          </div>

                          {/* Team */}
                          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200">
                            {player.teamLogo && (
                              <img
                                src={player.teamLogo}
                                alt={player.teamName}
                                className="w-5 h-5"
                              />
                            )}
                            <span className="text-sm text-gray-600">{player.teamName}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination Controls */}
                {pagination && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={pagination.totalPlayers}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[24, 48, 96]}
                  />
                )}
              </>
            )}
          </div>
        </div>

      <Footer />
    </>
  );
}
