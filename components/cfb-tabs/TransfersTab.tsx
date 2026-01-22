'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Team } from '@/data/teams';
import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition } from '@/types/player';
import PlayerTable from '@/components/PlayerTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { exportToCSV } from '@/utils/csvExport';
import { CLASS_ORDER } from '@/utils/constants';
import { Download, X } from 'lucide-react';

interface TransfersTabProps {
  team: Team;
  teamColor: string;
}

type TransferType = 'All' | 'Incoming' | 'Outgoing';
type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool' | 'announcedDate' | 'commitDate';
type SortDirection = 'asc' | 'desc';

export default function TransfersTab({ team, teamColor }: TransfersTabProps) {
  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<PlayerStatus | 'All'>('All');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | 'All'>('All');
  const [selectedPosition, setSelectedPosition] = useState<PlayerPosition | 'All'>('All');
  const [selectedType, setSelectedType] = useState<TransferType>('All');

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>('announcedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/cfb-hq/api/transfer-portal');

        if (!response.ok) {
          throw new Error('Failed to fetch transfer portal data');
        }

        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        console.error('Error fetching transfers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transfer data');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'class' ? 'desc' : 'asc');
    }
  };

  // Filter players for this team
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const teamNameLower = team.name.toLowerCase();
      const teamIdLower = team.id.toLowerCase();
      const newSchoolLower = (player.newSchool || '').toLowerCase();
      const formerSchoolLower = player.formerSchool.toLowerCase();

      const isIncoming = newSchoolLower === teamIdLower ||
                        newSchoolLower === teamNameLower ||
                        newSchoolLower.includes(teamIdLower);
      const isOutgoing = formerSchoolLower === teamIdLower ||
                        formerSchoolLower === teamNameLower ||
                        formerSchoolLower.includes(teamIdLower);

      // Apply Type filter
      if (selectedType === 'Incoming' && !isIncoming) return false;
      if (selectedType === 'Outgoing' && !isOutgoing) return false;
      if (selectedType === 'All' && !isIncoming && !isOutgoing) return false;

      // Apply other filters
      if (selectedStatus !== 'All' && player.status !== selectedStatus) return false;

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

  // Calculate counts
  const incomingCount = useMemo(() => {
    const teamNameLower = team.name.toLowerCase();
    const teamIdLower = team.id.toLowerCase();

    return players.filter(player => {
      const newSchoolLower = (player.newSchool || '').toLowerCase();
      return newSchoolLower === teamIdLower ||
             newSchoolLower === teamNameLower ||
             newSchoolLower.includes(teamIdLower);
    }).length;
  }, [players, team]);

  const outgoingCount = useMemo(() => {
    const teamNameLower = team.name.toLowerCase();
    const teamIdLower = team.id.toLowerCase();

    return players.filter(player => {
      const formerSchoolLower = player.formerSchool.toLowerCase();
      return formerSchoolLower === teamIdLower ||
             formerSchoolLower === teamNameLower ||
             formerSchoolLower.includes(teamIdLower);
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

  // Handle export to CSV
  const handleExport = useCallback(() => {
    const teamName = team.name.replace(/\s+/g, '-').toLowerCase();
    exportToCSV(sortedPlayers, `${teamName}-transfers.csv`);
  }, [team.name, sortedPlayers]);

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
      {/* Stats Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">{incomingCount}</p>
            <p className="text-sm text-gray-600">Incoming</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{outgoingCount}</p>
            <p className="text-sm text-gray-600">Outgoing</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${incomingCount - outgoingCount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {incomingCount - outgoingCount >= 0 ? '+' : ''}{incomingCount - outgoingCount}
            </p>
            <p className="text-sm text-gray-600">Net</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PlayerStatus | 'All')}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900 text-base sm:text-sm cursor-pointer"
              style={{ outline: 'none' }}
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
              onChange={(e) => setSelectedClass(e.target.value as PlayerClass | 'All')}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900 text-base sm:text-sm cursor-pointer"
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
              onChange={(e) => setSelectedPosition(e.target.value as PlayerPosition | 'All')}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900 text-base sm:text-sm cursor-pointer"
            >
              <option value="All">All</option>
              <option value="QB">QB</option>
              <option value="RB">RB</option>
              <option value="WR">WR</option>
              <option value="TE">TE</option>
              <option value="OL">OL</option>
              <option value="DL">DL</option>
              <option value="LB">LB</option>
              <option value="CB">CB</option>
              <option value="S">S</option>
              <option value="K">K</option>
              <option value="P">P</option>
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
              onChange={(e) => setSelectedType(e.target.value as TransferType)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900 text-base sm:text-sm cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            disabled={sortedPlayers.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:border-green-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>

          <button
            onClick={handleClearFilters}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors cursor-pointer ${
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

      {/* Transfers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
  );
}
