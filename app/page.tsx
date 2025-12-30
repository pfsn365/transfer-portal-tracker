'use client';

import { useState, useMemo, useEffect } from 'react';
import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';
import FilterBar from '@/components/FilterBar';
import PlayerTable from '@/components/PlayerTable';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import TableSkeleton from '@/components/TableSkeleton';
import Pagination from '@/components/Pagination';
import { getTeamById } from '@/data/teams';
import { getWatchlist } from '@/utils/watchlist';
import { exportToCSV } from '@/utils/csvExport';
import { Download, Star, X } from 'lucide-react';

export default function TransferPortalTracker() {
  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'All'>('All');
  const [selectedSchool, setSelectedSchool] = useState<string>('All');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | 'All'>('All');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | 'All'>('All');
  const [selectedConference, setSelectedConference] = useState<Conference | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showWatchlistOnly, setShowWatchlistOnly] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  // Sorting state
  type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool' | 'announcedDate';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>('announcedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/transfer-portal`);

      if (!response.ok) {
        throw new Error('Failed to fetch transfer portal data');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setPlayers(data.players || []);
      setLastUpdated(data.updatedTime || new Date().toISOString());

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
    setWatchlist(getWatchlist());
  }, []);

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
    exportToCSV(sortedPlayers, 'transfer-portal-data.csv');
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

      if (selectedClass !== 'All' && player.class !== selectedClass) return false;
      if (selectedPosition !== 'All' && player.position !== selectedPosition) return false;
      if (selectedConference !== 'All' &&
          player.formerConference !== selectedConference &&
          player.newConference !== selectedConference) return false;
      return true;
    });
  }, [players, selectedStatus, selectedSchool, selectedClass, selectedPosition, selectedConference, searchQuery, showWatchlistOnly, watchlist]);

  // Sort filtered players
  const sortedPlayers = useMemo(() => {
    if (!sortField) return filteredPlayers;

    const sorted = [...filteredPlayers].sort((a, b) => {
      let aVal: any;
      let bVal: any;

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
          // Sort by class year order: FR, SO, JR, SR, GR
          const classOrder = { FR: 1, SO: 2, JR: 3, SR: 4, GR: 5 };
          aVal = classOrder[a.class];
          bVal = classOrder[b.class];
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
    const sliced = sortedPlayers.slice(startIndex, endIndex);
    console.log('Pagination Debug:', {
      totalPlayers: sortedPlayers.length,
      itemsPerPage,
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      slicedCount: sliced.length
    });
    return sliced;
  }, [sortedPlayers, currentPage, itemsPerPage, totalPages]);

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Get unique schools from data
  const schools = useMemo(() => {
    const schoolSet = new Set<string>();
    players.forEach(player => {
      schoolSet.add(player.formerSchool);
      if (player.newSchool) schoolSet.add(player.newSchool);
    });
    return Array.from(schoolSet).sort();
  }, [players]);


  // Show loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header
          playerCount={0}
          totalCount={0}
          lastUpdated={lastUpdated}
        />

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[150px]">
          <div className="raptive-pfn-header"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header
          playerCount={0}
          totalCount={0}
          lastUpdated={lastUpdated}
        />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header
        playerCount={filteredPlayers.length}
        totalCount={players.length}
        lastUpdated={lastUpdated}
      />

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[150px]">
        <div className="raptive-pfn-header"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by player name or school..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

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
          schools={schools}
        />

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Watchlist Toggle */}
          <button
            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
            disabled={sortedPlayers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>

          {/* Clear Filters */}
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-red-500 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        </div>

        <div className="mt-6">
          <PlayerTable
            players={paginatedPlayers}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onWatchlistChange={() => setWatchlist(getWatchlist())}
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
    </main>
  );
}
