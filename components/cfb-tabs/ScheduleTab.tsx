'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Team, getTeamBySlug, getTeamById } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ScheduleTabProps {
  team: Team;
  teamColor: string;
  initialSchedule?: Game[];
}

interface Game {
  week: number | string;
  date: string;
  opponent: string;
  opponentLogo?: string;
  opponentSlug?: string;
  isHome: boolean;
  isConference: boolean;
  isPostseason?: boolean;
  bowlName?: string;
  time?: string;
  tv?: string;
  venue: string;
  result?: 'W' | 'L' | 'T';
  score?: {
    team: number;
    opponent: number;
  };
  isBye?: boolean;
}

export default function ScheduleTab({ team, teamColor, initialSchedule }: ScheduleTabProps) {
  const [schedule, setSchedule] = useState<Game[]>(initialSchedule || []);
  const [loading, setLoading] = useState(!initialSchedule);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    // Skip fetch if we already have schedule data from props
    if (initialSchedule && initialSchedule.length > 0) {
      setSchedule(initialSchedule);
      setLoading(false);
      return;
    }

    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/cfb-hq/api/teams/schedule/${team.slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch schedule');
        }

        const data = await response.json();
        setSchedule(data.schedule || []);
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err instanceof Error ? err.message : 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [team.slug, initialSchedule]);

  // Calculate team record (include all completed games for overall, exclude postseason for conference)
  const completedGames = schedule.filter(g => g.result && !g.isBye);
  const upcomingGames = schedule.filter(g => !g.result && !g.isBye);
  const regularSeasonCompleted = completedGames.filter(g => !g.isPostseason);
  const postseasonCompleted = completedGames.filter(g => g.isPostseason);
  const wins = completedGames.filter(g => g.result === 'W').length;
  const losses = completedGames.filter(g => g.result === 'L').length;
  // Conference record only includes regular season conference games
  const confGames = regularSeasonCompleted.filter(g => g.isConference);
  const confWins = confGames.filter(g => g.result === 'W').length;
  const confLosses = confGames.filter(g => g.result === 'L').length;

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
      {/* Record Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">{wins}-{losses}</p>
            <p className="text-sm text-gray-600">Overall Record</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{confWins}-{confLosses}</p>
            <p className="text-sm text-gray-600">Conference Record</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{regularSeasonCompleted.filter(g => g.isHome && g.result === 'W').length}-{regularSeasonCompleted.filter(g => g.isHome && g.result === 'L').length}</p>
            <p className="text-sm text-gray-600">Home Record</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{regularSeasonCompleted.filter(g => !g.isHome && g.result === 'W').length}-{regularSeasonCompleted.filter(g => !g.isHome && g.result === 'L').length}</p>
            <p className="text-sm text-gray-600">Away Record</p>
          </div>
          {postseasonCompleted.length > 0 && (
            <div>
              <p className="text-3xl font-bold text-amber-700">{postseasonCompleted.filter(g => g.result === 'W').length}-{postseasonCompleted.filter(g => g.result === 'L').length}</p>
              <p className="text-sm text-gray-600">Postseason</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              style={{ accentColor: teamColor }}
            />
            <span className="text-sm text-gray-700">Show Completed ({completedGames.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUpcoming}
              onChange={(e) => setShowUpcoming(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              style={{ accentColor: teamColor }}
            />
            <span className="text-sm text-gray-700">Show Upcoming ({upcomingGames.length})</span>
          </label>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
          <h3 className="text-lg font-bold text-white">2025-26 Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Week</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Opponent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Result</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedule
                .filter(game => game.isBye || (game.result && showCompleted) || (!game.result && showUpcoming))
                .map((game, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${game.isConference ? 'border-l-4' : ''} ${game.isPostseason ? 'bg-amber-50/50' : ''}`} style={game.isConference ? { borderLeftColor: teamColor } : {}}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {game.isPostseason ? (
                        <span className="text-amber-700 font-medium">Bowl</span>
                      ) : (
                        game.week
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{game.isBye ? '' : game.date}</td>
                    <td className="px-4 py-3">
                      {game.isBye ? (
                        <span className="text-sm font-medium text-gray-400 italic">BYE</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          {game.opponentLogo && (
                            <Image
                              src={game.opponentLogo}
                              alt={game.opponent}
                              width={28}
                              height={28}
                              className="object-contain"
                            />
                          )}
                          <div>
                            <span className="text-sm text-gray-500">{game.isHome ? 'vs' : '@'}</span>{' '}
                            {game.opponentSlug ? (
                              <Link href={`/teams/${game.opponentSlug}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {game.opponent}
                              </Link>
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{game.opponent}</span>
                            )}
                            {game.isConference && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: teamColor }}>
                                {team.conference}
                              </span>
                            )}
                            {game.isPostseason && game.bowlName && (
                              <div className="text-xs text-amber-700 mt-0.5">{game.bowlName.replace(` - ${team.name} vs ${game.opponent}`, '').replace(` - ${game.opponent} vs ${team.name}`, '')}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {game.isBye ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : game.result ? (
                        <span className={`font-bold ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                          {game.result} {game.score?.team}-{game.score?.opponent}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">{game.time || 'TBD'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{game.isBye ? '' : game.venue}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {schedule.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <p className="text-gray-500">No schedule data available</p>
        </div>
      )}
    </div>
  );
}
