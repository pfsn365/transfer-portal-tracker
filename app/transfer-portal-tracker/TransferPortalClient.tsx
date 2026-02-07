'use client';

import { useState, useMemo, useEffect } from 'react';
import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';
import FilterBar from '@/components/FilterBar';
import PlayerTable from '@/components/PlayerTable';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ErrorMessage from '@/components/ErrorMessage';
import TableSkeleton from '@/components/TableSkeleton';
import Pagination from '@/components/Pagination';
import { getTeamById } from '@/data/teams';
import { getWatchlist } from '@/utils/watchlist';
import { exportToCSV } from '@/utils/csvExport';
import { isFCSConference } from '@/utils/conferenceHelpers';
import { CLASS_ORDER } from '@/utils/constants';
import { Download, Star, X } from 'lucide-react';

export default function TransferPortalClient() {
  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'All'>('All');
  const [selectedSchool, setSelectedSchool] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | 'All'>('All');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | 'All'>('All');
  const [selectedConference, setSelectedConference] = useState<Conference | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Sorting state
  type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool' | 'announcedDate' | 'commitDate';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>('announcedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cfb-items-per-page');
      if (saved) return Number(saved);
    }
    return 25;
  });

  // Valid player slugs (players that have roster pages)
  const [validPlayerSlugs, setValidPlayerSlugs] = useState<Set<string>>(new Set());

  // Load data on component mount
  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/cfb-hq/api/transfer-portal`, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        if (!response.ok) {
          throw new Error('Failed to fetch transfer portal data');
        }

        const data = await response.json();

        if (abortController.signal.aborted) return;

        if (data.error) {
          throw new Error(data.error);
        }

        setPlayers(data.players || []);

      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading data');
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    setWatchlist(getWatchlist());

    return () => {
      abortController.abort();
    };
  }, [refreshKey]);

  // Fetch valid player slugs
  useEffect(() => {
    fetch('/cfb-hq/api/players?slugsOnly=true')
      .then(res => res.json())
      .then(data => {
        if (data.slugs) setValidPlayerSlugs(new Set(data.slugs));
      })
      .catch(() => {});
  }, []);

  // Handle retry
  const handleRetry = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field - default to descending for class (to show GR/SR first), ascending for others
      setSortField(field);
      setSortDirection(field === 'class' ? 'desc' : 'asc');
    }
  };

  // Handle export to CSV
  const handleExport = () => {
    exportToCSV(paginatedPlayers, 'transfer-portal-data.csv');
  };

  // Handle clear all filters
  const handleClearFilters = () => {
    setSelectedStatus('All');
    setSelectedSchool('All');
    setSelectedClass('All');
    setSelectedPosition('All');
    setSelectedConference('All');
    setSearchQuery('');
    setShowWatchlistOnly(false);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedStatus !== 'All' ||
      selectedSchool !== 'All' ||
      selectedClass !== 'All' ||
      selectedPosition !== 'All' ||
      selectedConference !== 'All' ||
      searchQuery.trim() !== '' ||
      showWatchlistOnly
    );
  }, [selectedStatus, selectedSchool, selectedClass, selectedPosition, selectedConference, searchQuery, showWatchlistOnly]);

  // Filter players based on selections
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      // Watchlist filter
      if (showWatchlistOnly && !watchlist.includes(player.id)) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const nameMatch = player.name.toLowerCase().includes(query);
        const schoolMatch = player.formerSchool.toLowerCase().includes(query) ||
                           (player.newSchool?.toLowerCase().includes(query) ?? false);
        if (!nameMatch && !schoolMatch) return false;
      }

      if (selectedStatus !== 'All' && player.status !== selectedStatus) return false;

      // School filter - match by name or team ID (case-insensitive)
      if (selectedSchool !== 'All') {
        const team = getTeamById(selectedSchool);
        const schoolLower = selectedSchool.toLowerCase();
        const formerSchoolLower = player.formerSchool.toLowerCase();
        const newSchoolLower = (player.newSchool || '').toLowerCase();

        const formerMatch = formerSchoolLower === schoolLower ||
                           formerSchoolLower === team?.id.toLowerCase() ||
                           formerSchoolLower === team?.name.toLowerCase();
        const newMatch = newSchoolLower === schoolLower ||
                        newSchoolLower === team?.id.toLowerCase() ||
                        newSchoolLower === team?.name.toLowerCase();

        if (!formerMatch && !newMatch) return false;
      }

      // Class filter - include redshirt variants (e.g., FR filter includes both FR and RS-FR)
      if (selectedClass !== 'All') {
        const playerClass = player.class;
        const matchesBase = playerClass === selectedClass;
        const matchesRedshirt = playerClass === `RS-${selectedClass}`;
        if (!matchesBase && !matchesRedshirt) return false;
      }
      if (selectedPosition !== 'All' && player.position !== selectedPosition) return false;

      // Conference filter - handle FCS as a special case
      if (selectedConference !== 'All') {
        if (selectedConference === 'FCS') {
          // When FCS is selected, show all players from FCS conferences
          const formerIsFCS = isFCSConference(player.formerConference);
          const newIsFCS = player.newConference ? isFCSConference(player.newConference) : false;
          if (!formerIsFCS && !newIsFCS) return false;
        } else {
          // Regular conference filter
          if (player.formerConference !== selectedConference &&
              player.newConference !== selectedConference) return false;
        }
      }

      return true;
    });
  }, [players, selectedStatus, selectedSchool, selectedClass, selectedPosition, selectedConference, searchQuery, showWatchlistOnly, watchlist]);

  // Sort filtered players
  const sortedPlayers = useMemo(() => {
    if (!sortField) return filteredPlayers;

    const sorted = [...filteredPlayers].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'position':
          aVal = a.position;
          bVal = b.position;
          break;
        case 'class':
          // Sort by class year order: FR, RS-FR, SO, RS-SO, JR, RS-JR, SR, RS-SR, GR, RS-GR
          aVal = CLASS_ORDER[a.class] || 1;
          bVal = CLASS_ORDER[b.class] || 1;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'rating':
          aVal = a.rating ?? 0;
          bVal = b.rating ?? 0;
          break;
        case 'formerSchool':
          aVal = a.formerSchool.toLowerCase();
          bVal = b.formerSchool.toLowerCase();
          break;
        case 'newSchool':
          aVal = (a.newSchool || '').toLowerCase();
          bVal = (b.newSchool || '').toLowerCase();
          break;
        case 'announcedDate':
          aVal = new Date(a.announcedDate).getTime();
          bVal = new Date(b.announcedDate).getTime();
          break;
        case 'commitDate':
          // Players without commit dates should sort to the end
          aVal = a.commitDate ? new Date(a.commitDate).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.commitDate ? new Date(b.commitDate).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredPlayers, sortField, sortDirection]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedSchool, selectedClass, selectedPosition, selectedConference, searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedPlayers.slice(startIndex, endIndex);
  }, [sortedPlayers, currentPage, itemsPerPage]);

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cfb-items-per-page', String(items));
    }
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <Header />

          {/* Raptive Header Ad */}
          <div className="container mx-auto px-4 min-h-[110px]">
            <div className="raptive-pfn-header-90"></div>
          </div>

          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">All Transfer Portal Players</h2>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <TableSkeleton />
          </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <Header />
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">All Transfer Portal Players</h2>
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
      </>
    );
  }

  return (
    <>
      <Header />

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">All Transfer Portal Players</h2>
          {/* Search & Filter Section */}
          <div className="bg-white rounded-lg shadow-md mb-6 p-4 sm:p-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by player name or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-4">
              <FilterBar
                selectedStatus={selectedStatus}
                selectedSchool={selectedSchool}
                selectedClass={selectedClass}
                selectedPosition={selectedPosition}
                selectedConference={selectedConference}
                onStatusChange={setSelectedStatus}
                onSchoolChange={setSelectedSchool}
                onClassChange={setSelectedClass}
                onPositionChange={setSelectedPosition}
                onConferenceChange={setSelectedConference}
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Watchlist Toggle */}
              <button
                onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  showWatchlistOnly
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-yellow-500 hover:text-yellow-600'
                }`}
              >
                <Star className={`w-4 h-4 ${showWatchlistOnly ? 'fill-white' : ''}`} />
                My Watchlist ({watchlist.length})
              </button>

              {/* Export to CSV */}
              <button
                onClick={handleExport}
                disabled={paginatedPlayers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export to CSV
              </button>

              {/* Clear Filters */}
              <button
                onClick={handleClearFilters}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  hasActiveFilters
                    ? 'bg-red-500 text-white hover:bg-red-600 border-2 border-red-500'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-600'
                }`}
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>

          <div className="mt-6">
            <PlayerTable
              players={paginatedPlayers}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onWatchlistChange={() => setWatchlist(getWatchlist())}
              validPlayerSlugs={validPlayerSlugs.size > 0 ? validPlayerSlugs : undefined}
            />
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={sortedPlayers.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>

      <Footer currentPage="CFB" />
    </>
  );
}
