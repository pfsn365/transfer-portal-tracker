'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition } from '@/types/player';
import { getTeamBySlug } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { getTeamColor } from '@/utils/teamColors';
import Header from '@/components/Header';
import CFBSidebar from '@/components/CFBSidebar';
import Footer from '@/components/Footer';
import PlayerTable from '@/components/PlayerTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { exportToCSV } from '@/utils/csvExport';
import { CLASS_ORDER } from '@/utils/constants';
import { Download, X } from 'lucide-react';

interface TeamPageClientProps {
  slug: string;
}

type TransferType = 'All' | 'Incoming' | 'Outgoing';

export default function TeamPageClient({ slug }: TeamPageClientProps) {
  const team = getTeamBySlug(slug);

  // If team not found, show 404 page
  if (!team) {
    notFound();
  }

  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'All'>('All');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | 'All'>('All');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | 'All'>('All');
  const [selectedType, setSelectedType] = useState<TransferType>('All');

  // Sorting state
  type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool' | 'announcedDate';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>('announcedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

    return () => {
      abortController.abort();
    };
  }, [refreshKey]);

  // Handle retry
  const handleRetry = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Default to descending for class (to show GR/SR first), ascending for others
      setSortDirection(field === 'class' ? 'desc' : 'asc');
    }
  };

  // Filter players for this team
  const filteredPlayers = useMemo(() => {
    if (!team) return [];
    return players.filter(player => {
      // Check if player is incoming or outgoing for this team
      const teamNameLower = team.name.toLowerCase();
      const teamIdLower = team.id.toLowerCase();
      const newSchoolLower = (player.newSchool || '').toLowerCase();
      const formerSchoolLower = player.formerSchool.toLowerCase();

      const isIncoming = newSchoolLower === teamIdLower ||
                        newSchoolLower === teamNameLower;
      const isOutgoing = formerSchoolLower === teamIdLower ||
                        formerSchoolLower === teamNameLower;

      // Apply Type filter
      if (selectedType === 'Incoming' && !isIncoming) return false;
      if (selectedType === 'Outgoing' && !isOutgoing) return false;
      if (selectedType === 'All' && !isIncoming && !isOutgoing) return false;

      // Apply other filters
      if (selectedStatus !== 'All' && player.status !== selectedStatus) return false;

      // Class filter - include redshirt variants (e.g., FR filter includes both FR and RS-FR)
      if (selectedClass !== 'All') {
        const playerClass = player.class;
        const matchesBase = playerClass === selectedClass;
        const matchesRedshirt = playerClass === `RS-${selectedClass}`;
        if (!matchesBase && !matchesRedshirt) return false;
      }

      if (selectedPosition !== 'All' && player.position !== selectedPosition) return false;

      return true;
    });
  }, [players, team, selectedStatus, selectedClass, selectedPosition, selectedType]);

  // Calculate incoming and outgoing counts for stats
  const incomingCount = useMemo(() => {
    if (!team) return 0;
    const teamNameLower = team.name.toLowerCase();
    const teamIdLower = team.id.toLowerCase();

    return players.filter(player => {
      const newSchoolLower = (player.newSchool || '').toLowerCase();
      return newSchoolLower === teamIdLower ||
             newSchoolLower === teamNameLower;
    }).length;
  }, [players, team]);

  const outgoingCount = useMemo(() => {
    if (!team) return 0;
    const teamNameLower = team.name.toLowerCase();
    const teamIdLower = team.id.toLowerCase();

    return players.filter(player => {
      const formerSchoolLower = player.formerSchool.toLowerCase();
      return formerSchoolLower === teamIdLower ||
             formerSchoolLower === teamNameLower;
    }).length;
  }, [players, team]);

  // Sort players
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
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredPlayers, sortField, sortDirection]);

  // Calculate team stats
  const teamStats = useMemo(() => {
    const netGain = incomingCount - outgoingCount;

    return {
      incoming: incomingCount,
      outgoing: outgoingCount,
      netGain,
    };
  }, [incomingCount, outgoingCount]);

  // Optimized filter handlers with useCallback to prevent re-renders
  const handleStatusChange = useCallback((value: PlayerStatus | 'All') => {
    setSelectedStatus(value);
  }, []);

  const handleClassChange = useCallback((value: PlayerClass | 'All') => {
    setSelectedClass(value);
  }, []);

  const handlePositionChange = useCallback((value: PlayerPosition | 'All') => {
    setSelectedPosition(value);
  }, []);

  const handleTypeChange = useCallback((value: TransferType) => {
    setSelectedType(value);
  }, []);

  // Handle export to CSV
  const handleExport = useCallback(() => {
    const teamName = team?.name.replace(/\s+/g, '-').toLowerCase() || 'team';
    exportToCSV(sortedPlayers, `${teamName}-transfers.csv`);
  }, [team?.name, sortedPlayers]);

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedStatus('All');
    setSelectedClass('All');
    setSelectedPosition('All');
    setSelectedType('All');
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedStatus !== 'All' ||
      selectedClass !== 'All' ||
      selectedPosition !== 'All' ||
      selectedType !== 'All'
    );
  }, [selectedStatus, selectedClass, selectedPosition, selectedType]);

  // Sidebar wrapper component to reduce repetition
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
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

      <main className="flex-1 lg:ml-64 min-w-0 mt-[52px] lg:mt-0" style={{ touchAction: 'manipulation' }}>
        <Header />
        {children}
        <Footer currentPage="CFB" />
      </main>
    </div>
  );

  if (!team) {
    return (
      <PageWrapper>
        {/* Raptive Header Ad - Reserve space when team not found */}
        <div className="container mx-auto px-4">
          <div className="min-h-[90px] md:min-h-[120px] lg:min-h-[150px]"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <Link
            href="/transfer-portal-tracker/teams"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 text-blue-600 hover:underline touch-manipulation"
            aria-label="Go back to teams directory"
          >
            Back to Teams Directory
          </Link>
        </div>
      </PageWrapper>
    );
  }

  if (loading) {
    return (
      <PageWrapper>
        {/* Raptive Header Ad - Reserve space during loading */}
        <div className="container mx-auto px-4">
          <div className="min-h-[90px] md:min-h-[120px] lg:min-h-[150px]"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinner />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        {/* Raptive Header Ad - Reserve space during error */}
        <div className="container mx-auto px-4">
          <div className="min-h-[90px] md:min-h-[120px] lg:min-h-[150px]"></div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorMessage message={error} onRetry={handleRetry} />
        </div>
      </PageWrapper>
    );
  }

  const teamColor = getTeamColor(team.id);

  return (
    <PageWrapper>
      {/* Raptive Header Ad - Reserve space to prevent CLS */}
      <div className="container mx-auto px-4">
        <div className="raptive-pfn-header-90 min-h-[90px] md:min-h-[120px] lg:min-h-[150px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-base">
            <li>
              <Link
                href="/transfer-portal-tracker"
                className="inline-flex items-center min-h-[44px] py-2 hover:underline transition-colors touch-manipulation"
                style={{ color: teamColor }}
                aria-label="Go to Transfer Portal Tracker home"
              >
                Transfer Portal
              </Link>
            </li>
            <li aria-hidden="true" style={{ color: teamColor }}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link
                href="/transfer-portal-tracker/teams"
                className="inline-flex items-center min-h-[44px] py-2 hover:underline transition-colors touch-manipulation"
                style={{ color: teamColor }}
                aria-label="Browse all team transfer pages"
              >
                Teams
              </Link>
            </li>
            <li aria-hidden="true" style={{ color: teamColor }}>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span
                className="inline-flex items-center min-h-[44px] py-2 font-semibold"
                style={{ color: teamColor }}
                aria-current="page"
              >
                {team.name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Team Hero Header */}
        <div
          className="rounded-xl shadow-md mb-6 text-white"
          style={{ backgroundColor: teamColor, contain: 'layout style paint' }}
        >
          <div className="container mx-auto px-4 py-4 sm:py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center shadow-lg p-3 sm:p-4">
                  <Image
                    src={getTeamLogo(team.id)}
                    alt={`${team.name} logo`}
                    width={112}
                    height={112}
                    sizes="(max-width: 640px) 80px, (max-width: 1024px) 96px, 128px"
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
                <div className="min-w-0 text-center lg:text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-1">{team.name}</h1>
                  <p className="text-base sm:text-lg lg:text-xl opacity-90">{team.conference}</p>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white text-gray-800 rounded-lg p-4 sm:p-6 w-full lg:w-auto shadow-lg">
                <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Incoming</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{teamStats.incoming}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Outgoing</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{teamStats.outgoing}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 uppercase font-semibold mb-1">Net</p>
                    <p className={`text-xl sm:text-2xl font-bold ${teamStats.netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {teamStats.netGain >= 0 ? '+' : ''}{teamStats.netGain}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6" style={{ contain: 'layout style' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as PlayerStatus | 'All')}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm cursor-pointer"
                aria-label="Filter by status"
              >
                <option value="All">All</option>
                <option value="Entered">In Portal</option>
                <option value="Committed">Committed</option>
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <label htmlFor="class-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                Class
              </label>
              <select
                id="class-filter"
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value as PlayerClass | 'All')}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm cursor-pointer"
                aria-label="Filter by class"
              >
                <option value="All">All</option>
                <option value="FR">FR</option>
                <option value="SO">SO</option>
                <option value="JR">JR</option>
                <option value="SR">SR</option>
                <option value="GR">GR</option>
              </select>
            </div>

            {/* Position Filter */}
            <div>
              <label htmlFor="position-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                Position
              </label>
              <select
                id="position-filter"
                value={selectedPosition}
                onChange={(e) => handlePositionChange(e.target.value as PlayerPosition | 'All')}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm cursor-pointer"
                aria-label="Filter by position"
              >
                <option value="All">All</option>
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="OL">OL</option>
                <option value="OT">OT</option>
                <option value="OG">OG</option>
                <option value="C">C</option>
                <option value="EDGE">EDGE</option>
                <option value="DL">DL</option>
                <option value="DT">DT</option>
                <option value="LB">LB</option>
                <option value="CB">CB</option>
                <option value="S">S</option>
                <option value="DB">DB</option>
                <option value="K">K</option>
                <option value="P">P</option>
                <option value="ATH">ATH</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                Type
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as TransferType)}
                className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-all text-base sm:text-sm cursor-pointer"
                aria-label="Filter by transfer type"
              >
                <option value="All">All</option>
                <option value="Incoming">Incoming</option>
                <option value="Outgoing">Outgoing</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Export to CSV */}
            <button
              onClick={handleExport}
              disabled={sortedPlayers.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation cursor-pointer"
              aria-label="Export transfers to CSV"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export to CSV
            </button>

            {/* Clear Filters */}
            <button
              onClick={handleClearFilters}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors touch-manipulation cursor-pointer ${
                hasActiveFilters
                  ? 'bg-red-500 text-white hover:bg-red-600 border-2 border-red-500'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-red-500 hover:text-red-600'
              }`}
              aria-label="Clear all filters"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transfers Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6" style={{ contentVisibility: 'auto' }}>
          {sortedPlayers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No transfers found for {team.name}
                {hasActiveFilters && ' with the selected filters'}
              </p>
            </div>
          ) : (
            <PlayerTable
              players={sortedPlayers}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
