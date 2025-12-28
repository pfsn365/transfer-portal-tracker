'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TransferPlayer } from '@/types/player';
import { getTeamBySlug } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { getTeamColor } from '@/utils/teamColors';
import Header from '@/components/Header';
import PlayerTable from '@/components/PlayerTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface TeamPageClientProps {
  slug: string;
}

export default function TeamPageClient({ slug }: TeamPageClientProps) {
  const team = getTeamBySlug(slug);

  const [players, setPlayers] = useState<TransferPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  // Sorting state
  type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter players for this team
  const incomingTransfers = useMemo(() => {
    if (!team) return [];
    return players.filter(player =>
      player.newSchool?.toLowerCase() === team.name.toLowerCase() ||
      player.newSchool?.toLowerCase() === team.id.toLowerCase()
    );
  }, [players, team]);

  const outgoingTransfers = useMemo(() => {
    if (!team) return [];
    return players.filter(player =>
      player.formerSchool?.toLowerCase() === team.name.toLowerCase() ||
      player.formerSchool?.toLowerCase() === team.id.toLowerCase()
    );
  }, [players, team]);

  // Sort players
  const sortedPlayers = useMemo(() => {
    const playersToSort = activeTab === 'incoming' ? incomingTransfers : outgoingTransfers;
    if (!sortField) return playersToSort;

    const sorted = [...playersToSort].sort((a, b) => {
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
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [activeTab, incomingTransfers, outgoingTransfers, sortField, sortDirection]);

  // Calculate team stats
  const teamStats = useMemo(() => {
    const incoming = incomingTransfers.length;
    const outgoing = outgoingTransfers.length;
    const netGain = incoming - outgoing;

    return {
      incoming,
      outgoing,
      netGain,
    };
  }, [incomingTransfers, outgoingTransfers]);

  if (!team) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header playerCount={0} totalCount={0} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <Link href="/college" className="text-blue-600 hover:underline">
            Back to Teams Directory
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header playerCount={0} totalCount={0} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header playerCount={0} totalCount={0} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </main>
    );
  }

  const teamColor = getTeamColor(team.id);

  return (
    <main className="min-h-screen bg-gray-50">
      <Header playerCount={0} totalCount={players.length} />

      {/* Raptive Header Ad */}
      <div className="container mx-auto px-4 min-h-[150px]">
        <div className="raptive-pfn-header"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* All Teams Button */}
        <Link
          href="/college"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mb-4"
        >
          All Teams
        </Link>

        {/* Team Header */}
        <div
          className="rounded-lg shadow-md p-6 mb-6 text-white"
          style={{ backgroundColor: teamColor }}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 bg-white rounded-full p-3">
              <Image
                src={getTeamLogo(team.id)}
                alt={`${team.name} logo`}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">{team.name}</h1>
              <p className="text-lg opacity-90">{team.conference}</p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 uppercase mb-1">Incoming</p>
            <p className="text-2xl font-bold text-green-600">{teamStats.incoming}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 uppercase mb-1">Outgoing</p>
            <p className="text-2xl font-bold text-red-600">{teamStats.outgoing}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600 uppercase mb-1">Net Gain/Loss</p>
            <p className={`text-2xl font-bold ${teamStats.netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {teamStats.netGain >= 0 ? '+' : ''}{teamStats.netGain}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                type="button"
                onClick={() => setActiveTab('incoming')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'incoming'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Incoming Transfers ({teamStats.incoming})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('outgoing')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'outgoing'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Outgoing Transfers ({teamStats.outgoing})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {sortedPlayers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No {activeTab} transfers found for {team.name}
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
      </div>
    </main>
  );
}
