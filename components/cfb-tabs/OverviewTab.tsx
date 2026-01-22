'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { Team } from '@/data/teams';
import { getTeamLogo } from '@/utils/teamLogos';
import { fetcher } from '@/utils/swr';

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

// Skeleton components to prevent CLS
function ScheduleCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-12 h-4 bg-gray-200 rounded" />
            <div className="w-6 h-4 bg-gray-200 rounded" />
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function StandingsCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between pb-2 mb-2 border-b border-gray-100">
        <div className="w-16 h-3 bg-gray-200 rounded" />
        <div className="flex gap-4">
          <div className="w-6 h-3 bg-gray-200 rounded" />
          <div className="w-6 h-3 bg-gray-200 rounded" />
          <div className="w-10 h-3 bg-gray-200 rounded" />
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="w-4 h-4 bg-gray-200 rounded" />
            <div className="w-10 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}


function TransfersCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
      <div>
        <div className="w-28 h-4 bg-gray-200 rounded mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
              <div className="w-12 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="w-28 h-4 bg-gray-200 rounded mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
              <div className="w-12 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverviewTab({ team, schedule, teamColor }: OverviewTabProps) {
  // SWR hooks for data fetching with caching
  const { data: standingsData, isLoading: loadingStandings } = useSWR(
    `/cfb-hq/api/cfb/standings?group=80`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Use team-filtered endpoint for transfers (much smaller payload)
  const { data: transfersData, isLoading: loadingTransfers } = useSWR(
    `/cfb-hq/api/transfer-portal?team=${encodeURIComponent(team.id)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000 }
  );

  // Derive recent games from schedule prop
  const recentGames = useMemo(() => {
    return schedule.filter(g => g.result).slice(-5).reverse();
  }, [schedule]);

  const scheduleReady = schedule.length > 0 || recentGames.length === 0;

  // Process standings data
  const standings = useMemo(() => {
    if (!standingsData?.conferences) return [];

    const conferences = standingsData.conferences;
    const teamConference = conferences.find((conf: any) =>
      conf.name === team.conference || conf.shortName === team.conference
    );

    if (!teamConference?.teams) return [];

    const confTeams = teamConference.teams;
    const allStandings: Standing[] = confTeams.map((t: any) => ({
      team: t.name,
      teamId: t.id,
      logo: t.logo,
      wins: t.conferenceWins || 0,
      losses: t.conferenceLosses || 0,
      pct: t.conferenceWins + t.conferenceLosses > 0
        ? (t.conferenceWins / (t.conferenceWins + t.conferenceLosses)).toFixed(3)
        : '.000',
    }));

    // Find current team's position in standings
    const teamIndex = allStandings.findIndex((s: Standing) =>
      s.team?.toLowerCase().includes(team.id.toLowerCase()) ||
      s.teamId === team.id ||
      team.name.toLowerCase().includes(s.team?.toLowerCase() || '')
    );

    // Get 5 teams around the current team (2 above, team, 2 below)
    let startIdx = 0;
    if (teamIndex !== -1) {
      startIdx = Math.max(0, teamIndex - 2);
      if (startIdx + 5 > allStandings.length) {
        startIdx = Math.max(0, allStandings.length - 5);
      }
    }

    return allStandings.slice(startIdx, startIdx + 5);
  }, [standingsData, team.conference, team.id, team.name]);

  // Process transfers data
  const transfers = useMemo((): { incoming: TransferPlayer[]; outgoing: TransferPlayer[] } => {
    const players = transfersData?.players || [];
    const teamIdLower = team.id.toLowerCase();

    const incoming: TransferPlayer[] = players.filter((p: TransferPlayer) => {
      const newSchoolLower = (p.newSchool || '').toLowerCase();
      return newSchoolLower === teamIdLower || newSchoolLower.includes(teamIdLower);
    }).slice(0, 5);

    const outgoing: TransferPlayer[] = players.filter((p: TransferPlayer) => {
      const formerSchoolLower = p.formerSchool.toLowerCase();
      return formerSchoolLower === teamIdLower || formerSchoolLower.includes(teamIdLower);
    }).slice(0, 5);

    return { incoming, outgoing };
  }, [transfersData, team.id]);

  // Helper to get player initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Schedule and Standings Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">2025-26 Schedule</h3>
          </div>
          <div className="p-4 flex flex-col flex-1">
            {!scheduleReady ? (
              <ScheduleCardSkeleton />
            ) : recentGames.length > 0 ? (
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
                        {game.opponent.split(' ').slice(0, -1).join(' ') || game.opponent}
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
              className="block mt-auto pt-3 pb-2.5 rounded-lg text-sm font-medium leading-none text-center transition-colors hover:opacity-90"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Schedule
            </Link>
          </div>
        </div>

        {/* Conference Standings Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: teamColor }}>
            <h3 className="text-lg font-bold text-white">{team.conference} Standings</h3>
          </div>
          <div className="p-4 flex flex-col flex-1">
            {loadingStandings ? (
              <StandingsCardSkeleton />
            ) : standings.length > 0 ? (
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
                                           standing.teamId === team.id ||
                                           team.name.toLowerCase().includes(standing.team?.toLowerCase() || '');
                      return (
                        <tr key={idx} className={`border-t border-gray-100 ${isCurrentTeam ? 'bg-gray-200' : ''}`}>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
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
                                {standing.team?.split(' ').slice(0, -1).join(' ') || standing.team}
                              </span>
                            </div>
                          </td>
                          <td className={`text-center text-sm py-2 ${isCurrentTeam ? 'font-bold' : ''}`}>{standing.wins}</td>
                          <td className={`text-center text-sm py-2 ${isCurrentTeam ? 'font-bold' : ''}`}>{standing.losses}</td>
                          <td className={`text-center text-sm py-2 ${isCurrentTeam ? 'font-bold' : ''}`}>{standing.pct}</td>
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
              className="block mt-auto pt-3 pb-2.5 rounded-lg text-sm font-medium leading-none text-center transition-colors hover:opacity-90"
              style={{ backgroundColor: teamColor, color: 'white' }}
            >
              View Full Standings
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
          {loadingTransfers ? (
            <TransfersCardSkeleton />
          ) : (
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
          )}

          <Link
            href={`/teams/${team.slug}/transfers`}
            className="block mt-6 text-center pt-3 pb-2.5 rounded-lg text-sm font-medium leading-none transition-colors hover:opacity-90"
            style={{ backgroundColor: teamColor, color: 'white' }}
          >
            View All Transfer Portal Activity
          </Link>
        </div>
      </div>
    </div>
  );
}
