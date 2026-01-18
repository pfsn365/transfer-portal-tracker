'use client';

import { useState, useEffect } from 'react';
import { getTeamLogo } from '@/utils/teamLogos';

interface Team {
  seed: number;
  name: string;
  record?: string;
  score?: number;
  isWinner?: boolean;
}

interface Matchup {
  id: string;
  team1: Team | null;
  team2: Team | null;
  round: string;
  location?: string;
  date?: string;
  completed?: boolean;
}

// Bracket progression mapping: matchupId -> { nextMatchup, slot }
const bracketProgression: { [key: string]: { nextMatchup: string; slot: 'team1' | 'team2' } } = {
  'r1-1': { nextMatchup: 'qf-1', slot: 'team2' },
  'r1-2': { nextMatchup: 'qf-2', slot: 'team2' },
  'r1-3': { nextMatchup: 'qf-3', slot: 'team2' },
  'r1-4': { nextMatchup: 'qf-4', slot: 'team2' },
  'qf-1': { nextMatchup: 'sf-1', slot: 'team1' },
  'qf-2': { nextMatchup: 'sf-1', slot: 'team2' },
  'qf-3': { nextMatchup: 'sf-2', slot: 'team1' },
  'qf-4': { nextMatchup: 'sf-2', slot: 'team2' },
  'sf-1': { nextMatchup: 'final', slot: 'team1' },
  'sf-2': { nextMatchup: 'final', slot: 'team2' },
};

// 2025-26 CFB Playoff data (12-team format)
// Add scores and set completed: true when games are finished
const initialPlayoffData: { [key: string]: Matchup } = {
  // First Round (Dec 20-21, 2025) - Seeds 5-12 play, 1-4 get byes
  'r1-1': {
    id: 'r1-1',
    team1: { seed: 9, name: 'Alabama', score: 31 },
    team2: { seed: 8, name: 'Oklahoma', score: 24 },
    round: 'First Round',
    location: 'Oklahoma',
    date: 'Dec 19',
    completed: true,
  },
  'r1-3': {
    id: 'r1-3',
    team1: { seed: 10, name: 'Miami', score: 10 },
    team2: { seed: 7, name: 'Texas A&M', score: 7 },
    round: 'First Round',
    location: 'Texas',
    date: 'Dec 20',
    completed: true,
  },
  'r1-4': {
    id: 'r1-4',
    team1: { seed: 11, name: 'Tulane', score: 10 },
    team2: { seed: 6, name: 'Ole Miss', score: 41 },
    round: 'First Round',
    location: 'Mississippi',
    date: 'Dec 20',
    completed: true,
  },
  'r1-2': {
    id: 'r1-2',
    team1: { seed: 12, name: 'James Madison', score: 34 },
    team2: { seed: 5, name: 'Oregon', score: 51 },
    round: 'First Round',
    location: 'Oregon',
    date: 'Dec 20',
    completed: true,
  },
  // Quarterfinals (Dec 31 - Jan 1) - NY6 Bowls
  'qf-1': {
    id: 'qf-1',
    team1: { seed: 1, name: 'Indiana', score: 38 },
    team2: { seed: 9, name: 'Alabama', score: 3 },
    round: 'Quarterfinal',
    location: 'Rose Bowl',
    date: 'Jan 1',
    completed: true,
  },
  'qf-2': {
    id: 'qf-2',
    team1: { seed: 4, name: 'Texas Tech', score: 0 },
    team2: { seed: 5, name: 'Oregon', score: 23 },
    round: 'Quarterfinal',
    location: 'Orange Bowl',
    date: 'Jan 1',
    completed: true,
  },
  'qf-3': {
    id: 'qf-3',
    team1: { seed: 2, name: 'Ohio State', score: 14 },
    team2: { seed: 10, name: 'Miami', score: 24 },
    round: 'Quarterfinal',
    location: 'Cotton Bowl',
    date: 'Dec 31',
    completed: true,
  },
  'qf-4': {
    id: 'qf-4',
    team1: { seed: 3, name: 'Georgia', score: 34 },
    team2: { seed: 6, name: 'Ole Miss', score: 39 },
    round: 'Quarterfinal',
    location: 'Sugar Bowl',
    date: 'Jan 1',
    completed: true,
  },
  // Semifinals (Jan 8-9)
  'sf-1': {
    id: 'sf-1',
    team1: { seed: 1, name: 'Indiana', score: 56 },
    team2: { seed: 5, name: 'Oregon', score: 22 },
    round: 'Semifinal',
    location: 'Peach Bowl',
    date: 'Jan 9',
    completed: true,
  },
  'sf-2': {
    id: 'sf-2',
    team1: { seed: 10, name: 'Miami', score: 31 },
    team2: { seed: 6, name: 'Ole Miss', score: 27 },
    round: 'Semifinal',
    location: 'Fiesta Bowl',
    date: 'Jan 8',
    completed: true,
  },
  // Championship (Jan 19, 2026)
  'final': {
    id: 'final',
    team1: null,
    team2: null,
    round: 'Championship',
    location: 'Miami, FL',
    date: 'Jan 19',
    completed: false,
  },
};

function TeamLogo({ teamName, size = 28 }: { teamName: string; size?: number }) {
  if (!teamName || teamName === 'TBD' || teamName.startsWith('Winner')) {
    return (
      <div
        className="bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-xs">?</span>
      </div>
    );
  }

  const logoUrl = getTeamLogo(teamName);

  return (
    <img
      src={logoUrl}
      alt={`${teamName} logo`}
      width={size}
      height={size}
      className="flex-shrink-0 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/cfb-hq/logos/default.svg';
      }}
    />
  );
}

interface MatchupCardProps {
  matchup: Matchup;
  compact?: boolean;
  userPick?: 'team1' | 'team2' | null;
  onPickWinner?: (matchupId: string, pick: 'team1' | 'team2') => void;
  canPick?: boolean;
}

function MatchupCard({ matchup, compact = false, userPick, onPickWinner, canPick = false }: MatchupCardProps) {
  const team1 = matchup.team1;
  const team2 = matchup.team2;

  // Create placeholder teams for TBD slots
  const displayTeam1 = team1 && team1.name ? team1 : { seed: 0, name: 'TBD' };
  const displayTeam2 = team2 && team2.name ? team2 : { seed: 0, name: 'TBD' };

  // Determine winners based on scores if completed
  let team1Winner = false;
  let team2Winner = false;
  if (matchup.completed && team1?.score !== undefined && team2?.score !== undefined) {
    team1Winner = team1.score > team2.score;
    team2Winner = team2.score > team1.score;
  }

  const canPickTeam1 = !!(canPick && !matchup.completed && team1 && team1.name && team1.name !== 'TBD');
  const canPickTeam2 = !!(canPick && !matchup.completed && team2 && team2.name && team2.name !== 'TBD');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden`}>
      <div className={compact ? 'p-2' : 'p-3'}>
        <TeamRow
          team={displayTeam1}
          compact={compact}
          isWinner={team1Winner}
          isPicked={userPick === 'team1'}
          canPick={canPickTeam1}
          onPick={() => onPickWinner?.(matchup.id, 'team1')}
        />
        <div className="border-t border-gray-100 my-1.5"></div>
        <TeamRow
          team={displayTeam2}
          compact={compact}
          isWinner={team2Winner}
          isPicked={userPick === 'team2'}
          canPick={canPickTeam2}
          onPick={() => onPickWinner?.(matchup.id, 'team2')}
        />
      </div>
      {matchup.location && (
        <div className="bg-gray-50 px-3 py-1.5 border-t border-gray-200">
          <span className="text-sm text-gray-600">{matchup.date} - {matchup.location}</span>
        </div>
      )}
    </div>
  );
}

interface TeamRowProps {
  team: Team;
  compact?: boolean;
  isWinner?: boolean;
  isPicked?: boolean;
  canPick?: boolean;
  onPick?: () => void;
}

function TeamRow({ team, compact = false, isWinner = false, isPicked = false, canPick = false, onPick }: TeamRowProps) {
  const isTBD = !team.name || team.name === 'TBD';

  return (
    <div
      onClick={canPick && !isTBD ? onPick : undefined}
      className={`flex items-center justify-between ${compact ? 'py-1' : 'py-1.5'}
        ${isWinner ? 'font-semibold' : ''}
        ${isPicked ? 'bg-green-50 -mx-2 px-2 rounded' : ''}
        ${canPick && !isTBD ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded transition-colors' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team.seed > 0 && (
          <span className={`${compact ? 'text-sm' : 'text-base'} text-gray-500 w-5 flex-shrink-0`}>
            {team.seed}
          </span>
        )}
        <TeamLogo teamName={team.name} size={compact ? 24 : 28} />
        <span className={`${compact ? 'text-sm' : 'text-base'} ${isTBD ? 'text-gray-500 italic' : isWinner ? 'text-gray-900' : 'text-gray-600'} truncate`}>
          {team.name || 'TBD'}
        </span>
        {isPicked && (
          <span className="text-green-600 text-sm ml-1">✓</span>
        )}
      </div>
      {team.score !== undefined && (
        <span className={`${compact ? 'text-sm' : 'text-base'} ${isWinner ? 'text-gray-900 font-bold' : 'text-gray-500'} ml-2`}>
          {team.score}
        </span>
      )}
    </div>
  );
}

export default function CFBPlayoffBracket() {
  // User picks for incomplete games
  const [userPicks, setUserPicks] = useState<{ [matchupId: string]: 'team1' | 'team2' }>({});

  // Computed bracket with user picks applied to future rounds
  const [displayData, setDisplayData] = useState(initialPlayoffData);

  // Recompute display data when user picks change
  useEffect(() => {
    const newData = structuredClone(initialPlayoffData);

    // Process each matchup and propagate winners/picks
    const processMatchup = (matchupId: string) => {
      const matchup = newData[matchupId];
      if (!matchup) return null;

      // If game is completed, determine winner by score
      if (matchup.completed && matchup.team1?.score !== undefined && matchup.team2?.score !== undefined) {
        return matchup.team1.score > matchup.team2.score ? matchup.team1 : matchup.team2;
      }

      // If user has a pick for this game
      if (userPicks[matchupId] && matchup.team1 && matchup.team2) {
        return userPicks[matchupId] === 'team1' ? matchup.team1 : matchup.team2;
      }

      return null;
    };

    // Propagate winners through the bracket
    Object.keys(bracketProgression).forEach(matchupId => {
      const winner = processMatchup(matchupId);
      if (winner) {
        const { nextMatchup, slot } = bracketProgression[matchupId];
        if (newData[nextMatchup]) {
          const existingTeam = newData[nextMatchup][slot];
          // Preserve existing team data if it has a score (game already has results entered)
          if (existingTeam?.score !== undefined) {
            return;
          }
          // Don't carry score forward - only seed and name
          newData[nextMatchup][slot] = { seed: winner.seed, name: winner.name };
        }
      }
    });

    setDisplayData(newData);
  }, [userPicks]);

  const handlePickWinner = (matchupId: string, pick: 'team1' | 'team2') => {
    setUserPicks(prev => {
      // If clicking the same pick, deselect it
      if (prev[matchupId] === pick) {
        const newPicks = { ...prev };
        delete newPicks[matchupId];
        // Also clear downstream picks
        clearDownstreamPicks(matchupId, newPicks);
        return newPicks;
      }
      // Otherwise set the new pick and clear downstream
      const newPicks = { ...prev, [matchupId]: pick };
      clearDownstreamPicks(matchupId, newPicks);
      return newPicks;
    });
  };

  // Clear picks for games that depend on this matchup
  const clearDownstreamPicks = (matchupId: string, picks: typeof userPicks) => {
    const progression = bracketProgression[matchupId];
    if (progression) {
      const { nextMatchup } = progression;
      if (picks[nextMatchup]) {
        delete picks[nextMatchup];
        clearDownstreamPicks(nextMatchup, picks);
      }
    }
  };

  // Find champion (either from completed game or user pick)
  const finalMatchup = displayData['final'];
  const champion = (() => {
    if (finalMatchup.completed && finalMatchup.team1?.score !== undefined && finalMatchup.team2?.score !== undefined) {
      return finalMatchup.team1.score > finalMatchup.team2.score ? finalMatchup.team1 : finalMatchup.team2;
    }
    if (userPicks['final'] && finalMatchup.team1 && finalMatchup.team2) {
      return userPicks['final'] === 'team1' ? finalMatchup.team1 : finalMatchup.team2;
    }
    return null;
  })();

  const hasAnyPicks = Object.keys(userPicks).length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden w-full max-w-6xl mx-auto">
      <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: '#800000' }}>
        <h3 className="text-xl font-bold text-white">2025-26 CFB Playoff Bracket</h3>
        <button
          onClick={() => setUserPicks({})}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${hasAnyPicks ? 'bg-white/20 text-white hover:bg-white/30' : 'invisible'}`}
        >
          Clear Picks
        </button>
      </div>

      <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5">
        <p className="text-sm text-blue-700">Click on a team to pick them as the winner. Your picks will advance through the bracket.</p>
      </div>

      <div className="px-5 pt-3 pb-5 overflow-x-auto">
        {/* Desktop Bracket View */}
        <div className="hidden lg:block">
          <div className="flex items-stretch gap-4 justify-between">
            {/* First Round */}
            <div className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[260px]">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">First Round</div>
              <MatchupCard matchup={displayData['r1-1']} compact userPick={userPicks['r1-1']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-2']} compact userPick={userPicks['r1-2']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-3']} compact userPick={userPicks['r1-3']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-4']} compact userPick={userPicks['r1-4']} onPickWinner={handlePickWinner} canPick />
            </div>

            {/* Quarterfinals */}
            <div className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[260px] justify-around">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">Quarterfinals</div>
              <MatchupCard matchup={displayData['qf-1']} compact userPick={userPicks['qf-1']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-2']} compact userPick={userPicks['qf-2']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-3']} compact userPick={userPicks['qf-3']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-4']} compact userPick={userPicks['qf-4']} onPickWinner={handlePickWinner} canPick />
            </div>

            {/* Semifinals */}
            <div className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[260px] justify-around">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">Semifinals</div>
              <div className="flex-1 flex flex-col justify-around">
                <MatchupCard matchup={displayData['sf-1']} compact userPick={userPicks['sf-1']} onPickWinner={handlePickWinner} canPick />
                <MatchupCard matchup={displayData['sf-2']} compact userPick={userPicks['sf-2']} onPickWinner={handlePickWinner} canPick />
              </div>
            </div>

            {/* Championship */}
            <div className="flex flex-col flex-1 min-w-[220px] max-w-[280px]">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide text-center">Championship</div>
              <div className="flex-1 flex flex-col justify-center">
                <MatchupCard matchup={displayData['final']} userPick={userPicks['final']} onPickWinner={handlePickWinner} canPick />
                <div className="mt-4 text-center">
                  <div className={`inline-block rounded-lg px-5 py-3 ${champion ? 'bg-yellow-100 border border-yellow-300' : 'bg-gray-100 border border-gray-200'}`}>
                    <span className={`font-semibold text-base ${champion ? 'text-yellow-800' : 'text-gray-500'}`}>
                      {userPicks['final'] && !finalMatchup.completed ? 'Your Pick' : 'National Champion'}
                    </span>
                    {champion ? (
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <TeamLogo teamName={champion.name} size={28} />
                        <span className="text-gray-900 font-bold text-lg">{champion.name}</span>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-lg">TBD</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View */}
        <div className="lg:hidden space-y-6">
          {/* Champion Banner */}
          <div className={`rounded-lg p-4 text-center ${champion ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
            <span className={`font-semibold text-sm ${champion ? 'text-yellow-800' : 'text-gray-500'}`}>
              {userPicks['final'] && !finalMatchup.completed ? 'Your Champion Pick' : '2025-26 National Champion'}
            </span>
            {champion ? (
              <div className="flex items-center justify-center gap-2 mt-2">
                <TeamLogo teamName={champion.name} size={32} />
                <span className="text-xl font-bold text-gray-900">{champion.name}</span>
              </div>
            ) : (
              <div className="text-xl font-bold text-gray-500 mt-1 italic">TBD</div>
            )}
          </div>

          {/* Championship */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Championship - Jan 19</h4>
            <MatchupCard matchup={displayData['final']} userPick={userPicks['final']} onPickWinner={handlePickWinner} canPick />
          </div>

          {/* Semifinals */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Semifinals</h4>
            <div className="space-y-3">
              <MatchupCard matchup={displayData['sf-1']} userPick={userPicks['sf-1']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['sf-2']} userPick={userPicks['sf-2']} onPickWinner={handlePickWinner} canPick />
            </div>
          </div>

          {/* Quarterfinals */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Quarterfinals</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MatchupCard matchup={displayData['qf-1']} userPick={userPicks['qf-1']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-2']} userPick={userPicks['qf-2']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-3']} userPick={userPicks['qf-3']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['qf-4']} userPick={userPicks['qf-4']} onPickWinner={handlePickWinner} canPick />
            </div>
          </div>

          {/* First Round */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">First Round</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MatchupCard matchup={displayData['r1-1']} userPick={userPicks['r1-1']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-2']} userPick={userPicks['r1-2']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-3']} userPick={userPicks['r1-3']} onPickWinner={handlePickWinner} canPick />
              <MatchupCard matchup={displayData['r1-4']} userPick={userPicks['r1-4']} onPickWinner={handlePickWinner} canPick />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
