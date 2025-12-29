import { TransferPlayer, PlayerPosition } from '@/types/player';
import { ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getTeamLogo } from '@/utils/teamLogos';
import { getTeamColor, getTeamColorLight } from '@/utils/teamColors';
import { getTeamById } from '@/data/teams';

// Get position-specific impact grade URL (only for positions with ranking pages)
function getPositionImpactUrl(position: PlayerPosition): string | null {
  const positionMap: Record<string, string> = {
    'QB': 'qb',
    'RB': 'rb',
    'WR': 'wr',
    'TE': 'te',
    'OL': 'ol',
    'OT': 'ol',  // All O-Line positions use OL rankings
    'OG': 'ol',
    'C': 'ol',
    'EDGE': 'edge',
    'DL': 'dl',
    'DT': 'dt',
    'LB': 'lb',
    'CB': 'cb',
    // No ranking pages for: S, DB, K, P, ATH
  };

  const posSlug = positionMap[position];
  if (!posSlug) return null;

  return `https://www.profootballnetwork.com/cfb-${posSlug}-rankings-impact/`;
}

// Get which school logo to display based on player status
function getDisplaySchool(player: TransferPlayer): string {
  // If committed or enrolled and has a new school, show new school
  if ((player.status === 'Committed' || player.status === 'Enrolled') && player.newSchool) {
    return player.newSchool;
  }
  // Otherwise show former school
  return player.formerSchool;
}

type SortField = 'name' | 'position' | 'class' | 'status' | 'rating' | 'formerSchool' | 'newSchool' | 'announcedDate';
type SortDirection = 'asc' | 'desc';

interface PlayerTableProps {
  players: TransferPlayer[];
  sortField: SortField | null;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

export default function PlayerTable({ players, sortField, sortDirection, onSort }: PlayerTableProps) {
  // Sortable header component
  const SortableHeader = ({ field, children, centered = false }: { field: SortField; children: React.ReactNode; centered?: boolean }) => {
    const isActive = sortField === field;
    return (
      <th
        className={`px-6 py-4 ${centered ? 'text-center' : 'text-left'} text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none`}
        onClick={() => onSort(field)}
      >
        <div className={`flex items-center gap-1 ${centered ? 'justify-center' : ''}`}>
          {children}
          <div className="flex flex-col">
            <ChevronUp
              className={`w-3 h-3 -mb-1 ${isActive && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
            />
            <ChevronDown
              className={`w-3 h-3 ${isActive && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
            />
          </div>
        </div>
      </th>
    );
  };

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
                <SortableHeader field="name">Player</SortableHeader>
                <SortableHeader field="position" centered>Pos</SortableHeader>
                <SortableHeader field="class" centered>Class</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Transfer Path
                </th>
                <SortableHeader field="rating" centered>
                  <div>
                    <div>PFSN Impact Grade</div>
                    <div className="text-[10px] font-normal normal-case text-gray-500 mt-0.5">
                      Comparable within position groups
                    </div>
                  </div>
                </SortableHeader>
                <SortableHeader field="announcedDate">Date</SortableHeader>
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
                      {(() => {
                        const displaySchool = getDisplaySchool(player);
                        return (
                          <div className="flex-shrink-0 h-14 w-14 relative rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                            <Image
                              src={getTeamLogo(displaySchool.toLowerCase())}
                              alt={`${displaySchool} logo`}
                              fill
                              sizes="56px"
                              className="object-contain p-3"
                            />
                          </div>
                        );
                      })()}
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{player.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getPositionColor(player.position)}`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                    {player.class}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(player.status)}`}>
                      {player.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      {(() => {
                        const formerTeam = getTeamById(player.formerSchool);
                        return formerTeam ? (
                          <Link href={`/college/${formerTeam.slug}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
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
                              <div className="font-semibold text-gray-900 hover:underline">{player.formerSchool}</div>
                              <div className="text-xs text-gray-500">{player.formerConference}</div>
                            </div>
                          </Link>
                        ) : (
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
                        );
                      })()}
                      {player.newSchool && (
                        <>
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mx-1" />
                          {(() => {
                            const newTeam = getTeamById(player.newSchool!);
                            return newTeam ? (
                              <Link href={`/college/${newTeam.slug}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
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
                                  <div className="font-semibold text-green-700 hover:underline">{player.newSchool}</div>
                                  <div className="text-xs text-gray-500">{player.newConference}</div>
                                </div>
                              </Link>
                            ) : (
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
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      {player.rating ? (
                        (() => {
                          const url = getPositionImpactUrl(player.position);
                          return url ? (
                            <Link
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {player.rating.toFixed(1)}
                            </Link>
                          ) : (
                            <span className="text-lg font-bold text-gray-900">
                              {player.rating.toFixed(1)}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-lg font-bold text-gray-900">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {new Date(player.announcedDate).toLocaleDateString('en-US', {
                        month: 'numeric',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {/* Mobile Sort Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
          <div className="flex gap-2">
            <select
              value={sortField || ''}
              onChange={(e) => onSort(e.target.value as SortField)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              <option value="name">Player Name</option>
              <option value="position">Position</option>
              <option value="class">Class</option>
              <option value="status">Status</option>
              <option value="rating">Impact Grade</option>
            </select>
            {sortField && (
              <button
                type="button"
                onClick={() => onSort(sortField)}
                className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {sortDirection === 'asc' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
        {players.map((player) => (
          <div key={player.id} className="bg-white rounded-lg shadow-md p-4 sm:p-5 border border-gray-200 active:bg-gray-50 transition-colors">
            {/* Player Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const displaySchool = getDisplaySchool(player);
                  return (
                    <div className="flex-shrink-0 h-14 w-14 relative rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-200">
                      <Image
                        src={getTeamLogo(displaySchool.toLowerCase())}
                        alt={`${displaySchool} logo`}
                        fill
                        sizes="56px"
                        className="object-contain p-3"
                      />
                    </div>
                  );
                })()}
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
              <div className="text-right">
                <div className="text-xl font-bold">
                  {player.rating ? (
                    (() => {
                      const url = getPositionImpactUrl(player.position);
                      return url ? (
                        <Link
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {player.rating.toFixed(1)}
                        </Link>
                      ) : (
                        <span className="text-gray-900">
                          {player.rating.toFixed(1)}
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-gray-900">-</span>
                  )}
                </div>
                <div className="text-xs text-gray-500">PFSN Grade</div>
              </div>
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
                  {(() => {
                    const formerTeam = getTeamById(player.formerSchool);
                    return formerTeam ? (
                      <Link href={`/college/${formerTeam.slug}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
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
                          <div className="font-semibold text-gray-900 text-sm hover:underline">{player.formerSchool}</div>
                          <div className="text-xs text-gray-500">{player.formerConference}</div>
                        </div>
                      </Link>
                    ) : (
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
                    );
                  })()}
                </div>
                {player.newSchool && (
                  <>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-1">To</div>
                      {(() => {
                        const newTeam = getTeamById(player.newSchool!);
                        return newTeam ? (
                          <Link href={`/college/${newTeam.slug}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
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
                              <div className="font-semibold text-green-700 text-sm hover:underline">{player.newSchool}</div>
                              <div className="text-xs text-gray-500">{player.newConference}</div>
                            </div>
                          </Link>
                        ) : (
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
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="text-xs text-gray-500">
              {new Date(player.announcedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
