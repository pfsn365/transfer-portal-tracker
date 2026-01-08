'use client';

import { getTeamLogo } from '@/utils/teamLogos';

interface Game {
  id: string;
  date: string;
  time?: string;
  homeTeam: string;
  awayTeam: string;
  homeRank?: number;
  awayRank?: number;
  homeScore?: number;
  awayScore?: number;
  location?: string;
  network?: string;
  completed?: boolean;
}

// Manually enter games here - will be replaced with API later
const scheduleData: Game[] = [
  // Bowl Games / Playoff Games
  {
    id: '1',
    date: 'Jan. 2',
    time: '1:00 PM',
    homeTeam: 'Texas State',
    awayTeam: 'Rice',
    location: 'Armed Forces Bowl',
    network: 'ESPN',
    completed: false,
  },
  {
    id: '2',
    date: 'Jan 2',
    time: '4:30 PM',
    homeTeam: 'Cincinnati',
    awayTeam: 'Navy',
    location: 'Liberty Bowl',
    network: 'ESPN',
    completed: false,
  },
  {
    id: '3',
    date: 'Jan 2',
    time: '8:00 PM',
    homeTeam: 'SMU',
    awayTeam: 'Arizona',
    awayRank: 17,
    location: 'Trust & Will Holiday Bowl',
    network: 'ESPN',
    completed: false,
  },
  {
    id: '4',
    date: 'Jan 2',
    time: '8:00 PM',
    homeTeam: 'Mississippi State',
    awayTeam: 'Wake Forest',
    location: 'Dukes Mayo Bowl',
    network: 'ESPN',
    completed: false,
  },
  {
    id: '5',
    date: 'Jan 8',
    time: '7:30 PM',
    homeTeam: 'Ole Miss',
    awayTeam: 'Miami',
    homeRank: 6,
    awayRank: 10,
    location: 'Fiesta Bowl',
    network: 'ESPN',
    completed: false,
  },
  {
    id: '6',
    date: 'Jan 9',
    time: '7:30 PM',
    homeTeam: 'Indiana',
    awayTeam: 'Oregon',
    homeRank: 1,
    awayRank: 5,
    location: 'Peach Bowl',
    network: 'ESPN',
    completed: false,
  },
];

function TeamLogo({ teamName, size = 20 }: { teamName: string; size?: number }) {
  const logoUrl = getTeamLogo(teamName);

  return (
    <img
      src={logoUrl}
      alt={`${teamName} logo`}
      className="flex-shrink-0 object-contain"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/cfb-hq/logos/default.svg';
      }}
    />
  );
}

function GameRow({ game }: { game: Game }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{game.date} {game.time && `• ${game.time}`}</span>
        {game.network && (
          <span className="text-xs font-medium text-gray-500">{game.network}</span>
        )}
      </div>

      <div className="space-y-1.5">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={game.awayTeam} size={20} />
            <span className={`text-sm ${game.completed && game.awayScore !== undefined && game.homeScore !== undefined && game.awayScore > game.homeScore ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {game.awayRank && <span className="text-gray-500">{game.awayRank} </span>}
              {game.awayTeam}
            </span>
          </div>
          {game.completed && game.awayScore !== undefined && (
            <span className={`text-sm font-medium ${game.awayScore > (game.homeScore ?? 0) ? 'text-gray-900' : 'text-gray-500'}`}>
              {game.awayScore}
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={game.homeTeam} size={20} />
            <span className={`text-sm ${game.completed && game.homeScore !== undefined && game.awayScore !== undefined && game.homeScore > game.awayScore ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
              {game.homeRank && <span className="text-gray-500">{game.homeRank} </span>}
              {game.homeTeam}
            </span>
          </div>
          {game.completed && game.homeScore !== undefined && (
            <span className={`text-sm font-medium ${game.homeScore > (game.awayScore ?? 0) ? 'text-gray-900' : 'text-gray-500'}`}>
              {game.homeScore}
            </span>
          )}
        </div>
      </div>

      {game.location && (
        <div className="mt-1.5 text-xs text-gray-500">{game.location}</div>
      )}
    </div>
  );
}

export default function CFBScheduleWidget() {
  const upcomingGames = scheduleData.filter(g => !g.completed);
  const completedGames = scheduleData.filter(g => g.completed);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden h-full">
      <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: '#800000' }}>
        <h3 className="text-lg font-bold text-white">Schedule</h3>
      </div>

      <div className="px-4">
        {upcomingGames.length > 0 && (
          <div>
            {upcomingGames.map(game => (
              <GameRow key={game.id} game={game} />
            ))}
          </div>
        )}

        {completedGames.length > 0 && (
          <div className={upcomingGames.length > 0 ? 'mt-4' : ''}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Completed</h4>
            {completedGames.map(game => (
              <GameRow key={game.id} game={game} />
            ))}
          </div>
        )}

        {scheduleData.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center py-4">No games scheduled</p>
        )}
      </div>
    </div>
  );
}
