import { TransferPlayer } from '@/types/player';

interface StatsCardsProps {
  players: TransferPlayer[];
}

export default function StatsCards({ players }: StatsCardsProps) {
  // Calculate total players
  const totalPlayers = players.length;

  // Calculate most active position
  const positionCounts = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActivePosition = Object.entries(positionCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // Calculate most active conference (incoming)
  const incomingConferenceCounts = players.reduce((acc, player) => {
    if (player.newConference) {
      acc[player.newConference] = (acc[player.newConference] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const mostActiveConference = Object.entries(incomingConferenceCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // Calculate average impact grade
  const playersWithRating = players.filter(p => p.rating !== undefined);
  const avgRating = playersWithRating.length > 0
    ? (playersWithRating.reduce((sum, p) => sum + (p.rating || 0), 0) / playersWithRating.length).toFixed(1)
    : 'N/A';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Players */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase">Total Players</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalPlayers.toLocaleString()}</p>
        </div>
      </div>

      {/* Most Active Position */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase">Top Position</p>
          {mostActivePosition ? (
            <>
              <p className="text-3xl font-bold text-gray-900 mt-1">{mostActivePosition[0]}</p>
              <p className="text-xs text-gray-500 mt-1">{mostActivePosition[1]} players</p>
            </>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">N/A</p>
          )}
        </div>
      </div>

      {/* Most Active Conference (Incoming) */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase">Most Active Conf</p>
          {mostActiveConference ? (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">{mostActiveConference[0]}</p>
              <p className="text-xs text-gray-500 mt-1">{mostActiveConference[1]} incoming</p>
            </>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mt-1">N/A</p>
          )}
        </div>
      </div>

      {/* Average Impact Grade */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
        <div>
          <p className="text-sm font-medium text-gray-600 uppercase">Avg Impact Grade</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{avgRating}</p>
          <p className="text-xs text-gray-500 mt-1">{playersWithRating.length} rated</p>
        </div>
      </div>
    </div>
  );
}
