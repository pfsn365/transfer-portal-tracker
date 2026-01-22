'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Team } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';

interface OverviewTabProps {
  team: Team;
  schedule: any[];
  teamColor: string;
}

interface Standing {
  team: string;
  teamId?: string;
  logo?: string;
  wins: number;
  losses: number;
  pct: string;
}

interface TransferPlayer {
  name: string;
  position: string;
  stars?: number;
  formerSchool: string;
  newSchool?: string;
}

export default function OverviewTab({ team, schedule, teamColor }: OverviewTabProps) {
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [transfers, setTransfers] = useState<{ incoming: TransferPlayer[]; outgoing: TransferPlayer[] }>({ incoming: [], outgoing: [] });

  useEffect(() => {
    // Get recent completed games (last 5)
    const completed = schedule.filter(g => g.result).slice(-5).reverse();
    setRecentGames(completed);
  }, [schedule]);

  // Fetch conference standings
  useEffect(() => {
    const fetchStandings = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/cfb/standings?conference=${encodeURIComponent(team.conference)}`);
        if (response.ok) {
          const data = await response.json();
          const allStandings = data.standings || [];

          // Find current team's position in standings
          const teamIndex = allStandings.findIndex((s: Standing) =>
            s.team?.toLowerCase().includes(team.id.toLowerCase()) ||
            s.teamId === team.id
          );

          // Get 5 teams around the current team (2 above, team, 2 below)
          let startIdx = 0;
          if (teamIndex !== -1) {
            startIdx = Math.max(0, teamIndex - 2);
            // Adjust if near the end
            if (startIdx + 5 > allStandings.length) {
              startIdx = Math.max(0, allStandings.length - 5);
            }
          }

          setStandings(allStandings.slice(startIdx, startIdx + 5));
        }
      } catch (error) {
        console.error('Failed to fetch standings:', error);
      }
    };

    fetchStandings();
  }, [team.conference, team.id]);

  // Fetch team stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/teams/stats/${team.slug}`);
        if (response.ok) {
          const data = await response.json();
          setTeamStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, [team.slug]);

  // Fetch transfer portal data
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/cfb-hq/api/transfer-portal`);
        if (response.ok) {
          const data = await response.json();
          const players = data.players || [];

          const teamNameLower = team.name.toLowerCase();
          const teamIdLower = team.id.toLowerCase();

          const incoming = players.filter((p: any) =>
            (p.newSchool || '').toLowerCase() === teamIdLower ||
            (p.newSchool || '').toLowerCase() === teamNameLower ||
            (p.newSchool || '').toLowerCase().includes(team.id.toLowerCase())
          ).slice(0, 5);

          const outgoing = players.filter((p: any) =>
            p.formerSchool.toLowerCase() === teamIdLower ||
            p.formerSchool.toLowerCase() === teamNameLower ||
            p.formerSchool.toLowerCase().includes(team.id.toLowerCase())
          ).slice(0, 5);

          setTransfers({ incoming, outgoing });
        }
      } catch (error) {
        console.error('Failed to fetch transfers:', error);
      }
    };

    fetchTransfers();
  }, [team.id, team.name]);

  // Find team's position in standings
  const teamStandingIndex = standings.findIndex(s =>
    s.team?.toLowerCase().includes(team.id.toLowerCase()) ||
    s.teamId === team.id
  );

  // Helper to get player initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Three Cards - Schedule, Standings, Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">2025-26 Schedule</h3>
          </div>
          <div className="p-4">
            {recentGames.length > 0 ? (
              <div className="space-y-3">
                {recentGames.map((game, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-gray-500 w-12 flex-shrink-0">{game.date}</span>
                      <span className="text-xs text-gray-500">{game.isHome ? 'vs' : '@'}</span>
                      {game.opponentLogo && (
                        <Image
                          src={game.opponentLogo}
                          alt={game.opponent}
                          width={20}
                          height={20}
                          className="object-contain flex-shrink-0"
                        />
                      )}
                      <Link
                        href={game.opponentSlug ? `/teams/${game.opponentSlug}` : '#'}
                        className="text-sm font-medium text-gray-900 hover:underline truncate"
                      >
                        {game.opponent.split(' ').slice(-1)[0]}
                      </Link>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${game.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                      {game.result} {game.score?.team}-{game.score?.opponent}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent games</p>
            )}
            <Link
              href={`/teams/${team.slug}/schedule`}
              className="block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Schedule
            </Link>
          </div>
        </div>

        {/* Conference Standings Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">{team.conference} Standings</h3>
          </div>
          <div className="p-4">
            {standings.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left pb-2">Team</th>
                    <th className="text-center pb-2 w-8">W</th>
                    <th className="text-center pb-2 w-8">L</th>
                    <th className="text-center pb-2 w-12">PCT</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((standing, idx) => {
                    const isCurrentTeam = standing.team?.toLowerCase().includes(team.id.toLowerCase()) ||
                                         standing.teamId === team.id;
                    return (
                      <tr key={idx} className={`border-t border-gray-100 ${isCurrentTeam ? 'bg-gray-50' : ''}`}>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            {isCurrentTeam && (
                              <span className="text-xs" style={{ color: teamColor }}>★</span>
                            )}
                            {standing.logo && (
                              <Image
                                src={standing.logo}
                                alt={standing.team}
                                width={20}
                                height={20}
                                className="object-contain"
                              />
                            )}
                            <span className={`text-sm ${isCurrentTeam ? 'font-bold' : ''}`}>
                              {standing.team?.split(' ').slice(-1)[0] || standing.team}
                            </span>
                          </div>
                        </td>
                        <td className="text-center text-sm py-2">{standing.wins}</td>
                        <td className="text-center text-sm py-2">{standing.losses}</td>
                        <td className="text-center text-sm py-2">{standing.pct}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No standings available</p>
            )}
            <Link
              href="/standings"
              className="block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Standings
            </Link>
          </div>
        </div>

        {/* Team Stats Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">{team.name.split(' ').slice(-1)[0]} Leaders</h3>
          </div>
          <div className="p-4">
            {teamStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Points/Game</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.offense?.pointsPerGame?.toFixed(1) || '-'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Yards/Game</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.offense?.yardsPerGame?.toFixed(1) || '-'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Sacks</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.defense?.sacks || '-'}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase">Takeaways</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.defense?.takeaways || '-'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Loading stats...</p>
            )}
            <Link
              href={`/teams/${team.slug}/stats`}
              className="block mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Team Stats
            </Link>
          </div>
        </div>
      </div>

      {/* Transfer Portal Preview Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
          <h3 className="text-lg font-bold text-white">Transfer Portal Activity</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incoming Transfers */}
            <div>
              <h4 className="text-sm font-semibold text-green-600 uppercase mb-3 flex items-center gap-2">
                <span>↓</span> Incoming ({transfers.incoming.length})
              </h4>
              {transfers.incoming.length > 0 ? (
                <div className="space-y-2">
                  {transfers.incoming.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: teamColor }}
                      >
                        {getInitials(player.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No incoming transfers</p>
              )}
            </div>

            {/* Outgoing Transfers */}
            <div>
              <h4 className="text-sm font-semibold text-red-600 uppercase mb-3 flex items-center gap-2">
                <span>↑</span> Outgoing ({transfers.outgoing.length})
              </h4>
              {transfers.outgoing.length > 0 ? (
                <div className="space-y-2">
                  {transfers.outgoing.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-gray-400 flex-shrink-0">
                        {getInitials(player.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No outgoing transfers</p>
              )}
            </div>
          </div>

          <Link
            href={`/teams/${team.slug}/transfers`}
            className="block mt-6 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: teamColor, color: 'white' }}
          >
            View All Transfer Portal Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
