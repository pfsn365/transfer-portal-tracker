import { TransferPlayer } from '@/types/player';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getTeamLogo } from '@/utils/teamLogos';
import { getTeamColor, getTeamColorLight } from '@/utils/teamColors';

interface PlayerTableProps {
  players: TransferPlayer[];
}

export default function PlayerTable({ players }: PlayerTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Committed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Entered':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Enrolled':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getPositionColor = (position: string) => {
    // Quarterback
    if (position === 'QB') return 'bg-purple-100 text-purple-800';

    // Running Backs
    if (position === 'RB') return 'bg-green-100 text-green-800';

    // Wide Receivers
    if (position === 'WR') return 'bg-blue-100 text-blue-800';

    // Tight End
    if (position === 'TE') return 'bg-cyan-100 text-cyan-800';

    // Offensive Line
    if (['OL', 'OT', 'OG', 'C'].includes(position)) return 'bg-orange-100 text-orange-800';

    // Defensive Line
    if (['EDGE', 'DL', 'DT'].includes(position)) return 'bg-red-100 text-red-800';

    // Linebackers
    if (position === 'LB') return 'bg-amber-100 text-amber-800';

    // Defensive Backs
    if (['CB', 'S', 'DB'].includes(position)) return 'bg-teal-100 text-teal-800';

    // Special Teams
    if (['K', 'P'].includes(position)) return 'bg-gray-100 text-gray-800';

    // Athletes
    if (position === 'ATH') return 'bg-violet-100 text-violet-800';

    // Default
    return 'bg-slate-100 text-slate-800';
  };

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-500 text-lg">No players found matching your filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden content-auto">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pos
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Transfer Path
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  PFSN Impact Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player, index) => (
                <tr
                  key={player.id}
                  className={`table-row-hover ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                        <Image
                          src={getTeamLogo(player.formerSchool.toLowerCase())}
                          alt={`${player.formerSchool} logo`}
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{player.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {player.class}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(player.status)}`}>
                      {player.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 flex-shrink-0">
                          <Image
                            src={getTeamLogo(player.formerSchool.toLowerCase())}
                            alt={`${player.formerSchool} logo`}
                            fill
                            sizes="24px"
                            className="object-contain"
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-gray-900">{player.formerSchool}</div>
                          <div className="text-xs text-gray-500">{player.formerConference}</div>
                        </div>
                      </div>
                      {player.newSchool && (
                        <>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mx-1" />
                          <div className="flex items-center gap-2">
                            <div className="relative h-6 w-6 flex-shrink-0">
                              <Image
                                src={getTeamLogo(player.newSchool.toLowerCase())}
                                alt={`${player.newSchool} logo`}
                                fill
                                sizes="24px"
                                className="object-contain"
                              />
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-green-700">{player.newSchool}</div>
                              <div className="text-xs text-gray-500">{player.newConference}</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.rating && (
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900">{player.rating}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {players.map((player) => (
          <div key={player.id} className="bg-white rounded-lg shadow-md p-4 sm:p-5 border border-gray-200 active:bg-gray-50 transition-colors">
            {/* Player Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-12 w-12 relative rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                  <Image
                    src={getTeamLogo(player.formerSchool.toLowerCase())}
                    alt={`${player.formerSchool} logo`}
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{player.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                    <span className="text-xs text-gray-600 font-medium">{player.class}</span>
                  </div>
                </div>
              </div>
              {player.rating && (
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{player.rating}</div>
                  <div className="text-xs text-gray-500">PFSN Grade</div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="mb-3">
              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(player.status)}`}>
                {player.status}
              </span>
            </div>

            {/* Transfer Path */}
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">From</div>
                  <div className="flex items-center gap-2">
                    <div className="relative h-5 w-5 flex-shrink-0">
                      <Image
                        src={getTeamLogo(player.formerSchool.toLowerCase())}
                        alt={`${player.formerSchool} logo`}
                        fill
                        sizes="20px"
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{player.formerSchool}</div>
                      <div className="text-xs text-gray-500">{player.formerConference}</div>
                    </div>
                  </div>
                </div>
                {player.newSchool && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      <div className="flex items-center gap-2">
                        <div className="relative h-5 w-5 flex-shrink-0">
                          <Image
                            src={getTeamLogo(player.newSchool.toLowerCase())}
                            alt={`${player.newSchool} logo`}
                            fill
                            sizes="20px"
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-green-700 text-sm">{player.newSchool}</div>
                          <div className="text-xs text-gray-500">{player.newConference}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
