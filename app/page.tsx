'use client';

import { useState, useMemo, useEffect } from 'react';
import { TransferPlayer, PlayerStatus, PlayerClass, PlayerPosition, Conference } from '@/types/player';
import FilterBar from '@/components/FilterBar';
import PlayerTable from '@/components/PlayerTable';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

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

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/cfb-hq/transfer-portal-tracker/api/transfer-portal');

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
  }, []);

  // Filter players based on selections
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      if (selectedStatus !== 'All' && player.status !== selectedStatus) return false;
      if (selectedSchool !== 'All' &&
          player.formerSchool !== selectedSchool &&
          player.newSchool !== selectedSchool) return false;
      if (selectedClass !== 'All' && player.class !== selectedClass) return false;
      if (selectedPosition !== 'All' && player.position !== selectedPosition) return false;
      if (selectedConference !== 'All' &&
          player.formerConference !== selectedConference &&
          player.newConference !== selectedConference) return false;
      return true;
    });
  }, [players, selectedStatus, selectedSchool, selectedClass, selectedPosition, selectedConference]);

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
        <Header playerCount={0} totalCount={0} lastUpdated={lastUpdated} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header playerCount={0} totalCount={0} lastUpdated={lastUpdated} />
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <ErrorMessage message={error} onRetry={fetchData} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header playerCount={filteredPlayers.length} totalCount={players.length} lastUpdated={lastUpdated} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <div className="mt-6">
          <PlayerTable players={filteredPlayers} />
        </div>
      </div>
    </main>
  );
}
