'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { getTeamById } from '@/data/teams';
import {
  playoffTeams2025,
  bowlGames2025,
  keyDates2025,
  conferencePerformance2025,
  cfpSeedRecords12Team,
  cfpSeedRecords4Team,
  fcsPlayoffTeams2025,
  fcsChampionshipGame2025,
  getTeamLogo,
} from '@/data/postseason-2025';
import {
  nationalChampions,
  getChampionshipCounts,
  getChampionsByEra,
  fcsChampions,
  getFCSChampionshipCounts,
} from '@/data/national-champions';

type Tab = 'playoff' | 'fcs-playoff' | 'bowls' | 'conference' | 'dates' | 'champions';

type ConferenceSortField = 'conference' | 'bowlEligible' | 'bowlWins' | 'winPct';
type SortDirection = 'asc' | 'desc';

export default function PostseasonClient() {
  const [activeTab, setActiveTab] = useState<Tab>('playoff');
  const [bowlFilter, setBowlFilter] = useState<'all' | 'cfp' | 'other'>('all');
  const [bowlSearch, setBowlSearch] = useState('');
  const [championsView, setChampionsView] = useState<'fbs' | 'fcs'>('fbs');
  const [confSortField, setConfSortField] = useState<ConferenceSortField>('winPct');
  const [confSortDirection, setConfSortDirection] = useState<SortDirection>('desc');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'playoff', label: 'College Football Playoff' },
    { id: 'fcs-playoff', label: 'FCS Playoff' },
    { id: 'bowls', label: 'Bowl Games' },
    { id: 'conference', label: 'Conference Performance' },
    { id: 'dates', label: 'Key Dates' },
    { id: 'champions', label: 'National Champions By Year' },
  ];

  const filteredBowlGames = bowlGames2025.filter((game) => {
    // Filter by type
    if (bowlFilter === 'cfp' && !game.isCFP) return false;
    if (bowlFilter === 'other' && game.isCFP) return false;

    // Filter by search
    if (bowlSearch.trim()) {
      const search = bowlSearch.toLowerCase();
      return (
        game.name.toLowerCase().includes(search) ||
        game.team1.toLowerCase().includes(search) ||
        game.team2.toLowerCase().includes(search) ||
        game.location.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const championshipCounts = getChampionshipCounts().slice(0, 10);
  const fcsChampionshipCounts = getFCSChampionshipCounts().slice(0, 10);
  const cfpEraChampions = getChampionsByEra('cfp');
  const bcsEraChampions = getChampionsByEra('bcs');
  const preBcsChampions = getChampionsByEra('pre-bcs');

  const handleConfSort = (field: ConferenceSortField) => {
    if (confSortField === field) {
      setConfSortDirection(confSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setConfSortField(field);
      setConfSortDirection('desc');
    }
  };

  const sortedConferencePerformance = [...conferencePerformance2025].sort((a, b) => {
    const aWinPct = a.bowlWins / (a.bowlWins + a.bowlLosses);
    const bWinPct = b.bowlWins / (b.bowlWins + b.bowlLosses);

    let comparison = 0;
    switch (confSortField) {
      case 'conference':
        comparison = a.conference.localeCompare(b.conference);
        break;
      case 'bowlEligible':
        comparison = a.bowlEligible - b.bowlEligible;
        break;
      case 'bowlWins':
        comparison = a.bowlWins - b.bowlWins;
        break;
      case 'winPct':
        comparison = aWinPct - bWinPct;
        break;
    }
    return confSortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: ConferenceSortField }) => (
    <span className="ml-1 inline-block">
      {confSortField === field ? (
        confSortDirection === 'asc' ? '↑' : '↓'
      ) : (
        <span className="text-gray-300">↕</span>
      )}
    </span>
  );

  return (
    <>
        {/* Hero Section */}
        <header
          className="text-white shadow-lg"
          style={{
            background: 'linear-gradient(180deg, #800000 0%, #600000 100%)',
            boxShadow: 'inset 0 -30px 40px -30px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container mx-auto px-4 pt-6 sm:pt-7 md:pt-8 lg:pt-10 pb-5 sm:pb-6 md:pb-7 lg:pb-8">
            <h1 className="text-4xl lg:text-5xl font-extrabold mb-2">
              CFB Postseason HQ
            </h1>
            <p className="text-lg opacity-90 font-medium">
              {(() => {
                const year = new Date().getMonth() < 8 ? new Date().getFullYear() - 1 : new Date().getFullYear();
                return `${year}-${(year + 1).toString().slice(-2)}`;
              })()} College Football Playoff & Bowl Games
            </p>
          </div>
        </header>

        {/* Raptive Header Ad */}
        <div className="container mx-auto px-4 min-h-[110px]">
          <div className="raptive-pfn-header-90"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Tab Navigation */}
          <div className="sticky top-[48px] z-20 bg-white border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 px-4 sm:px-6 lg:mx-0 lg:px-0 lg:static lg:bg-white lg:rounded-xl lg:border lg:border-gray-200 lg:shadow-sm lg:p-2 lg:mb-6">
            <nav className="flex gap-2 overflow-x-auto scrollbar-hide py-2.5 lg:py-0 lg:gap-1 lg:min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer lg:rounded-lg lg:py-2 lg:font-semibold ${
                    activeTab === tab.id
                      ? 'bg-[#800000] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 lg:bg-white lg:text-gray-700 lg:hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="h-6 lg:hidden"></div>

          {/* Tab Content */}
          {activeTab === 'playoff' && (
            <div className="space-y-6">
              {/* CFP National Championship Result */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-300 shadow-sm p-6">
                <div className="text-center">
                  <div className="text-sm font-semibold text-amber-700 mb-2">2025-26 CFP NATIONAL CHAMPION</div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="relative w-16 h-16">
                      <Image
                        src="https://a.espncdn.com/i/teamlogos/ncaa/500/84.png"
                        alt="Indiana"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Indiana</div>
                      <div className="text-gray-600">Hoosiers</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    27-21 vs Miami (FL)
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    January 19, 2026 • Hard Rock Stadium, Miami Gardens, FL
                  </div>
                </div>
              </div>

              {/* Playoff Teams Grid */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                  <h2 className="text-lg font-bold text-white">2025-26 College Football Playoff Teams</h2>
                </div>
                <div className="p-4">
                  <div className="flex overflow-x-auto scrollbar-hide gap-4 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                    {playoffTeams2025.map((team) => (
                      <div
                        key={team.seed}
                        className={`min-w-[280px] w-[85vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink border rounded-lg p-4 ${
                          team.result === 'National Champion'
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl font-bold text-[#800000]">#{team.seed}</span>
                          {team.logo && (
                            <div className="relative w-10 h-10">
                              <Image
                                src={team.logo}
                                alt={team.team}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          )}
                          <div>
                            {(() => {
                              const teamData = getTeamById(team.team);
                              return teamData ? (
                                <Link href={`/teams/${teamData.slug}`} className="font-bold text-gray-900 hover:text-[#800000] hover:underline">
                                  {team.team}
                                </Link>
                              ) : (
                                <div className="font-bold text-gray-900">{team.team}</div>
                              );
                            })()}
                            <div className="text-sm text-gray-600">{team.record}</div>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Conference:</span>
                            <span className="font-medium">{team.conference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Qualification:</span>
                            <span className={`font-medium ${team.qualification === 'Conference Champion' ? 'text-green-600' : 'text-[#800000]'}`}>
                              {team.qualification}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Result:</span>
                            <span className={`font-semibold ${
                              team.result === 'National Champion' ? 'text-amber-600' : 'text-gray-700'
                            }`}>
                              {team.result}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CFP Records by Seed - 12-Team */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                  <h2 className="text-lg font-bold text-white">CFP Records by Seed: 12-Team Playoff Era</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Seed</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">First Round</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Quarterfinals</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Semifinals</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Championship</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cfpSeedRecords12Team.map((record, idx) => (
                        <tr key={record.seed} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-bold text-[#800000]">#{record.seed}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.firstRound}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.quarterfinal}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.semifinal}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.championship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CFP Records by Seed - 4-Team */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                  <h2 className="text-lg font-bold text-white">CFP Records by Seed: 4-Team Playoff Era (2014-2023)</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Seed</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Semifinals</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Championship</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cfpSeedRecords4Team.map((record, idx) => (
                        <tr key={record.seed} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-bold text-[#800000]">#{record.seed}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.semifinal}</td>
                          <td className="px-4 py-3 text-center text-sm">{record.championship}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'fcs-playoff' && (
            <div className="space-y-6">
              {/* FCS Championship Result */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-300 shadow-sm p-6">
                <div className="text-center">
                  <div className="text-sm font-semibold text-amber-700 mb-2">2025-26 FCS NATIONAL CHAMPION</div>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="relative w-16 h-16">
                      <Image
                        src="https://a.espncdn.com/i/teamlogos/ncaa/500/147.png"
                        alt="Montana State"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">Montana State</div>
                      <div className="text-gray-600">Bobcats</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {fcsChampionshipGame2025.team1Score}-{fcsChampionshipGame2025.team2Score} {fcsChampionshipGame2025.overtime ? '(OT)' : ''} vs Illinois State
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(fcsChampionshipGame2025.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {fcsChampionshipGame2025.stadium}, {fcsChampionshipGame2025.location}
                  </div>
                </div>
              </div>

              {/* FCS Playoff Teams Grid */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                  <h2 className="text-lg font-bold text-white">2025-26 FCS Playoff Teams (24-Team Bracket)</h2>
                </div>
                <div className="p-4">
                  <div className="flex overflow-x-auto scrollbar-hide gap-4 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                    {fcsPlayoffTeams2025.map((team, index) => (
                      <div
                        key={team.team}
                        className={`min-w-[280px] w-[85vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink border rounded-lg p-3 ${
                          team.result === 'National Champion'
                            ? 'border-amber-400 bg-amber-50'
                            : team.result === 'Lost in Championship'
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-lg font-bold ${team.seed && team.seed <= 8 ? 'text-[#800000]' : 'text-gray-500'}`}>
                            {team.seed ? `#${team.seed}` : '—'}
                          </span>
                          {team.logo && (
                            <div className="relative w-8 h-8">
                              <Image
                                src={team.logo}
                                alt={team.team}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-sm truncate">{team.team}</div>
                            <div className="text-xs text-gray-600">{team.record}</div>
                          </div>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Conference:</span>
                            <span className="font-medium truncate ml-1">{team.conference}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Result:</span>
                            <span className={`font-semibold ${
                              team.result === 'National Champion' ? 'text-amber-600' :
                              team.result === 'Lost in Championship' ? 'text-gray-700' : 'text-gray-600'
                            }`}>
                              {team.result}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tournament Bracket Note */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <strong>About the FCS Playoff:</strong> The FCS Championship is a 24-team single-elimination playoff. Only the top 16 teams are seeded.
                Seeds 1-8 receive first-round byes. Seeds 9-16 host first-round games against the 8 unseeded teams, paired by geographic proximity.
                The championship game is held at a predetermined location (2025: Nashville, TN).
              </div>
            </div>
          )}

          {activeTab === 'bowls' && (
            <div className="space-y-6">
              {/* Bowl Filter */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <nav className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {[
                      { id: 'all', label: 'All Bowl Games' },
                      { id: 'cfp', label: 'CFP Games Only' },
                      { id: 'other', label: 'Non-CFP Bowls' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setBowlFilter(filter.id as typeof bowlFilter)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          bowlFilter === filter.id
                            ? 'bg-[#800000] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </nav>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search bowls or teams..."
                      value={bowlSearch}
                      onChange={(e) => setBowlSearch(e.target.value)}
                      className="w-full sm:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bowl Games Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                  <h2 className="text-lg font-bold text-white">
                    2025-26 Bowl Games ({filteredBowlGames.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Bowl</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Matchup</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredBowlGames.map((game, idx) => (
                        <tr key={`${game.name}-${idx}`} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${game.isCFP ? 'border-l-4 border-l-[#800000]' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{game.name}</div>
                            {game.cfpRound && (
                              <span className="text-xs text-[#800000] font-semibold">{game.cfpRound}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1.5">
                                {getTeamLogo(game.team1) && (
                                  <div className="relative w-6 h-6 flex-shrink-0">
                                    <Image
                                      src={getTeamLogo(game.team1)!}
                                      alt={game.team1}
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                {(() => {
                                  const team1Data = getTeamById(game.team1);
                                  return team1Data ? (
                                    <Link href={`/teams/${team1Data.slug}`} className={`hover:text-[#800000] hover:underline ${game.team1Score > game.team2Score ? 'font-bold' : ''}`}>
                                      {game.team1Rank && <span className="text-gray-500">#{game.team1Rank} </span>}
                                      {game.team1}
                                    </Link>
                                  ) : (
                                    <span className={game.team1Score > game.team2Score ? 'font-bold' : ''}>
                                      {game.team1Rank && <span className="text-gray-500">#{game.team1Rank} </span>}
                                      {game.team1}
                                    </span>
                                  );
                                })()}
                              </div>
                              <span className="text-gray-400">vs</span>
                              <div className="flex items-center gap-1.5">
                                {getTeamLogo(game.team2) && (
                                  <div className="relative w-6 h-6 flex-shrink-0">
                                    <Image
                                      src={getTeamLogo(game.team2)!}
                                      alt={game.team2}
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  </div>
                                )}
                                {(() => {
                                  const team2Data = getTeamById(game.team2);
                                  return team2Data ? (
                                    <Link href={`/teams/${team2Data.slug}`} className={`hover:text-[#800000] hover:underline ${game.team2Score > game.team1Score ? 'font-bold' : ''}`}>
                                      {game.team2Rank && <span className="text-gray-500">#{game.team2Rank} </span>}
                                      {game.team2}
                                    </Link>
                                  ) : (
                                    <span className={game.team2Score > game.team1Score ? 'font-bold' : ''}>
                                      {game.team2Rank && <span className="text-gray-500">#{game.team2Rank} </span>}
                                      {game.team2}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${game.team1Score > game.team2Score ? 'text-green-600' : 'text-gray-700'}`}>
                              {game.team1Score}
                            </span>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className={`font-bold ${game.team2Score > game.team1Score ? 'text-green-600' : 'text-gray-700'}`}>
                              {game.team2Score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                            {game.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conference' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                <h2 className="text-lg font-bold text-white">2025-26 Conference Bowl Performance</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th
                        onClick={() => handleConfSort('conference')}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Conference<SortIcon field="conference" />
                      </th>
                      <th
                        onClick={() => handleConfSort('bowlEligible')}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Bowl Eligible<SortIcon field="bowlEligible" />
                      </th>
                      <th
                        onClick={() => handleConfSort('bowlWins')}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Bowl Record<SortIcon field="bowlWins" />
                      </th>
                      <th
                        onClick={() => handleConfSort('winPct')}
                        className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        Win %<SortIcon field="winPct" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedConferencePerformance.map((conf, idx) => {
                      const winPct = conf.bowlWins / (conf.bowlWins + conf.bowlLosses);
                      return (
                        <tr key={conf.conference} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3 font-medium text-gray-900">{conf.conference}</td>
                          <td className="px-4 py-3 text-center text-sm">{conf.bowlEligible}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-semibold text-gray-900">{conf.bowlWins}-{conf.bowlLosses}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${winPct >= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                              {winPct.toFixed(3).replace(/^0/, '')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                <h2 className="text-lg font-bold text-white">2025-26 Postseason Key Dates</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {keyDates2025.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="sm:w-48 flex-shrink-0">
                        <div className="text-lg font-bold text-[#800000]">{item.date}</div>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.event}</div>
                        {item.location && (
                          <div className="text-sm text-gray-600">{item.location}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'champions' && (
            <div className="space-y-6">
              {/* FBS/FCS Toggle */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <nav className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setChampionsView('fbs')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      championsView === 'fbs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    FBS (Division I)
                  </button>
                  <button
                    onClick={() => setChampionsView('fcs')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      championsView === 'fcs'
                        ? 'bg-[#800000] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    FCS (Division I-AA)
                  </button>
                </nav>
              </div>

              {championsView === 'fbs' && (
                <>
                  {/* Most Championships Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">Most National Championships by School</h2>
                    </div>
                    <div className="p-4">
                      <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 md:grid-cols-5 sm:gap-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                        {championshipCounts.map((school, idx) => (
                          <div
                            key={school.school}
                            className={`min-w-[140px] w-[40vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink text-center p-3 rounded-lg border ${
                              idx === 0 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="text-2xl font-bold text-[#800000]">{school.count}</div>
                            <div className="text-sm font-medium text-gray-700 truncate">{school.school}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CFP Era */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">CFP Era (2014-Present)</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Champion</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Selector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cfpEraChampions.map((champ, idx) => (
                            <tr key={champ.year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-3 font-bold text-[#800000]">{champ.year}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{champ.champion}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{champ.selector}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* BCS Era */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">BCS Era (1998-2013)</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Champion</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Selector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {bcsEraChampions.map((champ, idx) => (
                            <tr key={champ.year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-3 font-bold text-[#800000]">{champ.year}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{champ.champion}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{champ.selector}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pre-BCS Era */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">Pre-BCS Era (1869-1997)</h2>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-20 bg-gray-50">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 bg-gray-50">Champion</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell bg-gray-50">Selector</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {preBcsChampions.map((champ, idx) => (
                            <tr key={champ.year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-3 font-bold text-[#800000]">{champ.year}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{champ.champion}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{champ.selector}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {championsView === 'fcs' && (
                <>
                  {/* Most FCS Championships Card */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">Most FCS Championships by School</h2>
                    </div>
                    <div className="p-4">
                      <div className="flex overflow-x-auto scrollbar-hide gap-3 -mx-4 px-4 snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 md:grid-cols-5 sm:gap-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:pb-0 sm:snap-none">
                        {fcsChampionshipCounts.map((school, idx) => (
                          <div
                            key={school.school}
                            className={`min-w-[140px] w-[40vw] flex-shrink-0 snap-start sm:min-w-0 sm:w-auto sm:flex-shrink text-center p-3 rounded-lg border ${
                              idx === 0 ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="text-2xl font-bold text-[#800000]">{school.count}</div>
                            <div className="text-sm font-medium text-gray-700 truncate">{school.school}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* FCS Champions List */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-[#800000]">
                      <h2 className="text-lg font-bold text-white">FCS/I-AA National Champions (1978-Present)</h2>
                    </div>
                    <div className="overflow-x-auto max-h-[600px]">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-16 bg-gray-50">Year</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 bg-gray-50">Champion</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden md:table-cell bg-gray-50">Coach</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 bg-gray-50">Score</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell bg-gray-50">Runner-Up</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 hidden lg:table-cell bg-gray-50">Site</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {fcsChampions.map((champ, idx) => (
                            <tr key={champ.year} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="px-4 py-3 font-bold text-[#800000]">{champ.year}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{champ.champion}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{champ.coach}</td>
                              <td className="px-4 py-3 text-center text-sm font-semibold">{champ.score}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{champ.runnerUp}</td>
                              <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">{champ.site}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      <Footer currentPage="CFB" />
    </>
  );
}
