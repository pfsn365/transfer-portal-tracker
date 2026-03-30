'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getApiPath } from '@/utils/api';
import { getTeamLogo } from '@/utils/teamLogos';
import { allTeams, type Team } from '@/data/teams';

interface Recruit {
  id: number;
  name: string;
  position: string;
  city: string;
  state: string;
  height: string;
  weight: number;
  highSchool: string;
  classYear: number;
  stars: number;
  rating: number;
  nationalRank: number;
  positionRank: number;
  stateRank: number;
  imageUrl: string;
  committedSchoolLogo?: string;
  status: string;
  commitStatus: string;
  committedTo?: string;
  source: string;
}

interface TeamRanking {
  rank: number;
  school: string;
  totalCommits: number;
  avgStars: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStars: number;
  zeroStars: number;
  compositePoints: number;
  topRecruit: string;
}

const CFB_HQ_POINTS: Record<number, number> = { 5: 160, 4: 70, 3: 30, 2: 12, 1: 4, 0: 1 };

const FBS_CONFERENCES = ['SEC', 'Big Ten', 'Big 12', 'ACC', 'American', 'Pac-12', 'Mountain West', 'Sun Belt', 'Conference USA', 'MAC', 'Independent'];

function StarRating({ stars }: { stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= stars ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function RecruitAvatar({ recruit }: { recruit: Recruit }) {
  const [error, setError] = useState(false);
  const initials = recruit.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  if (!recruit.imageUrl || error) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-gray-500">{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={recruit.imageUrl}
      alt={recruit.name}
      className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}

interface ClassCalculatorProps {
  year: string;
  availableYears: number[];
  onYearChange: (year: string) => void;
}

export default function ClassCalculator({ year, availableYears, onYearChange }: ClassCalculatorProps) {
  // Team selection
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);

  // Data
  const [allTeamRankings, setAllTeamRankings] = useState<TeamRanking[]>([]);
  const [baseCommits, setBaseCommits] = useState<Recruit[]>([]);
  const [simulatedCommits, setSimulatedCommits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(false);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalPosition, setModalPosition] = useState('');
  const [modalStars, setModalStars] = useState('');
  const [modalRecruits, setModalRecruits] = useState<Recruit[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTotal, setModalTotal] = useState(0);
  const [modalPage, setModalPage] = useState(1);
  const [debouncedModalSearch, setDebouncedModalSearch] = useState('');

  // Track additions and removals
  const [additions, setAdditions] = useState<Set<string>>(new Set());
  const [removals, setRemovals] = useState<Set<string>>(new Set());

  // Close team dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target as Node)) {
        setTeamDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounce modal search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedModalSearch(modalSearch), 300);
    return () => clearTimeout(timer);
  }, [modalSearch]);

  // Fetch all team rankings for rank comparison
  useEffect(() => {
    const controller = new AbortController();
    setRankingsLoading(true);
    fetch(getApiPath(`api/cfb/recruits?year=${year}&source=composite&view=team-rankings`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => setAllTeamRankings(data.teamRankings || []))
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setRankingsLoading(false));
    return () => controller.abort();
  }, [year]);

  // Fetch team's commits when team is selected
  useEffect(() => {
    if (!selectedTeam) return;
    const controller = new AbortController();
    setLoading(true);

    fetch(getApiPath(`api/cfb/recruits?year=${year}&source=composite&team=${selectedTeam.id}&limit=200`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const commits = (data.recruits || []) as Recruit[];
        setBaseCommits(commits);
        setSimulatedCommits(commits);
        setAdditions(new Set());
        setRemovals(new Set());
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [selectedTeam, year]);

  // Fetch recruits for the add modal
  useEffect(() => {
    if (!addModalOpen) return;
    const controller = new AbortController();
    setModalLoading(true);

    const params = new URLSearchParams({
      year,
      source: 'composite',
      page: String(modalPage),
      limit: '50',
    });
    if (debouncedModalSearch) params.set('search', debouncedModalSearch);
    if (modalPosition) params.set('position', modalPosition);
    if (modalStars) params.set('stars', modalStars);

    fetch(getApiPath(`api/cfb/recruits?${params}`), { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        setModalRecruits(data.recruits || []);
        setModalTotal(data.total || 0);
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err); })
      .finally(() => setModalLoading(false));

    return () => controller.abort();
  }, [addModalOpen, year, debouncedModalSearch, modalPosition, modalStars, modalPage]);

  const openAddModal = useCallback(() => {
    setModalSearch('');
    setDebouncedModalSearch('');
    setModalPosition('');
    setModalStars('');
    setModalPage(1);
    setAddModalOpen(true);
  }, []);

  // Recruit key for dedup
  const recruitKey = useCallback((r: Recruit) => `${r.name}__${r.position}__${r.highSchool}`, []);

  // Match a team ranking school name to the selected team
  // CFBD uses names like "Ohio State", "Miami", "Miami (OH)" while our IDs are "ohio state", "miami", "miami (oh)"
  const matchesSelectedTeam = useCallback((school: string, team: Team): boolean => {
    const schoolLower = school.toLowerCase();
    const teamId = team.id.toLowerCase();
    // Exact match on ID
    if (schoolLower === teamId) return true;
    // Match without mascot: "Alabama Crimson Tide" -> "alabama crimson"
    const teamNameBase = team.name.split(' ').slice(0, -1).join(' ').toLowerCase();
    if (teamNameBase && schoolLower === teamNameBase) return true;
    // Match "Ohio State" to "ohio state" when school is just the base name
    // But prevent "Miami" from matching "Miami (OH)" — require exact boundaries
    if (schoolLower === teamId.replace(/[()]/g, '').trim()) return true;
    return false;
  }, []);

  // Computed: scoring & ranking
  // Team-rankings uses CFBD data; the calculator shows composite recruits.
  // To keep rank comparison consistent, we use the team-rankings compositePoints
  // as the authoritative base score and apply add/remove deltas to it.
  const simulatedData = useMemo(() => {
    if (!selectedTeam || !allTeamRankings.length) return null;

    // Find the team in rankings — this is the authoritative score from CFBD
    const rankingIdx = allTeamRankings.findIndex(t => matchesSelectedTeam(t.school, selectedTeam));
    const rankingEntry = rankingIdx >= 0 ? allTeamRankings[rankingIdx] : null;
    const originalRank = rankingIdx >= 0 ? rankingIdx + 1 : 0;
    const baseRankingScore = rankingEntry?.compositePoints || 0;

    // Compute delta from user's add/remove actions
    const addedScore = [...additions].reduce((sum, key) => {
      const recruit = simulatedCommits.find(r => recruitKey(r) === key);
      return sum + (recruit ? (CFB_HQ_POINTS[recruit.stars || 0] || 1) : 0);
    }, 0);
    const removedScore = [...removals].reduce((sum, key) => {
      const recruit = baseCommits.find(r => recruitKey(r) === key);
      return sum + (recruit ? (CFB_HQ_POINTS[recruit.stars || 0] || 1) : 0);
    }, 0);

    const simScore = baseRankingScore + addedScore - removedScore;
    const scoreDelta = simScore - baseRankingScore;

    const starBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 } as Record<number, number>;
    simulatedCommits.forEach(r => {
      starBreakdown[r.stars || 0] = (starBreakdown[r.stars || 0] || 0) + 1;
    });

    const avgRating = simulatedCommits.length > 0
      ? simulatedCommits.reduce((sum, r) => sum + (r.rating || 0), 0) / simulatedCommits.length
      : 0;

    // Compute simulated rank by replacing team's score and re-sorting
    const modified = allTeamRankings.map(t =>
      matchesSelectedTeam(t.school, selectedTeam) ? { ...t, compositePoints: simScore } : t
    );
    modified.sort((a, b) => b.compositePoints - a.compositePoints);
    const simRank = modified.findIndex(t => matchesSelectedTeam(t.school, selectedTeam)) + 1;

    const commitsDelta = simulatedCommits.length - baseCommits.length;

    return {
      baseScore: baseRankingScore,
      simScore,
      scoreDelta,
      originalRank: originalRank || null,
      simRank: simRank || null,
      rankDelta: originalRank - simRank,
      commitsDelta,
      starBreakdown,
      avgRating,
      hasChanges: additions.size > 0 || removals.size > 0,
    };
  }, [selectedTeam, allTeamRankings, baseCommits, simulatedCommits, additions, removals, matchesSelectedTeam, recruitKey]);

  const handleAddRecruit = useCallback((recruit: Recruit) => {
    const key = recruitKey(recruit);
    setSimulatedCommits(prev => {
      if (prev.some(r => recruitKey(r) === key)) return prev;
      return [...prev, recruit];
    });
    setAdditions(prev => new Set(prev).add(key));
    setRemovals(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [recruitKey]);

  const handleRemoveRecruit = useCallback((recruit: Recruit) => {
    const key = recruitKey(recruit);
    setSimulatedCommits(prev => prev.filter(r => recruitKey(r) !== key));
    if (baseCommits.some(r => recruitKey(r) === key)) {
      setRemovals(prev => new Set(prev).add(key));
    }
    setAdditions(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, [recruitKey, baseCommits]);

  const handleReset = useCallback(() => {
    setSimulatedCommits([...baseCommits]);
    setAdditions(new Set());
    setRemovals(new Set());
  }, [baseCommits]);

  const handleSelectTeam = useCallback((team: Team) => {
    setSelectedTeam(team);
    setTeamSearch('');
    setTeamDropdownOpen(false);
  }, []);

  // Filter teams for dropdown
  const filteredTeams = useMemo(() => {
    const fbsTeams = allTeams.filter(t => FBS_CONFERENCES.includes(t.conference));
    if (!teamSearch) return fbsTeams;
    const q = teamSearch.toLowerCase();
    return fbsTeams.filter(t =>
      t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
    );
  }, [teamSearch]);

  // Group teams by conference for dropdown
  const groupedTeams = useMemo(() => {
    const groups: Record<string, Team[]> = {};
    filteredTeams.forEach(t => {
      if (!groups[t.conference]) groups[t.conference] = [];
      groups[t.conference].push(t);
    });
    return groups;
  }, [filteredTeams]);

  // Simulated commits already in the list (for modal filtering)
  const simulatedKeys = useMemo(() => new Set(simulatedCommits.map(recruitKey)), [simulatedCommits, recruitKey]);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-900">Class Calculator</h2>
        <div className="flex gap-2 items-center">
          <select
            value={year}
            onChange={e => onYearChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>Class of {y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select a Team</label>
        <div ref={teamDropdownRef} className="relative max-w-md">
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#0050A0] focus-within:border-transparent">
            {selectedTeam && (
              <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                <img src={getTeamLogo(selectedTeam.id)} alt="" className="w-6 h-6 object-contain" />
              </div>
            )}
            <input
              type="text"
              placeholder={selectedTeam ? selectedTeam.name : 'Search for a team...'}
              value={teamSearch}
              onChange={e => { setTeamSearch(e.target.value); setTeamDropdownOpen(true); }}
              onFocus={() => setTeamDropdownOpen(true)}
              className="w-full px-3 py-2.5 text-sm focus:outline-none"
            />
            {selectedTeam && (
              <button
                onClick={() => { setSelectedTeam(null); setTeamSearch(''); setBaseCommits([]); setSimulatedCommits([]); setAdditions(new Set()); setRemovals(new Set()); }}
                className="px-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                title="Clear selection"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {teamDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {Object.keys(groupedTeams).length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-500">No teams found</div>
              ) : (
                Object.entries(groupedTeams)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([conf, teams]) => (
                    <div key={conf}>
                      <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0">
                        {conf}
                      </div>
                      {teams.map(team => (
                        <button
                          key={team.id}
                          onClick={() => handleSelectTeam(team)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer text-left text-sm transition-colors"
                        >
                          <img src={getTeamLogo(team.id)} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                          <span className="text-gray-900">{team.name}</span>
                        </button>
                      ))}
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* No Team Selected State */}
      {!selectedTeam && !rankingsLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a team to get started</h3>
          <p className="text-sm text-gray-500">Choose a team above to view their recruiting class and simulate what-if scenarios</p>
        </div>
      )}

      {/* Loading */}
      {(loading || rankingsLoading) && selectedTeam && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Team Selected */}
      {selectedTeam && !loading && !rankingsLoading && simulatedData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* PFSN Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">PFSN Score</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">{simulatedData.simScore.toLocaleString()}</span>
                {simulatedData.scoreDelta !== 0 && (
                  <span className={`text-sm font-semibold ${simulatedData.scoreDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {simulatedData.scoreDelta > 0 ? '+' : ''}{simulatedData.scoreDelta}
                  </span>
                )}
              </div>
            </div>

            {/* National Rank */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">National Rank</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">
                  {simulatedData.simRank ? `#${simulatedData.simRank}` : '—'}
                </span>
                {simulatedData.rankDelta !== 0 && (
                  <span className={`text-sm font-semibold flex items-center gap-0.5 ${simulatedData.rankDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <svg className={`w-3 h-3 ${simulatedData.rankDelta > 0 ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    {Math.abs(simulatedData.rankDelta)}
                  </span>
                )}
              </div>
              {simulatedData.hasChanges && simulatedData.originalRank && (
                <div className="text-xs text-gray-400 mt-0.5">was #{simulatedData.originalRank}</div>
              )}
            </div>

            {/* Commits */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Commits</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900">{simulatedCommits.length}</span>
                {simulatedData.commitsDelta !== 0 && (
                  <span className={`text-sm font-semibold ${simulatedData.commitsDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {simulatedData.commitsDelta > 0 ? '+' : ''}{simulatedData.commitsDelta}
                  </span>
                )}
              </div>
            </div>

            {/* 5-Star */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">5-Star</div>
              <span className="text-2xl font-bold text-yellow-600">{simulatedData.starBreakdown[5] || 0}</span>
            </div>

            {/* 4-Star */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">4-Star</div>
              <span className="text-2xl font-bold text-[#0050A0]">{simulatedData.starBreakdown[4] || 0}</span>
            </div>

            {/* Avg Rating */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Avg Rating</div>
              <span className="text-2xl font-bold text-gray-900">{simulatedData.avgRating.toFixed(4)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0050A0] text-white rounded-lg font-semibold text-sm hover:bg-[#003a75] transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Recruit
            </button>
            {simulatedData.hasChanges && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:border-[#0050A0] hover:text-[#0050A0] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
            )}
            {simulatedData.hasChanges && (
              <span className="text-xs text-gray-500">
                {additions.size > 0 && <span className="text-green-600">{additions.size} added</span>}
                {additions.size > 0 && removals.size > 0 && ', '}
                {removals.size > 0 && <span className="text-red-600">{removals.size} removed</span>}
              </span>
            )}
          </div>

          {/* Commits Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0050A0] text-white">
                  <th className="px-3 py-3 text-center font-semibold w-10">#</th>
                  <th className="px-3 py-3 text-left font-semibold">Recruit</th>
                  <th className="px-3 py-3 text-center font-semibold">Pos</th>
                  <th className="px-3 py-3 text-center font-semibold">Stars</th>
                  <th className="px-3 py-3 text-center font-semibold hidden sm:table-cell">Rating</th>
                  <th className="px-3 py-3 text-center font-semibold">Pts</th>
                  <th className="px-3 py-3 text-left font-semibold hidden md:table-cell">High School</th>
                  <th className="px-3 py-3 text-center font-semibold w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {simulatedCommits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      No commits in this class. Use &quot;Add Recruit&quot; to build a simulated class.
                    </td>
                  </tr>
                ) : (
                  [...simulatedCommits]
                    .sort((a, b) => (b.stars || 0) - (a.stars || 0) || (b.rating || 0) - (a.rating || 0))
                    .map((recruit, idx) => {
                      const key = recruitKey(recruit);
                      const isAdded = additions.has(key);
                      return (
                        <tr
                          key={`${key}-${idx}`}
                          className={`hover:bg-blue-50 transition-colors ${
                            isAdded
                              ? 'bg-green-50/60 border-l-2 border-l-green-400'
                              : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-3 py-2.5 text-center tabular-nums text-gray-500 text-xs">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <RecruitAvatar recruit={recruit} />
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 text-sm truncate">{recruit.name}</div>
                                <div className="text-xs text-gray-500 md:hidden">{recruit.highSchool}</div>
                              </div>
                              {isAdded && (
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">NEW</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-gray-700 text-xs font-medium">{recruit.position}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-center"><StarRating stars={recruit.stars} /></div>
                          </td>
                          <td className="px-3 py-2.5 text-center tabular-nums text-gray-600 text-xs hidden sm:table-cell">
                            {recruit.rating ? recruit.rating.toFixed(4) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-[#0050A0]">
                            {CFB_HQ_POINTS[recruit.stars || 0] || 1}
                          </td>
                          <td className="px-3 py-2.5 text-gray-600 hidden md:table-cell truncate max-w-[200px] text-xs">
                            {recruit.highSchool}
                            {recruit.state && <span className="text-gray-400"> ({recruit.state})</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => handleRemoveRecruit(recruit)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                              title="Remove from class"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>

          {simulatedCommits.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Showing {simulatedCommits.length} recruit{simulatedCommits.length !== 1 ? 's' : ''} &middot; PFSN Points: 5★=160, 4★=70, 3★=30, 2★=12, 1★=4
            </p>
          )}
        </>
      )}

      {/* ═══ ADD RECRUIT MODAL ═══ */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddModalOpen(false)}>
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Recruit</h3>
                {selectedTeam && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <img src={getTeamLogo(selectedTeam.id)} alt="" className="w-4 h-4 object-contain" />
                    Adding to {selectedTeam.name} &middot; Class of {year}
                  </p>
                )}
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Filters */}
            <div className="px-5 py-3 border-b border-gray-100 space-y-2">
              <input
                type="text"
                placeholder="Search by name, high school, or city..."
                value={modalSearch}
                onChange={e => { setModalSearch(e.target.value); setModalPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] focus:border-transparent"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={modalPosition}
                  onChange={e => { setModalPosition(e.target.value); setModalPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  <option value="">All Positions</option>
                  {['ATH','QB','RB','WR','TE','OL','DT','EDGE','LB','CB','SAF','K','P'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <select
                  value={modalStars}
                  onChange={e => { setModalStars(e.target.value); setModalPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0050A0] cursor-pointer"
                >
                  <option value="">All Stars</option>
                  <option value="5">5★ Only</option>
                  <option value="4">4★ Only</option>
                  <option value="3">3★ Only</option>
                </select>
              </div>
            </div>

            {/* Modal Results */}
            <div className="flex-1 overflow-y-auto">
              {modalLoading ? (
                <div className="p-5 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-14"></div>
                    </div>
                  ))}
                </div>
              ) : modalRecruits.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No recruits found</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {modalRecruits.map((recruit, idx) => {
                    const key = recruitKey(recruit);
                    const alreadyAdded = simulatedKeys.has(key);
                    return (
                      <div
                        key={`${key}-${idx}`}
                        className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${alreadyAdded ? 'opacity-50' : ''}`}
                      >
                        <RecruitAvatar recruit={recruit} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm truncate">{recruit.name}</span>
                            <span className="text-xs text-gray-500">{recruit.position}</span>
                            {recruit.nationalRank > 0 && (
                              <span className="text-xs text-gray-400">#{recruit.nationalRank}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StarRating stars={recruit.stars} />
                            <span className="text-xs text-gray-500 truncate">
                              {recruit.highSchool}{recruit.state ? `, ${recruit.state}` : ''}
                            </span>
                          </div>
                          {recruit.committedTo && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <img src={getTeamLogo(recruit.committedTo)} alt="" className="w-3.5 h-3.5 object-contain" />
                              <span className="text-xs text-gray-400">Committed to {recruit.committedTo}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-semibold text-[#0050A0] tabular-nums">
                            +{CFB_HQ_POINTS[recruit.stars || 0] || 1}
                          </span>
                          <button
                            onClick={() => handleAddRecruit(recruit)}
                            disabled={alreadyAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              alreadyAdded
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-[#0050A0] text-white hover:bg-[#003a75]'
                            }`}
                          >
                            {alreadyAdded ? 'Added' : 'Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!modalLoading && modalTotal > 50 && (
              <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing {Math.min(modalPage * 50, modalTotal)} of {modalTotal} recruits
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalPage(p => Math.max(1, p - 1))}
                    disabled={modalPage <= 1}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setModalPage(p => p + 1)}
                    disabled={modalPage * 50 >= modalTotal}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
